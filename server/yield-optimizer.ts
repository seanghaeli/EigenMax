import type { Vault } from "@shared/schema";
import { storage } from "./storage";

export class YieldOptimizer {
  private readonly MIN_APY_DIFFERENCE = {
    stable: 0.5,
    lsd: 1.0,
    governance: 2.0,
    other: 1.5
  };
  private readonly MIN_BALANCE = {
    stable: 1000,
    lsd: 500,
    governance: 2000,
    other: 1000
  };
  private readonly REBALANCE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

  async checkAndOptimize(vault: Vault) {
    if (!vault.autoMode || vault.balance < this.MIN_BALANCE[vault.tokenType || 'other']) {
      return null;
    }

    const vaults = await storage.getVaults();
    const bestProtocol = this.findBestProtocol(vaults);

    if (bestProtocol.protocol !== vault.protocol && 
        bestProtocol.apy - vault.apy > this.MIN_APY_DIFFERENCE[vault.tokenType || 'other']) {
      return this.rebalanceVault(vault, bestProtocol.protocol);
    }

    return null;
  }

  private async calculateRealAPY(protocol: Protocol): Promise<number> {
    const prices = await storage.getPrices("ethereum");
    if (prices.length < 2) return protocol.apy; // Fallback to static APY

    // Calculate returns over available time period
    const oldestPrice = prices[prices.length - 1].price;
    const latestPrice = prices[0].price;
    const timeDiffHours = (prices[0].timestamp.getTime() - prices[prices.length - 1].timestamp.getTime()) / (1000 * 3600);

    // Calculate period return and annualize it
    const periodReturn = (latestPrice - oldestPrice) / oldestPrice;
    const annualizedReturn = (Math.pow(1 + periodReturn, 365 * 24 / timeDiffHours) - 1) * 100;

    // Blend protocol base APY with market performance
    return (protocol.apy * 0.7) + (annualizedReturn * 0.3);
  }

  private async findBestProtocol(vaults: Vault[]) {
    const protocols = await storage.getProtocols();
    const apyPromises = protocols.map(async (p) => ({
      protocol: p,
      realAPY: await this.calculateRealAPY(p)
    }));

    const results = await Promise.all(apyPromises);
    return results.reduce((best, current) => 
      current.realAPY > best.realAPY ? current : best
    ).protocol;
  }

  private eigenAVS = new EigenAVSService(
    process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    process.env.PRIVATE_KEY || 'your-private-key'
  );

  private async rebalanceVault(vault: Vault, newProtocol: string) {
    // Create rebalance transaction
    const transaction = await storage.createTransaction({
      vaultId: vault.id,
      type: "rebalance",
      amount: vault.balance,
      timestamp: new Date()
    });

    // Verify through EigenLayer
    const verification = await this.eigenAVS.verifyTransaction(transaction.id.toString());

    if (!verification.verified) {
      throw new Error('Transaction verification failed');
    }

    // Update vault protocol
    return storage.updateVault(vault.id, {
      protocol: newProtocol,
      lastVerification: verification
    });
  }
}
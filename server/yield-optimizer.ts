
import type { Vault } from "@shared/schema";
import { storage } from "./storage";

export class YieldOptimizer {
  private readonly MIN_APY_DIFFERENCE = 0.5; // Minimum APY difference to trigger a move
  private readonly MIN_BALANCE = 1000; // Minimum balance to consider moving

  async checkAndOptimize(vault: Vault) {
    if (!vault.autoMode || vault.balance < this.MIN_BALANCE) {
      return null;
    }

    const tokenPrice = await PriceService.getTokenPrice(vault.token);
    const vaults = await storage.getVaults();
    const bestProtocol = this.findBestProtocol(vaults);
    
    // Include price data in response
    const vaultWithPrice = {
      ...vault,
      tokenPrice
    };

    if (bestProtocol.protocol !== vault.protocol && 
        bestProtocol.apy - vault.apy > this.MIN_APY_DIFFERENCE) {
      return this.rebalanceVault(vault, bestProtocol.protocol);
    }

    return null;
  }

  private findBestProtocol(vaults: Vault[]) {
    return vaults.reduce((best, current) => 
      current.apy > best.apy ? current : best
    );
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


import type { Vault } from "@shared/schema";
import { storage } from "./storage";

export class YieldOptimizer {
  private readonly MIN_APY_DIFFERENCE = 0.5; // Minimum APY difference to trigger a move
  private readonly MIN_BALANCE = 1000; // Minimum balance to consider moving

  async checkAndOptimize(vault: Vault) {
    if (!vault.autoMode || vault.balance < this.MIN_BALANCE) {
      return null;
    }

    const vaults = await storage.getVaults();
    const bestProtocol = this.findBestProtocol(vaults);

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

  private async rebalanceVault(vault: Vault, newProtocol: string) {
    // Create rebalance transaction
    await storage.createTransaction({
      vaultId: vault.id,
      type: "rebalance",
      amount: vault.balance,
      timestamp: new Date()
    });

    // Update vault protocol
    return storage.updateVault(vault.id, {
      protocol: newProtocol
    });
  }
}


import { ethers } from 'ethers';

export class GasOptimizer {
  private provider: ethers.JsonRpcProvider;
  
  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async isRebalanceWorthwhile(
    amount: number,
    apyDiff: number,
    tokenType: string
  ): Promise<boolean> {
    const gasPrice = await this.provider.getFeeData();
    const estimatedGasCost = gasPrice.gasPrice * BigInt(300000); // Average gas for swap
    const yearlyBenefit = amount * (apyDiff / 100);
    const gasCostInUsd = Number(estimatedGasCost) * ethPrice / 1e18;
    
    const minMonthsToBreakeven = gasCostInUsd / (yearlyBenefit / 12);
    const maxAllowedMonths = {
      stable: 1,
      lsd: 2,
      governance: 3,
      other: 1.5
    };
    
    return minMonthsToBreakeven <= maxAllowedMonths[tokenType];
  }
}

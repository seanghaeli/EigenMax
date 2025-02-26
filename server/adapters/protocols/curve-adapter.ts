import { BaseProtocolAdapter, YieldStrategy } from './base-adapter';

export class CurveAdapter extends BaseProtocolAdapter {
  private readonly SUPPORTED_TOKENS = [
    'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'ETH',
    'stETH', 'frxETH', 'rETH'
  ];

  getName(): string {
    return 'Curve';
  }

  async getAPY(): Promise<number> {
    const yieldData = await this.defiLlama.getYieldData(['curve']);
    // Average APY across all Curve pools
    const avgApy = yieldData.reduce((sum, pool) => sum + pool.apy, 0) / yieldData.length;
    return avgApy;
  }

  async getTVL(): Promise<number> {
    return this.defiLlama.getProtocolTVL('curve');
  }

  getSupportedTokens(): string[] {
    return this.SUPPORTED_TOKENS;
  }

  getGasOverhead(): number {
    return 185000; // Base gas units for Curve operations
  }

  getRiskLevel(): 'low' | 'medium' | 'high' {
    return 'low'; // Curve is considered a battle-tested protocol
  }

  async calculateYieldStrategy(
    token: string,
    amount: number,
    currentGasPrice: number
  ): Promise<YieldStrategy> {
    const [baseApy, tvl] = await Promise.all([
      this.getAPY(),
      this.getTVL()
    ]);

    const gasOverhead = this.getGasOverhead();
    const gasOverheadCost = (gasOverhead * currentGasPrice) / 1e9; // Convert to ETH
    
    // Calculate net APY considering:
    // 1. Base APY from providing liquidity
    // 2. CRV rewards
    // 3. Gas costs
    // 4. Risk adjustments
    const netApy = this.calculateNetApy(
      baseApy,
      2.5, // Assuming 2.5% APR from CRV rewards
      gasOverheadCost,
      this.getRiskLevel()
    );

    return {
      protocol: this.getName(),
      apy: baseApy,
      tvl,
      gasOverhead,
      impermanentLossRisk: true, // Curve pools can experience IL
      contractRisk: this.getRiskLevel(),
      netApy,
      rewardTokens: ['CRV']
    };
  }
}

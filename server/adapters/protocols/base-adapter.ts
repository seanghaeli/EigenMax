export interface ProtocolAdapter {
  getName(): string;
  getAPY(): Promise<number>;
  getTVL(): Promise<number>;
  getSupportedTokens(): string[];
  getGasOverhead(): number;
  getRiskLevel(): 'low' | 'medium' | 'high';
  getHistoricalPerformance(): Promise<{
    timestamp: Date;
    apy: number;
    tvl: number;
  }[]>;
}

export interface YieldStrategy {
  protocol: string;
  apy: number;
  tvl: number;
  gasOverhead: number;
  impermanentLossRisk: boolean;
  contractRisk: 'low' | 'medium' | 'high';
  netApy: number; // APY after gas costs and risks
  rewardTokens?: string[];
}

export abstract class BaseProtocolAdapter implements ProtocolAdapter {
  protected defiLlama: DefiLlamaAdapter;
  
  constructor() {
    this.defiLlama = new DefiLlamaAdapter();
  }

  abstract getName(): string;
  abstract getAPY(): Promise<number>;
  abstract getTVL(): Promise<number>;
  abstract getSupportedTokens(): string[];
  abstract getGasOverhead(): number;
  abstract getRiskLevel(): 'low' | 'medium' | 'high';
  
  async getHistoricalPerformance(): Promise<{ timestamp: Date; apy: number; tvl: number; }[]> {
    // Implement historical data fetching from DeFi Llama
    return [];
  }

  protected calculateNetApy(
    baseApy: number,
    rewardApy: number,
    gasOverhead: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): number {
    const totalApy = baseApy + rewardApy;
    
    // Risk adjustment factors
    const riskFactors = {
      low: 0.95,
      medium: 0.85,
      high: 0.70
    };

    // Adjust APY based on risk level and gas costs
    const riskAdjustedApy = totalApy * riskFactors[riskLevel];
    const gasAdjustedApy = riskAdjustedApy - (gasOverhead / 10000); // Convert gas overhead to basis points

    return Math.max(0, gasAdjustedApy);
  }
}

import type { Protocol } from '@shared/schema';

interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyPct1D: number;
  apyPct7D: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
}

interface DefiLlamaProtocol {
  id: string;
  name: string;
  address: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  tvl: number;
  change1h: number;
  change1d: number;
  change7d: number;
}

export class DefiLlamaService {
  private readonly baseUrl = 'https://api.llama.fi';
  private readonly yieldsUrl = 'https://yields.llama.fi';

  async getProtocolTVL(protocol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/protocol/${protocol}`);
      const data = await response.json();
      return data.tvl[data.tvl.length - 1].totalLiquidityUSD;
    } catch (error) {
      console.error(`Error fetching TVL for ${protocol}:`, error);
      return 0;
    }
  }

  async getPoolsForProtocol(protocol: string): Promise<DefiLlamaPool[]> {
    try {
      const response = await fetch(`${this.yieldsUrl}/pools`);
      const data = await response.json();
      return data.data.filter((pool: DefiLlamaPool) => 
        pool.project.toLowerCase() === protocol.toLowerCase()
      );
    } catch (error) {
      console.error(`Error fetching pools for ${protocol}:`, error);
      return [];
    }
  }

  async getProtocolHealth(protocol: string): Promise<{
    tvlChange24h: number;
    tvlChange7d: number;
    riskScore: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/protocol/${protocol}`);
      const data = await response.json();
      
      return {
        tvlChange24h: data.change_1d || 0,
        tvlChange7d: data.change_7d || 0,
        riskScore: this.calculateRiskScore(data),
      };
    } catch (error) {
      console.error(`Error fetching protocol health for ${protocol}:`, error);
      return {
        tvlChange24h: 0,
        tvlChange7d: 0,
        riskScore: 0,
      };
    }
  }

  private calculateRiskScore(protocolData: any): number {
    // Risk score calculation based on:
    // 1. TVL stability (weight: 0.4)
    // 2. Protocol age (weight: 0.3)
    // 3. Recent changes (weight: 0.3)
    
    const tvlStability = Math.abs(protocolData.change_1d || 0) < 10 ? 1 : 0.5;
    const protocolAge = (Date.now() - (protocolData.date_launched || Date.now())) / (1000 * 60 * 60 * 24 * 365);
    const ageScore = Math.min(protocolAge / 3, 1); // Max score for 3+ years
    const recentChangesScore = Math.abs(protocolData.change_7d || 0) < 20 ? 1 : 0.5;

    return (tvlStability * 0.4 + ageScore * 0.3 + recentChangesScore * 0.3) * 100;
  }
}

export const defiLlama = new DefiLlamaService();

import { z } from "zod";

const ProtocolTVLResponse = z.object({
  tvl: z.array(z.object({
    date: z.number(),
    totalLiquidityUSD: z.number()
  }))
});

const YieldResponse = z.object({
  data: z.array(z.object({
    pool: z.string(),
    project: z.string(),
    chain: z.string(),
    apyBase: z.number().nullable(),
    apyReward: z.number().nullable(),
    tvlUsd: z.number(),
    apy: z.number()
  }))
});

export interface ProtocolData {
  name: string;
  tvl: number;
  apy: number;
  chain: string;
  risks: {
    impermanentLoss: boolean;
    contractRisk: 'low' | 'medium' | 'high';
  };
}

export class DefiLlamaAdapter {
  private baseUrl = 'https://api.llama.fi';
  private yieldUrl = 'https://yields.llama.fi';

  async getProtocolTVL(protocol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/protocol/${protocol}`);
      const data = await response.json();
      const parsed = ProtocolTVLResponse.parse(data);
      return parsed.tvl[parsed.tvl.length - 1].totalLiquidityUSD;
    } catch (error) {
      console.error(`Error fetching TVL for ${protocol}:`, error);
      return 0;
    }
  }

  async getYieldData(protocols: string[]): Promise<ProtocolData[]> {
    try {
      const response = await fetch(`${this.yieldUrl}/pools`);
      const data = await response.json();
      const parsed = YieldResponse.parse(data);

      return parsed.data
        .filter(pool => protocols.includes(pool.project.toLowerCase()))
        .map(pool => ({
          name: pool.project,
          tvl: pool.tvlUsd,
          apy: pool.apy,
          chain: pool.chain,
          risks: {
            impermanentLoss: this.assessImpermanentLossRisk(pool.project, pool.pool),
            contractRisk: this.assessContractRisk(pool.project)
          }
        }));
    } catch (error) {
      console.error('Error fetching yield data:', error);
      return [];
    }
  }

  private assessImpermanentLossRisk(project: string, pool: string): boolean {
    // Assess IL risk based on protocol type and pool composition
    return project.toLowerCase().includes('uniswap') || 
           project.toLowerCase().includes('balancer') ||
           pool.toLowerCase().includes('volatile');
  }

  private assessContractRisk(project: string): 'low' | 'medium' | 'high' {
    // Basic risk assessment based on protocol maturity and audit status
    const lowRiskProtocols = ['aave', 'compound', 'curve', 'lido'];
    const mediumRiskProtocols = ['balancer', 'yearn', 'convex'];
    
    const projectLower = project.toLowerCase();
    if (lowRiskProtocols.includes(projectLower)) return 'low';
    if (mediumRiskProtocols.includes(projectLower)) return 'medium';
    return 'high';
  }
}

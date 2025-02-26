import type { Protocol } from '@shared/schema';

interface DefiLlamaProtocol {
  tvl: number;
  apy: number;
  symbol: string;
  project: string;
  chain: string;
  healthScore: number;
  tvlChange24h: number;
  tvlChange7d: number;
}

export class DefiLlamaService {
  private baseUrl = 'https://api.llama.fi';
  private poolsUrl = 'https://yields.llama.fi/pools';

  async getProtocolTVL(protocol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/protocol/${protocol}`);
      const data = await response.json();
      return data.currentTvl || 0;
    } catch (error) {
      console.error(`Error fetching TVL for ${protocol}:`, error);
      return 0;
    }
  }

  async getProtocolYields(): Promise<DefiLlamaProtocol[]> {
    try {
      const response = await fetch(this.poolsUrl);
      console.log("Fetching yields from:", this.poolsUrl); // Added logging
      const data = await response.json();
      return data.data.map((pool: any) => ({
        tvl: pool.tvlUsd,
        apy: pool.apy,
        symbol: pool.symbol,
        project: pool.project,
        chain: pool.chain,
        healthScore: this.calculateHealthScore(pool),
        tvlChange24h: pool.tvlUsdChange24h || 0,
        tvlChange7d: pool.tvlUsdChange7d || 0
      }));
    } catch (error) {
      console.error('Error fetching protocol yields:', error);
      return [];
    }
  }

  private calculateHealthScore(pool: any): number {
    // Health score factors (0-100):
    // - TVL stability (weight: 0.4)
    // - Protocol longevity (weight: 0.3)
    // - Smart contract audits (weight: 0.3)
    const tvlStability = Math.abs(pool.tvlUsdChange24h) < 10 ? 100 : 
      Math.max(0, 100 - Math.abs(pool.tvlUsdChange24h));

    const protocolLongevity = pool.inception ? 
      Math.min(100, ((Date.now() - new Date(pool.inception).getTime()) / (365 * 24 * 60 * 60 * 1000)) * 100) : 
      50;

    const auditScore = pool.audits ? pool.audits * 20 : 50;

    return (tvlStability * 0.4) + (protocolLongevity * 0.3) + (auditScore * 0.3);
  }

  async updateProtocolData(protocols: Protocol[]): Promise<Protocol[]> {
    const yields = await this.getProtocolYields();
    console.log('Fetched yields from DeFi Llama:', yields.length, 'protocols');

    return protocols.map(protocol => {
      const protocolYield = yields.find(y => 
        y.project.toLowerCase() === protocol.name.toLowerCase()
      );

      if (protocolYield) {
        console.log(`Updating protocol ${protocol.name} with DeFi Llama data:`, {
          tvl: protocolYield.tvl,
          apy: protocolYield.apy,
          healthScore: protocolYield.healthScore,
          tvlChange24h: protocolYield.tvlChange24h,
          tvlChange7d: protocolYield.tvlChange7d
        });

        return {
          ...protocol,
          tvl: protocolYield.tvl,
          apy: protocolYield.apy,
          healthScore: protocolYield.healthScore,
          tvlChange24h: protocolYield.tvlChange24h,
          tvlChange7d: protocolYield.tvlChange7d
        };
      }

      return protocol;
    });
  }
}

export const defiLlama = new DefiLlamaService();
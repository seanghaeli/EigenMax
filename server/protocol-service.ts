import { defiLlama } from './defi-llama-service';
import { storage } from './storage';
import type { Protocol, Token } from '@shared/schema';

export class ProtocolService {
  async updateProtocolMetrics(protocol: Protocol): Promise<Protocol> {
    try {
      // Fetch latest data from DeFi Llama
      const [tvlData, healthData] = await Promise.all([
        defiLlama.getProtocolTVL(protocol.name.toLowerCase()),
        defiLlama.getProtocolHealth(protocol.name.toLowerCase())
      ]);

      // Update protocol with new data
      return await storage.updateProtocol(protocol.id, {
        tvl: tvlData,
        tvlChange24h: healthData.tvlChange24h,
        tvlChange7d: healthData.tvlChange7d,
        healthScore: healthData.riskScore,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error(`Error updating metrics for ${protocol.name}:`, error);
      return protocol;
    }
  }

  async getOptimalPosition(token: Token, amount: number): Promise<{
    protocol: Protocol;
    expectedApy: number;
    risk: string;
  }> {
    const protocols = await storage.getActiveProtocols();
    const compatibleProtocols = protocols.filter(p => 
      p.supportedTokens.includes(token.symbol)
    );

    let bestProtocol = compatibleProtocols[0];
    let maxScore = 0;

    for (const protocol of compatibleProtocols) {
      // Score based on APY, health score, and TVL stability
      const score = (
        protocol.apy * 0.4 + 
        protocol.healthScore * 0.3 + 
        (100 - Math.abs(protocol.tvlChange24h)) * 0.3
      );

      if (score > maxScore) {
        maxScore = score;
        bestProtocol = protocol;
      }
    }

    return {
      protocol: bestProtocol,
      expectedApy: bestProtocol.apy,
      risk: this.calculateRiskLevel(bestProtocol)
    };
  }

  private calculateRiskLevel(protocol: Protocol): string {
    const riskScore = (
      protocol.healthScore * 0.4 +
      (100 - Math.abs(protocol.tvlChange24h)) * 0.3 +
      (100 - Math.abs(protocol.tvlChange7d)) * 0.3
    );

    if (riskScore >= 80) return 'Low';
    if (riskScore >= 60) return 'Medium';
    return 'High';
  }
}

export const protocolService = new ProtocolService();

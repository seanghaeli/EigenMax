import { AVSClient, type AVSConfig } from '@eigenlayer/avs-client';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';

interface AVSMetrics {
  healthScore: number;
  totalStaked: number;
  apy: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  slashingEvents: number;
  uptime: number;
}

interface RestakingPosition {
  avsId: string;
  amount: string;
  token: 'stETH' | 'rETH' | 'cbETH' | 'ETH';
  timestamp: Date;
}

export class EigenAVSService {
  private client: AVSClient;
  private metrics: Map<string, AVSMetrics> = new Map();

  constructor(
    private readonly rpcUrl: string = process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    private readonly privateKey: string = process.env.EIGEN_PRIVATE_KEY || ''
  ) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    this.client = new AVSClient({
      host: 'avs.eigenlayer.xyz',
      chainId: 1,
      signer,
    });

    // Initialize metrics monitoring
    this.startMetricsMonitoring();
  }

  private async startMetricsMonitoring() {
    setInterval(async () => {
      const avsList = await this.client.getAVSList();
      for (const avs of avsList) {
        const metrics = await this.calculateAVSMetrics(avs.id);
        this.metrics.set(avs.id, metrics);
      }
    }, 5 * 60 * 1000); // Update every 5 minutes
  }

  private async calculateAVSMetrics(avsId: string): Promise<AVSMetrics> {
    try {
      const data = await this.client.getAVSMetrics(avsId);

      // Calculate risk level based on multiple factors
      const riskScore = this.calculateRiskScore(data);
      const riskLevel = riskScore > 80 ? 'LOW' : riskScore > 50 ? 'MEDIUM' : 'HIGH';

      return {
        healthScore: data.healthScore || 0,
        totalStaked: data.totalStaked || 0,
        apy: data.apy || 0,
        riskLevel,
        slashingEvents: data.slashingEvents || 0,
        uptime: data.uptime || 0
      };
    } catch (error) {
      console.error(`Error calculating metrics for AVS ${avsId}:`, error);
      return {
        healthScore: 0,
        totalStaked: 0,
        apy: 0,
        riskLevel: 'HIGH',
        slashingEvents: 0,
        uptime: 0
      };
    }
  }

  private calculateRiskScore(metrics: any): number {
    // Weight factors for risk calculation
    const weights = {
      healthScore: 0.3,
      slashingEvents: 0.3,
      uptime: 0.2,
      stakingRatio: 0.2
    };

    const scores = {
      healthScore: metrics.healthScore,
      slashingEvents: Math.max(0, 100 - metrics.slashingEvents * 20),
      uptime: metrics.uptime,
      stakingRatio: (metrics.totalStaked / metrics.maxStake) * 100
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);
  }

  async restakeETH(
    amount: string,
    sourceToken: 'stETH' | 'rETH' | 'cbETH' | 'ETH',
    targetAVS: string
  ): Promise<RestakingPosition> {
    try {
      // Verify AVS health before restaking
      const metrics = await this.calculateAVSMetrics(targetAVS);
      if (metrics.riskLevel === 'HIGH') {
        throw new Error('AVS risk level too high for restaking');
      }

      // Perform restaking operation
      const tx = await this.client.restake({
        amount,
        token: sourceToken,
        avsId: targetAVS,
      });

      await tx.wait();

      return {
        avsId: targetAVS,
        amount,
        token: sourceToken,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Restaking failed:', error);
      throw error;
    }
  }

  async exitPosition(
    positionId: string,
    percentage: number // 0-100
  ): Promise<boolean> {
    try {
      if (percentage < 0 || percentage > 100) {
        throw new Error('Invalid exit percentage');
      }

      const tx = await this.client.exitPosition(positionId, percentage);
      await tx.wait();

      return true;
    } catch (error) {
      console.error('Exit position failed:', error);
      throw error;
    }
  }

  async getAVSMetrics(avsId: string): Promise<AVSMetrics | undefined> {
    return this.metrics.get(avsId);
  }

  async getAllAVSMetrics(): Promise<Map<string, AVSMetrics>> {
    return this.metrics;
  }

  async rebalancePositions(
    riskThreshold: number = 70,
    minYieldDifference: number = 2 // percentage points
  ): Promise<void> {
    try {
      const positions = await this.client.getPositions();
      const avsMetrics = await this.getAllAVSMetrics();

      for (const position of positions) {
        const currentAVSMetrics = avsMetrics.get(position.avsId);
        if (!currentAVSMetrics) continue;

        // Check if current AVS exceeds risk threshold
        if (this.calculateRiskScore(currentAVSMetrics) > riskThreshold) {
          // Find safer AVS with acceptable yield
          const saferAVS = Array.from(avsMetrics.entries())
            .find(([_, metrics]) => 
              this.calculateRiskScore(metrics) < riskThreshold &&
              metrics.apy > currentAVSMetrics.apy - minYieldDifference
            );

          if (saferAVS) {
            await this.restakeETH(
              position.amount,
              position.token,
              saferAVS[0]
            );
          }
        }
      }
    } catch (error) {
      console.error('Rebalancing failed:', error);
      throw error;
    }
  }

  async verifyTransaction(txHash: string) {
    try {
      const verification = await this.client.verifyTransaction({
        transactionHash: txHash,
        quorumThreshold: 2/3,
        timeout: 30000,
      });
      
      return {
        verified: verification.status === 'confirmed',
        signatures: verification.signatures,
        timestamp: verification.timestamp,
      };
    } catch (error) {
      console.error('EigenLayer verification failed:', error);
      return {
        verified: false,
        error: error.message,
      };
    }
  }
}

export const eigenAVS = new EigenAVSService();
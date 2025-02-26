
import { AVSClient } from '@eigenlayer/avs-client';
import { ethers } from 'ethers';

export class EigenAVSService {
  private client: AVSClient;
  
  constructor(private readonly rpcUrl: string, private readonly privateKey: string) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    this.client = new AVSClient({
      host: 'avs.eigenlayer.xyz',
      signer,
    });
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

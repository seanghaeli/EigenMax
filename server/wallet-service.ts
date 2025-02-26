
import { ethers } from 'ethers';
import type { Protocol } from '@shared/schema';

export class WalletService {
  private provider: ethers.JsonRpcProvider;
  
  constructor(rpcUrl: string = 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID') {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async getPositions(address: string, protocols: Protocol[]) {
    const positions = [];
    
    for (const protocol of protocols) {
      try {
        const balance = await this.provider.getBalance(address);
        positions.push({
          protocol: protocol.name,
          balance: ethers.formatEther(balance),
        });
      } catch (error) {
        console.error(`Error fetching balance for ${protocol.name}:`, error);
      }
    }
    
    return positions;
  }
}

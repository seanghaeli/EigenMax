
import axios from 'axios';

export class PriceService {
  private static baseUrl = 'https://api.coingecko.com/api/v3';

  static async getTokenPrice(token: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params: {
          ids: token.toLowerCase(),
          vs_currencies: 'usd'
        }
      });
      return response.data[token.toLowerCase()].usd;
    } catch (error) {
      console.error('Error fetching price:', error);
      return 0;
    }
  }
}

import {
  type Token,
  type InsertToken,
  type Protocol,
  type InsertProtocol,
  type Vault,
  type InsertVault,
  type Transaction,
  type InsertTransaction,
  type Price,
  type InsertPrice,
} from "@shared/schema";

export interface IStorage {
  // Token methods
  getTokens(): Promise<Token[]>;
  getActiveTokens(): Promise<Token[]>;
  getToken(symbol: string): Promise<Token | undefined>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: number, token: Partial<InsertToken>): Promise<Token>;

  // Protocol methods
  getProtocols(): Promise<Protocol[]>;
  getActiveProtocols(): Promise<Protocol[]>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: number, protocol: Partial<InsertProtocol>): Promise<Protocol>;
  toggleProtocol(id: number): Promise<Protocol>;

  // Vault methods
  getVaults(): Promise<Vault[]>;
  getVault(id: number): Promise<Vault | undefined>;
  createVault(vault: InsertVault): Promise<Vault>;
  updateVault(id: number, vault: Partial<InsertVault>): Promise<Vault>;

  // Transaction methods
  getTransactions(vaultId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Price methods
  getPrices(asset: string): Promise<Price[]>;
  getLatestPrice(asset: string): Promise<Price | undefined>;
  createPrice(price: InsertPrice): Promise<Price>;
}

export class MemStorage implements IStorage {
  private tokens: Map<number, Token>;
  private protocols: Map<number, Protocol>;
  private vaults: Map<number, Vault>;
  private transactions: Map<number, Transaction>;
  private prices: Map<number, Price>;
  private tokenId: number = 1;
  private protocolId: number = 1;
  private vaultId: number = 1;
  private transactionId: number = 1;
  private priceId: number = 1;

  constructor() {
    this.tokens = new Map();
    this.protocols = new Map();
    this.vaults = new Map();
    this.transactions = new Map();
    this.prices = new Map();

    // Add new protocol types
    this.createProtocol({
      name: "Curve",
      type: "dex",
      apy: 5.2,
      tvl: 15000000,
      active: true,
      supportedTokens: ["USDC", "DAI", "wstETH"],
      gasOverhead: 180000,
      healthScore: 95,
      tvlChange24h: -0.5,
      tvlChange7d: 2.1,
    });

    this.createProtocol({
      name: "Balancer",
      type: "dex",
      apy: 4.8,
      tvl: 12000000,
      active: true,
      supportedTokens: ["wstETH", "rETH", "AAVE"],
      gasOverhead: 220000,
      healthScore: 92,
      tvlChange24h: 0.8,
      tvlChange7d: 3.2,
    });

    this.createProtocol({
      name: "Uniswap V3",
      type: "dex",
      apy: 8.5,
      tvl: 20000000,
      active: true,
      supportedTokens: ["USDC", "DAI", "UNI"],
      gasOverhead: 150000,
      healthScore: 98,
      tvlChange24h: 1.2,
      tvlChange7d: 4.5,
    });

    this.createProtocol({
      name: "Yearn",
      type: "yield_aggregator",
      apy: 6.7,
      tvl: 8000000,
      active: true,
      supportedTokens: ["USDC", "DAI", "wstETH"],
      gasOverhead: 280000,
      healthScore: 90,
      tvlChange24h: -0.3,
      tvlChange7d: 1.8,
    });

    // Add some Curve LP tokens
    this.createToken({
      symbol: "crvUSD",
      name: "Curve USD LP",
      type: "curve_lp",
      decimals: 18,
      active: true,
      baseGasLimit: 85000,
      address: "0x4dCf7407AE5C07f8681e1659f626E114A7667339",
      protocol: "Curve",
      poolId: "crvUSD",
    });

    // Add some Balancer LP tokens
    this.createToken({
      symbol: "B-80BAL-20WETH",
      name: "Balancer 80BAL-20WETH",
      type: "balancer_lp",
      decimals: 18,
      active: true,
      baseGasLimit: 95000,
      address: "0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56",
      protocol: "Balancer",
      poolId: "80bal-20weth",
    });

    // Add Uniswap V3 positions
    this.createToken({
      symbol: "UNI-V3-USDC-ETH",
      name: "Uniswap V3 USDC/ETH LP",
      type: "uniswap_v3",
      decimals: 18,
      active: true,
      baseGasLimit: 102000,
      address: "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
      protocol: "Uniswap V3",
      poolId: "usdc-eth-500",
      range: "0.95-1.05",
    });

    // Add Yearn vault tokens
    this.createToken({
      symbol: "yvUSDC",
      name: "Yearn USDC Vault",
      type: "yearn_vault",
      decimals: 6,
      active: true,
      baseGasLimit: 120000,
      address: "0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE",
      protocol: "Yearn",
      poolId: "usdc-vault",
    });

    // Add mock token data
    this.createToken({
      symbol: "wstETH",
      name: "Wrapped Staked Ethereum",
      type: "lsd",
      decimals: 18,
      active: true,
      baseGasLimit: 65000,
      address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
    });
    this.createToken({
      symbol: "rETH",
      name: "Rocket Pool ETH",
      type: "lsd",
      decimals: 18,
      active: true,
      baseGasLimit: 70000,
      address: "0xae78736Cd615f374D3085123A210448E74Fc6393"
    });
    this.createToken({
      symbol: "USDC",
      name: "USD Coin",
      type: "stablecoin",
      decimals: 6,
      active: true,
      baseGasLimit: 45000,
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    });
    this.createToken({
      symbol: "DAI",
      name: "Dai Stablecoin",
      type: "stablecoin",
      decimals: 18,
      active: true,
      baseGasLimit: 48000,
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    });
    this.createToken({
      symbol: "UNI",
      name: "Uniswap",
      type: "governance",
      decimals: 18,
      active: true,
      baseGasLimit: 55000,
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
    });
    this.createToken({
      symbol: "AAVE",
      name: "Aave Token",
      type: "governance",
      decimals: 18,
      active: true,
      baseGasLimit: 52000,
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
    });


    // Add mock protocol data with supported tokens
    this.createProtocol({
      name: "AAVE",
      apy: 4.5,
      tvl: 10000000,
      active: true,
      supportedTokens: ["wstETH", "rETH", "USDC", "DAI", "UNI", "AAVE"],
      gasOverhead: 220000
    });
    this.createProtocol({
      name: "Compound",
      apy: 3.8,
      tvl: 8500000,
      active: true,
      supportedTokens: ["USDC", "DAI"],
      gasOverhead: 180000
    });
    this.createProtocol({
      name: "Morpho",
      apy: 4.2,
      tvl: 7000000,
      active: true,
      supportedTokens: ["wstETH", "USDC", "DAI"],
      gasOverhead: 250000
    });

    // Add mock vault data with diverse portfolio
    this.createVault({
      name: "USDC Vault",
      balance: 10000,
      autoMode: true,
      protocol: "AAVE",
      token: "USDC",
      apy: 4.5
    });
    this.createVault({
      name: "wstETH Vault",
      balance: 5,
      autoMode: true,
      protocol: "Morpho",
      token: "wstETH",
      apy: 4.2
    });
    this.createVault({
      name: "DAI Vault",
      balance: 15000,
      autoMode: true,
      protocol: "Compound",
      token: "DAI",
      apy: 3.8
    });
    this.createVault({
      name: "UNI Governance Vault",
      balance: 1000,
      autoMode: false,
      protocol: "AAVE",
      token: "UNI",
      apy: 2.5
    });
  }

  // Token methods
  async getTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }

  async getActiveTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values()).filter(t => t.active);
  }

  async getToken(symbol: string): Promise<Token | undefined> {
    return Array.from(this.tokens.values()).find(t => t.symbol === symbol);
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = this.tokenId++;
    const token: Token = { ...insertToken, id };
    this.tokens.set(id, token);
    return token;
  }

  async updateToken(id: number, updates: Partial<InsertToken>): Promise<Token> {
    const token = this.tokens.get(id);
    if (!token) throw new Error("Token not found");
    const updatedToken = { ...token, ...updates };
    this.tokens.set(id, updatedToken);
    return updatedToken;
  }

  // Protocol methods
  async getProtocols(): Promise<Protocol[]> {
    return Array.from(this.protocols.values());
  }

  async getActiveProtocols(): Promise<Protocol[]> {
    return Array.from(this.protocols.values()).filter(p => p.active);
  }

  async createProtocol(insertProtocol: InsertProtocol): Promise<Protocol> {
    const id = this.protocolId++;
    const protocol: Protocol = { ...insertProtocol, id };
    this.protocols.set(id, protocol);
    return protocol;
  }

  async updateProtocol(id: number, updates: Partial<InsertProtocol>): Promise<Protocol> {
    const protocol = this.protocols.get(id);
    if (!protocol) throw new Error("Protocol not found");
    const updatedProtocol = { ...protocol, ...updates };
    this.protocols.set(id, updatedProtocol);
    return updatedProtocol;
  }

  async toggleProtocol(id: number): Promise<Protocol> {
    const protocol = this.protocols.get(id);
    if (!protocol) throw new Error("Protocol not found");
    const updatedProtocol = { ...protocol, active: !protocol.active };
    this.protocols.set(id, updatedProtocol);
    return updatedProtocol;
  }

  // Vault methods
  async getVaults(): Promise<Vault[]> {
    return Array.from(this.vaults.values());
  }

  async getVault(id: number): Promise<Vault | undefined> {
    return this.vaults.get(id);
  }

  async createVault(insertVault: InsertVault): Promise<Vault> {
    const id = this.vaultId++;
    const vault: Vault = { ...insertVault, id };
    this.vaults.set(id, vault);
    return vault;
  }

  async updateVault(id: number, updates: Partial<InsertVault>): Promise<Vault> {
    const vault = this.vaults.get(id);
    if (!vault) throw new Error("Vault not found");
    const updatedVault = { ...vault, ...updates };
    this.vaults.set(id, updatedVault);
    return updatedVault;
  }

  // Transaction methods
  async getTransactions(vaultId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.vaultId === vaultId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      timestamp: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  // Price methods
  async getPrices(asset: string): Promise<Price[]> {
    return Array.from(this.prices.values())
      .filter(p => p.asset === asset)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLatestPrice(asset: string): Promise<Price | undefined> {
    return Array.from(this.prices.values())
      .filter(p => p.asset === asset)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  async createPrice(insertPrice: InsertPrice): Promise<Price> {
    const id = this.priceId++;
    const price: Price = {
      ...insertPrice,
      id,
      timestamp: new Date(),
    };
    this.prices.set(id, price);
    return price;
  }
}

export const storage = new MemStorage();
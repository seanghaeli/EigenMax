import { type Protocol, type InsertProtocol, type Vault, type InsertVault, type Transaction, type InsertTransaction } from "@shared/schema";

export interface IStorage {
  // Protocol methods
  getProtocols(): Promise<Protocol[]>;
  getActiveProtocols(): Promise<Protocol[]>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: number, protocol: Partial<InsertProtocol>): Promise<Protocol>;
  toggleProtocol(id: number): Promise<Protocol>;

  // Existing methods
  getVaults(): Promise<Vault[]>;
  getVault(id: number): Promise<Vault | undefined>;
  createVault(vault: InsertVault): Promise<Vault>;
  updateVault(id: number, vault: Partial<InsertVault>): Promise<Vault>;
  getTransactions(vaultId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private protocols: Map<number, Protocol>;
  private vaults: Map<number, Vault>;
  private transactions: Map<number, Transaction>;
  private protocolId: number = 1;
  private vaultId: number = 1;
  private transactionId: number = 1;

  constructor() {
    this.protocols = new Map();
    this.vaults = new Map();
    this.transactions = new Map();

    // Add mock protocol data
    this.createProtocol({ name: "AAVE", apy: 4.5, tvl: 10000000, active: true });
    this.createProtocol({ name: "Compound", apy: 3.8, tvl: 8500000, active: true });
    this.createProtocol({ name: "Morpho", apy: 4.2, tvl: 7000000, active: true });
    this.createProtocol({ name: "Moonwell", apy: 3.5, tvl: 5000000, active: true });

    // Add mock vault data
    this.createVault({ name: "USDC Vault", balance: 10000, autoMode: true, protocol: "AAVE", apy: 4.5 });
    this.createVault({ name: "DAI Vault", balance: 5000, autoMode: false, protocol: "Compound", apy: 3.8 });
    this.createVault({ name: "USDT Vault", balance: 7500, autoMode: true, protocol: "Morpho", apy: 4.2 });
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

  // Existing methods remain unchanged
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
}

export const storage = new MemStorage();
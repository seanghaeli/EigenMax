import { type Vault, type InsertVault, type Transaction, type InsertTransaction } from "@shared/schema";

export interface IStorage {
  getVaults(): Promise<Vault[]>;
  getVault(id: number): Promise<Vault | undefined>;
  createVault(vault: InsertVault): Promise<Vault>;
  updateVault(id: number, vault: Partial<InsertVault>): Promise<Vault>;
  getTransactions(vaultId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private vaults: Map<number, Vault>;
  private transactions: Map<number, Transaction>;
  private vaultId: number = 1;
  private transactionId: number = 1;

  constructor() {
    this.vaults = new Map();
    this.transactions = new Map();
    
    // Add mock data
    this.createVault({ name: "USDC Vault", balance: 10000, autoMode: true, protocol: "AAVE", apy: 4.5 });
    this.createVault({ name: "DAI Vault", balance: 5000, autoMode: false, protocol: "Compound", apy: 3.8 });
    this.createVault({ name: "USDT Vault", balance: 7500, autoMode: true, protocol: "Morpho", apy: 4.2 });
  }

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

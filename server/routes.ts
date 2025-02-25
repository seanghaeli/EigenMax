import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVaultSchema, insertTransactionSchema, insertProtocolSchema, insertPriceSchema } from "@shared/schema";

class YieldOptimizer {
  async checkAndOptimize(vault: any) {
    const protocols = await storage.getActiveProtocols();
    const ethPrice = await storage.getLatestPrice("ethereum");

    // Consider price trends in optimization strategy
    const bestProtocol = protocols.reduce((best, current) => {
      const currentScore = current.apy * (ethPrice ? ethPrice.price / 3000 : 1); // Price-weighted APY
      const bestScore = best.apy * (ethPrice ? ethPrice.price / 3000 : 1);
      return currentScore > bestScore ? current : best;
    });

    if (bestProtocol.name !== vault.protocol) {
      const transaction = await storage.createTransaction({
        vaultId: vault.id,
        type: "rebalance",
        amount: vault.balance,
        timestamp: new Date(),
      });

      const updatedVault = await storage.updateVault(vault.id, {
        protocol: bestProtocol.name,
        apy: bestProtocol.apy,
      });

      return { vault: updatedVault, transaction };
    }

    return null;
  }
}

export async function registerRoutes(app: Express) {
  // Initialize historical price data (past hour)
  const startTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
  const basePrice = 3150.75;
  for (let i = 0; i < 60; i++) { // One data point per minute
    const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
    const volatility = 0.0005; // 0.05% per minute
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const price = basePrice * (1 + randomChange);
    await storage.createPrice({
      asset: "ethereum",
      price,
      timestamp,
    });
  }

  // Protocol routes
  app.get("/api/protocols", async (_req, res) => {
    const protocols = await storage.getProtocols();
    res.json(protocols);
  });

  app.post("/api/protocols", async (req, res) => {
    const result = insertProtocolSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid protocol data" });
    }
    const protocol = await storage.createProtocol(result.data);
    res.json(protocol);
  });

  app.patch("/api/protocols/:id", async (req, res) => {
    const protocol = await storage.updateProtocol(Number(req.params.id), req.body);
    res.json(protocol);
  });

  app.post("/api/protocols/:id/toggle", async (req, res) => {
    const protocol = await storage.toggleProtocol(Number(req.params.id));
    res.json(protocol);
  });

  // Price routes
  app.get("/api/prices/:asset", async (req, res) => {
    const prices = await storage.getPrices(req.params.asset);
    res.json(prices);
  });

  // Simulate price updates every minute
  setInterval(async () => {
    const lastPrice = await storage.getLatestPrice("ethereum");
    const basePrice = lastPrice?.price || 3000;
    const volatility = 0.0005; // 0.05% per minute
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = basePrice * (1 + randomChange);
    await storage.createPrice({
      asset: "ethereum",
      price: newPrice,
      timestamp: new Date(),
    });
  }, 60000); // Update every minute

  // Vault routes
  app.get("/api/vaults", async (_req, res) => {
    const vaults = await storage.getVaults();
    res.json(vaults);
  });

  app.get("/api/vaults/:id", async (req, res) => {
    const vault = await storage.getVault(Number(req.params.id));
    if (!vault) return res.status(404).json({ message: "Vault not found" });
    res.json(vault);
  });

  app.post("/api/vaults", async (req, res) => {
    const result = insertVaultSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid vault data" });
    }
    const vault = await storage.createVault(result.data);
    res.json(vault);
  });

  app.patch("/api/vaults/:id", async (req, res) => {
    const vault = await storage.updateVault(Number(req.params.id), req.body);
    res.json(vault);
  });

  app.post("/api/vaults/:id/optimize", async (req, res) => {
    const vault = await storage.getVault(Number(req.params.id));
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const optimizer = new YieldOptimizer();
    const result = await optimizer.checkAndOptimize(vault);
    res.json(result || vault);
  });

  app.get("/api/vaults/:id/transactions", async (req, res) => {
    const transactions = await storage.getTransactions(Number(req.params.id));
    res.json(transactions);
  });

  app.post("/api/transactions", async (req, res) => {
    const result = insertTransactionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid transaction data" });
    }
    const transaction = await storage.createTransaction(result.data);
    res.json(transaction);
  });

  return createServer(app);
}
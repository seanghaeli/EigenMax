import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVaultSchema, insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
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

import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVaultSchema, insertTransactionSchema, insertProtocolSchema, insertPriceSchema } from "@shared/schema";

// Function to fetch ETH price from CoinGecko
async function fetchEthPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return null;
  }
}

// Function to fetch historical ETH prices
async function fetchHistoricalEthPrices() {
  try {
    // Get data for the last hour with 5-minute intervals
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/ethereum/market_chart/range?vs_currency=usd&from=${oneHourAgo}&to=${now}`
    );
    const data = await response.json();
    return data.prices.map(([timestamp, price]: [number, number]) => ({
      timestamp: new Date(timestamp * 1000), // Corrected timestamp conversion
      price
    }));
  } catch (error) {
    console.error('Error fetching historical ETH prices:', error);
    return [];
  }
}

class YieldOptimizer {
  async checkAndOptimize(vault: any) {
    const protocols = await storage.getActiveProtocols();
    const ethPrice = await storage.getLatestPrice("ethereum");
    const priceHistory = await storage.getPrices("ethereum");

    // Calculate price trend
    const priceChange = priceHistory.length > 1 
      ? (priceHistory[0].price - priceHistory[priceHistory.length - 1].price) / priceHistory[priceHistory.length - 1].price
      : 0;

    // Enhanced scoring that considers:
    // 1. Base APY
    // 2. Current ETH price relative to baseline (3000)
    // 3. Recent price trend
    const bestProtocol = protocols.reduce((best, current) => {
      const priceMultiplier = (ethPrice?.price || 3000) / 3000;
      const trendMultiplier = 1 + (priceChange * 0.5); // Price trend has 50% weight

      const currentScore = current.apy * priceMultiplier * trendMultiplier;
      const bestScore = best.apy * priceMultiplier * trendMultiplier;

      return currentScore > bestScore ? current : best;
    });

    if (bestProtocol.name !== vault.protocol) {
      // Include transaction cost consideration (0.1% fee assumption)
      const transactionCost = vault.balance * 0.001;
      const currentYearlyYield = vault.balance * (vault.apy / 100);
      const newYearlyYield = vault.balance * (bestProtocol.apy / 100);
      const yearlyBenefit = newYearlyYield - currentYearlyYield;

      // Only rebalance if benefit exceeds transaction costs
      if (yearlyBenefit > transactionCost) {
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

        return {
          vault: updatedVault,
          transaction,
          analysis: {
            priceChange: priceChange * 100,
            currentYield: currentYearlyYield,
            projectedYield: newYearlyYield,
            transactionCost,
            netBenefit: yearlyBenefit - transactionCost
          }
        };
      }
    }

    return null;
  }
}

export async function registerRoutes(app: Express) {
  // Initialize historical price data
  const historicalPrices = await fetchHistoricalEthPrices();
  for (const { timestamp, price } of historicalPrices) {
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

  // Real-time price updates using CoinGecko
  setInterval(async () => {
    const price = await fetchEthPrice();
    if (price) {
      await storage.createPrice({
        asset: "ethereum",
        price,
        timestamp: new Date(),
      });
    }
  }, 10000); // Update every 10 seconds

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
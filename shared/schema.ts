import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type", { 
    enum: ["lsd", "governance", "stablecoin", "other"] 
  }).notNull(),
  decimals: integer("decimals").notNull().default(18),
  active: boolean("active").notNull().default(true),
  baseGasLimit: integer("base_gas_limit").notNull(), 
  address: text("address").notNull(),
});

export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { 
    enum: ["lending", "dex", "yield_aggregator", "avs", "other"] 
  }).notNull(),
  apy: real("apy").notNull().default(0),
  tvl: real("tvl").notNull().default(0),
  active: boolean("active").notNull().default(true),
  supportedTokens: text("supported_tokens").array().notNull(),
  gasOverhead: integer("gas_overhead").notNull(),
  healthScore: real("health_score").notNull().default(50),
  tvlChange24h: real("tvl_change_24h").notNull().default(0),
  tvlChange7d: real("tvl_change_7d").notNull().default(0),
  lastUpdate: timestamp("last_update").notNull().defaultNow(),
  // New AVS-specific fields
  slashingRisk: real("slashing_risk").default(0),
  nodeCount: integer("node_count").default(0),
  avgUptimePercent: real("avg_uptime_percent").default(99.9),
  restakingEnabled: boolean("restaking_enabled").default(false),
  minStakeAmount: real("min_stake_amount").default(0),
  avgRewardRate: real("avg_reward_rate").default(0),
  securityScore: real("security_score").default(50),
  riskCategory: text("risk_category", {
    enum: ["low", "medium", "high"]
  }).default("medium"),
});

export const vaults = pgTable("vaults", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  balance: real("balance").notNull().default(0),
  autoMode: boolean("auto_mode").notNull().default(false),
  protocol: text("protocol").notNull(),
  token: text("token").notNull(), 
  apy: real("apy").notNull().default(0),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  vaultId: integer("vault_id").notNull(),
  type: text("type", { enum: ["deposit", "withdraw", "rebalance"] }).notNull(),
  amount: real("amount").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  gasCost: real("gas_cost").notNull().default(0), 
  txHash: text("tx_hash"), 
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  asset: text("asset").notNull(),
  price: real("price").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertTokenSchema = createInsertSchema(tokens, {
  id: z.number(),
  symbol: z.string(),
  name: z.string(),
  type: z.enum(["lsd", "governance", "stablecoin", "other"]),
  decimals: z.number(),
  active: z.boolean(),
  baseGasLimit: z.number(),
  address: z.string(),
}).omit({ id: true });

export const insertProtocolSchema = createInsertSchema(protocols, {
  id: z.number(),
  name: z.string(),
  type: z.enum(["lending", "dex", "yield_aggregator", "avs", "other"]),
  apy: z.number(),
  tvl: z.number(),
  active: z.boolean(),
  supportedTokens: z.array(z.string()),
  gasOverhead: z.number(),
  healthScore: z.number(),
  tvlChange24h: z.number(),
  tvlChange7d: z.number(),
  lastUpdate: z.date(),
  slashingRisk: z.number().optional(),
  nodeCount: z.number().optional(),
  avgUptimePercent: z.number().optional(),
  restakingEnabled: z.boolean().optional(),
  minStakeAmount: z.number().optional(),
  avgRewardRate: z.number().optional(),
  securityScore: z.number().optional(),
  riskCategory: z.enum(["low", "medium", "high"]).optional(),
}).omit({ id: true });

export const insertVaultSchema = createInsertSchema(vaults, {
  id: z.number(),
  name: z.string(),
  balance: z.number(),
  autoMode: z.boolean(),
  protocol: z.string(),
  token: z.string(),
  apy: z.number(),
}).omit({ id: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  id: z.number(),
  vaultId: z.number(),
  type: z.enum(["deposit", "withdraw", "rebalance"]),
  amount: z.number(),
  timestamp: z.date(),
  gasCost: z.number(),
  txHash: z.string().optional(),
}).omit({ id: true });

export const insertPriceSchema = createInsertSchema(prices, {
  id: z.number(),
  asset: z.string(),
  price: z.number(),
  timestamp: z.date(),
}).omit({ id: true });

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type Vault = typeof vaults.$inferSelect;
export type InsertVault = z.infer<typeof insertVaultSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Price = typeof prices.$inferSelect;
export type InsertPrice = z.infer<typeof insertPriceSchema>;
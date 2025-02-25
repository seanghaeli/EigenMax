import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apy: real("apy").notNull().default(0),
  tvl: real("tvl").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const vaults = pgTable("vaults", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  balance: real("balance").notNull().default(0),
  autoMode: boolean("auto_mode").notNull().default(false),
  protocol: text("protocol").notNull(),
  apy: real("apy").notNull().default(0),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  vaultId: integer("vault_id").notNull(),
  type: text("type", { enum: ["deposit", "withdraw", "rebalance"] }).notNull(),
  amount: real("amount").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertProtocolSchema = createInsertSchema(protocols, {
  id: z.number(),
  name: z.string(),
  apy: z.number(),
  tvl: z.number(),
  active: z.boolean(),
}).omit({ id: true });

export const insertVaultSchema = createInsertSchema(vaults, {
  id: z.number(),
  name: z.string(),
  balance: z.number(),
  autoMode: z.boolean(),
  protocol: z.string(),
  apy: z.number(),
}).omit({ id: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  id: z.number(),
  vaultId: z.number(),
  type: z.enum(["deposit", "withdraw", "rebalance"]),
  amount: z.number(),
  timestamp: z.date(),
}).omit({ id: true });

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type Vault = typeof vaults.$inferSelect;
export type InsertVault = z.infer<typeof insertVaultSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
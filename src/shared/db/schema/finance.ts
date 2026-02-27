import { pgTable, text, timestamp, decimal, uuid, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const walletStatus = pgEnum("wallet_status", ["active", "frozen", "closed"]);
export const transactionType = pgEnum("transaction_type", ["deposit", "withdrawal", "payment", "refund"]);
export const transactionStatus = pgEnum("transaction_status", ["pending", "completed", "failed", "cancelled"]);
export const apiKeyStatus = pgEnum("api_key_status", ["active", "revoked", "expired"]);
export const apiKeyEnvironment = pgEnum("api_key_environment", ["development", "staging", "production"]);

export const wallets = pgTable(
    "wallets",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: "cascade" }),
        balance: decimal("balance", { precision: 20, scale: 8 }).default("0").notNull(),
        currency: text("currency").notNull(),
        minimumBalance: decimal("minimum_balance", { precision: 20, scale: 8 }),
        status: walletStatus("status"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        lastTransactionAt: timestamp("last_transaction_at"),
    },
    // (table) => [
    //     index("wallets_userId_idx").on(table.userId),
    //     index("wallets_status_idx").on(table.status),
    // ]
);

export const transactions = pgTable(
    "transactions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        walletId: uuid("wallet_id")
            .notNull()
            .references(() => wallets.id),
        type: transactionType("type").notNull(),
        amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
        fee: decimal("fee", { precision: 20, scale: 8 }),
        netAmount: decimal("net_amount", { precision: 20, scale: 8 }),
        currency: text("currency"),
        status: transactionStatus("status").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        completedAt: timestamp("completed_at"),
        failedAt: timestamp("failed_at"),
    },
    // (table) => [
    //     index("transactions_userId_idx").on(table.userId),
    //     index("transactions_walletId_idx").on(table.walletId),
    //     index("transactions_status_idx").on(table.status),
    //     index("transactions_type_idx").on(table.type),
    //     index("transactions_userId_status_idx").on(table.userId, table.status),
    //     index("transactions_userId_createdAt_idx").on(table.userId, table.createdAt),
    //     index("transactions_walletId_status_idx").on(table.walletId, table.status),
    // ]
);

export const walletsRelations = relations(wallets, ({ one, many }) => ({
    user: one(user, {
        fields: [wallets.userId],
        references: [user.id],
    }),
    transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(user, {
        fields: [transactions.userId],
        references: [user.id],
    }),
    wallet: one(wallets, {
        fields: [transactions.walletId],
        references: [wallets.id],
    }),
}));
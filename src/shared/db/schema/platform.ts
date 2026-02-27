import { pgTable, text, timestamp, decimal, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const serviceType = pgEnum("service_type", ["kyc", "verification", "identity_check"]);
export const feeType = pgEnum("fee_type", ["percentage", "fixed"]);
export const feeStatus = pgEnum("fee_status", ["active", "inactive"]);

export const providerServices = pgTable("provider_services", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    serviceType: serviceType("service_type"),
    apiEndpoint: text("api_endpoint"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const platformFees = pgTable(
    "platform_fees",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        serviceType: serviceType("service_type"),
        feeName: text("fee_name"),
        feeType: feeType("fee_type"),
        feeValue: decimal("fee_value", { precision: 10, scale: 4 }),
        effectiveFrom: timestamp("effective_from"),
        effectiveTo: timestamp("effective_to"),
        isActive: boolean("is_active"),
        createdBy: uuid("created_by")
            .references(() => user.id),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    // (table) => [
    //     index("platformFees_createdBy_idx").on(table.createdBy),
    // ]
);

export const platformFeesRelations = relations(platformFees, ({ one }) => ({
    creator: one(user, {
        fields: [platformFees.createdBy],
        references: [user.id],
    }),
}));
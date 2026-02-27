import { pgTable, text, timestamp, uuid, pgEnum, jsonb, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const kycVerificationStatus = pgEnum("kyc_verification_status", ["pending", "approved", "rejected", "expired"]);

export const userKycProofs = pgTable(
    "user_kyc_proofs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .unique()
            .references(() => user.id, { onDelete: "cascade" }),
        applicantId: text("applicant_id"),
        verificationStatus: kycVerificationStatus("verification_status"),
        verifiedAt: timestamp("verified_at"),
        expiresAt: timestamp("expires_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    // (table) => [
    //     index("userKycProofs_userId_idx").on(table.userId),
    // ]
);

export const kycFlowStage = pgEnum("kyc_flow_stage", [
    "draft",      // filling form
    "submitted",  // sent to provider (LOCKED)
    "pending",    // provider processing
    "approved",   // success
    "rejected",   // failed
    "expired"
]);

export const customerKycProofs = pgTable(
    "customer_kyc_proofs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        applicantId: text("applicant_id"),
        documentId: text("document_id"),
        email: text("email"),
        expiresAt: timestamp("expires_at"),
        hash: text("hash"), // SHA-256 hash of the KYC proof payload
        tempHash: text("temp_hash"), // Encrypted proof stored temporarily, encrypted with token-derived key
        tokenId: uuid("token_id"), // Reference to sdk_token.id for proof retrieval
        zkData: jsonb("zk_data").$type<{
            isBigger18?: boolean; // Only set when verification is complete
            isMale?: boolean; // Only set when verification is complete
            isKycStatus: boolean;
            country: string;
            expiracyDate: string;
        }>(),
        // Wallet binding — all nullable, only populated after StepSigning
        walletAddress: text("wallet_address"),
        commitmentHash: text("commitment_hash"),
        transactionHash: text("transaction_hash"),
        walletBoundAt: timestamp("wallet_bound_at"),
        userSignature: jsonb("user_signature"),

        flowStage: kycFlowStage("flow_stage").default("draft").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    // (table) => [
    //     index("customerKycProofs_userId_idx").on(table.userId),
    // ]
);

export const userKycProofsRelations = relations(userKycProofs, ({ one }) => ({
    user: one(user, {
        fields: [userKycProofs.userId],
        references: [user.id],
    }),
}));

export const customerFeedback = pgTable("customer_feedback", {
    id: uuid("id").primaryKey().defaultRandom(),

    customerKycProofId: uuid("customer_kyc_proof_id")
        .notNull()
        .unique()
        .references(() => customerKycProofs.id, { onDelete: "cascade" }),

    rating: integer("rating"), // 1–5
    comment: text("comment"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerKycProofsRelations = relations(customerKycProofs, ({ one }) => ({
    user: one(user, {
        fields: [customerKycProofs.userId],
        references: [user.id],
    }),
}));

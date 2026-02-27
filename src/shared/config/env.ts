import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  // Server-side only variables - NOT accessible on the client
  // These are secure and will not be exposed to the browser
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.number(),
    DATABASE_USER: z.string(),
    DATABASE_PASS: z.string(),
    DATABASE_DB: z.string(),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.string().url().optional(),

    // Platform API URL for token generation and verification
    PLATFORM_API_URL: z.string().url().optional(),

    // AWS SES Configuration
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),

    // KYCAID Configuration
    KYCAID_API_BASE: z.string().url().optional(),
    KYCAID_API_TOKEN: z.string().optional(),
    KYCAID_FORM_ID: z.string().optional(),
    KYCAID_AML_FORM_ID: z.string().optional(),

    // ZkPass Configuration
    ZKPASS_API_PATH: z.string().url().optional(),

      HYPERSIGN_KYC_API_SECRET: z.string().optional(),
  HYPERSIGN_SSI_API_SECRET: z.string().optional(),
  HYPERSIGN_ISSUER_DID: z.string().optional(),
  HYPERSIGN_ISSUER_VERMETHOD_ID: z.string().optional(),
  },

  // Client-side accessible variables - MUST be prefixed with NEXT_PUBLIC_
  // These variables will be exposed to the browser, so only include non-sensitive values
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_ENCRYPTION_KEY: z.string().optional(),
    NEXT_PUBLIC_ENCRYPT_SECRET: z.string().optional(),
  },

  runtimeEnv: {
   DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASS: process.env.DATABASE_PASS,
    DATABASE_DB: process.env.DATABASE_DB,

    
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    PLATFORM_API_URL: process.env.PLATFORM_API_URL,

    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,

    KYCAID_API_BASE: process.env.KYCAID_API_BASE,
    KYCAID_API_TOKEN: process.env.KYCAID_API_TOKEN,
    KYCAID_FORM_ID: process.env.KYCAID_FORM_ID,
    KYCAID_AML_FORM_ID: process.env.KYCAID_AML_FORM_ID,

    ZKPASS_API_PATH: process.env.ZKPASS_API_PATH,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_ENCRYPTION_KEY: process.env.NEXT_PUBLIC_ENCRYPTION_KEY,
    NEXT_PUBLIC_ENCRYPT_SECRET: process.env.NEXT_PUBLIC_ENCRYPT_SECRET,

      HYPERSIGN_KYC_API_SECRET: process.env.KYC_API_SECRET,
  HYPERSIGN_SSI_API_SECRET: process.env.SSI_API_SECRET,
  HYPERSIGN_ISSUER_DID: process.env.ISSUER_DID,
  HYPERSIGN_ISSUER_VERMETHOD_ID: process.env.ISSUER_VERMETHOD_ID,
  },
});


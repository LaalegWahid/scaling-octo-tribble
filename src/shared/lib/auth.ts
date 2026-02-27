import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey } from "better-auth/plugins";
import { db } from "@/shared/db"; 
import { apikey } from "@/shared/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      apikey: apikey,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    apiKey({
      enableMetadata: true,
      rateLimit: {
        enabled: false, 
      }
    }),
  ],
});


export async function checkApiKeyInDb(apiKey: string): Promise<boolean> {
  try {
    const result = await auth.api.verifyApiKey({
      body: { key: apiKey },
    });
    return result.valid === true;
  } catch (error) {
    console.error("API key verification failed:", error);
    return false;
  }
}
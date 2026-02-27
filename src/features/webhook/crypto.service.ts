import crypto from "crypto";
import { db } from "@/shared/db";
import { sdkToken } from "@/shared/db/schema/auth";
import { eq } from "drizzle-orm";
import { KycPayload, EncryptedData } from "./types";

export async function getEncryptedProof(tokenId: string | null, zkPassResult: KycPayload): Promise<string | null> {
  if (!tokenId) return null;

  const tokenRecord = await db
    .select({ token: sdkToken.token })
    .from(sdkToken)
    .where(eq(sdkToken.id, tokenId))
    .limit(1);

  if (!tokenRecord[0]?.token) return null;

  console.log("Encrypting proof for applicant");
  return encryptProofWithToken(zkPassResult, tokenRecord[0].token);
}

function encryptProofWithToken(proof: KycPayload, token: string): string {
  if (!token) {
    throw new Error("Missing token");
  }

  const key = crypto.createHash("sha256").update(token).digest();
  const iv = crypto.randomBytes(12);
  
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const jsonString = JSON.stringify(proof);
  let encrypted = cipher.update(jsonString, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const authTag = cipher.getAuthTag().toString("base64");
  
  const encryptedData: EncryptedData = {
    ciphertext: encrypted,
    iv: iv.toString("base64"),
    authTag: authTag,
  };
  
  return JSON.stringify(encryptedData);
}

export function decryptProofWithToken(encryptedProofJson: string, token: string): KycPayload {
  if (!token ) {
    throw new Error("Invalid token format");
  }

  const encryptedData: EncryptedData = JSON.parse(encryptedProofJson);
  
  const key = crypto.createHash("sha256").update(token).digest();
  const iv = Buffer.from(encryptedData.iv, "base64");
  const authTag = Buffer.from(encryptedData.authTag, "base64");
  
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData.ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  
  return JSON.parse(decrypted) as KycPayload;
}
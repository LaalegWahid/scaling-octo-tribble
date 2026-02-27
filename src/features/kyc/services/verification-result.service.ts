import crypto from 'crypto';
import { db } from '@/shared/db';
import { customerKycProofs } from '@/shared/db/schema/kyc';
import { sdkToken } from '@/shared/db/schema/auth';
import { eq } from 'drizzle-orm';
import { env } from '@/shared/config/env';

// ── Types (from original webhook/types.ts) ────────────────────────────────────

type KycPayload = {
  success: boolean;
  data: {
    task: string;
    signature: string;
    result: {
      verify_result: boolean;
      data: string;
      url: string;
      method: "GET" | "POST" | "PUT" | "DELETE";
      asserts: {
        response: Array<{
          key: string;
          operation?: ">" | "<" | "=";
          value?: string;
          tips?: string;
          isPublic?: boolean;
        }>;
      };
      verify_timestamp: number;
    };
    validatorAddress: string;
    data: {
      isMale: boolean;
      expiry_date: string;
      country: string;
    };
  };
};

type EncryptedData = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

// ── zkPass (identical to original zkpass.service.ts) ─────────────────────────

async function callZkPass(applicantId: string): Promise<KycPayload> {
  if (!applicantId) throw new Error("applicant_id is required");

  const path = env.ZKPASS_API_PATH;
  if (!path) throw new Error("ZKPASS_API_PATH is not defined");

  const url = path + "/" + encodeURIComponent(applicantId);
  console.log("zkPass URL:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch {
    console.error("ZKPass returned non-JSON:", text.slice(0, 200));
    throw new Error("ZkPass returned invalid JSON");
  }

  if (!res.ok) throw new Error(payload?.error || "ZkPass request failed");
  return payload;
}

function hashKycPayload(payload: KycPayload): string {
  const json = JSON.stringify(payload);
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  console.log("Generated hash for payload:", hash);
  return hash;
}

// ── Encryption (identical to original crypto.service.ts) ─────────────────────

function encryptProofWithToken(proof: KycPayload, token: string): string {
  if (!token) throw new Error("Missing token");
  const key = crypto.createHash("sha256").update(token).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(JSON.stringify(proof), "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");
  const encryptedData: EncryptedData = {
    ciphertext: encrypted,
    iv: iv.toString("base64"),
    authTag,
  };
  return JSON.stringify(encryptedData);
}

async function getEncryptedProof(
  tokenId: string | null,
  zkPassResult: KycPayload
): Promise<string | null> {
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

// ── Age calculation ───────────────────────────────────────────────────────────

function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());
  if (!hasHadBirthday) age--;
  return age;
}

// ── Main exports ──────────────────────────────────────────────────────────────

export async function handleVerificationResult(
  proofId: string,
  sessionId: string,          // Hypersign sessionId → used as applicantId for zkPass
  dobFromForm: string | undefined
): Promise<string> {

  const existing = await db
    .select({ id: customerKycProofs.id, tokenId: customerKycProofs.tokenId })
    .from(customerKycProofs)
    .where(eq(customerKycProofs.id, proofId))
    .limit(1);

  if (!existing[0]) throw new Error("KYC proof record not found");

  // ── Call zkPass exactly as the original webhook did ───────────────────────
  const zkPassResult = await callZkPass(sessionId);
  const hash = hashKycPayload(zkPassResult);

  const baseData = zkPassResult.data.data;
  const age = calculateAge(dobFromForm);

  const zkData = {
    isBigger18: age !== null ? age >= 18 : undefined,
    isMale: baseData.isMale || false,
    isKycStatus: true,
    country: baseData.country || "",
    expiracyDate: baseData.expiry_date || "",
  };

  // ── Encrypt exactly as the original webhook did ───────────────────────────
  const encryptedProof = await getEncryptedProof(existing[0].tokenId, zkPassResult);

  const expiresAt = baseData.expiry_date ? new Date(baseData.expiry_date) : null;

  // ── Update DB exactly as the original webhook did ─────────────────────────
  await db.update(customerKycProofs).set({
    zkData,
    hash,
    tempHash: encryptedProof,
    expiresAt,
    flowStage: "approved",
    updatedAt: new Date(),
  }).where(eq(customerKycProofs.id, existing[0].id));

  console.log("✅ Proof record approved:", proofId);
  return hash;
}

export async function handleFailedVerification(proofId: string): Promise<void> {
  await db.update(customerKycProofs).set({
    zkData: { isKycStatus: false, country: "", expiracyDate: "" },
    flowStage: "rejected",
    updatedAt: new Date(),
  }).where(eq(customerKycProofs.id, proofId));
}

// import crypto from 'crypto';
// import { db } from '@/shared/db';
// import { customerKycProofs } from '@/shared/db/schema/kyc';
// import { sdkToken } from '@/shared/db/schema/auth';
// import { eq } from 'drizzle-orm';

// type KycPayload = {
//   success: boolean;
//   data: {
//     task: string;
//     signature: string;
//     result: {
//       verify_result: boolean;
//       data: string;
//       url: string;
//       method: "GET" | "POST" | "PUT" | "DELETE";
//       asserts: {
//         response: Array<{
//           key: string;
//           operation?: ">" | "<" | "=";
//           value?: string;
//           tips?: string;
//           isPublic?: boolean;
//         }>;
//       };
//       verify_timestamp: number;
//     };
//     validatorAddress: string;
//     data: {
//       isMale: boolean;
//       expiry_date: string;
//       country: string;
//     };
//   };
// };

// type EncryptedData = {
//   ciphertext: string;
//   iv: string;
//   authTag: string;
// };

// function calculateAge(dob: string | null | undefined): number | null {
//   if (!dob) return null;
//   const birthDate = new Date(dob);
//   if (isNaN(birthDate.getTime())) return null;
//   const today = new Date();
//   let age = today.getFullYear() - birthDate.getFullYear();
//   const hasHadBirthday =
//     today.getMonth() > birthDate.getMonth() ||
//     (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
//   if (!hasHadBirthday) age--;
//   return age;
// }

// export async function handleVerificationResult(
//   proofId: string,
//   credentials: any[],   // raw credentials array from verifyBiometrics
//   dobFromForm: string | undefined
// ): Promise<string> {

//   const existing = await db
//     .select({ id: customerKycProofs.id, tokenId: customerKycProofs.tokenId })
//     .from(customerKycProofs)
//     .where(eq(customerKycProofs.id, proofId))
//     .limit(1);

//   if (!existing[0]) throw new Error("KYC proof record not found");

//   // Pull data directly from Hypersign credential
//   const subject = credentials?.[0]?.credentialSubject ?? {};

//   const age = calculateAge(dobFromForm);

//   const zkData = {
//     isBigger18: age !== null ? age >= 18 : undefined,
//     isMale: subject.sex === "M",
//     isKycStatus: true,
//     country: subject.issuingStateCode || subject.nationality || "",
//     expiracyDate: subject.dateOfExpiry || "",
//   };

//   // Simple hash of the zkData itself (no zkPass needed)
//   const hash = crypto
//     .createHash("sha256")
//     .update(JSON.stringify(zkData))
//     .digest("hex");

//   const expiresAt = subject.dateOfExpiry ? new Date(subject.dateOfExpiry) : null;

//   await db.update(customerKycProofs).set({
//     zkData,
//     hash,
//     expiresAt,
//     flowStage: "approved",
//     updatedAt: new Date(),
//   }).where(eq(customerKycProofs.id, existing[0].id));

//   console.log("✅ Proof record approved:", proofId);
//   return hash;
// }

// export async function handleFailedVerification(proofId: string): Promise<void> {
//   await db.update(customerKycProofs).set({
//     zkData: { isKycStatus: false, country: "", expiracyDate: "" },
//     flowStage: "rejected",
//     updatedAt: new Date(),
//   }).where(eq(customerKycProofs.id, proofId));
// }
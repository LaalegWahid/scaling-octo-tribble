import { db } from "@/shared/db";
import { customerKycProofs } from "@/shared/db/schema/kyc";
import { eq } from "drizzle-orm";
import { callZkPass, hashKycPayload } from "./zkpass.service";
import { getEncryptedProof } from "./crypto.service";
import { calculateAge } from "./utils";

type WebhookApplicantLike = {
  dob?: string | null;
};

export async function handleFailedVerification(
  applicantId: string,
  _applicant?: WebhookApplicantLike
) {
  const existing = await db
    .select()
    .from(customerKycProofs)
    .where(eq(customerKycProofs.applicantId, applicantId))
    .limit(1);

  if (!existing[0]) {
    throw new Error("KYC proof record not found");
  }

  if (!["submitted", "pending"].includes(existing[0].flowStage)) {
    return;
  }

  await db.update(customerKycProofs).set({
    zkData: { isKycStatus: false, country: "", expiracyDate: "" },
    flowStage: "rejected",
    updatedAt: new Date(),
  }).where(eq(customerKycProofs.id, existing[0].id));

  console.log("Marked record as failed:", applicantId);
}

export async function handleSuccessfulVerification(
  applicantId: string,
  applicant?: WebhookApplicantLike
) {
  const existing = await db
    .select({
      id: customerKycProofs.id,
      flowStage: customerKycProofs.flowStage,
      tokenId: customerKycProofs.tokenId,
    })
    .from(customerKycProofs)
    .where(eq(customerKycProofs.applicantId, applicantId))
    .limit(1);

  if (!existing[0]) {
    throw new Error("KYC proof record not found");
  }

  if (!["submitted", "pending"].includes(existing[0].flowStage)) {
    return;
  }

  const zkPassResult = await callZkPass(applicantId);
  const hash = hashKycPayload(zkPassResult);

  const baseData = zkPassResult.data.data;
  const age = calculateAge(applicant?.dob ?? null);

  const zkData = {
    isBigger18: age !== null && age >= 18,
    isMale: baseData.isMale || false,
    isKycStatus: true,
    country: baseData.country || "",
    expiracyDate: baseData.expiry_date || "",
  };

  const encryptedProof = await getEncryptedProof(
    existing[0].tokenId,
    zkPassResult
  );

  await db.update(customerKycProofs).set({
    zkData,
    hash,
    tempHash: encryptedProof,
    expiresAt: baseData.expiry_date ? new Date(baseData.expiry_date) : null,
    flowStage: "approved",
    updatedAt: new Date(),
  }).where(eq(customerKycProofs.id, existing[0].id));

  console.log("Updated existing record:", applicantId);
}
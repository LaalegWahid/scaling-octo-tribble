import { NextRequest } from "next/server";
import { env } from "@/shared/config/env";
import { db } from "@/shared/db";
import { eq } from "drizzle-orm"
import { customerKycProofs } from "@/shared/db/schema";

export function authorizeWebhook(req: NextRequest) {
  const authHeader = req.headers.get("authorization")?.split(" ")[1];
  if (!authHeader || authHeader !== env.KYCAID_API_TOKEN) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function statusApplicant(applicantId: string) {
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

  return existing[0].flowStage;
}


export function calculateAge(dob: string | null): number | null {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}
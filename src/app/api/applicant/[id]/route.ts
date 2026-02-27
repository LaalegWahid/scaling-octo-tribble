import { fetchHypersignUser } from "@/features/kyc/lib/hypersign-user";
import { fetchAdminAccessToken } from "@/features/kyc/services/hypersign.service";
import { checkApiKeyInDb } from "@/shared/lib/auth";
import { NextResponse } from "next/server";

const ZKPASS_API_KEY = process.env.ZKPASS_API_KEY;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const authorized = await isValidApiKey(apiKey);
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: applicantId } = await params;
    if (!applicantId) return NextResponse.json({ error: "applicant_id is required" }, { status: 400 });

    const kycAdminToken = await fetchAdminAccessToken(
      process.env.KYC_API_SECRET!,
      "access_service_kyc"
    );

    const userData = await fetchHypersignUser(applicantId, kycAdminToken);

    // ── Level 1: top-level keys ───────────────────────────────────────────
    console.log("📦 userData top-level keys:", Object.keys(userData));
    console.log("📦 userData.status:", userData.status);
    console.log("📦 userData.createdAt:", userData.createdAt);

    // ── Level 2: ocriddocsDetails ─────────────────────────────────────────
    console.log("🔍 ocriddocsDetails:", JSON.stringify(userData.ocriddocsDetails, null, 2));

    // ── Level 3: selfiDetails ─────────────────────────────────────────────
    console.log("🤳 selfiDetails:", JSON.stringify(userData.selfiDetails, null, 2));

    // ── Level 4: userConsentDetails raw ───────────────────────────────────
    console.log("📜 userConsentDetails (raw):", JSON.stringify(userData.userConsentDetails, null, 2));

    // ── Level 5: parse presentation ───────────────────────────────────────
    const consent = userData.userConsentDetails ?? {};
    let presentation: any = null;

    if (consent.presentation) {
      try {
        presentation = typeof consent.presentation === "string"
          ? JSON.parse(consent.presentation)
          : consent.presentation;
        console.log("✅ presentation parsed successfully");
        console.log("📋 presentation type:", presentation?.type);
        console.log("📋 presentation holder:", presentation?.holder);
        console.log("📋 verifiableCredential count:", presentation?.verifiableCredential?.length);
      } catch (e) {
        console.error("❌ Failed to parse presentation:", e);
        console.log("📜 Raw presentation value:", consent.presentation);
      }
    } else {
      console.warn("⚠️ No presentation found in userConsentDetails");
    }


    // ── Extract ───────────────────────────────────────────────────────────
    const credSubject = presentation?.verifiableCredential?.[0]?.credentialSubject ?? {};

    const dateOfBirth = credSubject.dateOfBirth ?? null;
    const dateOfExpiry = credSubject.dateOfExpiry ?? null;

    // convert unix ms to YYYY-MM-DD
    const expiryFormatted = dateOfExpiry
      ? new Date(dateOfExpiry).toISOString().split("T")[0]
      : null;
    const country = credSubject.issuingStateCode ?? null;
    const sex = credSubject.sex ?? null;

    const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
    // const isMale = sex ? sex.toUpperCase() === "M" : null;
    const verificationStatus = userData.status === "success" ? "valid" : "invalid";

    const response = { 
      dob: age, 
      gender: sex,  
      expiry_date: expiryFormatted, 
      country: country 
    };
    
    console.log("✅ Final zkPass response:", response);
    return NextResponse.json(response);

  } catch (err: any) {
    console.error("🔥 Error in GET /api/applicant", err);
    return NextResponse.json({ error: "Internal server error", details: err?.message }, { status: 500 });
  }
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

async function isValidApiKey(apiKey: string | null): Promise<boolean> {
  if (!apiKey) return false;
  if (apiKey === ZKPASS_API_KEY) return true;
  return await checkApiKeyInDb(apiKey);
}
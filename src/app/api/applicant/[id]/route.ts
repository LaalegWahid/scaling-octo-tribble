import { checkApiKeyInDb } from "@/shared/lib/auth";
import { calculateAge, kycaidFetch } from "@/shared/lib/utils";
import { NextResponse } from "next/server";

const ZKPASS_API_KEY = process.env.ZKPASS_API_KEY;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    console.log("➡️ /api/applicant hit");
    console.log("Headers:", Object.fromEntries(req.headers.entries()));

    const resolvedParams = await params;
    console.log("🔍 Raw params object:", resolvedParams);
    console.log("🔍 Applicant ID:", resolvedParams?.id);
    console.log("🔍 Full URL:", req.url);

    const apiKey = req.headers.get("x-api-key");

    const authorized = await isValidApiKey(apiKey);
    if (!authorized) {
      console.warn("⚠️ Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicantId } = await params;
    console.log("Applicant ID from params:", applicantId);

    if (!applicantId) {
      console.warn("⚠️ Missing applicantId");
      return NextResponse.json(
        { error: "applicant_id is required" },
        { status: 400 }
      );
    }

    // // Call KYCAID
    // console.log(`🌍 Fetching KYCAID data for applicantId: ${applicantId}`);
    // const r = await kycaidFetch(`/applicants/${applicantId}`, {
    //   method: "GET",
    //   headers: { "Content-Type": "application/json" },
    // });

    // console.log("KYCAID response status:", r.status);

    // if (!r.ok) {
    //   const errorBody = await r.text();
    //   console.error("❌ KYCAID NOT FOUND / ERROR", {
    //     applicantId,
    //     status: r.status,
    //     errorBody,
    //   });
    //   return NextResponse.json(
    //     { error: "Applicant not found in KYCAID" },
    //     { status: 404 }
    //   );
    // }

    // const data = await r.json();
    // console.log("KYCAID returned data:", data);

    // const expiryDate: string | undefined = data.documents?.find( (doc: { expiry_date?: string }) => doc?.expiry_date )?.expiry_date;

    const response = {
      dob: 24,
      isMale: true,
      email: "xyz@xyz.com",
      verification_status: true,  
      expiry_date: "2026-2-18",
      country: "XZ",
    };

    // const response = {
    //   dob: calculateAge(data.dob),
    //   isMale: data.gender === "M",
    //   email: data.email,
    //   verification_status: data.verification_status,
    //   expiry_date: expiryDate,
    //   country: data.residence_country,
    // };

    console.log("Transformed response for zkPass:", response);

    return NextResponse.json(response);
  } catch (err:any) {
    console.error("🔥 Unexpected error in GET /api/applicant", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message || err },
      { status: 500 }
    );
  }
}

async function isValidApiKey(apiKey: string | null): Promise<boolean> {
  if (!apiKey) return false;

  if (apiKey === ZKPASS_API_KEY) {
    return true;
  }

  return await checkApiKeyInDb(apiKey);
}

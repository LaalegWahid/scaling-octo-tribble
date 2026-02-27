import { compressImage } from "./kycaid.service";

const KYC_BASE_URL = "https://api.cavach.hypersign.id";
const SSI_BASE_URL = "https://api.entity.hypersign.id";
const DASHBOARD_URL = "https://api.entity.dashboard.hypersign.id";

export async function fetchAdminAccessToken(apiSecret: string, serviceType: string) {
  const res = await fetch(`${DASHBOARD_URL}/api/v1/app/oauth?grant_type=${serviceType}`, {
    method: "POST",
    headers: { "X-Api-Secret-Key": apiSecret, Accept: "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth failed: ${data.message}`);
  return data.access_token;
}

export async function initializeVerificationSession(kycAdminToken: string): Promise<string> {
  const res = await fetch(`${KYC_BASE_URL}/api/v2/session`, {
    method: "POST",
    headers: { "x-kyc-access-token": kycAdminToken, "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Session init failed: ${data.message}`);
  return data.data.sessionId;
}

export async function registerUserDid(ssiAdminToken: string) {
  const res = await fetch(`${SSI_BASE_URL}/api/v1/did/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ssiAdminToken}` },
    body: JSON.stringify({ namespace: "" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`DID create failed: ${data.message}`);

  const methods = data?.metaData?.didDocument?.verificationMethod ?? [];
  const method = methods.find((m: any) => m.type === "Ed25519VerificationKey2020") ?? methods[0];
  if (!method) throw new Error("No verification method found");

  return { did: data.did, verificationMethodId: method.id };
}

export async function generateKycUserSessionToken(
  claims: object,
  kycAdminToken: string,
  ssiAdminToken: string,
  sessionId: string,
  issuerDid: string,
  issuerMethodId: string
) {
  const ssiRes = await fetch(`${SSI_BASE_URL}/api/v1/did/auth/issue-jwt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ssiAdminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      issuer: { verificationMethodId: issuerMethodId, did: issuerDid },
      audience: KYC_BASE_URL,
      claims,
      ttlSeconds: 3600,
    }),
  });
  const ssiData = await ssiRes.json();
  if (!ssiRes.ok) throw new Error(`issue-jwt failed: ${ssiData.message}`);
  const didJwt = ssiData.accessToken ?? ssiData.access_token ?? ssiData.token ?? ssiData.jwt;
  if (!didJwt) throw new Error("Could not find JWT in response");

  const kycRes = await fetch(`${KYC_BASE_URL}/api/v2/auth/exchange`, {
    method: "POST",
    headers: {
      "x-ssi-access-token": ssiAdminToken,
      "x-kyc-access-token": kycAdminToken,
      Authorization: `Bearer ${didJwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider: "client_auth", sessionId }),
  });
  const kycData = await kycRes.json();
  if (!kycRes.ok) throw new Error(`auth/exchange failed: ${kycData.message}`);

  const token =
    kycData?.data?.kycServiceUserAccessToken ??
    kycData?.kycServiceUserAccessToken ??
    kycData?.data?.accessToken ??
    kycData?.accessToken ??
    kycData?.token;
  if (!token) throw new Error("Could not find user token in response");
  return token;
}

export async function extractDocument(params: {
  documentFront: string;
  sessionId: string;
  kycAdminToken: string;
  userBearerToken: string;
  ssiAdminToken: string;
}): Promise<string> {
  const raw = params.documentFront.includes(",")
    ? params.documentFront.split(",")[1]
    : params.documentFront;

  const compressed = await compressImage(raw, 400);

  const res = await fetch(`${KYC_BASE_URL}/api/v2/documents/extract`, {
    method: "POST",
    headers: {
      "x-kyc-access-token": params.kycAdminToken,
      "x-ssi-access-token": params.ssiAdminToken,
      Authorization: `Bearer ${params.userBearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentFront: compressed,
      sessionId: params.sessionId,
      documentType: "PASSPORT",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw with a prefix the orchestrator can detect reliably
    throw new Error(`OCR_EXTRACTION_FAILED: ${data.message || "Document extraction failed"}`);
  }

  return data.data.extractionToken;
}

export async function verifyBiometrics(params: {
  documentToken: string;
  sessionId: string;
  selfieImage: string;
  holderDid: string;
  kycAdminToken: string;
  userBearerToken: string;
  ssiAdminToken: string;
  issuerDid: string;
  issuerMethodId: string;
}):  Promise<{ credentials: any[]; userId: string }> { {
  // Compress selfie before sending
  const compressedSelfie = await compressImage(params.selfieImage, 300);

  const res = await fetch(`${KYC_BASE_URL}/api/v2/biometrics/verify`, {
    method: "POST",
    headers: {
      "x-kyc-access-token": params.kycAdminToken,
      "x-ssi-access-token": params.ssiAdminToken,
      "x-issuer-did": params.issuerDid,
      "x-issuer-did-ver-method": params.issuerMethodId,
      Authorization: `Bearer ${params.userBearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentToken: params.documentToken,
      sessionId: params.sessionId,
      selfieImage: compressedSelfie,   // ← compressed
      holderDid: params.holderDid,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Biometric verification failed");
  return {
    credentials: data.data.credentials,
    userId: data.data.userId,
  };
}}

export async function submitConsent(params: {
  sessionId: string;
  holderDid: string;
  credentials: any[];
  domain: string;
  verificationMethodId: string;
  kycAdminToken: string;
  userBearerToken: string;
  ssiAdminToken: string;
}):  Promise<{ userId: string }> {
  // 1. Create VP
  const vpRes = await fetch(`${SSI_BASE_URL}/api/v1/presentation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.ssiAdminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      credentialDocuments: params.credentials,
      holderDid: params.holderDid,
      challenge: params.sessionId,
      domain: params.domain,
      verificationMethodId: params.verificationMethodId,
    }),
  });
  const vpData = await vpRes.json();
  if (!vpRes.ok) throw new Error(vpData.message || "VP creation failed");

  // 2. Submit consent
  const consentRes = await fetch(`${KYC_BASE_URL}/api/v2/consents`, {
    method: "POST",
    headers: {
      "x-kyc-access-token": params.kycAdminToken,
      Authorization: `Bearer ${params.userBearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId: params.sessionId, presentation: vpData.presentation }),
  });
  const consentData = await consentRes.json();
  if (!consentRes.ok) throw new Error(consentData.message || "Consent submission failed");
  return { userId: consentData.data.userId };
}

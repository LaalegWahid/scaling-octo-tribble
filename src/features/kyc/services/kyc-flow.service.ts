import { db } from '@/shared/db';
import {
  fetchAdminAccessToken,
  initializeVerificationSession,
  registerUserDid,
  generateKycUserSessionToken,
  extractDocument,
  verifyBiometrics,
  submitConsent,
} from './hypersign.service';
import { subtractMoneyOrThrow, markTokenAsUsed, fetchPrice, createEndUserProof } from './billing.service';
import { handleVerificationResult } from './verification-result.service';
import { KycForm, UserFeedback } from './types';
import { customerFeedback } from '@/shared/db/schema';
import { env } from '@/shared/config/env';

export async function submitKYCHypersign(
  userId: string,
  tokenId: string,
  environment: 'prod' | 'test',
  form: KycForm
): Promise<string> { // returns proof hash
  if (environment !== 'prod') {
    throw new Error("TEST_KEY_SUBMISSION_NOT_ALLOWED");
  }

  if (!form.document?.front || !form.selfie) {
    throw new Error("MISSING_INPUT");
  }

  const price = await fetchPrice(userId);

  // ── Step 1: Initialize Hypersign session ──────────────────────────────────
  const [kycAdminToken, ssiAdminToken] = await Promise.all([
    fetchAdminAccessToken(env.HYPERSIGN_KYC_API_SECRET!, "access_service_kyc"),
    fetchAdminAccessToken(env.HYPERSIGN_SSI_API_SECRET!, "access_service_ssi"),
  ]);

  const sessionId = await initializeVerificationSession(kycAdminToken);
  const userDidMetadata = await registerUserDid(ssiAdminToken);

  console.log(form)
  console.log(form.userData)
  console.log(form.userData.email)
  const userBearerToken = await generateKycUserSessionToken(
    { name: `${form.userData.firstName} ${form.userData.lastName}`, email: form.userData.email, userDid: userDidMetadata.did },
    kycAdminToken,
    ssiAdminToken,
    sessionId,
    env.HYPERSIGN_ISSUER_DID!,
    env.HYPERSIGN_ISSUER_VERMETHOD_ID!,
  );

  // ── Step 2: Extract document ──────────────────────────────────────────────
  const extractionToken = await extractDocument({
    documentFront: form.document.front,
    sessionId,
    kycAdminToken,
    userBearerToken,
    ssiAdminToken,
  });

  // ── Step 3: Verify biometrics (face match) ────────────────────────────────
  const { credentials, userId: hypersignUserId } = await verifyBiometrics({
    documentToken: extractionToken,
    sessionId,
    selfieImage: form.selfie,
    holderDid: userDidMetadata.did,
    kycAdminToken,
    userBearerToken,
    ssiAdminToken,
    issuerDid: env.HYPERSIGN_ISSUER_DID!,
    issuerMethodId: env.HYPERSIGN_ISSUER_VERMETHOD_ID!,
  });

  // ── Step 4: Submit consent ────────────────────────────────────────────────
const { userId: consentUserId } = await submitConsent({
  sessionId,
  holderDid: userDidMetadata.did,
  credentials,
  domain: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  verificationMethodId: userDidMetadata.verificationMethodId,
  kycAdminToken,
  userBearerToken,
  ssiAdminToken,
});

  // ── Step 5: DB transaction (billing + proof record) ───────────────────────
const hypersignEmailHash = hypersignUserId ?? consentUserId;
if (!hypersignEmailHash) throw new Error("No userId returned from Hypersign");

// ── Step 5: DB transaction ────────────────────────────────────────────────
const proof = await db.transaction(async (tx) => {
  return await createEndUserProof(tx, {
    userId,
    tokenId,
    applicantId: hypersignEmailHash, // ← store the real userId, not sessionId
    kycData: form,
    walletAddress: form.walletAddress,
    walletSignature: form.walletSignature,
  });
});

await submitFeedbackIfPresent(proof.id, form.feedback);


const proofHash = await handleVerificationResult(
  proof.id,
  hypersignEmailHash, // ← pass userId instead of sessionId
  form.userData.dob
);

// Step 6: Pass credentials directly — no zkPass call
// const proofHash = await handleVerificationResult(
//   proof.id,
//   credentials,           // ← pass credentials here
//   form.userData.dob
// );

  return proofHash;
}

export async function submitFeedbackIfPresent(proofId: string, feedback: UserFeedback) {
  if (!feedback) return;
  const { rating, comment } = feedback;
  const hasRating = typeof rating === "number";
  const hasComment = typeof comment === "string" && comment.trim() !== "";
  if (!hasRating && !hasComment) return;
  if (hasRating && (rating < 1 || rating > 5)) throw new Error("INVALID_RATING");
  await db.insert(customerFeedback).values({
    customerKycProofId: proofId,
    rating: hasRating ? rating : null,
    comment: hasComment ? comment : null,
  });
}

// import { db } from '@/shared/db';
// import {
//   uploadAllDocuments,
//   linkDocuments,
//   triggerVerificationOrThrow,
//   createApplicationOrThrow,
// } from './kycaid.service';
// import { subtractMoneyOrThrow, markTokenAsUsed, fetchPrice, createEndUserProof } from './billing.service';
// import { KycForm, UserFeedback } from './types';
// import { customerFeedback } from '@/shared/db/schema';

// export async function submitKYCAID(
//   userId: string,
//   tokenId: string,
//   environment: 'prod' | 'test',
//   form: KycForm
// ) {
//   if (environment !== 'prod') {
//     throw new Error("TEST_KEY_SUBMISSION_NOT_ALLOWED");
//   }

//   // Back is only required for non-passport documents
//   const requiresBack = form.document.type !== 'passport';
//   if (!form.document?.front || (requiresBack && !form.document?.back) || !form.selfie) {
//     throw new Error("MISSING_INPUT");
//   }

//   const price = await fetchPrice(userId);
//   const applicantId = await createApplicationOrThrow(form.userData, tokenId);

//   // backId is null for passport — linkDocuments handles it
//   const [frontId, backId, selfieId] = await uploadAllDocuments(form);

//   await linkDocuments(applicantId, frontId, backId, selfieId, form.document.type);

//   const proof = await db.transaction(async (tx) => {
//     await subtractMoneyOrThrow(tx, userId, price);
//     await markTokenAsUsed(tx, tokenId);
//     return await createEndUserProof(tx, {
//       userId,
//       tokenId,
//       applicantId,
//       kycData: form,
//       walletAddress: form.walletAddress,
//       walletSignature: form.walletSignature,
//     });
//   });

//   await submitFeedbackIfPresent(proof.id, form.feedback);
//   await triggerVerificationOrThrow(applicantId);

//   return applicantId;
// }

// export async function submitFeedbackIfPresent(proofId: string, feedback: UserFeedback) {
//   if (!feedback) return;

//   const { rating, comment } = feedback;
//   const hasRating = typeof rating === "number";
//   const hasComment = typeof comment === "string" && comment.trim() !== "";

//   if (!hasRating && !hasComment) return;
//   if (hasRating && (rating < 1 || rating > 5)) throw new Error("INVALID_RATING");

//   await db.insert(customerFeedback).values({
//     customerKycProofId: proofId,
//     rating: hasRating ? rating : null,
//     comment: hasComment ? comment : null,
//   });
// }
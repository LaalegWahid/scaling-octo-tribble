import { env } from '@/shared/config/env';
import { KycForm, UserData } from './types';
import sharp from "sharp";

const API_KEY = env.KYCAID_API_TOKEN;

export async function kycaidPost(path: string, body: object) {
  const res = await fetch(`https://api.kycaid.com${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("KYC_PROVIDER_ERROR");

  return res.json();
}

export async function uploadDocument(base64: string, name: string): Promise<string> {
  if (!base64 || base64.trim() === '') throw new Error("MISSING_BASE64");

  const blob = base64ToBlob(base64);
  const formData = new FormData();
  formData.append('file', blob, `${name}.jpg`);

  const res = await fetch('https://api.kycaid.com/files', {
    method: 'POST',
    headers: { Authorization: `Token ${API_KEY}` },
    body: formData,
  });

  if (!res.ok) throw new Error("UPLOAD_FAILED");

  const json = await res.json();
  return json.file_id;
}

export async function uploadAllDocuments(
  form: KycForm
): Promise<[string, string | null, string]> {
  const [frontId, selfieId] = await Promise.all([
    uploadDocument(form.document.front, 'id_front'),
    uploadDocument(form.selfie, 'selfie'),
  ]);

  // Back is optional — passport has no back side
  const backId =
    form.document.back && form.document.back.trim() !== ''
      ? await uploadDocument(form.document.back, 'id_back')
      : null;

  return [frontId, backId, selfieId];
}

export async function linkDocuments(
  applicantId: string,
  frontId: string,
  backId: string | null,
  selfieId: string,
  documentType: string
) {
  const type = mapDocumentType(documentType);

  const documentPayload: Record<string, unknown> = {
    applicant_id: applicantId,
    type,
    front_side_id: frontId,
  };

  // Only send back_side_id if it exists — KYCAID rejects empty string
  if (backId && backId.trim() !== '') {
    documentPayload.back_side_id = backId;
  }

  await kycaidPost('/documents', documentPayload);

  await kycaidPost('/documents', {
    applicant_id: applicantId,
    type: 'SELFIE_IMAGE',
    front_side_id: selfieId,
  });
}

export async function triggerVerificationOrThrow(applicantId: string) {
  const res = await kycaidPost('/verifications', {
    applicant_id: applicantId,
    form_id: env.KYCAID_FORM_ID,
  });

  if (!res?.verification_id) throw new Error("KYC_PROVIDER_ERROR");

  return res.verification_id;
}

export async function createApplicationOrThrow(userData: UserData, tokenId: string) {
  const res = await kycaidPost('/applicants', {
    type: "PERSON",
    first_name: userData.firstName,
    last_name: userData.lastName,
    dob: userData.dob,
    email: userData.email,
    external_applicant_id: tokenId,
  });

  if (!res?.applicant_id) throw new Error("KYC_PROVIDER_ERROR");

  return res.applicant_id;
}

function mapDocumentType(type = 'id_card'): string {
  const t = type.toLowerCase().replace(/[\s-_]/g, '');

  if (t.includes('passport')) return 'PASSPORT';
  if (t.includes('license')) return 'DRIVERS_LICENSE';
  if (t.includes('id')) return 'GOVERNMENT_ID';

  throw new Error("UNSUPPORTED_DOCUMENT_TYPE");
}

export async function compressImage(base64: string, maxSizeKB = 400, minWidth = 1000): Promise<string> {
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const buffer = Buffer.from(raw, "base64") as Buffer;

  const sizeKB = buffer.length / 1024;
  console.log(`[compress] original size: ${Math.round(sizeKB)}KB`);

  // Get image dimensions
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;

  const tooSmall = width < minWidth;
  const tooBig = sizeKB > maxSizeKB;

  // Nothing to do — good size and good resolution
  if (!tooSmall && !tooBig) return raw;

  let quality = tooBig ? 80 : 90; // start higher quality if we're just upscaling
  let result: Buffer = buffer;

  // Target width: upscale if too small, cap at 1200 if too big
  const targetWidth = tooSmall ? minWidth : 1200;

  while (quality >= 20) {
    result = await sharp(buffer)
      .resize({ width: targetWidth }) // no withoutEnlargement — allow upscale
      .jpeg({ quality })
      .toBuffer() as Buffer;

    const resultKB = result.length / 1024;
    console.log(`[compress] quality ${quality} → ${Math.round(resultKB)}KB`);

    if (resultKB <= maxSizeKB) break;
    quality -= 10;
  }

  console.log(`[compress] final size: ${Math.round(result.length / 1024)}KB`);
  return result.toString("base64");
}

function base64ToBlob(base64: string): Blob {
  try {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const byteCharacters = atob(base64Data);
    const bytes = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      bytes[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/jpeg' });
  } catch {
    throw new Error("INVALID_BASE64");
  }
}
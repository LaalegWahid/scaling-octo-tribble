'use server';

import { tryCatch } from '@/shared/lib/try-catch';
import { submitKYCHypersign } from '../services/kyc-flow.service';
import { KycForm } from '../services/types';

export type SubmitKycResult =
  | { ok: true; proofHash: string }
  | { ok: false; errorCode: 'OCR_FAILED' | 'TEST_KEY' | 'MISSING_INPUT' | 'INSUFFICIENT_FUNDS' | 'UNKNOWN'; message: string };

export async function submitKycAction(
  userId: string,
  tokenId: string,
  environment: 'test' | 'prod',
  form: KycForm
): Promise<SubmitKycResult> {
  const result = await tryCatch(
    submitKYCHypersign(userId, tokenId, environment, form)
  );

  if (!result.ok) {
    const msg: string = result.error?.message || '';
    console.error('submitKycAction error:', msg);

    if (msg.includes('OCR_EXTRACTION_FAILED') || msg.includes('extraction') || msg.includes('OCR')) {
      return { ok: false, errorCode: 'OCR_FAILED', message: msg };
    }
    if (msg.includes('TEST_KEY_SUBMISSION_NOT_ALLOWED')) {
      return { ok: false, errorCode: 'TEST_KEY', message: msg };
    }
    if (msg.includes('MISSING_INPUT')) {
      return { ok: false, errorCode: 'MISSING_INPUT', message: msg };
    }
    if (msg.includes('INSUFFICIENT_FUNDS')) {
      return { ok: false, errorCode: 'INSUFFICIENT_FUNDS', message: msg };
    }

    return { ok: false, errorCode: 'UNKNOWN', message: msg || 'Unexpected error' };
  }

  return { ok: true, proofHash: result.data };
}
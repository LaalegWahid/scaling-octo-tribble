'use server';

import { verifyProof } from '../services';
import { customerKycProofs } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/shared/db';

export interface VerifyProofResult {
  exists:boolean
}
export async function verifyProofAction(
  hashproof: string
): Promise<VerifyProofResult> {
  const { response } = await verifyProof(hashproof);
  
  return {
    exists: response,
  };
}


'use server';

import { KycStatus } from '@/features/kyc/types';
import { verifyToken } from '../services';
import { customerKycProofs } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/shared/db';

export interface VerifyTokenResult {
  userId: string;
  status: KycStatus;
  tokenId: string;
  proof: string | null;
  environment: 'prod' | 'test';
}

export async function verifyTokenAction(token: string): Promise<VerifyTokenResult> {
  const { userId, tokenId, apiKeyPrefix } = await verifyToken(token);

  const proof = await db.query.customerKycProofs.findFirst({
    where: eq(customerKycProofs.tokenId, tokenId),
  });
  
  const environment = apiKeyPrefix === 'prod_' ? 'prod' : 'test';

  if (!proof) {
    return { userId: userId, status: 'Register', tokenId: tokenId, proof: null, environment: environment };
  }

  const statusMap: Record<typeof proof.flowStage, KycStatus> = {
    draft: 'Register',
    submitted: 'Pending',
    pending: 'Pending',
    approved: 'Success',
    rejected: 'Error',
    expired: 'Error',
  };

  return {
    userId: userId,
    status: statusMap[proof.flowStage],
    tokenId: tokenId,
    proof: proof.hash,
    environment: environment
  };
}
import { db, TransactionType } from '@/shared/db';
import { wallets, transactions } from '@/shared/db/schema/finance';

import { apikey, sdkToken, user } from '@/shared/db/schema/auth';
import { eq, and, gte, gt, sql } from 'drizzle-orm';
import { customerKycProofs } from '@/shared/db/schema';
import { KycForm, UserData } from './types';

export async function verifyToken(token: string): Promise<{
  userId: string;
  tokenId: string;
  apiKeyPrefix: string;
}> {
  if (!token) throw new Error("MISSING_TOKEN");

  const result = await db
    .select({
      tokenId: sdkToken.id,
      userId: user.id,
      isBanned: user.banned,
      apiKeyPrefix: apikey.prefix,
    })
    .from(sdkToken)
    .innerJoin(user, eq(sdkToken.userId, user.id))
    .innerJoin(apikey, eq(sdkToken.apiKeyId, apikey.id))
    .where(
      and(
        eq(sdkToken.token, token),
        gt(sdkToken.expiresAt, sql`NOW()`)
      )
    )
    .limit(1);

  const session = result[0];
  if (!session || !session.apiKeyPrefix) throw new Error("INVALID_TOKEN");
  if (session.isBanned) throw new Error("USER_BANNED");

  return {
    userId: session.userId,
    tokenId: session.tokenId,
    apiKeyPrefix: session.apiKeyPrefix,
  };
}

export async function hasMoney(userId: string, price: number) {
  const result = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(
      and(
        eq(wallets.userId, userId),
        gte(wallets.balance, price.toString())
      )
    )
    .limit(1);

  if (!result.length) {
    throw new Error("INSUFFICIENT_FUNDS");
  }
}

export async function fetchPrice(userId: string) {
  return 1.2
}

export async function subtractMoneyOrThrow(
  tx: TransactionType,
  userId: string,
  price: number
) {
  const result = await tx
    .update(wallets)
    .set({
      balance: sql`${wallets.balance} - ${price}`,
      updatedAt: new Date(),
      lastTransactionAt: new Date(),
    })
    .where(
      and(
        eq(wallets.userId, userId),
        gte(wallets.balance, price.toString())
      )
    )
    .returning({ id: wallets.id });

  if (!result.length) {
    throw new Error("INSUFFICIENT_FUNDS");
  }

  await tx.insert(transactions).values({
    userId,
    walletId: result[0].id,
    type: 'payment',
    amount: price.toString(),
    status: 'completed',
    currency: 'USD',
    completedAt: new Date(),
  });
}

export async function markTokenAsUsed(
  tx: TransactionType,
  tokenId: string
) {
  console.log(tokenId)
  const result = await tx
    .update(sdkToken)
    .set({ used: true })
    .where(
      and(
        eq(sdkToken.id, tokenId),
        eq(sdkToken.used, false)
      )
    )
    .returning({ id: sdkToken.id });

  if (!result.length) {
    throw new Error("INVALID_TOKEN");
  }
}

export async function createEndUserProof(
  tx: TransactionType,
  {
    userId,
    tokenId,
    applicantId,
    kycData,
    walletAddress,
    walletSignature
  }: {
    userId: string;
    tokenId: string;
    applicantId: string;
    kycData: KycForm
    walletAddress?: string;       // ← new
    walletSignature?: object;     // ← new
  }
) {
  const existing = await tx.query.customerKycProofs.findFirst({
    where: eq(customerKycProofs.tokenId, tokenId),
  });

  if (existing) {
    return existing;
  }

let expiresAt = new Date(kycData.document?.expiracyDate);

// 2. Check if it's "Invalid Date" (getTime() returns NaN for invalid dates)
if (isNaN(expiresAt.getTime())) {
  // Fallback to current date or a distant future date
  expiresAt = new Date(); 
}
  const [proof] = await tx
    .insert(customerKycProofs)
    .values({
      userId: userId,
      tokenId: tokenId,
      applicantId: applicantId,
      email: kycData.userData.email,
      expiresAt: expiresAt,
      flowStage: 'submitted',
      walletAddress: walletAddress ?? null,           // ← saved here
      userSignature: walletSignature as any ?? null,  // ← saved here
      walletBoundAt: walletAddress ? new Date() : null,
    })
    .returning();

  return proof;
}


export async function verifyProof(
  hashProof: string
): Promise<{ response: boolean }> {
  if (!hashProof) {
    throw new Error("MISSING_HASH");
  }

  const result = await db
    .select({ id: customerKycProofs.id })
    .from(customerKycProofs)
    .where(eq(customerKycProofs.hash, hashProof))
    .limit(1);

  return {
    response: result.length > 0,
  };
}

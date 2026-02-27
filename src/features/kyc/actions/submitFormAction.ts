// features/kyc/actions/submitFormAction.ts
'use server';

import { tryCatch } from '@/shared/lib/try-catch';
import { submitKYCHypersign } from '../services/kyc-flow.service';
import { KycForm } from '../services/types';

export async function submitKycAction(
  userId: string,
  tokenId: string,
  environment: 'test' | 'prod',
  form: KycForm
): Promise<{ proofHash: string }> {  // ← updated return type
  const result = await tryCatch(
    submitKYCHypersign(userId, tokenId, environment, form)
  );

  if (!result.ok) {
    console.error('submitKycAction error:', result.error);
    throw result.error;
  }

  return { proofHash: result.data };  // ← result.data IS the hash string
}

// 'use server';

// import { tryCatch } from '@/shared/lib/try-catch';
// import { submitKYCAID } from '../services';
// import { KycForm } from '../services/types';

// export async function submitKycAction(
//   userId: string,
//   tokenId: string,
//   environment: 'test' | 'prod',
//   form: KycForm
// ): Promise<{ applicantId: string }> {

//   const result = await tryCatch(
//     submitKYCAID(userId, tokenId, environment, form)
//   );

//   if (!result.ok) {
//     console.error('submitKycAction error:', result.error);
//     throw result.error;
//   }

//   return { applicantId: result.data };
// }
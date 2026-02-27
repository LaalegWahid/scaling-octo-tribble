// features/kyc/services/index.ts
import { submitKYCHypersign } from "./kyc-flow.service";
import { verifyToken, hasMoney, verifyProof } from "./billing.service";

export {
  verifyToken,
  submitKYCHypersign as submitKYCAID, // keep the same export name so nothing else breaks
  hasMoney,
  verifyProof,
};
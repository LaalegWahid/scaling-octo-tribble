export type KycError =
  | "INVALID_TOKEN"
  | "USER_BANNED"
  | "MISSING_INPUT"
  | "UPLOAD_FAILED"
  | "KYC_PROVIDER_ERROR"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_BASE64"
  | "UNSUPPORTED_DOCUMENT_TYPE";

export type UserData = {
    type: "PERSON",
    firstName: string,
    lastName: string,
    dob: string,
    email: string,
    external_applicant_id: string,
}
//Gender:body.gender NEED THAT
export type DocumentType = 'national_id' | 'passport' | 'drivers_license';

export type KycDocument = {
    front: string,
    back?: string,
    type: DocumentType,
    expiracyDate: string
}

export type UserFeedback = {
    rating?: number; // 1–5
    comment?: string;
}

export type KycForm = {
    userData: UserData,
    document: KycDocument,
    selfie: string,
    feedback: UserFeedback,
      walletAddress?: string;    // ← new
  walletSignature?: object;  // ← new
}
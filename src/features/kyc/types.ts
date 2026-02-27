export type KycStatus = 'Register' | 'Pending' | 'Signing' | 'Success' | 'Error';

export type DocumentType = 'national_id' | 'passport' | 'drivers_license';

export interface KycSubmissionPayload {
  token: string;
  userId: string;
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    dob: string;
    gender: string;
  };
  document: {
    type: DocumentType;
    front: string; // Base64
    back?: string; // Base64 (Optional for Passport)
    expiryDate: string;
  };
  images: {
    selfie: string;   // Base64 from Step 2
    liveness: string; // Data from Step 3
  };
}

export interface KycWizardState {
  walletAddress?: string;
  walletSignature?: object; // ← collected at StepSigning, saved at submit

  // Step 1: Info & Docs
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  gender?: string;
  documentType?: DocumentType;
  documentFront?: string; // Base64
  documentBack?: string;  // Base64
  expiryDate?: string;

  // Step 2: Selfie
  selfieBase64?: string;

  // Step 3: Liveness
  livenessData?: string;

  // Step 4: Feedback
  rating?: number;
  comment?: string;
}

// export interface StepProps {
//   onNext: (data: Partial<KycWizardState>) => void;
//   data: KycWizardState;
//   currentStep?: number;
//   onStepClick?: (step: number) => void;
//   tokenId?: string;
//   successUrl?:string;
// }

export interface StepProps {
  onNext: (data: Partial<KycWizardState>) => void;
  data: KycWizardState;
  currentStep?: number;
  onStepClick?: (step: number) => void;
  tokenId?: string;
  successUrl?: string;
  failureUrl?: string;
  // New: passed by orchestrator when OCR extraction fails
  ocrFailed?: boolean;
  onOcrErrorDismiss?: () => void;
   // Camera props — provided by orchestrator
  cameraStream?: MediaStream | null;
  onRequestCamera?: (facingMode: 'user' | 'environment') => Promise<void>;
  onReleaseCamera?: () => void;
}
export interface KycDecryptedResult {
  status?: string;
  verified?: boolean;
  applicant_id?: string;
  [key: string]: unknown;
}

export interface SdkClientProps {
  userId: string;
  initialStatus: KycStatus;
  tokenId: string;
  callbackUrl?: string;
  successUrl?: string;
  failureUrl?: string ;
  externalUserId: string;
  initialProof: string | null;
  environment?: 'test' | 'prod';
}

export interface MainPageProps {
  searchParams: {
    userId: string;
    initialStatus: KycStatus;
    apiKey: string;
    callbackUrl?: string;
    successUrl?: string;
    failureUrl?: string;
    externalUserId: string;
    initialProof: string | null;
    environment?: 'test' | 'prod';

  };
}
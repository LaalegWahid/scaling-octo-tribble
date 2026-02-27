export type KycPayload = {
  success: boolean;
  data: {
    task: string;
    signature: string;
    result: {
      verify_result: boolean;
      data: string;
      url: string;
      method: "GET" | "POST" | "PUT" | "DELETE";
      asserts: {
        response: Array<{
          key: string;
          operation?: ">" | "<" | "=";
          value?: string;
          tips?: string;
          isPublic?: boolean;
        }>;
      };
      verify_timestamp: number;
    };
    validatorAddress: string;
    data: {
      isMale: boolean;
      expiry_date: string;
      country: string;
    };
  };
};

export type EncryptedData = {
  ciphertext: string;
  iv: string;
  authTag: string;
};
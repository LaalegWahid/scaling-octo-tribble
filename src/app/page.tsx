import { KycStatus, MainPageProps, SdkClientProps } from '@/features/kyc/types';
import SdkClientUI from '../features/kyc/components/SdkClientUI';

export default async function Page({ searchParams }: MainPageProps) {
  const params = await searchParams;
  
  const mockSession = {
  userId: "usr_9f3b2c7a8d1e4f6a",
  status: "Register" as KycStatus,
  tokenId: "tok_4a7c91e2b6d34f8a",
  proof: "proof_8c2f1a9d7b6e3c4f",
  environment: 'prod' as 'test' | 'prod',
};

const successUrl = "https://hypersign-zkyc-demo.vercel.app/success";
const failureUrl = "https://hypersign-zkyc-demo.vercel.app/error";

 



  const sdkClientProps : SdkClientProps = {
     userId       :mockSession.userId ,
     initialStatus:mockSession.status ,
     tokenId      :mockSession.tokenId,
     successUrl   :successUrl,
     failureUrl   :failureUrl,
     initialProof :mockSession.proof,
     externalUserId: "sadsa",
     environment: mockSession.environment,
  }

  return (
    <SdkClientUI {...sdkClientProps}/>
  );
}
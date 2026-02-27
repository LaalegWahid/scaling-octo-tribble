import { KycStatus, MainPageProps, SdkClientProps } from '@/features/kyc/types';
import { verifyTokenAction } from '@/features/kyc/actions/verifyTokenAction';
import SdkClientUI from '../features/kyc/components/SdkClientUI';

export default async function Page({ searchParams }: MainPageProps) {
  const params = await searchParams;
  
  const token = params.apiKey;
  const successUrl = params.successUrl; 
  const failureUrl = params.failureUrl; 

  if (!token) {
    throw new Error('Missing security token.');
  } 

  if (!successUrl || !failureUrl) {
    throw new Error('Missing Success/Failure Link.');
  }

  const session = await verifyTokenAction(token);

  const sdkClientProps : SdkClientProps = {
     userId       :session.userId ,
     initialStatus:session.status ,
     tokenId      :session.tokenId,
     successUrl   :successUrl,
     failureUrl   :failureUrl,
     initialProof :session.proof,
     externalUserId: "sadsa",
     environment: session.environment,
  }

  return (
    <SdkClientUI {...sdkClientProps}/>
  );
}
import { NextRequest, NextResponse } from "next/server";
import { authorizeWebhook, statusApplicant,  } from "@/features/webhook/utils";
import { 
  handleFailedVerification, 
  handleSuccessfulVerification 
} from "@/features/webhook/verification.service";

export async function POST(req: NextRequest) {
  try {
    console.log("➡️ Webhook received");
 
    authorizeWebhook(req);
    console.log("✅ wAuthorized");

    const body = await req.json();
    console.log("📦 Body:", body);

    const { type, applicant_id, verified, applicant } = body;

    const flowStage = await statusApplicant(applicant_id);
    console.log("📍 Current flowStage:", flowStage);

    if (["approved", "rejected"].includes(flowStage)) {
      console.log("⏭️ Already finalized");
      return NextResponse.json({ ok: true }, { status: 204 });
    }

    if (type !== "VERIFICATION_COMPLETED") {
      console.log("⏭️ Ignored event:", type);
      return NextResponse.json({ ok: true });
    }

    if (!verified) {
      console.log("❌ Verification failed");
      await handleFailedVerification(applicant_id, applicant);
      return NextResponse.json({ ok: true, verified: false });
    }

    console.log("✅ Verification success — handling");
    await handleSuccessfulVerification(applicant_id, applicant);


    console.log("🎉 Webhook processed successfully");
    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("🔥 WEBHOOK ERROR:", err);
    throw err; // IMPORTANT: let Next.js log it fully
  }
}



// export async function POST(req: NextRequest) {
//   try {
//     authorizeWebhook(req);
    
//     const body = await req.json();
//     const { type, applicant_id, verified, applicant } = body;
    
//     const flowStage = await statusApplicant(applicant_id)
//     if (["approved", "rejected"].includes(flowStage)) {
//       return NextResponse.json({ok: true, status: 204 });
//     }

//     if (type !== "VERIFICATION_COMPLETED") {
//       return NextResponse.json({ ok: true, message: "ignored event type" });
//     }

//     if (!verified) {
//       await handleFailedVerification(applicant_id);
//       return NextResponse.json({ ok: true, status: "failed", verified: false });
//     }

//     await handleSuccessfulVerification(applicant_id, applicant);
//     return NextResponse.json({ ok: true, received: true });
//   } catch (err: any) {
//     console.error("WEBHOOK ERROR:", err);
//     return NextResponse.json(
//       { error: "Webhook processing failed" },
//       { status: 500 }
//     );
//   }
// }

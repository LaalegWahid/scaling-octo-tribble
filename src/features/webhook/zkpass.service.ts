import { env } from "@/shared/config/env";
import crypto from "crypto";
import { KycPayload } from "./types";

export async function callZkPass(applicantId: string): Promise<KycPayload> {
  if (!applicantId) {
    throw new Error("applicant_id is required");
  }

  const path = env.ZKPASS_API_PATH;
  if (!path) {
    throw new Error("ZKPASS_API_PATH is not defined");
  }

  const url = path + "/" + encodeURIComponent(applicantId);
console.log(url)
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const text = await res.text();

  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch {
    console.error("ZKPass returned non-JSON:", text.slice(0, 200));
    throw new Error("ZKPass returned invalid JSON");
  }

  if (!res.ok) {
    throw new Error(payload?.error || "ZkPass request failed");
  }

  return payload;
}

export function hashKycPayload(payload: KycPayload): string {
  const json = JSON.stringify(payload);
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  console.log("Generated hash for payload:", hash);
  return hash;
}
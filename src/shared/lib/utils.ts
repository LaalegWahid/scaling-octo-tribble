import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { env } from "../config/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(dob: string | null): number | null {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// lib/kyc.ts
function getKYCAID() {

  return {
    BASE: env.KYCAID_API_BASE || "",
    TOKEN: env.KYCAID_API_TOKEN || "",
    FORM_ID: env.KYCAID_FORM_ID || "",
  };
}

export async function kycaidFetch(path: string, init: RequestInit = {}) {
  const config = getKYCAID();
  const headers = new Headers(init.headers);
  
  // Make sure there's no extra space or encoding issue
  headers.set("Authorization", `Token ${config.TOKEN.trim()}`);
  
  const url = `${config.BASE}${path}`;
  console.log("🌐 Full KYCAID URL:", url);
  console.log("🔑 Auth header:", headers.get("Authorization")?.substring(0, 20) + "...");
  
  return fetch(url, { ...init, headers });
}
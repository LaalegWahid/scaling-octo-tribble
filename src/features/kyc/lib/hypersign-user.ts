const KYC_BASE_URL = "https://api.cavach.hypersign.id";

export async function fetchHypersignUser(userId: string, kycAdminToken: string) {
  const res = await fetch(`${KYC_BASE_URL}/api/v1/user/${userId}?env=dev`, {
    method: "GET",
    headers: {
      "x-kyc-access-token": kycAdminToken,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Hypersign returned non-JSON: ${text.slice(0, 200)}`);
  }

  if (!res.ok) throw new Error(`Hypersign user fetch failed: ${data.message}`);
  return data.data;
}
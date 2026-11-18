/** Legacy alias: authorization and analysis use the canonical implementation. */
import { POST as canonicalPost } from "@/app/api/v1/ai/analyze-image/route";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";

export async function POST(request: Request) {
  const response = await canonicalPost(request);
  setLegacyApiHeaders(response.headers);
  return response;
}

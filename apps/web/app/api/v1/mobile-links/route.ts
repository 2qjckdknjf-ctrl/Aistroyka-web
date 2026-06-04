import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function valueOrNull(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function GET() {
  return NextResponse.json({
    data: {
      APP_STORE_WORKER_URL: valueOrNull(process.env.APP_STORE_WORKER_URL),
      GOOGLE_PLAY_WORKER_URL: valueOrNull(process.env.GOOGLE_PLAY_WORKER_URL),
      APP_STORE_MANAGER_URL: valueOrNull(process.env.APP_STORE_MANAGER_URL),
      GOOGLE_PLAY_MANAGER_URL: valueOrNull(process.env.GOOGLE_PLAY_MANAGER_URL),
    },
  });
}

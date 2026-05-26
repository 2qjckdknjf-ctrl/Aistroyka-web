import { Suspense } from "react";
import { TelegramAuthCallbackClient } from "./telegram-auth-callback-client";

export default function TelegramAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-aistroyka-4 py-aistroyka-8" />}>
      <TelegramAuthCallbackClient />
    </Suspense>
  );
}

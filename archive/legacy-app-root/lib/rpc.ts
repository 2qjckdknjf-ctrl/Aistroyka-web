import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type RpcErrorContext = {
  rpc: string;
  params?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  code: string;
  context?: unknown;

  constructor(message: string, opts: { code: string; context?: unknown }) {
    super(message);
    this.name = "AppError";
    this.code = opts.code;
    this.context = opts.context;
  }
}

/**
 * Typed RPC wrapper. Calls Supabase RPC with the given name and params.
 * Throws AppError with code "RPC_ERROR" and context on failure.
 * No assumptions about returned shape; caller defines TResponse.
 */
export async function callRPC<TResponse, TParams = Record<string, unknown>>(
  rpcName: string,
  params?: TParams,
  opts?: { signal?: AbortSignal }
): Promise<TResponse> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.rpc(
    rpcName,
    params as Record<string, unknown> | undefined
  );
  void opts?.signal; // reserved for future AbortSignal support

  if (error) {
    throw new AppError(error.message, {
      code: "RPC_ERROR",
      context: { rpc: rpcName, params, cause: error } satisfies RpcErrorContext,
    });
  }

  return data as TResponse;
}

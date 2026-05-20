import { routeAgentRequest } from "agents";
import { AistroykaFieldAgent } from "./server";

export default {
  async fetch(request: Request, env: any, ctx: any) {
    return (
      (await routeAgentRequest(request, env, { cors: true })) ??
      new Response("AISTROYKA Cloudflare Agent is running", { status: 200 })
    );
  },
};

export { AistroykaFieldAgent };

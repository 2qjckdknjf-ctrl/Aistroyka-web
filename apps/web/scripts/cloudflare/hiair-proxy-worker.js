export default {
  async fetch(request) {
    const target = new URL(request.url);
    target.protocol = "https:";
    target.hostname = "www.aistroyka.ai";
    target.port = "";
    const proxied = new Request(target.toString(), request);
    return fetch(proxied, { redirect: "follow" });
  },
};

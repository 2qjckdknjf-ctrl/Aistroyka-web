export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = "aistroyka.ai";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  },
};

export default {
	async fetch(request) {
		const origin = request.headers.get("Origin");
		const allowedOrigin = "https://steam.space-aces.com";
		const cors = new Headers({
			"Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
			"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
			"Access-Control-Allow-Headers": "x-mod-auth, content-type, range",
			"Access-Control-Max-Age": "86400",
			"Vary": "Origin",
		});
		// Handle preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: cors });
		}
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method Not Allowed", { status: 405, headers: cors });
		}
		// Proxy to your GitHub Pages repo
		const reqUrl = new URL(request.url);
		const cleanPath = reqUrl.pathname.replace(/^\/+/, "");
		const upstreamUrl = new URL(cleanPath + reqUrl.search, "https://llenax.github.io/spaceaces-mod/");
		// Strip client auth header before upstream fetch
		const upstreamHeaders = new Headers(request.headers);
		upstreamHeaders.delete("x-mod-auth");
		upstreamHeaders.delete("origin");
		const upstreamResp = await fetch(new Request(upstreamUrl.toString(), {
			method: request.method,
			headers: upstreamHeaders,
			redirect: "follow",
		}), {
			cf: { cacheEverything: true, cacheTtl: 3600 },
		});
		const outHeaders = new Headers(upstreamResp.headers);
		cors.forEach((v, k) => outHeaders.set(k, v));
		return new Response(upstreamResp.body, {
			status: upstreamResp.status,
			statusText: upstreamResp.statusText,
			headers: outHeaders,
		});
	},
};

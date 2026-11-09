import { createAuthEndpoint } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";

/**
 * Better Auth 1.7 answers OAuth at `/api/auth/callback/:id`.
 * The Grok preview broker only allows
 * `https://*.grok-sandbox.com/api/auth/oauth2/callback/*`
 * (see `preview.ts`). Keep that redirect_uri, and if the browser
 * lands on the old path, forward it to the new handler. The token
 * exchange still uses the old redirect_uri, which is what the broker
 * registered.
 */
export function grokOAuthCallbackCompat() {
  return {
    id: "grok-oauth-callback-compat",
    init(ctx: { socialProviders: Array<{ id: string }> }) {
      return {
        context: {
          socialProviders: ctx.socialProviders.map((provider) =>
            provider.id.startsWith("grok-")
              ? {
                  ...provider,
                  callbackPath: `/oauth2/callback/${provider.id}`,
                }
              : provider,
          ),
        },
      };
    },
    endpoints: {
      legacyOAuthCallback: createAuthEndpoint(
        "/oauth2/callback/:id",
        { method: ["GET", "POST"] },
        async (ctx) => {
          const requestUrl = ctx.request?.url;
          if (!requestUrl) {
            throw new Error("OAuth callback arrived without a request URL");
          }
          const incoming = new URL(requestUrl);
          const target = new URL(
            `${ctx.context.baseURL}/callback/${encodeURIComponent(ctx.params.id)}`,
          );
          target.search = incoming.search;
          throw ctx.redirect(target.toString());
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}

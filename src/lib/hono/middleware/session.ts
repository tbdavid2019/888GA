import type { MiddlewareHandler } from "hono";

import { resolveDashboardSession } from "@/lib/edge/analytics/providers/d1/operations/team-dashboard";
import type { AppEnv } from "@/lib/hono/types";
import { una as unauthorized } from "@/lib/response";

export function requireSessionMiddleware(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const session = await resolveDashboardSession(c.req.raw, c.env);
    if (!session) {
      const response = unauthorized("Unauthorized", undefined, c.req.raw);
      c.res = response;
      return response;
    }
    const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
      c.req.raw.method,
    );
    if (session.userId === "demo-user-001" && isWriteMethod) {
      const response = c.json(
        {
          ok: false,
          error: "demo_read_only",
          message: "Demo 測試帳號為唯讀模式，無法儲存或修改任何設定。",
        },
        403,
      );
      c.res = response;
      return response;
    }
    c.set("session", session);
    await next();
  };
}

import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zAuthPasswordRoutes = {
  post: {
    "/password/forgotten-password": {
      // TODO_SECURITY_FIX AB will think about it
      body: z
        .object({
          username: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            url: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/password/reset-password": {
      body: z
        .object({
          passwordToken: z.string(),
          newPassword: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            token: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "jwt-password",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef

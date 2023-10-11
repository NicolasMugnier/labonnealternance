import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zUnsubscribeRoute = {
  post: {
    // TODO_SECURITY AB Vs. Marion + Abdellah + Léo !! fight !!
    "/unsubscribe": {
      method: "post",
      path: "/unsubscribe",
      body: z.object({ email: z.string().email(), reason: z.string() }).strict(),
      response: {
        "200": z.enum(["OK", "NON_RECONNU", "ETABLISSEMENTS_MULTIPLES"]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      rateLimit: {
        max: 1,
        timeWindow: "5s",
      },
    },
  },
} as const satisfies IRoutesDef

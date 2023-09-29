import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef, ZResError } from "./common.routes"

const zResponse = z
  .object({
    env: z.enum(["local", "recette", "production", "preview", "next"]),
    healthcheck: z
      .object({
        mongodb: z.boolean(),
      })
      .strict(),
  })
  .strict()

export const zCoreRoutes = {
  get: {
    "/": {
      response: {
        "200": zResponse,
        "500": z.union([ZResError, zResponse]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/healthcheck": {
      response: {
        "200": zResponse,
        "500": z.union([ZResError, zResponse]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/version": {
      response: {
        "200": z
          .object({
            version: z.string(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef

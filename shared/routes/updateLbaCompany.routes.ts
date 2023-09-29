import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZLbaCompany } from "../models/lbaCompany.model"

import { IRoutesDef } from "./common.routes"

export const zUpdateLbaCompanyRoutes = {
  get: {
    // TODO_SECURITY passer en session role is-admin et faire un formulaire (migrer en POST)
    "/updateLBB/updateContactInfo": {
      querystring: z
        .object({
          secret: z.string(),
          siret: extensions.siret(),
          email: z.string().email().or(z.literal("")).optional(),
          phone: extensions.phone().or(z.literal("")).optional(),
        })
        .strict(),
      response: {
        "200": z.union([ZLbaCompany, z.string()]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef

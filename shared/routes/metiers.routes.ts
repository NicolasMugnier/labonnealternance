import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZAppellationsRomes, ZMetierEnrichiArray, ZMetiers } from "../models/metiers.model"

import { IRoutesDef } from "./common.routes"

export const zMetiersRoutes = {
  get: {
    "/v1/metiers/metiersParFormation/:cfd": {
      params: z
        .object({
          cfd: z.string().openapi({
            param: {
              description: "L'identifiant CFD de la formation.",
            },
            example: "50022137",
          }),
        })
        .strict(),
      response: {
        200: ZMetiers,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        description: "Récupérer la liste des noms des métiers du référentiel de La bonne alternance pour une formation donnée",
      },
    },
    "/v1/metiers/metiersParEtablissement/:siret": {
      params: z
        .object({
          siret: extensions.siret(),
        })
        .strict(),
      response: {
        200: ZMetiers,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        description: "Récupérer la liste des noms des métiers du référentiel de La bonne alternance pour un établissement de formation",
      },
    },
    "/v1/metiers/all": {
      response: {
        200: ZMetiers,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/v1/metiers": {
      querystring: z
        .object({
          title: z.string().openapi({
            param: {
              description: "Un terme libre de recherche de métier.",
            },
            example: "Décoration",
          }),
          romes: z
            .string()
            .openapi({
              param: {
                description: "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s).",
              },
              example: "F1603,I1308",
            })
            .optional(),
          rncps: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "Une liste de codes RNCP séparés par des virgules correspondant au(x) métier(s) recherché(s).",
              },
              example: "RNCP500,RNCP806",
            }),
        })
        .strict(),
      response: {
        200: z
          .object({
            labelsAndRomes: ZMetierEnrichiArray,
          })
          .strict(),
      },
      openapi: { description: "Récupérer la liste des noms des métiers du référentiel de La bonne alternance" },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/v1/metiers/intitule": {
      querystring: z
        .object({
          label: z.string().nonempty(),
        })
        .strict(),
      response: {
        200: ZAppellationsRomes.strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef

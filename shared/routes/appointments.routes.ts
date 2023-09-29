import { z } from "zod"

import { referrers } from "../constants/referers"
import { ZAppointment, ZEtablissement } from "../models"
import { ZEligibleTrainingsForAppointmentSchema } from "../models/elligibleTraining.model"

import { IRoutesDef, ZResError } from "./common.routes"

const zContextCreateSchemaParcoursup = z
  .object({
    idParcoursup: z.string(),
    trainingHasJob: z.boolean().optional(),
    referrer: z.literal(referrers.PARCOURSUP.name.toLowerCase()),
  })
  .strict()

export type IContextCreateSchemaParcoursup = z.output<typeof zContextCreateSchemaParcoursup>

const zContextCreateSchemaRcoFormation = z
  .object({
    idRcoFormation: z.string().min(1),
    trainingHasJob: z.boolean().optional(),
    referrer: z.literal(referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase()),
  })
  .strict()

export type IContextCreateSchemaRcoFormation = z.output<typeof zContextCreateSchemaRcoFormation>

const zContextCreateSchemaActionFormation = z
  .object({
    idActionFormation: z.string().min(1),
    trainingHasJob: z.boolean().optional(),
    referrer: z.literal(referrers.ONISEP.name.toLowerCase()),
  })
  .strict()

export type IContextCreateSchemaActionFormation = z.output<typeof zContextCreateSchemaActionFormation>

const zContextCreateSchemaCleMinistereEducatif = z
  .object({
    idCleMinistereEducatif: z.string().min(1),
    trainingHasJob: z.boolean().optional(),
    referrer: z.enum([
      referrers.PARCOURSUP.name.toLowerCase(),
      referrers.LBA.name.toLowerCase(),
      referrers.PFR_PAYS_DE_LA_LOIRE.name.toLowerCase(),
      referrers.ONISEP.name.toLowerCase(),
      referrers.JEUNE_1_SOLUTION.name.toLowerCase(),
      referrers.AFFELNET.name.toLowerCase(),
    ]),
  })
  .strict()

export type IContextCreateSchemaCleMinistereEducatif = z.output<typeof zContextCreateSchemaCleMinistereEducatif>

const zContextCreateSchema = z.union([
  // Find through "idParcoursup"
  zContextCreateSchemaParcoursup,

  // Find through "idRcoFormation"
  zContextCreateSchemaRcoFormation,

  // Find through "idActionFormation"
  zContextCreateSchemaActionFormation,

  // Find through "idCleMinistereEducatif"
  zContextCreateSchemaCleMinistereEducatif,
])

export const zAppointmentsRoute = {
  get: {
    "/admin/appointments": {
      response: {
        "2xx": z
          .object({
            appointments: z.array(ZAppointment),
          })
          .strict(),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
    "/admin/appointments/details": {
      response: {
        "2xx": z
          .object({
            appointments: z.array(
              z
                .object({
                  created_at: z.date(),
                  applicant_message_to_cfa: z.string().nullable(),
                  appointment_origin: z.string(),
                  cfa_recipient_email: z.string(),
                  formation: z
                    .object({
                      etablissement_gestionnaire_entreprise_raison_sociale: z.string().nullable(),
                      etablissement_formateur_siret: z.string().nullable(),
                      intitule_long: z.string().nullable(),
                    })
                    .strict(),
                  candidat: z
                    .object({
                      firstname: z.string(),
                      lastname: z.string(),
                      email: z.string(),
                      phone: z.string(),
                    })
                    .strict(),
                })
                .strict()
            ),
          })
          .strict(),
      },
      securityScheme: {
        auth: "jwt-rdv-admin",
        role: "administrator",
      },
    },
    "/appointment-request/context/recap": {
      // TODO_SECURITY_FIX il faut un secure token
      querystring: z.object({ appointmentId: z.string() }).strict(),
      response: {
        "2xx": z
          .object({
            appointment: z
              .object({
                appointment: z.any(),
                appointment_origin_detailed: z.string(),
              })
              .strict(),
            user: z.any(),
            etablissement: z.union([ZEligibleTrainingsForAppointmentSchema, z.object({}).strict()]),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/appointment-request/context/create": {
      body: zContextCreateSchema,
      response: {
        "2xx": z.union([
          z
            .object({
              etablissement_formateur_entreprise_raison_sociale: ZEtablissement.shape.raison_sociale,
              intitule_long: z.string(),
              lieu_formation_adresse: z.string(),
              code_postal: z.string(),
              etablissement_formateur_siret: ZEtablissement.shape.formateur_siret,
              cfd: z.string(),
              localite: z.string(),
              id_rco_formation: z.string(),
              cle_ministere_educatif: z.string(),
              form_url: z.string(),
            })
            .strict(),
          z
            .object({
              error: z.literal("Prise de rendez-vous non disponible."),
            })
            .strict(),
        ]),
        "404": z.union([ZResError, z.literal("Formation introuvable")]),
        "400": z.union([ZResError, z.literal("Critère de recherche non conforme.")]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/appointment-request/validate": {
      body: z
        .object({
          firstname: z.string(),
          lastname: z.string(),
          phone: z.string(),
          email: z.string(),
          type: z.string(),
          applicantMessageToCfa: z.string().nullable(),
          applicantReasons: z.array(z.enum(["modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre"])),
          cleMinistereEducatif: z.string(),
          appointmentOrigin: z.string(),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            userId: z.string(),
            appointment: z.union([ZAppointment, z.null()]),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/appointment-request/reply": {
      // TODO_SECURITY_FIX token jwt
      body: z
        .object({
          appointment_id: z.string(),
          cfa_intention_to_applicant: z.string(),
          cfa_message_to_applicant_date: z.date(),
          cfa_message_to_applicant: z.string().nullable(),
        })
        .strict(),
      response: {
        "2xx": z
          .object({
            appointment_id: z.string(),
            cfa_intention_to_applicant: z.string(),
            cfa_message_to_applicant: z.string().nullable(),
            cfa_message_to_applicant_date: z.date(),
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

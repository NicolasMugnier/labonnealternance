import { createMongoDBIndexes } from "@/common/model"
import { CronName, IInternalJobsCronTask, IInternalJobsSimple } from "@/common/model/schema/internalJobs/internalJobs.types"

import { getLoggerWithContext } from "../common/logger"

import anonymizeOldApplications from "./anonymizeOldApplications/anonymizeOldApplications"
import { cronsInit, cronsScheduler } from "./crons_actions"
import { validateModels } from "./database/validateModels"
import updateDiplomesMetiers from "./diplomesMetiers/updateDiplomesMetiers"
import updateDomainesMetiers from "./domainesMetiers/updateDomainesMetiers"
import updateDomainesMetiersFile from "./domainesMetiers/updateDomainesMetiersFile"
import { importCatalogueFormationJob } from "./formationsCatalogue/formationsCatalogue"
import { updateFormationCatalogue } from "./formationsCatalogue/updateFormationCatalogue"
import { addJob, executeJob } from "./jobs_actions"
import { createApiUser } from "./lba_recruteur/api/createApiUser"
import { disableApiUser } from "./lba_recruteur/api/disableApiUser"
import { resetApiKey } from "./lba_recruteur/api/resetApiKey"
import { annuleFormulaire } from "./lba_recruteur/formulaire/annuleFormulaire"
import { createUserFromCLI } from "./lba_recruteur/formulaire/createUser"
import { exportPE } from "./lba_recruteur/formulaire/misc/exportPE"
import { removeIsDelegatedFromJobs } from "./lba_recruteur/formulaire/misc/removeIsDelegatedFromJobs"
import { removeVersionKeyFromAllCollections } from "./lba_recruteur/formulaire/misc/removeVersionKeyFromAllCollections"
import { relanceFormulaire } from "./lba_recruteur/formulaire/relanceFormulaire"
import { generateIndexes } from "./lba_recruteur/indexes/generateIndexes"
import { relanceOpco } from "./lba_recruteur/opco/relanceOpco"
import { createOffreCollection } from "./lba_recruteur/seed/createOffre"
import { checkAwaitingCompaniesValidation } from "./lba_recruteur/user/misc/updateMissingActivationState"
import { updateSiretInfosInError } from "./lba_recruteur/user/misc/updateSiretInfosInError"
import updateGeoLocations from "./lbb/updateGeoLocations"
import updateLbaCompanies from "./lbb/updateLbaCompanies"
import updateOpcoCompanies from "./lbb/updateOpcoCompanies"
import { activateOptOutEtablissementFormations } from "./rdv/activateOptOutEtablissementFormations"
import { anonimizeAppointments } from "./rdv/anonymizeAppointments"
import { anonimizeUsers } from "./rdv/anonymizeUsers"
import { eligibleTrainingsForAppointmentsHistoryWithCatalogue } from "./rdv/eligibleTrainingsForAppointmentsHistoryWithCatalogue"
import { importReferentielOnisep } from "./rdv/importReferentielOnisep"
import { inviteEtablissementToOptOut } from "./rdv/inviteEtablissementToOptOut"
import { inviteEtablissementToPremium } from "./rdv/inviteEtablissementToPremium"
import { inviteEtablissementAffelnetToPremium } from "./rdv/inviteEtablissementToPremiumAffelnet"
import { inviteEtablissementToPremiumFollowUp } from "./rdv/inviteEtablissementToPremiumFollowUp"
import { inviteEtablissementAffelnetToPremiumFollowUp } from "./rdv/inviteEtablissementToPremiumFollowUpAffelnet"
import { premiumActivatedReminder } from "./rdv/premiumActivatedReminder"
import { premiumInviteOneShot } from "./rdv/premiumInviteOneShot"
import { syncEtablissementsAndFormations } from "./rdv/syncEtablissementsAndFormations"
import { syncAffelnetFormationsFromCatalogueME } from "./rdv/syncEtablissementsAndFormationsAffelnet"
import updateReferentielRncpRomes from "./referentielRncpRome/updateReferentielRncpRomes"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails/updateBrevoBlockedEmails"

const logger = getLoggerWithContext("script")

interface CronDef {
  name: CronName
  cron_string: string
  handler: () => Promise<number>
}

export const CRONS: Record<CronName, CronDef> = {
  "Reindex formulaire collection": {
    name: "Reindex formulaire collection",
    cron_string: "5 1 * * *",
    handler: () => addJob({ name: "indexes:generate", payload: { index_list: "recruiters" } }),
  },
  "Create offre collection for metabase": {
    name: "Create offre collection for metabase",
    cron_string: "55 0 * * *",
    handler: () => addJob({ name: "metabase:offre:create", payload: {} }),
  },
  "Cancel lba recruteur expired offers": {
    name: "Cancel lba recruteur expired offers",
    cron_string: "15 0 * * *",
    handler: () => addJob({ name: "formulaire:annulation", payload: {} }),
  },
  "Send offer reminder email at J+7": {
    name: "Send offer reminder email at J+7",
    cron_string: "20 0 * * *",
    handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "7" } }),
  },
  "Send offer reminder email at J+1": {
    name: "Send offer reminder email at J+1",
    cron_string: "25 0 * * *",
    handler: () => addJob({ name: "formulaire:relance", payload: { threshold: "1" } }),
  },
  "Send reminder to OPCO about awaiting validation users": {
    name: "Send reminder to OPCO about awaiting validation users",
    cron_string: "30 0 * * 1,3,5",
    handler: () => addJob({ name: "opco:relance", payload: { threshold: "1" } }),
  },
  "Send CSV offers to Pôle emploi": {
    name: "Send CSV offers to Pôle emploi",
    cron_string: "30 5 * * *",
    handler: () => addJob({ name: "pe:offre:export", payload: { threshold: "1" } }),
  },
  "Check companies validation state": {
    name: "Check companies validation state",
    cron_string: "30 6 * * *",
    handler: () => addJob({ name: "user:validate", payload: { threshold: "1" } }),
  },
  "Mise à jour des recruteurs en erreur": {
    name: "Mise à jour des recruteurs en erreur",
    cron_string: "10 0 * * *",
    handler: () => addJob({ name: "siret:inError:update", payload: {} }),
  },
  "Active tous les établissements qui ont souscrits à l'opt-out.": {
    name: "Active tous les établissements qui ont souscrits à l'opt-out.",
    cron_string: "50 0 * * *",
    handler: () => addJob({ name: "etablissement:formations:activate:opt-out", payload: {} }),
  },
  "Invite les établissements (via email gestionnaire) à l'opt-out.": {
    name: "Invite les établissements (via email gestionnaire) à l'opt-out.",
    cron_string: "35 0 * * *",
    handler: () => addJob({ name: "etablissement:invite:opt-out", payload: {} }),
  },
  "Invite les établissements (via email gestionnaire) au premium (Parcoursup).": {
    name: "Invite les établissements (via email gestionnaire) au premium (Parcoursup).",
    cron_string: "0 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium", payload: {} }),
  },
  "(Relance) Invite les établissements (via email gestionnaire) au premium (Parcoursup).": {
    name: "(Relance) Invite les établissements (via email gestionnaire) au premium (Parcoursup).",
    cron_string: "30 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium:follow-up", payload: {} }),
  },
  "Récupère la liste de toutes les formations du Catalogue et les enregistre en base de données.": {
    name: "Récupère la liste de toutes les formations du Catalogue et les enregistre en base de données.",
    cron_string: "10 2 * * *",
    handler: () => addJob({ name: "etablissements:formations:sync", payload: {} }),
  },
  "Historisation des formations éligibles à la prise de rendez-vous.": {
    name: "Historisation des formations éligibles à la prise de rendez-vous.",
    cron_string: "55 2 * * *",
    handler: () => addJob({ name: "catalogue:trainings:appointments:archive:eligible", payload: {} }),
  },
  "Anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus d'un an": {
    name: "Anonimisation des utilisateurs n'ayant effectué aucun rendez-vous de plus d'un an",
    cron_string: "0 0 1 * *",
    handler: () => addJob({ name: "users:anonimize", payload: {} }),
  },
  "Anonimisation des prises de rendez-vous de plus d'un an": {
    name: "Anonimisation des prises de rendez-vous de plus d'un an",
    cron_string: "10 0 1 * *",
    handler: () => addJob({ name: "appointments:anonimize", payload: {} }),
  },
  "Récupère la liste de toutes les formations Affelnet du Catalogue et les enregistre en base de données.": {
    name: "Récupère la liste de toutes les formations Affelnet du Catalogue et les enregistre en base de données.",
    cron_string: "15 8 * * *",
    handler: () => addJob({ name: "etablissements:formations:affelnet:sync", payload: {} }),
  },
  "Invite les établissements (via email gestionnaire) au premium (Affelnet).": {
    name: "Invite les établissements (via email gestionnaire) au premium (Affelnet).",
    cron_string: "15 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium:affelnet", payload: {} }),
  },
  "(Relance) Invite les établissements (via email gestionnaire) au premium (Affelnet).": {
    name: "(Relance) Invite les établissements (via email gestionnaire) au premium (Affelnet).",
    cron_string: "45 9 * * *",
    handler: () => addJob({ name: "etablissement:invite:premium:affelnet:follow-up", payload: {} }),
  },
  "Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep": {
    name: "Alimentation de la table de correspondance entre Id formation Onisep et Clé ME du catalogue RCO, utilisé pour diffuser la prise de RDV sur l’Onisep",
    cron_string: "45 23 * * 2",
    handler: () => addJob({ name: "referentiel:onisep:import", payload: {} }),
  },
  "Mise à jour depuis le Catalogue des formations.": {
    name: "Mise à jour depuis le Catalogue des formations.",
    cron_string: "15 3 * * *",
    handler: () => addJob({ name: "catalogue:trainings:sync", payload: {} }),
  },
  "Mise à jour des champs spécifiques de la collection formations catalogue.": {
    name: "Mise à jour des champs spécifiques de la collection formations catalogue.",
    cron_string: "30 3 * * *",
    handler: () => addJob({ name: "catalogue:trainings:sync:extra", payload: {} }),
  },
  "Mise à jour des adresses emails bloquées.": {
    name: "Mise à jour des adresses emails bloquées.",
    cron_string: "5 0 * * *",
    handler: () => addJob({ name: "brevo:blocked:sync", payload: {} }),
  },
  "Anonymise les candidatures de plus de un an.": {
    name: "Anonymise les candidatures de plus de un an.",
    cron_string: "10 0 * * *",
    handler: () => addJob({ name: "applications:anonymize", payload: {} }),
  },
  "Géolocation de masse des sociétés issues de l'algo": {
    name: "Géolocation de masse des sociétés issues de l'algo",
    cron_string: "0 5 * * 6",
    handler: () => addJob({ name: "geo-locations:update", payload: {} }),
  },
  "Détermination des opcos des sociétés issues de l'algo": {
    name: "Détermination des opcos des sociétés issues de l'algo",
    cron_string: "30 6 * * 6",
    handler: () => addJob({ name: "opcos:update", payload: {} }),
  },
  "Mise à jour des sociétés issues de l'algo": {
    name: "Mise à jour des sociétés issues de l'algo",
    cron_string: "0 5 * * 7",
    handler: () => addJob({ name: "companies:update", payload: { UseAlgoFile: true, ClearMongo: true, UseSave: true, BuildIndex: true } }),
  },
}

export async function runJob(job: IInternalJobsCronTask | IInternalJobsSimple): Promise<number> {
  return executeJob(job, async () => {
    if (job.type === "cron_task") {
      return CRONS[job.name].handler()
    }
    switch (job.name) {
      case "migration:remove-version-key-from-all-collections": // Temporaire, doit tourner en recette et production
        return removeVersionKeyFromAllCollections()
      case "migration:remove-delegated-from-jobs": // Temporaire, doit tourner en recette et production
        return removeIsDelegatedFromJobs()
      case "indexes:generate":
        return generateIndexes(job.payload)
      case "user:create": {
        const { first_name, last_name, establishment_siret, establishment_raison_sociale, phone, address, email, scope } = job.payload
        return createUserFromCLI(
          {
            first_name,
            last_name,
            establishment_siret,
            establishment_raison_sociale,
            phone,
            address,
            email,
            scope,
          },
          {
            options: {
              Type: job.payload.type,
              Email_valide: job.payload.email_valide,
            },
          }
        )
      }
      case "api:user:create": {
        const { nom, prenom, email, organization, scope } = job.payload
        return createApiUser(nom, prenom, email, organization, scope)
      }
      case "api:user:reset":
        return resetApiKey(job.payload?.email)
      case "api:user:disable": {
        const { email, state } = job.payload
        return disableApiUser(email, state)
      }
      case "formulaire:relance": {
        const { threshold } = job.payload
        return relanceFormulaire(parseInt(threshold))
      }
      case "formulaire:annulation":
        return annuleFormulaire()
      case "metabase:offre:create":
        return createOffreCollection()
      case "opco:relance":
        return relanceOpco()
      case "pe:offre:export":
        return exportPE()
      case "user:validate":
        return checkAwaitingCompaniesValidation()
      case "siret:inError:update":
        return updateSiretInfosInError()
      case "etablissement:formations:activate:opt-out":
        return activateOptOutEtablissementFormations()
      case "etablissement:invite:opt-out":
        return inviteEtablissementToOptOut()
      case "etablissement:invite:premium":
        return inviteEtablissementToPremium()
      case "etablissement:invite:premium:affelnet":
        return inviteEtablissementAffelnetToPremium()
      case "etablissement:invite:premium:follow-up":
        return inviteEtablissementToPremiumFollowUp()
      case "etablissement:invite:premium:affelnet:follow-up":
        return inviteEtablissementAffelnetToPremiumFollowUp()
      case "premium:activated:reminder":
        return premiumActivatedReminder()
      case "premium:invite:one-shot":
        return premiumInviteOneShot()
      case "etablissements:formations:sync":
        return syncEtablissementsAndFormations()
      case "etablissements:formations:affelnet:sync":
        return syncAffelnetFormationsFromCatalogueME()
      case "appointments:anonimize":
        return anonimizeAppointments()
      case "users:anonimize":
        return anonimizeUsers()
      case "catalogue:trainings:appointments:archive:eligible":
        return eligibleTrainingsForAppointmentsHistoryWithCatalogue()
      case "referentiel:onisep:import":
        return importReferentielOnisep()
      case "catalogue:trainings:sync":
        return importCatalogueFormationJob()
      case "catalogue:trainings:sync:extra":
        return updateFormationCatalogue()
      case "brevo:blocked:sync":
        return updateBrevoBlockedEmails(job.payload)
      case "applications:anonymize":
        return anonymizeOldApplications()
      case "companies:update":
        return updateLbaCompanies(job.payload)
      case "geo-locations:update":
        return updateGeoLocations(job.payload)
      case "opcos:update":
        return updateOpcoCompanies(job.payload)
      case "domaines-metiers:update":
        return updateDomainesMetiers()
      case "domaines-metiers:file:update": {
        const { filename, key } = job.payload
        return updateDomainesMetiersFile({ filename, key })
      }
      case "diplomes-metiers:update":
        return updateDiplomesMetiers()
      case "referentiel:rncp-romes:update":
        return updateReferentielRncpRomes()
      ///////
      case "mongodb:indexes:create":
        return createMongoDBIndexes()
      case "db:validate":
        return validateModels()
      case "migrations:up": {
        // await upMigration()
        // Validate all documents after the migration
        // await addJob({ name: "db:validate", queued: true })
        return
      }
      case "migrations:status": {
        // const pendingMigrations = await statusMigration()
        // console.log(`migrations-status=${pendingMigrations === 0 ? "synced" : "pending"}`)
        console.log(`migrations-status=synced`)
        return
      }
      case "migrations:create":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // createMigration(job.payload )
        return
      case "crons:init": {
        await cronsInit()
        return
      }
      case "crons:scheduler":
        return cronsScheduler()

      default: {
        logger.warn(`Job not found ${job.name}`)
      }
    }
  })
}
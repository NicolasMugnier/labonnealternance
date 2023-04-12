import { oleoduc, writeData } from "oleoduc"
import { Readable } from "stream"
import { logger } from "../../common/logger.js"
import { referrers } from "../../common/model/constants/referrers.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import { isEmailBlacklisted } from "../../service/applications.js"
import { getFormationsFromCatalogueMe } from "../../services/catalogue.service.js"

const select = {
  _id: 1,
  email: 1,
  cfd: 1,
  parcoursup_id: 1,
  cle_ministere_educatif: 1,
  etablissement_formateur_siret: 1,
  etablissement_formateur_courriel: 1,
  etablissement_formateur_code_postal: 1,
  intitule_long: 1,
  published: 1,
  adresse: 1,
  localite: 1,
  code_postal: 1,
  lieu_formation_adresse: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  etablissement_formateur_adresse: 1,
  etablissement_formateur_nom_departement: 1,
  etablissement_formateur_localite: 1,
  etablissement_gestionnaire_siret: 1,
  etablissement_gestionnaire_courriel: 1,
}

/**
 * Gets email from catalogue field.
 * These email fields can contain "not valid email", "emails separated by ##" or be null.
 * @param {string|null} email
 * @return {string|null}
 */
const getEmailFromCatalogueField = (email) => {
  if (!email) {
    return null
  }

  const divider = "##"
  if (email?.includes(divider)) {
    const emailSplit = email.split(divider).at(-1).toLowerCase()

    return isValidEmail(emailSplit) ? emailSplit : null
  }

  return isValidEmail(email) ? email.toLowerCase() : null
}

/**
 * @description Gets Catalogue etablissments informations and insert in etablissement collection.
 * @returns {Promise<void>}
 */
export const syncAffelnetFormationsFromCatalogueME = async ({ etablissements, eligibleTrainingsForAppointments }) => {
  logger.info("Cron #syncEtablissementsAndFormationsAffelnet started.")

  const referrersToActivate = [referrers.AFFELNET.name]

  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 1000,
    query: {
      affelnet_perimetre: true,
      affelnet_statut: { $in: ["publié", "en attente de publication"] },
    },
    select,
  })

  await oleoduc(
    Readable.from(catalogueMinistereEducatif),
    writeData(
      async (formation) => {
        const [eligibleTrainingsForAppointment, etablissement] = await Promise.all([
          eligibleTrainingsForAppointments.findOne({
            cle_ministere_educatif: formation.cle_ministere_educatif,
          }),
          etablissements.findOne({ formateur_siret: formation.etablissement_formateur_siret }),
        ])

        if (eligibleTrainingsForAppointment) {
          let emailRdv = eligibleTrainingsForAppointment.lieu_formation_email

          // Don't override "email" if this field is true
          if (!eligibleTrainingsForAppointment?.is_lieu_formation_email_customized) {
            emailRdv =
              getEmailFromCatalogueField(formation.email) ||
              getEmailFromCatalogueField(formation.etablissement_formateur_courriel) ||
              eligibleTrainingsForAppointment.lieu_formation_email
          }

          const emailBlacklisted = await isEmailBlacklisted(emailRdv)

          await eligibleTrainingsForAppointments.updateMany(
            { cle_ministere_educatif: formation.cle_ministere_educatif },
            {
              training_id_catalogue: formation._id,
              lieu_formation_email: emailRdv,
              parcoursup_id: formation.parcoursup_id,
              cle_ministere_educatif: formation.cle_ministere_educatif,
              training_code_formation_diplome: formation.cfd,
              etablissement_formateur_zip_code: formation.etablissement_formateur_code_postal,
              training_intitule_long: formation.intitule_long,
              referrers: emailRdv && !emailBlacklisted ? referrersToActivate : [],
              is_catalogue_published: formation.published,
              rco_formation_id: formation.id_rco_formation,
              last_catalogue_sync_date: dayjs().format(),
              lieu_formation_street: formation.lieu_formation_adresse,
              lieu_formation_city: formation.localite,
              lieu_formation_zip_code: formation.code_postal,
              etablissement_formateur_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
              etablissement_formateur_street: formation.etablissement_formateur_adresse,
              departement_etablissement_formateur: formation.etablissement_formateur_nom_departement,
              etablissement_formateur_city: formation.etablissement_formateur_localite,
              etablissement_formateur_siret: formation.etablissement_formateur_siret,
              etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
            }
          )
        } else {
          const emailRdv = getEmailFromCatalogueField(formation.etablissement_formateur_courriel)

          const emailBlacklisted = await isEmailBlacklisted(emailRdv)

          await eligibleTrainingsForAppointments.create({
            training_id_catalogue: formation._id,
            lieu_formation_email: emailRdv,
            parcoursup_id: formation.parcoursup_id,
            cle_ministere_educatif: formation.cle_ministere_educatif,
            training_code_formation_diplome: formation.cfd,
            training_intitule_long: formation.intitule_long,
            referrers: emailRdv && !emailBlacklisted ? referrersToActivate : [],
            is_catalogue_published: formation.published,
            rco_formation_id: formation.id_rco_formation,
            last_catalogue_sync_date: dayjs().format(),
            lieu_formation_street: formation.lieu_formation_adresse,
            lieu_formation_city: formation.localite,
            lieu_formation_zip_code: formation.code_postal,
            etablissement_formateur_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
            etablissement_formateur_street: formation.etablissement_formateur_adresse,
            etablissement_formateur_zip_code: formation.etablissement_formateur_code_postal,
            departement_etablissement_formateur: formation.etablissement_formateur_nom_departement,
            etablissement_formateur_city: formation.etablissement_formateur_localite,
            etablissement_formateur_siret: formation.etablissement_formateur_siret,
            etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
          })
        }

        let emailDecisionnaire = etablissement?.gestionnaire_email
        if (formation.etablissement_gestionnaire_courriel && isValidEmail(formation.etablissement_gestionnaire_courriel)) {
          emailDecisionnaire = formation.etablissement_gestionnaire_courriel.toLowerCase()
        }

        // Update etablissement model (upsert)
        return etablissements.updateMany(
          {
            formateur_siret: formation.etablissement_formateur_siret,
          },
          {
            affelnet_perimetre: true,
            gestionnaire_siret: formation.etablissement_gestionnaire_siret,
            gestionnaire_email: emailDecisionnaire,
            raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
            formateur_siret: formation.etablissement_formateur_siret,
            formateur_address: formation.etablissement_formateur_adresse,
            formateur_zip_code: formation.etablissement_formateur_code_postal,
            formateur_city: formation.etablissement_formateur_localite,
            last_catalogue_sync_date: dayjs().format(),
          }
        )
      },
      { parallel: 500 }
    )
  )

  logger.info("Cron #syncEtablissementsAndFormationsAffelnet done.")
}
import { oleoduc, writeData } from "oleoduc"
import { logger } from "../../common/logger.js"
import { referrers } from "../../common/model/constants/referrers.js"
import { FormationCatalogue } from "../../common/model/index.js"
import { dayjs } from "../../common/utils/dayjs.js"
import { isValidEmail } from "../../common/utils/isValidEmail.js"
import { getFormationsFromCatalogueMe } from "../../services/catalogue.service.js"
import { isEmailBlacklisted } from "../../service/applications.js"

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
export const syncEtablissementsAndFormations = async ({ etablissements, widgetParameters }) => {
  logger.info("Cron #syncEtablissementsAndFormations started.")

  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 1000,
    query: {
      parcoursup_id: { $ne: null },
      parcoursup_statut: "publié",
      published: true,
      catalogue_published: true,
    },
    select: { parcoursup_id: 1, cle_ministere_educatif: 1 },
  })

  await oleoduc(
    FormationCatalogue.find({}).cursor(),
    writeData(
      async (formation) => {
        const [widgetParameter, etablissement, formationMinistereEducatif] = await Promise.all([
          widgetParameters.findOne({
            cle_ministere_educatif: formation.cle_ministere_educatif,
          }),
          etablissements.findOne({ siret_formateur: formation.etablissement_formateur_siret }),
          catalogueMinistereEducatif.find((formationMe) => formationMe.cle_ministere_educatif === formation.cle_ministere_educatif),
        ])

        // Activate opt_out referrers
        const referrersToActivate = []
        if (etablissement?.opt_out_activated_at) {
          referrersToActivate.push(referrers.LBA.code)
          referrersToActivate.push(referrers.ONISEP.code)
          referrersToActivate.push(referrers.PFR_PAYS_DE_LA_LOIRE.code)
          referrersToActivate.push(referrers.AFFELNET.code)
          referrersToActivate.push(referrers.JEUNE_1_SOLUTION.code)
        }

        // Activate premium referrers
        if (etablissement?.premium_activated_at) {
          referrersToActivate.push(referrers.PARCOURSUP.code)
        }

        if (widgetParameter) {
          let emailRdv = widgetParameter.email_rdv

          // Don't override "email" if this field is true
          if (!widgetParameter?.is_custom_email_rdv) {
            emailRdv = getEmailFromCatalogueField(formation.email) || getEmailFromCatalogueField(formation.etablissement_formateur_courriel) || widgetParameter.email_rdv
          }

          const emailBlacklisted = await isEmailBlacklisted(emailRdv)

          await widgetParameters.updateMany(
            { cle_ministere_educatif: formation.cle_ministere_educatif },
            {
              id_catalogue: formation._id,
              email_rdv: emailRdv,
              id_parcoursup: formationMinistereEducatif?.parcoursup_id,
              cle_ministere_educatif: formation.cle_ministere_educatif,
              formation_cfd: formation.cfd,
              code_postal: formation.code_postal,
              formation_intitule: formation.intitule_long,
              referrers: emailRdv && !emailBlacklisted ? referrersToActivate : [],
              catalogue_published: formation.published,
              id_rco_formation: formation.id_rco_formation,
              cfd: formation.cfd,
              localite: formation.localite,
              last_catalogue_sync: dayjs().format(),
              etablissement_siret: formation.etablissement_formateur_siret,
              etablissement_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
              etablissement_formateur_adresse: formation.etablissement_formateur_adresse,
              etablissement_formateur_code_postal: formation.etablissement_formateur_code_postal,
              etablissement_formateur_nom_departement: formation.etablissement_formateur_nom_departement,
              etablissement_formateur_localite: formation.etablissement_formateur_localite,
              lieu_formation_adresse: formation.lieu_formation_adresse,
              etablissement_formateur_siret: formation.etablissement_formateur_siret,
              etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
            }
          )
        } else {
          const emailRdv = getEmailFromCatalogueField(formation.etablissement_formateur_courriel)

          const emailBlacklisted = await isEmailBlacklisted(emailRdv)

          await widgetParameters.createParameter({
            id_catalogue: formation._id,
            email_rdv: emailRdv,
            id_parcoursup: formationMinistereEducatif?.parcoursup_id,
            cle_ministere_educatif: formation.cle_ministere_educatif,
            formation_cfd: formation.cfd,
            code_postal: formation.code_postal,
            formation_intitule: formation.intitule_long,
            referrers: emailRdv && !emailBlacklisted ? referrersToActivate : [],
            catalogue_published: formation.published,
            id_rco_formation: formation.id_rco_formation,
            last_catalogue_sync: dayjs().format(),
            cfd: formation.cfd,
            localite: formation.localite,
            lieu_formation_adresse: formation.lieu_formation_adresse,
            etablissement_siret: formation.etablissement_formateur_siret,
            etablissement_raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
            etablissement_formateur_adresse: formation.etablissement_formateur_adresse,
            etablissement_formateur_code_postal: formation.etablissement_formateur_code_postal,
            etablissement_formateur_nom_departement: formation.etablissement_formateur_nom_departement,
            etablissement_formateur_localite: formation.etablissement_formateur_localite,
            etablissement_formateur_siret: formation.etablissement_formateur_siret,
            etablissement_gestionnaire_siret: formation.etablissement_gestionnaire_siret,
          })
        }

        let emailDecisionnaire = etablissement?.email_decisionnaire
        if (formation.etablissement_gestionnaire_courriel && isValidEmail(formation.etablissement_gestionnaire_courriel)) {
          emailDecisionnaire = formation.etablissement_gestionnaire_courriel.toLowerCase()
        }

        // Update etablissement model (upsert)
        return etablissements.updateMany(
          {
            siret_formateur: formation.etablissement_formateur_siret,
          },
          {
            siret_formateur: formation.etablissement_formateur_siret,
            siret_gestionnaire: formation.etablissement_gestionnaire_siret,
            email_decisionnaire: emailDecisionnaire,
            raison_sociale: formation.etablissement_formateur_entreprise_raison_sociale,
            etablissement_formateur_courriel: formation.etablissement_formateur_courriel,
            adresse: formation.etablissement_formateur_adresse,
            code_postal: formation.etablissement_formateur_code_postal,
            localite: formation.etablissement_formateur_localite,
            last_catalogue_sync: dayjs().format(),
          }
        )
      },
      { parallel: 500 }
    )
  )

  logger.info("Cron #syncEtablissementsAndFormations done.")
}
import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"

/**
 * @description Invite all "etablissements" to Premium.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToPremium = async ({ etablissements, mailer, eligibleTrainingsForAppointments }) => {
  logger.info("Cron #inviteEtablissementToPremium started.")

  const etablissementsActivated = await etablissements.find({
    email_decisionnaire: {
      $ne: null,
    },
    premium_activation_date: null,
    "to_etablissement_emails.campaign": { $ne: mailType.PREMIUM_INVITE },
  })

  for (const etablissement of etablissementsToInvite) {
    // Only send an invite if the "etablissement" have at least one available Parcoursup "formation"
    const hasOneAvailableFormation = await eligibleTrainingsForAppointments
      .findOne({
        etablissement_formateur_siret: etablissement.formateur_siret,
        lieu_formation_email: { $ne: null },
        parcoursup_id: { $ne: null },
      })
      .lean()

    if (!hasOneAvailableFormation) {
      continue
    }

    // Invite all etablissements only in production environment
    const { messageId } = await mailer.sendEmail({
      to: etablissement.email_decisionnaire,
      subject: `Optimisez le sourcing de vos candidats sur Parcoursup !`,
      template: mailTemplate["mail-cfa-premium-invite"],
      data: {
        isParcoursup: true,
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          exempleParcoursup: `${config.publicUrlEspacePro}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.email_decisionnaire,
          activatedAt: dayjs(etablissement.opt_out_will_be_activated_at).format("DD/MM"),
          linkToForm: `${config.publicUrlEspacePro}/form/premium/${etablissement._id}`,
        },
      },
    })

    await etablissements.updateOne(
      { siret_formateur: etablissement.siret_formateur },
      {
        premium_invited_at: dayjs().toDate(),
        $push: {
          mailing: {
            campaign: mailType.PREMIUM_INVITE,
            status: null,
            message_id: messageId,
            email_sent_at: dayjs().toDate(),
          },
        },
      }
    )
  }

  logger.info("Cron #inviteEtablissementToPremium done.")
}

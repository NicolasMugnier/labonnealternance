import express from "express"
import { mailTemplate } from "../../assets/index.js"
import { CFA, ENTREPRISE, etat_utilisateur } from "../../common/constants.js"
import dayjs from "../../common/dayjs.js"
import { Formulaire, UserRecruteur } from "../../common/model/index.js"
import { createMagicLinkToken } from "../../common/utils/jwtUtils.js"
import config from "../../config.js"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"

export default ({ usersRecruteur, mailer, formulaire }) => {
  const router = express.Router()

  router.get(
    "/opco",
    tryCatch(async (req, res) => {
      const userQuery = JSON.parse(req.query.userQuery)
      const formulaireQuery = JSON.parse(req.query.formulaireQuery)

      const [users, formulaires] = await Promise.all([UserRecruteur.find(userQuery).lean(), Formulaire.find(formulaireQuery).lean()])

      const results = users.reduce((acc, user) => {
        acc.push({ ...user, offres: 0 })

        const form = formulaires.find((x) => x.id_form === user.id_form)

        if (form) {
          const found = acc.findIndex((x) => x.id_form === form.id_form)

          if (found !== -1) {
            acc[found].offres = form.offres.length ?? 0
            acc[found].origine = form.origine
            acc[found].offres_detail = form.offres ?? []
          }
        }

        return acc
      }, [])

      return res.json(results)
    })
  )

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const query = JSON.parse(req.query.users)

      const users = await UserRecruteur.find(query).lean()

      return res.json(users)

      /**
       * KBA 13/10/2022 : To reuse when frontend can deal with pagination
       * Quick fix made above for now
       */
      // let qs = req.query;
      // const query = qs && qs.query ? JSON.parse(qs.query) : {};
      // const options = qs && qs.options ? JSON.parse(qs.options) : {};
      // const page = qs && qs.page ? qs.page : 1;
      // const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 100;

      // const result = await usersRecruteur.getUsers(query, options, { page, limit });
      // return res.json(result);
    })
  )

  router.get(
    "/:userId",
    tryCatch(async (req, res) => {
      const users = await UserRecruteur.findOne({ _id: req.params.userId }).select("-password")
      return res.json(users)
    })
  )

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const user = await usersRecruteur.createUser(req.body)
      return res.json(user)
    })
  )

  router.put(
    "/:userId",
    tryCatch(async (req, res) => {
      const userPayload = req.body
      const { userId } = req.params

      const exist = await UserRecruteur.findOne({ email: userPayload.email, _id: { $ne: userId } }).lean()

      if (exist) {
        return res.status(400).json({ error: true, reason: "EMAIL_TAKEN" })
      }

      const user = await usersRecruteur.updateUser(userId, userPayload)
      return res.json(user)
    })
  )

  router.put(
    "/:userId/history",
    tryCatch(async (req, res) => {
      const history = req.body
      const user = await usersRecruteur.updateUserValidationHistory(req.params.userId, history)

      // if user is disable, return the user data directly
      if (history.statut === etat_utilisateur.DESACTIVE) {
        return res.json(user)
      }

      if (user.type === ENTREPRISE) {
        /**
         * if entreprise type of user is validated :
         * - activate offer
         * - update expiration date to one month later
         * - send email to delegation if available
         */
        const userFormulaire = await formulaire.getFormulaire({ id_form: user.id_form })
        const offre = Object.assign(userFormulaire.offres[0], { statut: "Active", date_expiration: dayjs().add(1, "month").format("YYYY-MM-DD") })
        await formulaire.updateOffre(offre._id, offre)

        if (offre?.delegations && offre?.delegations.length) {
          await Promise.all(
            offre.delegations.map(
              async (delegation) =>
                await mailer.sendEmail({
                  to: delegation.email,
                  subject: `Une entreprise recrute dans votre domaine`,
                  template: mailTemplate["mail-cfa-delegation"],
                  data: {
                    enterpriseName: userFormulaire.raison_sociale,
                    jobName: offre.rome_appellation_label,
                    contractType: offre.type.join(", "),
                    trainingLevel: offre.niveau,
                    startDate: dayjs(offre.date_debut_apprentissage).format("DD/MM/YYYY"),
                    duration: offre.duree_contrat,
                    rhythm: offre.rythme_alternance,
                    offerButton: `${config.publicUrlEspacePro}/proposition/formulaire/${userFormulaire.id_form}/offre/${offre._id}/siret/${delegation.siret}`,
                    createAccountButton: `${config.publicUrlEspacePro}/creation/cfa`,
                  },
                })
            )
          )
        }
      }

      // validate user email addresse
      await usersRecruteur.updateUser(user._id, { email_valide: true })

      // get magiclink url
      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(user.email)}`

      // send welcome email to user
      await mailer.sendEmail({
        to: user.email,
        subject: "Bienvenue sur La bonne alternance",
        template: mailTemplate["mail-bienvenue"],
        data: {
          nom: user.nom,
          prenom: user.prenom,
          raison_sociale: user.raison_sociale,
          email: user.email,
          mandataire: user.type === CFA,
          url: magiclink,
        },
      })

      return res.json(user)
    })
  )

  router.delete(
    "/",
    tryCatch(async (req, res) => {
      const { userId, formId } = req.query

      await usersRecruteur.removeUser(userId)

      if (formId) {
        await formulaire.deleteFormulaire(formId)
      }

      return res.sendStatus(200)
    })
  )

  return router
}
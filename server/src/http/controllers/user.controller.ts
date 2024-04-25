import Boom from "boom"
import { CFA, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IJob, IRecruiter, getUserStatus, zRoutes } from "shared/index"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { stopSession } from "@/common/utils/session.service"
import { getUserFromRequest } from "@/security/authenticationService"
import { modifyPermissionToUser, roleToUserType } from "@/services/roleManagement.service"
import { validateUser2Email } from "@/services/user2.service"

import { Cfa, Entreprise, RoleManagement, User2 } from "../../common/model/index"
import { getStaticFilePath } from "../../common/utils/getStaticFilePath"
import config from "../../config"
import { ENTREPRISE, RECRUITER_STATUS } from "../../services/constant.service"
import {
  activateEntrepriseRecruiterForTheFirstTime,
  deleteFormulaire,
  getFormulaireFromUserId,
  getFormulaireFromUserIdOrError,
  reactivateRecruiter,
} from "../../services/formulaire.service"
import mailer, { sanitizeForEmail } from "../../services/mailer.service"
import { getUserAndRecruitersDataForOpcoUser, getUserNamesFromIds as getUsersFromIds } from "../../services/user.service"
import {
  createAdminUser,
  getAdminUsers,
  getUserRecruteurById,
  getUsersForAdmin,
  removeUser,
  sendWelcomeEmailToUserRecruteur,
  updateUser2Fields,
  userAndRoleAndOrganizationToUserRecruteur,
} from "../../services/userRecruteur.service"
import { Server } from "../server"

export default (server: Server) => {
  server.get(
    "/user/opco",
    {
      schema: zRoutes.get["/user/opco"],
      onRequest: [server.auth(zRoutes.get["/user/opco"])],
    },
    async (req, res) => {
      const { opco } = req.query
      return res.status(200).send(await getUserAndRecruitersDataForOpcoUser(opco))
    }
  )

  server.get(
    "/user",
    {
      schema: zRoutes.get["/user"],
      onRequest: [server.auth(zRoutes.get["/user"])],
    },
    async (req, res) => {
      const groupedUsers = await getUsersForAdmin()
      return res.status(200).send(groupedUsers)
    }
  )
  server.get(
    "/admin/users",
    {
      schema: zRoutes.get["/admin/users"],
      onRequest: [server.auth(zRoutes.get["/admin/users"])],
    },
    async (req, res) => {
      const users = await getAdminUsers()
      return res.status(200).send({ users })
    }
  )

  server.get(
    "/admin/users/:userId",
    {
      schema: zRoutes.get["/admin/users/:userId"],
      onRequest: [server.auth(zRoutes.get["/admin/users/:userId"])],
    },
    async (req, res) => {
      const { userId } = req.params
      const user = await User2.findById(userId).lean()
      if (!user) throw Boom.notFound(`user with id=${userId} not found`)
      const role = await RoleManagement.findOne({ user_id: userId, authorized_type: AccessEntityType.ADMIN }).lean()
      return res.status(200).send({ ...user, role: role ?? undefined })
    }
  )

  server.post(
    "/admin/users",
    {
      schema: zRoutes.post["/admin/users"],
      onRequest: [server.auth(zRoutes.post["/admin/users"])],
    },
    async (req, res) => {
      const { origin, ...userFields } = req.body
      const user = await createAdminUser(userFields, "création par l'interface admin", origin ?? "")
      return res.status(200).send({ _id: user._id })
    }
  )

  server.put(
    "/admin/users/:userId/organization/:siret",
    {
      schema: zRoutes.put["/admin/users/:userId/organization/:siret"],
      onRequest: [server.auth(zRoutes.put["/admin/users/:userId/organization/:siret"])],
    },
    async (req, res) => {
      const { userId, siret } = req.params
      const { opco, ...userFields } = req.body
      const result = await updateUser2Fields(userId, userFields)
      if ("error" in result) {
        return res.status(400).send({ error: true, reason: "EMAIL_TAKEN" })
      }
      if (opco) {
        const entreprise = await Entreprise.findOneAndUpdate({ siret }, { opco }).lean()
        if (!entreprise) {
          throw Boom.badRequest(`pas d'entreprise ayant le siret ${siret}`)
        }
      }
      return res.status(200).send({ ok: true })
    }
  )

  server.delete(
    "/admin/users/:userId",
    {
      schema: zRoutes.delete["/admin/users/:userId"],
      onRequest: [server.auth(zRoutes.delete["/admin/users/:userId"])],
    },
    async (req, res) => {
      const { recruiterId } = req.query

      await removeUser(req.params.userId)

      if (recruiterId) {
        // Seulement dans le cas d'une entreprise (non utilisé en front pour l'instant)
        await deleteFormulaire(recruiterId)
      }

      return res.status(200).send({ ok: true })
    }
  )

  server.get(
    "/user/:userId/organization/:organizationId",
    {
      schema: zRoutes.get["/user/:userId/organization/:organizationId"],
      onRequest: [server.auth(zRoutes.get["/user/:userId/organization/:organizationId"])],
    },
    async (req, res) => {
      const requestUser = getUserFromRequest(req, zRoutes.get["/user/:userId/organization/:organizationId"]).value
      if (!requestUser) throw Boom.badRequest()
      const { userId } = req.params
      const role = await RoleManagement.findOne({
        user_id: userId,
        // TODO à activer lorsque le frontend passe organizationId correctement
        // authorized_id: organizationId,
      }).lean()
      if (!role) {
        throw Boom.badRequest("role not found")
      }
      const user = await User2.findOne({ _id: userId }).lean()
      if (!user) {
        throw Boom.badRequest("user not found")
      }
      const type = roleToUserType(role)
      if (!type) {
        throw Boom.internal("user type not found")
      }
      let organization: ICFA | IEntreprise | null = null
      if (type === CFA || type === ENTREPRISE) {
        organization = await (type === CFA ? Cfa : Entreprise).findOne({ _id: role.authorized_id }).lean()
        if (!organization) {
          throw Boom.internal(`inattendu : impossible de trouver l'organization avec id=${role.authorized_id}`)
        }
      }

      let jobs: IJob[] = []
      let formulaire: IRecruiter | null = null

      if (type === ENTREPRISE) {
        formulaire = await getFormulaireFromUserId(userId)
        jobs = formulaire?.jobs ?? []
      }

      const userRecruteur = userAndRoleAndOrganizationToUserRecruteur(user, role, organization, formulaire)

      const opcoOrAdminRole = await RoleManagement.findOne({
        user_id: requestUser._id,
        authorized_type: { $in: [AccessEntityType.ADMIN, AccessEntityType.OPCO] },
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, AccessStatus.GRANTED] },
      }).lean()
      if (opcoOrAdminRole && getLastStatusEvent(opcoOrAdminRole.status)?.status === AccessStatus.GRANTED) {
        const userIds = userRecruteur.status.flatMap(({ user }) => (user ? [user] : []))
        const users = await getUsersFromIds(userIds)
        userRecruteur.status.forEach((event) => {
          const user = users.find((user) => user._id.toString() === event.user)
          if (!user) return
          event.user = `${user.first_name} ${user.last_name}`
        })
      }
      return res.status(200).send({ ...userRecruteur, jobs })
    }
  )

  server.get(
    "/user/status/:userId",
    {
      schema: zRoutes.get["/user/status/:userId"],
      onRequest: [server.auth(zRoutes.get["/user/status/:userId"])],
    },
    async (req, res) => {
      const user = await getUserRecruteurById(req.params.userId)

      if (!user) throw Boom.notFound("User not found")
      const status_current = getUserStatus(user.status)
      if (!status_current) throw Boom.internal("User doesn't have status")

      return res.status(200).send({ status_current })
    }
  )

  server.get(
    "/user/status/:userId/by-token",
    {
      schema: zRoutes.get["/user/status/:userId/by-token"],
      onRequest: [server.auth(zRoutes.get["/user/status/:userId/by-token"])],
    },
    async (req, res) => {
      const user = await getUserRecruteurById(req.params.userId)

      if (!user) throw Boom.notFound("User not found")
      const status_current = getUserStatus(user.status)
      if (!status_current) throw Boom.internal("User doesn't have status")

      return res.status(200).send({ status_current })
    }
  )

  server.put(
    "/user/:userId",
    {
      schema: zRoutes.put["/user/:userId"],
      onRequest: [server.auth(zRoutes.put["/user/:userId"])],
    },
    async (req, res) => {
      const { userId } = req.params
      const result = await updateUser2Fields(userId, req.body)
      if ("error" in result) {
        return res.status(400).send({ error: true, reason: "EMAIL_TAKEN" })
      }
      const user = await getUserRecruteurById(userId)
      return res.status(200).send(user)
    }
  )

  server.put(
    "/user/:userId/organization/:organizationId/permission",
    {
      schema: zRoutes.put["/user/:userId/organization/:organizationId/permission"],
      onRequest: [server.auth(zRoutes.put["/user/:userId/organization/:organizationId/permission"])],
    },
    async (req, res) => {
      const { reason, status, organizationType } = req.body
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, organizationId } = req.params
      const requestUser = getUserFromRequest(req, zRoutes.put["/user/:userId/organization/:organizationId/permission"]).value
      if (!requestUser) throw Boom.badRequest()
      const user = await User2.findOne({ _id: userId }).lean()
      if (!user) throw Boom.badRequest()

      const mainRole = await RoleManagement.findOne({ user_id: userId }).lean()
      if (!mainRole) {
        throw Boom.internal(`inattendu : aucun role trouvé pour user id=${userId}`)
      }
      const updatedRole = await modifyPermissionToUser(
        {
          user_id: userId,
          authorized_id: mainRole.authorized_id,
          // WARNING : ce code est temporaire tant qu'on sait qu'un user n'a qu'au plus 1 role
          // authorized_id: organizationId.toString(),
          authorized_type: mainRole.authorized_type,
          // authorized_type: organizationType,
          origin: "action admin ou opco",
        },
        {
          validation_type: VALIDATION_UTILISATEUR.MANUAL,
          reason,
          status,
          granted_by: requestUser._id.toString(),
        }
      )

      const { email, last_name, first_name } = user

      const newEvent = getLastStatusEvent(updatedRole.status)
      if (!newEvent) {
        throw Boom.internal("inattendu : aucun event sauvegardé")
      }
      // if user is disabled, return the user data directly
      if (newEvent.status === AccessStatus.DENIED) {
        // send email to user to notify him his account has been disabled
        await mailer.sendEmail({
          to: email,
          subject: "Votre compte a été désactivé sur La bonne alternance",
          template: getStaticFilePath("./templates/mail-compte-desactive.mjml.ejs"),
          data: {
            images: {
              accountDisabled: `${config.publicUrl}/images/image-compte-desactive.png?raw=true`,
              logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            },
            last_name: sanitizeForEmail(last_name),
            first_name: sanitizeForEmail(first_name),
            reason: sanitizeForEmail(newEvent.reason),
            emailSupport: "mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=Compte%20pro%20non%20validé",
          },
        })
        return res.status(200).send({})
      }

      /**
       * 20230831 kevin todo: share reason between front and back with shared folder
       */
      // if user isn't part of the OPCO, just send the user straight back
      if (newEvent.reason === "Ne relève pas des champs de compétences de mon OPCO") {
        return res.status(200).send({})
      }

      if (organizationType === AccessEntityType.ENTREPRISE) {
        /**
         * if entreprise type of user is validated :
         * - activate offer
         * - update expiration date to one month later
         * - send email to delegation if available
         */
        const userFormulaire = await getFormulaireFromUserIdOrError(user._id.toString())
        if (userFormulaire.status === RECRUITER_STATUS.ARCHIVE) {
          // le recruiter étant archivé on se contente de le rendre de nouveau Actif
          await reactivateRecruiter(userFormulaire._id)
        } else if (userFormulaire.status === RECRUITER_STATUS.ACTIF) {
          // le compte se trouve validé, on procède à l'activation de la première offre et à la notification aux CFAs
          if (userFormulaire?.jobs?.length) {
            await activateEntrepriseRecruiterForTheFirstTime(userFormulaire)
          }
        }
      }

      // validate user email addresse
      await validateUser2Email(user._id.toString())
      await sendWelcomeEmailToUserRecruteur(user)
      return res.status(200).send({})
    }
  )

  server.delete(
    "/user",
    {
      schema: zRoutes.delete["/user"],
      onRequest: [server.auth(zRoutes.delete["/user"])],
    },
    async (req, res) => {
      const { userId, recruiterId } = req.query

      await removeUser(userId)

      if (recruiterId) {
        await deleteFormulaire(recruiterId)
      }
      await stopSession(req, res)
      return res.status(200).send({})
    }
  )
}

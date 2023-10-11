import jwt from "jsonwebtoken"
import { zRoutes } from "shared/index"

import { Optout } from "../../common/model/index"
import config from "../../config"
import { ServerBuilder } from "../utils/serverBuilder"

export default (server: ServerBuilder) => {
  server.get(
    {
      schema: zRoutes.get["/optout/validate"],
    },
    async (req, res) => {
      const token = req.headers && req.headers.authorization && req.headers.authorization.split(" ")[1]

      if (!token) {
        return res.status(401).send({ error: true, reason: "TOKEN_NOT_FOUND" })
      }

      const { siret, email }: any = jwt.verify(token, config.auth["activation"].jwtSecret)

      const user = await Optout.findOne({ siret, "contacts.email": email }).lean()

      if (!user) {
        return res.status(400).send({ error: true, reason: "USER_NOT_FOUND" })
      }
      return res.status(200).send({
        ...user,
        // Set recipient email for the UI
        email,
      })
    }
  )
}

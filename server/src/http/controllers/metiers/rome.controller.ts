// @ts-nocheck
import querystring from "querystring"

import axios from "axios"
import express from "express"

import config from "../../../config"
import dayjs from "../../../services/dayjs.service"
import { getRomesAndLabelsFromTitleQuery } from "../../../services/metiers.service"
import { tryCatch } from "../../middlewares/tryCatchMiddleware"

/**
 * API romes
 */

const isTokenValid = (token) => token.expire?.isAfter(dayjs())

const getToken = async (token = {}) => {
  const isValid = isTokenValid(token)

  if (isValid) {
    return token
  }

  try {
    const response = await axios.post(
      "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=partenaire",
      querystring.stringify({
        grant_type: "client_credentials",
        client_id: config.poleEmploi.clientId,
        client_secret: config.poleEmploi.clientSecret,
        scope: `api_romev1 application_${config.poleEmploi.clientId} nomenclatureRome`,
      }),
      {
        headers: {
          Authorization: `Bearer ${config.poleEmploi.clientSecret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )

    return {
      ...response.data,
      expire: dayjs().add(response.data.expires_in - 10, "s"),
    }
  } catch (error) {
    console.error(error)
    return error.response.data
  }
}

export default function () {
  const router = express.Router()
  let token = {}

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await getRomesAndLabelsFromTitleQuery(req.query)
      return res.json(result)
    })
  )

  router.get(
    "/detail/:rome",
    tryCatch(async (req, res) => {
      token = await getToken(token)

      const response = await axios.get(`https://api.pole-emploi.io/partenaire/rome/v1/metier/${req.params.rome}`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      })

      return res.json(response.data)
    })
  )

  return router
}

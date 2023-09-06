import express from "express"
import Joi from "joi"

import { getTrainingLinks } from "../../services/trainingLinks.service"
import { tryCatch } from "../middlewares/tryCatchMiddleware"

export default () => {
  const router = express.Router()

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const params = req.body

      await Joi.array()
        .items(
          Joi.object({
            id: Joi.string().required(),
            cle_ministere_educatif: Joi.string().allow(""),
            mef: Joi.string().allow(""),
            cfd: Joi.string().allow(""),
            rncp: Joi.string().allow(""),
            code_postal: Joi.string().allow(""),
            uai: Joi.string().allow(""),
          })
        )
        .max(100)
        .messages({
          "array.base": "body must be an Array",
          "array.max": "maximum 100 trainings",
        })
        .validateAsync(params)

      const results = await getTrainingLinks(params)

      return res.json(results)
    })
  )

  return router
}

import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { referrers } from "../../common/model/constants/referrers.js"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service.js"

/**
 * @description Partners router.
 */
export default () => {
  const router = express.Router()

  /**
   * @description Returns all available parcoursup ids.
   */
  router.get(
    "/parcoursup/formations",
    tryCatch(async (req, res) => {
      const ids = await eligibleTrainingsForAppointmentService.find(
        {
          id_parcoursup: {
            $ne: null,
          },
          referrers: { $in: [referrers.PARCOURSUP.name] },
        },
        { id_parcoursup: 1 }
      )

      return res.send({ ids: ids.map((widgetParameter) => widgetParameter.id_parcoursup) })
    })
  )

  return router
}

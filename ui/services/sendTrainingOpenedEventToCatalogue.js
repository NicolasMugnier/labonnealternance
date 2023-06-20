import axios from "axios"
import { env } from "../config/config"

export default async function sendTrainingOpenedEventToCatalogue(cleMinistereEducatif) {
  if (!cleMinistereEducatif) return
  const catalogueApi = `https://catalogue-${env === "production" ? "apprentissage" : "recette"}.intercariforef.org/api/stats`
  try {
    if (env !== "local") {
      axios.post(catalogueApi, {
        source: `LBA${env !== "production" ? "-recette" : ""}`,
        cle_ministere_educatif: cleMinistereEducatif,
      })
    }
  } catch (err) {}

  return
}

// @ts-nocheck
import createMailer from "../mailer.js"
import { connectToMongo } from "../mongodb.js"
import createEtablissements from "./etablissement.js"
import createEtablissementRecruteur from "./etablissementRecruteur.js"

export default async function (options = {}) {
  const etablissements = await createEtablissements()
  const etablissementsRecruteur = await createEtablissementRecruteur()

  return {
    db: options.db || (await connectToMongo()).db,
    mailer: options.mailer || createMailer(),
    etablissements,
    etablissementsRecruteur,
  }
}

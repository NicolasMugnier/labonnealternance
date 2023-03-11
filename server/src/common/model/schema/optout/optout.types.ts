import { Types } from "mongoose"

interface IMail {
  email: string
  messageId: string
  date: Date
}

interface IOptout {
  etat: string
  uai: string[]
  rue: string
  code_postal: string
  commune: string
  siret: string
  contacts: object[]
  qualiopi: boolean
  raison_sociale: string
  adresse: string
  geo_coordonnees: string
  mail: IMail[]
  user_id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export { IOptout }
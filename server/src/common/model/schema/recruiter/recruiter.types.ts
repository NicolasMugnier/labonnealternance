import { IAdresse, IAdresseCFA } from "../_shared/shared.types.js"
import { IJobs } from "../jobs/jobs.types.js"
import { Types } from "mongoose"

interface IRecruiter {
  _id: Types.ObjectId
  establishment_id: string
  establishment_raison_sociale: string
  establishment_enseigne: string
  establishment_siret: string
  establishment_size: string
  establishment_creation_date: Date
  address_detail: IAdresse | (IAdresseCFA & IAdresse)
  address: string
  geo_coordinates: string
  is_delegated: boolean
  cfa_delegated_siret: string
  last_name: string
  first_name: string
  phone: string
  email: string
  jobs: IJobs[]
  origin: string
  opco: string
  idcc: string
  status: string
  naf_code: string
  naf_label: string
  createdAt: Date
  updatedAt: Date
}

export { IRecruiter }

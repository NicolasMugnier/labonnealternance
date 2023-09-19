import { IApiError } from "../common/utils/errorManager.js"
import { ILbaItem } from "./lbaitem.shared.service.types.js"

export type TJobSearchQuery = {
  romes?: string
  romeDomain?: string
  rncp?: string
  referer?: string
  caller?: string
  latitude?: string
  longitude?: string
  radius?: string
  insee?: string
  sources?: string
  diploma?: string
  opco?: string
  opcoUrl?: string
  useMock?: string
}

export type TFormationSearchQuery = TJobSearchQuery & { region?: string; departement?: string }

export type TLbaItemResult =
  | IApiError
  | {
      results: ILbaItem[]
    }
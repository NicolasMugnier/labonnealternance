// @ts-nocheck
import axios from "axios"
import querystring from "node:querystring"
import { compose } from "oleoduc"
import { logger } from "../common/logger.js"
import { FormationCatalogue } from "../common/model/index.js"
import { fetchStream } from "../common/utils/httpUtils.js"
import { streamJsonArray } from "../common/utils/streamUtils.js"
import config from "../config.js"

const neededFieldsFromCatalogue = {
  _id: 1,
  published: 1,
  catalogue_published: 1,
  intitule_long: 1,
  intitule_court: 1,
  niveau: 1,
  onisep_url: 1,
  parcoursup_id: 1,
  cle_ministere_educatif: 1,
  diplome: 1,
  cfd: 1,
  rncp_code: 1,
  rncp_intitule: 1,
  rncp_eligible_apprentissage: 1,
  capacite: 1,
  created_at: 1,
  last_update_at: 1,
  id_formation: 1,
  id_rco_formation: 1,
  email: 1,
  lieu_formation_adresse: 1,
  code_postal: 1,
  localite: 1,
  etablissement_formateur_nom_departement: 1,
  etablissement_formateur_courriel: 1,
  etablissement_formateur_adresse: 1,
  etablissement_formateur_complement_adresse: 1,
  etablissement_formateur_localite: 1,
  etablissement_formateur_code_postal: 1,
  etablissement_formateur_cedex: 1,
  etablissement_formateur_siret: 1,
  etablissement_formateur_id: 1,
  etablissement_formateur_uai: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  lieu_formation_geo_coordonnees: 1,
  num_departement: 1,
  region: 1,
  code_commune_insee: 1,
  rome_codes: 1,
  tags: 1,
  etablissement_gestionnaire_courriel: 1,
  etablissement_gestionnaire_adresse: 1,
  etablissement_gestionnaire_complement_adresse: 1,
  etablissement_gestionnaire_localite: 1,
  etablissement_gestionnaire_code_postal: 1,
  etablissement_gestionnaire_cedex: 1,
  etablissement_gestionnaire_entreprise_raison_sociale: 1,
  etablissement_gestionnaire_id: 1,
  etablissement_gestionnaire_uai: 1,
  etablissement_gestionnaire_siret: 1,
  etablissement_gestionnaire_type: 1,
  etablissement_gestionnaire_conventionne: 1,
}

/**
 * @description Get formations by its identifier.
 * @param {String} id
 * @returns {Promise<Object[]>}
 */
export const getFormationsById = ({ id }: { id: string }): Promise<object[]> => FormationCatalogue.find({ _id: id })

/**
 * @description Get formations by "siret formateur".
 * @param {String} siretFormateur
 * @returns {Promise<Object[]>}
 */
export const getFormationsBySiretFormateur = ({ siretFormateur }: { siretFormateur: string[] }): Promise<object[]> =>
  FormationCatalogue.find({ etablissement_formateur_siret: siretFormateur })

/**
 * @description Get formations by idRcoFormations.
 * @param {String[]} idRcoFormations
 * @returns {Promise<Object[]>}
 */
export const getFormationsByIdRcoFormations = ({ idRcoFormations }: { idRcoFormations: string[] }): Promise<object[]> =>
  FormationCatalogue.find({ id_rco_formation: idRcoFormations })

/**
 * @description Get formations through the catalogue.
 * @param {Object} query - Mongo query
 * @returns {Promise<Object>}
 */
export const getFormations = (query: object): Promise<object[]> => FormationCatalogue.find(query)

/**
 * @description Get formations count through the CARIF OREF catalogue API.
 * @returns {string}
 */
export const countFormations = async () => {
  try {
    const response = await axios.get(`${config.catalogueUrl}${config.formationsEndPoint}/count`)
    return response.data
  } catch (error) {
    logger.error(error)
    return false
  }
}

/**
 * @description Get all formations through the CARIF OREF catalogue API.
 * @returns {Stream<Object[]>}
 */
export const getAllFormationsFromCatalogue = async () => {
  const count = (await countFormations()) ?? null
  const query = { published: true, catalogue_published: true }

  if (!count) return

  logger.info(`${count} formation(s) à importer`)

  const streamFormations = async (query, options) => {
    const params = convertQueryIntoParams(query, options)
    const response = await fetchStream(`${config.catalogueUrl}${config.formationsEndPoint}.json?${params}`)

    return compose(response, streamJsonArray())
  }

  return streamFormations(query, {
    limit: count,
    select: neededFieldsFromCatalogue,
  })
}

/**
 * @description Convert query into URL params
 * @param {Object} query - Mongo query
 * @returns {String}
 */
const convertQueryIntoParams = (query: object, options: object = {}): string => {
  return querystring.stringify(
    {
      query: JSON.stringify(query),
      ...Object.keys(options).reduce((acc, key) => {
        return {
          ...acc,
          [key]: JSON.stringify(options[key]),
        }
      }, {}),
    },
    { encode: false }
  )
}

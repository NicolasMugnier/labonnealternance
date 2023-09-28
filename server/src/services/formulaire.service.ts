import Boom from "boom"
import { pick } from "lodash-es"
import moment from "moment"
import { Filter, ObjectId } from "mongodb"
import { ModelUpdateOptions, UpdateQuery } from "mongoose"
import { IDelegation, IJob, IRecruiter, IUserRecruteur } from "shared"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { getElasticInstance } from "../common/esClient/index"
import { Recruiter, UnsubscribeOF } from "../common/model/index"
import { asyncForEach } from "../common/utils/asyncUtils"
import config from "../config"

import { getCatalogueEtablissements, getCatalogueFormations } from "./catalogue.service"
import { ACTIVE, ETAT_UTILISATEUR, JOB_STATUS, RECRUITER_STATUS } from "./constant.service"
import dayjs from "./dayjs.service"
import { getEtablissement, sendEmailConfirmationEntreprise } from "./etablissement.service"
import { ILbaJobEsResult } from "./lbajob.service.types"
import mailer from "./mailer.service"
import { getUser, getUserStatus } from "./userRecruteur.service"

const esClient = getElasticInstance()

const JOB_SEARCH_LIMIT = 250

interface IFormulaireExtended extends IRecruiter {
  entreprise_localite?: string
}

export interface IOffreExtended extends IJob {
  candidatures: number
  pourvue: string
  supprimer: string
}

/**
 * @description get filtered jobs from elastic search index
 * @param {Object} payload
 * @param {number} payload.distance
 * @param {string} payload.lat
 * @param {string} payload.long
 * @param {string[]} payload.romes
 * @param {string} payload.niveau
 * @returns {Promise<ILbaJobEsResult[]>}
 */
export const getJobsFromElasticSearch = async ({
  distance,
  lat,
  lon,
  romes,
  niveau,
}: {
  distance: number
  lat: string
  lon: string
  romes: string[]
  niveau: string
}): Promise<ILbaJobEsResult[]> => {
  const filter: Array<object> = [
    {
      geo_distance: {
        distance: `${distance}km`,
        geo_coordinates: {
          lat,
          lon,
        },
      },
    },
  ]

  if (niveau && niveau !== "Indifférent") {
    filter.push({
      nested: {
        path: "jobs",
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  "jobs.job_level_label": niveau,
                },
              },
            ],
          },
        },
      },
    })
  }

  const body = {
    query: {
      bool: {
        must: [
          {
            nested: {
              path: "jobs",
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        "jobs.rome_code": romes.join(" "),
                      },
                    },
                    {
                      match: {
                        "jobs.job_status": ACTIVE,
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            match: {
              status: "Actif",
            },
          },
        ],
        filter: filter,
      },
    },
    sort: [
      {
        _geo_distance: {
          geo_coordinates: {
            lat,
            lon,
          },
          order: "asc",
          unit: "km",
          mode: "min",
          distance_type: "arc",
          ignore_unmapped: true,
        },
      },
    ],
  }

  const result = await esClient.search({ size: JOB_SEARCH_LIMIT, index: "recruiters", body })

  const filteredJobs = await Promise.all(
    result.body.hits.hits.map(async (x) => {
      const jobs: any[] = []

      if (x._source.jobs.length === 0) {
        return
      }

      if (x._source.is_delegated) {
        const [establishment_location] = x._source.address.match(/([0-9]{5})[ ,] ?([a-zA-Z-]*)/) ?? [""]
        const cfa = await getEtablissement({ establishment_siret: x._source.cfa_delegated_siret })

        x._source.phone = cfa?.phone
        x._source.email = cfa?.email
        x._source.last_name = cfa?.last_name
        x._source.first_name = cfa?.first_name
        x._source.establishment_raison_sociale = cfa?.establishment_raison_sociale
        x._source.address = cfa?.address
        x._source.establishment_location = establishment_location
      }

      x._source.jobs.forEach((o) => {
        if (romes.some((item) => o.rome_code.includes(item)) && o.job_status === "Active") {
          o.rome_label = o.rome_appellation_label ?? o.rome_label
          if (!niveau || niveau === "Indifférent" || niveau === o.job_level_label) {
            jobs.push(o)
          }
        }
      })

      x._source.jobs = jobs
      return x
    })
  )

  return filteredJobs
}

/**
 * @description get formulaire by offer id
 * @param {IJob["_id"]} id
 * @returns {Promise<IFormulaireExtended>}
 */
export const getOffreAvecInfoMandataire = async (id: string | ObjectId): Promise<IFormulaireExtended> => {
  const result = await getOffre(id)

  if (!result) {
    throw new Error("getOffreAvecInfoMandataire failed")
  }

  result.jobs = result.jobs.filter((x) => x._id.toString() === id.toString())

  if (result.is_delegated && result.address) {
    const [entreprise_localite] = result.address.match(/([0-9]{5})[ ,] ?([A-zÀ-ÿ]*)/) ?? [""]
    const { cfa_delegated_siret } = result
    if (cfa_delegated_siret) {
      const cfa = await getEtablissement({ establishment_siret: cfa_delegated_siret })

      if (cfa) {
        result.phone = cfa.phone
        result.email = cfa.email
        result.last_name = cfa.last_name
        result.first_name = cfa.first_name
        result.establishment_raison_sociale = cfa.establishment_raison_sociale
        result.address = cfa.address
        return { ...result, entreprise_localite }
      }
    }
  }
  return result
}

/**
 * @description Get formulaire list with mondodb paginate query
 * @param {Object} payload
 * @param {Filter<IRecruiter>} payload.query
 * @param {object} payload.options
 * @param {number} payload.page
 * @param {number} payload.limit
 */
export const getFormulaires = async (query: Filter<IRecruiter>, select: object, { page, limit }: { page?: number; limit?: number }) => {
  const response = await Recruiter.paginate({ query, ...select, page, limit, lean: true })

  return {
    pagination: {
      page: response?.page,
      result_per_page: limit,
      number_of_page: response?.totalPages,
      total: response?.totalDocs,
    },
    data: response?.docs,
  }
}

/**
 * @description Create job offer for formulaire
 * @param {Object} payload
 * @param {IOffreExtended} payload.job
 * @param {IUserRecruteur["establishment_id"]} payload.id
 * @returns {Promise<IRecruiter>}
 */
export const createJob = async ({ job, id }: { job: Partial<IOffreExtended>; id: IUserRecruteur["establishment_id"] }): Promise<IRecruiter> => {
  // get user data
  const user = await getUser({ establishment_id: id })

  if (!user) {
    throw new Error("Etablisement dos not exist")
  }

  const userStatus: ETAT_UTILISATEUR | null = user ? getUserStatus(user.status) : null
  const isUserAwaiting = userStatus !== ETAT_UTILISATEUR.VALIDE
  // get user activation state if not managed by a CFA
  if (user && isUserAwaiting) {
    // upon user creation, if user is awaiting validation, update job status to "En attente"
    job.job_status = JOB_STATUS.EN_ATTENTE
  }
  // insert job
  const updatedFormulaire = await createOffre(id, job)

  const { is_delegated, cfa_delegated_siret, jobs } = updatedFormulaire

  job._id = updatedFormulaire.jobs.filter((x) => x.rome_label === job.rome_label)[0]._id

  job.supprimer = `${config.publicUrl}/espace-pro/offre/${job._id}/cancel`
  job.pourvue = `${config.publicUrl}/espace-pro/offre/${job._id}/provided`

  // if first offer creation for an Entreprise, send specific mail
  if (jobs.length === 1 && is_delegated === false) {
    await sendEmailConfirmationEntreprise(user, updatedFormulaire)
    return updatedFormulaire
  }

  let contactCFA: IUserRecruteur | null = null
  // get CFA informations if formulaire is handled by a CFA
  if (cfa_delegated_siret && is_delegated) {
    contactCFA = await getUser({ establishment_siret: cfa_delegated_siret })
  }
  await sendMailNouvelleOffre(updatedFormulaire, job, contactCFA ?? undefined)

  return updatedFormulaire
}

/**
 * @description Create job delegations
 * @param {Object} payload
 * @param {IJob["_id"]} payload.jobId
 * @param {string[]} payload.etablissementCatalogueIds
 * @returns {Promise<IRecruiter>}
 */
export const createJobDelegations = async ({ jobId, etablissementCatalogueIds }: { jobId: string | ObjectId; etablissementCatalogueIds: string[] }): Promise<IRecruiter> => {
  const offreDocument = await getOffre(jobId)
  if (!offreDocument) {
    throw Boom.internal("Offre not found", { jobId, etablissementCatalogueIds })
  }
  const userDocument = await getUser({ establishment_id: offreDocument.establishment_id })
  if (!userDocument) {
    throw Boom.internal("User not found", { jobId, etablissementCatalogueIds })
  }
  const userState = userDocument.status.pop()

  const offre = offreDocument.jobs.find((job) => job._id.toString() === jobId.toString())

  if (!offre) {
    throw Boom.internal("Offre not found", { jobId, etablissementCatalogueIds })
  }

  const { etablissements } = await getCatalogueEtablissements({ _id: { $in: etablissementCatalogueIds } }, { _id: 1 })

  const delegations: IDelegation[] = []

  const promises = etablissements.map(async (etablissement) => {
    const formations = await getCatalogueFormations(
      {
        $or: [
          {
            etablissement_gestionnaire_id: etablissement._id,
          },
          {
            etablissement_formateur_id: etablissement._id,
          },
        ],
        etablissement_gestionnaire_courriel: { $nin: [null, ""] },
        catalogue_published: true,
      },
      { etablissement_gestionnaire_courriel: 1, etablissement_formateur_siret: 1 }
    )

    const { etablissement_formateur_siret: siret_code, etablissement_gestionnaire_courriel: email } = formations[0] ?? {}

    if (!email || !siret_code) {
      // This shouldn't happen considering the query filter
      throw Boom.internal("Unexpected etablissement_gestionnaire_courriel", { jobId, etablissementCatalogueIds })
    }

    delegations.push({ siret_code, email })

    if (userState?.status === ETAT_UTILISATEUR.VALIDE) {
      await sendDelegationMailToCFA(email, offre, offreDocument, siret_code)
    }
  })

  await Promise.all(promises)

  offre.delegations = offre.delegations?.concat(delegations) ?? delegations
  offre.job_delegation_count = offre.delegations.length

  return updateOffre(jobId, offre)
}

/**
 * @description Check if job offer exists
 * @param {IJob['_id']} id
 * @returns {Promise<IRecruiter>}
 */
export const checkOffreExists = async (id: IJob["_id"]): Promise<boolean> => {
  const offre = await getOffre(id)
  return offre ? true : false
}

/**
 * @description Find formulaire by query
 * @param {Filter<IRecruiter>} query
 * @returns {Promise<IRecruiter>}
 */
export const getFormulaire = async (query: Filter<IRecruiter>): Promise<IRecruiter> => Recruiter.findOne(query).lean()

/**
 * @description Create new formulaire
 * @param {IRecruiter} payload
 * @returns {Promise<IRecruiter>}
 */
export const createFormulaire = async (payload: Partial<Omit<IRecruiter, "_id" | "establishment_id" | "createdAt" | "updatedAt">>): Promise<IRecruiter> =>
  await Recruiter.create(payload)

/**
 * Remove formulaire by id
 */
export const deleteFormulaire = async (id: IRecruiter["_id"]): Promise<IRecruiter | null> => await Recruiter.findByIdAndDelete(id)

/**
 * @description Remove all formulaires belonging to gestionnaire
 * @param {IUserRecruteur["establishment_siret"]} establishment_siret
 * @returns {Promise<IRecruiter>}
 */
export const deleteFormulaireFromGestionnaire = async (siret: IUserRecruteur["establishment_siret"]): Promise<IRecruiter> =>
  await Recruiter.deleteMany({ cfa_delegated_siret: siret })

/**
 * @description Update existing formulaire and return updated version
 * @param {IRecruiter["establishment_id"]} id
 * @param {UpdateQuery<IRecruiter>} payload
 * @param {ModelUpdateOptions} [options={new:true}]
 * @returns {Promise<IRecruiter>}
 */
export const updateFormulaire = async (id: IRecruiter["establishment_id"], payload: UpdateQuery<IRecruiter>): Promise<IRecruiter> => {
  const recruiter = await Recruiter.findOneAndUpdate({ establishment_id: id }, payload, { new: true })
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }
  return recruiter
}

/**
 * @description Archive existing formulaire and cancel all its job offers
 * @param {IRecruiter["establishment_id"]} establishment_id
 * @returns {Promise<boolean>}
 */
export const archiveFormulaire = async (id: IRecruiter["establishment_id"]): Promise<boolean> => {
  const recruiter = await Recruiter.findOne({ establishment_id: id })
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  recruiter.status = RECRUITER_STATUS.ARCHIVE

  recruiter.jobs.map((job) => {
    job.job_status = JOB_STATUS.ANNULEE
  })

  await recruiter.save()

  return true
}

/**
 * @description Unarchive existing formulaire
 * @param {IRecruiter["establishment_id"]} establishment_id
 * @returns {Promise<boolean>}
 */
export const reactivateRecruiter = async (id: IRecruiter["establishment_id"]): Promise<boolean> => {
  const recruiter = await Recruiter.findOne({ establishment_id: id })
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }
  recruiter.status = RECRUITER_STATUS.ACTIF
  await recruiter.save()
  return true
}

/**
 * @description Archive existing delegated formulaires and cancel all its job offers
 * @param {IUserRecruteur["establishment_siret"]} establishment_siret
 * @returns {Promise<boolean>}
 */
export const archiveDelegatedFormulaire = async (siret: IUserRecruteur["establishment_siret"]): Promise<boolean> => {
  const formulaires = await Recruiter.find({ cfa_delegated_siret: siret }).lean()

  if (!formulaires.length) return false

  await asyncForEach(formulaires, async (form: IRecruiter) => {
    form.status = RECRUITER_STATUS.ARCHIVE

    form.jobs.forEach((job) => {
      job.job_status = JOB_STATUS.ANNULEE
    })

    await Recruiter.findByIdAndUpdate(form._id, form)
  })

  return true
}

/**
 * @description Get job offer by job id
 * @param {IJob["_id"]} id
 */
export async function getOffre(id: string | ObjectId) {
  return Recruiter.findOne({ "jobs._id": id }).lean()
}

/**
 * Create job offer on existing formulaire
 */
export async function createOffre(id: IRecruiter["establishment_id"], payload: UpdateQuery<IJob>): Promise<IRecruiter> {
  const recruiter = await Recruiter.findOneAndUpdate({ establishment_id: id }, { $push: { jobs: payload } }, { new: true })

  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  return recruiter
}

/**
 * @description Update existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export async function updateOffre(id: string | ObjectId, payload: UpdateQuery<IJob>): Promise<IRecruiter> {
  const recruiter = await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$": payload,
      },
    },
    { new: true }
  )
  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  return recruiter
}

/**
 * @description Increment field in existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export const incrementLbaJobViewCount = async (id: IJob["_id"] | string, payload: object, options: ModelUpdateOptions = { new: true }): Promise<IRecruiter> => {
  const incPayload = Object.fromEntries(Object.entries(payload).map(([key, value]) => [`jobs.$.${key}`, value]))
  const recruiter = await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $inc: incPayload,
    },
    options
  )

  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  return recruiter
}

/**
 * @description Update specific field(s) in an existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export const patchOffre = async (id: IJob["_id"], payload: UpdateQuery<IJob>, options: ModelUpdateOptions = { new: true }): Promise<IRecruiter> => {
  const fields = {}
  for (const key in payload) {
    fields[`jobs.$.${key}`] = payload[key]
  }

  const recruiter = await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: fields,
    },
    options
  )

  if (!recruiter) {
    throw Boom.internal("Recruiter not found")
  }

  return recruiter
}

/**
 * @description Change job status to provided
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const provideOffre = async (id: IJob["_id"]): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_status": JOB_STATUS.POURVUE,
      },
    }
  )
  return true
}

/**
 * @description Cancel job
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const cancelOffre = async (id: IJob["_id"]): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_status": JOB_STATUS.ANNULEE,
      },
    }
  )
  return true
}

/**
 * @description Extends job duration by 1 month.
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const extendOffre = async (id: IJob["_id"]): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_expiration_date": moment().add(1, "months").format("YYYY-MM-DD"),
        "jobs.$.job_last_prolongation_date": Date.now(),
      },
      $inc: { "jobs.$.job_prolongation_count": 1 },
    }
  )
  return true
}

/**
 * @description Get job offer by its id.
 */
export const getJob = async (id: string | ObjectId): Promise<IJob | null> => {
  const offre = await getOffre(id)
  if (!offre) return null
  return offre.jobs.find((job) => job._id.toString() === id.toString()) ?? null
}

/**
 * @description Sends the mail informing the CFA that a company wants the CFA to handle the offer.
 */
export async function sendDelegationMailToCFA(email: string, offre: IJob, recruiter: IRecruiter, siret_code: string) {
  const unsubscribeOF = await UnsubscribeOF.findOne({ establishment_siret: siret_code })
  if (unsubscribeOF) return
  await mailer.sendEmail({
    to: email,
    subject: `Une entreprise recrute dans votre domaine`,
    template: getStaticFilePath("./templates/mail-cfa-delegation.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      enterpriseName: recruiter.establishment_raison_sociale,
      jobName: offre.rome_appellation_label,
      contractType: (offre.job_type ?? []).join(", "),
      trainingLevel: offre.job_level_label,
      startDate: dayjs(offre.job_start_date).format("DD/MM/YYYY"),
      duration: offre.job_duration,
      rhythm: offre.job_rythm,
      offerButton: `${config.publicUrl}/espace-pro/proposition/formulaire/${recruiter.establishment_id}/offre/${offre._id}/siret/${siret_code}`,
      createAccountButton: `${config.publicUrl}/espace-pro/creation/cfa`,
      unsubscribeUrl: `${config.publicUrl}/espace-pro/proposition/formulaire/${recruiter.establishment_id}/offre/${offre._id}/siret/${siret_code}/unsubscribe`,
    },
  })
}

export async function sendMailNouvelleOffre(recruiter: IRecruiter, job: Partial<IOffreExtended>, contactCFA?: IUserRecruteur) {
  const isRecruteurAwaiting = recruiter.status === RECRUITER_STATUS.EN_ATTENTE_VALIDATION
  if (isRecruteurAwaiting) {
    return
  }
  const { is_delegated, email, last_name, first_name, establishment_raison_sociale, establishment_siret } = recruiter

  const establishmentTitle = establishment_raison_sociale ?? establishment_siret
  // Send mail with action links to manage offers
  await mailer.sendEmail({
    to: is_delegated && contactCFA ? contactCFA.email : email,
    subject: is_delegated ? `Votre offre d'alternance pour ${establishmentTitle} est publiée` : `Votre offre d'alternance est publiée`,
    template: getStaticFilePath("./templates/mail-nouvelle-offre.mjml.ejs"),
    data: {
      images: {
        logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
      },
      nom: is_delegated ? contactCFA?.last_name : last_name,
      prenom: is_delegated ? contactCFA?.first_name : first_name,
      raison_sociale: establishmentTitle,
      mandataire: recruiter.is_delegated,
      offre: pick(job, ["rome_appellation_label", "job_start_date", "type", "job_level_label"]),
      lba_url: `${config.publicUrl}/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${job._id}`,
    },
  })
}

import { pick } from "lodash-es"
import moment from "moment"
import { mailTemplate } from "../assets/index.js"
import createUserRecruteur from "../common/components/usersRecruteur.js"
import { ANNULEE, POURVUE, etat_utilisateur } from "../common/constants.js"
import dayjs from "../common/dayjs.js"
import { getElasticInstance } from "../common/esClient/index.js"
import createMailer from "../common/mailer.js"
import { Recruiter } from "../common/model/index.js"
import { IRecruiter } from "../common/model/schema/recruiter/recruiter.types.js"
import { IJobs } from "../common/model/schema/jobs/jobs.types.js"
import { IUserRecruteur } from "../common/model/schema/userRecruteur/userRecruteur.types.js"
import { asyncForEach } from "../common/utils/asyncUtils.js"
import config from "../config.js"
import { getCatalogueEtablissements, getFormations } from "./catalogue.service.js"
import { getEtablissement, getValidationUrl } from "./etablissement.service.js"
import { ModelUpdateOptions, UpdateQuery } from "mongoose"
import { Filter } from "mongodb"

const esClient = getElasticInstance()
const usersRecruteur = await createUserRecruteur()
const mailer = await createMailer()

interface IFormulaireExtended extends IRecruiter {
  entreprise_localite: string
}

interface IOffreExtended extends IJobs {
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
 * @returns {Promise<IRecruiter[]>}
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
}): Promise<IRecruiter[]> => {
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
                        "jobs.job_status": "Active",
                      },
                    },
                  ],
                },
              },
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

  const result = await esClient.search({ index: "recruiters", body })

  const filteredJobs = await Promise.all(
    result.body.hits.hits.map(async (x) => {
      const jobs = []
      let cfa = <IUserRecruteur>{}

      if (x._source.jobs.length === 0) {
        return
      }

      if (x._source.is_delegated) {
        const [establishment_location] = x._source.address.match(/([0-9]{5})[ ,] ?([a-zA-Z-]*)/) ?? [""]
        cfa = await getEtablissement({ establishment_siret: x._source.cfa_delegated_siret })

        x._source.phone = cfa.phone
        x._source.email = cfa.email
        x._source.last_name = cfa.last_name
        x._source.first_name = cfa.first_name
        x._source.establishment_raison_sociale = cfa.establishment_raison_sociale
        x._source.address = cfa.address
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
 * @param {IJobs["_id"]} id
 * @returns {Promise<IFormulaireExtended>}
 */
export const getOffreAvecInfoMandataire = async (id: IJobs["_id"]): Promise<IFormulaireExtended> => {
  const result = await getOffre(id)

  if (!result) {
    return result
  }

  result.jobs = result.jobs.filter((x) => x._id == id)

  if (result.is_delegated) {
    const [entreprise_localite] = result.address.match(/([0-9]{5})[ ,] ?([A-zÀ-ÿ]*)/) ?? [""]
    const cfa = await getEtablissement({ siret: result.cfa_delegated_siret })

    result.phone = cfa.phone
    result.email = cfa.email
    result.last_name = cfa.last_name
    result.first_name = cfa.first_name
    result.establishment_raison_sociale = cfa.establishment_raison_sociale
    result.address = cfa.address
    result.entreprise_localite = entreprise_localite
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
 * @returns {Promise<object>}
 */
export const getFormulaires = async (query: Filter<IRecruiter>, options: object, { page, limit }: { page: number; limit: number }): Promise<object> => {
  const response = await Recruiter.paginate({ query, ...options, page, limit, lean: true })

  return {
    pagination: {
      page: response.page,
      result_per_page: limit,
      number_of_page: response.totalPages,
      total: response.totalDocs,
    },
    data: response.docs,
  }
}

/**
 * @description Create job offer for formulaire
 * @param {Object} payload
 * @param {IOffreExtended} payload.job
 * @param {IUserRecruteur["establishment_id"]} payload.id
 * @returns {Promise<IRecruiter>}
 */
export const createJob = async ({ job, id }: { job: IOffreExtended; id: IUserRecruteur["establishment_id"] }): Promise<IRecruiter> => {
  let isUserAwaiting = false
  // get user data
  const user = await usersRecruteur.getUser({ establishment_id: id })
  // get user activation state if not managed by a CFA
  if (user) {
    isUserAwaiting = usersRecruteur.getUserValidationState(user.status) === etat_utilisateur.ATTENTE
    // upon user creation, if user is awaiting validation, update job status to "En attente"
    if (isUserAwaiting) {
      job.job_status = "En attente"
    }
  }
  // insert job
  const updatedFormulaire = await createOffre(id, job)

  const { email, establishment_raison_sociale, first_name, last_name, is_delegated, cfa_delegated_siret, jobs } = updatedFormulaire

  job._id = updatedFormulaire.jobs.filter((x) => x.rome_label === job.rome_label)[0]._id

  job.supprimer = `${config.publicUrlEspacePro}/offre/${job._id}/cancel`
  job.pourvue = `${config.publicUrlEspacePro}/offre/${job._id}/provided`

  // if first offer creation for an Entreprise, send specific mail
  if (jobs.length === 1 && is_delegated === false) {
    // Get user account validation link
    const url = getValidationUrl(user._id)

    await mailer.sendEmail({
      to: email,
      subject: "La bonne alternance - Merci de valider votre adresse mail pour diffuser votre offre",
      template: mailTemplate["mail-nouvelle-offre-depot-simplifie"],
      data: {
        images: {
          logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
        },
        nom: user.last_name,
        prenom: user.first_name,
        email: user.email,
        confirmation_url: url,
        offre: pick(job, ["rome_appellation_label", "job_start_date", "type", "job_level_label"]),
        isUserAwaiting,
      },
    })

    return updatedFormulaire
  }

  // get CFA informations if formulaire is handled by a CFA
  const contactCFA = is_delegated && (await usersRecruteur.getUser({ establishment_siret: cfa_delegated_siret }))

  // Send mail with action links to manage offers
  await mailer.sendEmail({
    to: is_delegated ? contactCFA.email : email,
    subject: is_delegated
      ? `La bonne alternance - Votre offre d'alternance pour ${establishment_raison_sociale} a bien été publiée`
      : `La bonne alternance - Votre offre d'alternance a bien été publiée`,
    template: mailTemplate["mail-nouvelle-offre"],
    data: {
      images: {
        logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
      },
      nom: is_delegated ? contactCFA.last_name : last_name,
      prenom: is_delegated ? contactCFA.first_name : first_name,
      raison_sociale: establishment_raison_sociale,
      mandataire: updatedFormulaire.is_delegated,
      offre: pick(job, ["rome_appellation_label", "job_start_date", "type", "job_level_label"]),
      lba_url:
        config.env !== "recette"
          ? `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${job._id}`
          : `https://labonnealternance-recette.apprentissage.beta.gouv.fr/recherche-apprentissage?&display=list&page=fiche&type=matcha&itemId=${job._id}`,
    },
  })

  return updatedFormulaire
}

/**
 * @description Create job delegations
 * @param {Object} payload
 * @param {IJobs["_id"]} payload.jobId
 * @param {string[]} payload.etablissementCatalogueIds
 * @returns {Promise<IRecruiter>}
 */
export const createJobDelegations = async ({ jobId, etablissementCatalogueIds }: { jobId: IJobs["_id"]; etablissementCatalogueIds: string[] }): Promise<IRecruiter> => {
  const offreDocument = await getOffre(jobId)
  const userDocument = await usersRecruteur.getUser({ establishment_id: offreDocument.establishment_id })
  const userState = userDocument.status.pop()

  const offre = offreDocument.jobs.find((job) => job._id.toString() === jobId)

  const { etablissements } = await getCatalogueEtablissements({ _id: { $in: etablissementCatalogueIds } })

  const delegations = []

  const promises = etablissements.map(async (etablissement) => {
    const formations = await getFormations(
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

    const { etablissement_formateur_siret: siret_code, etablissement_gestionnaire_courriel: email } = formations[0]

    delegations.push({ siret_code, email })

    if (userState.status === etat_utilisateur.VALIDE) {
      await mailer.sendEmail({
        to: email,
        subject: `Une entreprise recrute dans votre domaine`,
        template: mailTemplate["mail-cfa-delegation"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          enterpriseName: offreDocument.establishment_raison_sociale,
          jobName: offre.rome_appellation_label,
          contractType: offre.job_type.join(", "),
          trainingLevel: offre.job_level_label,
          startDate: dayjs(offre.job_start_date).format("DD/MM/YYYY"),
          duration: offre.job_duration,
          rhythm: offre.job_rythm,
          offerButton: `${config.publicUrlEspacePro}/proposition/formulaire/${offreDocument.establishment_id}/offre/${offre._id}/siret/${siret_code}`,
          createAccountButton: `${config.publicUrlEspacePro}/creation/cfa`,
        },
      })
    }
  })

  await Promise.all(promises)

  offre.is_delegated = true
  offre.job_prolongation_count = etablissements.length
  offre.delegations = offre?.delegations.concat(delegations) || delegations

  return await updateOffre(jobId, offre)
}

/**
 * @description Check if job offer exists
 * @param {IJobs['_id']} id
 * @returns {Promise<IRecruiter>}
 */
export const checkOffreExists = async (id: IJobs["_id"]): Promise<boolean> => {
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
export const createFormulaire = async (payload: IRecruiter): Promise<IRecruiter> => await Recruiter.create(payload)

/**
 * @description Remove formulaire by id
 * @param {IRecruiter["establishment_id"]} id
 * @returns {Promise<IRecruiter>}
 */
export const deleteFormulaire = async (id: IRecruiter["_id"]): Promise<IRecruiter> => await Recruiter.findByIdAndDelete(id)

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
export const updateFormulaire = async (id: IRecruiter["establishment_id"], payload: UpdateQuery<IRecruiter>, options: ModelUpdateOptions = { new: true }): Promise<IRecruiter> =>
  await Recruiter.findOneAndUpdate({ establishment_id: id }, payload, options)

/**
 * @description Archive existing formulaire and cancel all its job offers
 * @param {IRecruiter["establishment_id"]} establishment_id
 * @returns {Promise<boolean>}
 */
export const archiveFormulaire = async (id: IRecruiter["establishment_id"]): Promise<boolean> => {
  const form = await Recruiter.findOne({ establishment_id: id })

  form.status = "Archivé"

  form.jobs.map((job) => {
    job.job_status = "Annulée"
  })

  await form.save()

  return true
}

/**
 * @description Archive existing delegated formulaires and cancel all its job offers
 * @param {IUserRecruteur["establishment_siret"]} establishment_siret
 * @returns {Promise<boolean>}
 */
export const archiveDelegatedFormulaire = async (siret: IUserRecruteur["establishment_siret"]): Promise<boolean> => {
  const formulaires = await Recruiter.find({ cfa_delegated_siret: siret }).lean()

  if (!formulaires.length) return

  await asyncForEach(formulaires, async (form: IRecruiter) => {
    form.status = "Archivé"

    form.jobs.map((job) => {
      job.job_status = "Annulée"
    })

    await Recruiter.findByIdAndUpdate(form._id, form)
  })

  return true
}

/**
 * @description Get job offer by job id
 * @param {IJobs["_id"]} id
 * @returns {Promise<IFormulaireExtended>}
 */
export const getOffre = async (id: IJobs["_id"]): Promise<IFormulaireExtended> => await Recruiter.findOne({ "jobs._id": id }).lean()

/**
 * @description Create job offer on existing formulaire
 * @param {IRecruiter["establishment_id"]} id
 * @param {UpdateQuery<IJobs>} payload
 * @param {ModelUpdateOptions} [options={new:true}]
 * @returns {Promise<IRecruiter>}
 */
export const createOffre = async (id: IRecruiter["establishment_id"], payload: UpdateQuery<IJobs>, options: ModelUpdateOptions = { new: true }): Promise<IRecruiter> =>
  await Recruiter.findOneAndUpdate({ establishment_id: id }, { $push: { jobs: payload } }, options)

/**
 * @description Update existing job offer
 * @param {IJobs["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export const updateOffre = async (id: IJobs["_id"], payload: UpdateQuery<IJobs>, options: ModelUpdateOptions = { new: true }): Promise<IRecruiter> =>
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$": payload,
      },
    },
    options
  )

/**
 * @description Change job status to provided
 * @param {IJobs["_id"]} id
 * @returns {Promise<boolean>}
 */
export const provideOffre = async (id: IJobs["_id"]): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_status": POURVUE,
      },
    }
  )
  return true
}

/**
 * @description Cancel job
 * @param {IJobs["_id"]} id
 * @returns {Promise<boolean>}
 */
export const cancelOffre = async (id: IJobs["_id"]): Promise<boolean> => {
  await Recruiter.findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_status": ANNULEE,
      },
    }
  )
  return true
}

/**
 * @description Extends job duration by 1 month.
 * @param {IJobs["_id"]} id
 * @returns {Promise<boolean>}
 */
export const extendOffre = async (id: IJobs["_id"]): Promise<boolean> => {
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

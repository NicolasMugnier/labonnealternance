interface IEtablissementFormateur {
  etablissement_formateur_id: string
  etablissement_formateur_siret: string
  etablissement_formateur_enseigne: string
  etablissement_formateur_uai: string
  etablissement_formateur_type: string
  etablissement_formateur_conventionne: string
  etablissement_formateur_declare_prefecture: string
  etablissement_formateur_datadock: string
  etablissement_formateur_adresse: string
  etablissement_formateur_code_postal: string
  etablissement_formateur_code_commune_insee: string
  etablissement_formateur_localite: string
  etablissement_formateur_complement_adresse: string
  etablissement_formateur_cedex: string
  etablissement_formateur_entreprise_raison_sociale: string
  geo_coordonnees_etablissement_formateur: string
  etablissement_formateur_region: string
  etablissement_formateur_num_departement: string
  etablissement_formateur_nom_departement: string
  etablissement_formateur_nom_academie: string
  etablissement_formateur_num_academie: string
  etablissement_formateur_siren: string
  etablissement_formateur_courriel: string
  etablissement_formateur_published: boolean
  etablissement_formateur_catalogue_published: boolean
  rncp_etablissement_formateur_habilite: boolean
  etablissement_formateur_date_creation: Date
}

interface IEtablissementGestionnaire {
  etablissement_gestionnaire_id: string
  etablissement_gestionnaire_siret: string
  etablissement_gestionnaire_enseigne: string
  etablissement_gestionnaire_uai: string
  etablissement_gestionnaire_type: string
  etablissement_gestionnaire_conventionne: string
  etablissement_gestionnaire_declare_prefecture: string
  etablissement_gestionnaire_datadock: string
  etablissement_gestionnaire_adresse: string
  etablissement_gestionnaire_code_postal: string
  etablissement_gestionnaire_code_commune_insee: string
  etablissement_gestionnaire_localite: string
  etablissement_gestionnaire_complement_adresse: string
  etablissement_gestionnaire_cedex: string
  etablissement_gestionnaire_entreprise_raison_sociale: string
  geo_coordonnees_etablissement_gestionnaire: string
  etablissement_gestionnaire_region: string
  etablissement_gestionnaire_num_departement: string
  etablissement_gestionnaire_nom_departement: string
  etablissement_gestionnaire_nom_academie: string
  etablissement_gestionnaire_num_academie: string
  etablissement_gestionnaire_siren: string
  etablissement_gestionnaire_courriel: string
  etablissement_gestionnaire_published: boolean
  etablissement_gestionnaire_catalogue_published: boolean
  rncp_etablissement_gestionnaire_habilite: boolean
  etablissement_gestionnaire_date_creation: Date
}

interface IEtablissementReference {
  etablissement_reference: string
  etablissement_reference_published: boolean
  etablissement_reference_habilite_rncp: boolean
  etablissement_reference_certifie_qualite: boolean
  etablissement_reference_date_creation: Date
}

interface IFormationCatalogue extends IEtablissementFormateur, IEtablissementGestionnaire, IEtablissementReference {
  cle_ministere_educatif: string
  cfd: string
  cfd_specialite: object
  cfa_outdated: boolean
  cfd_date_fermeture: Date
  cfd_entree: string
  mef_10_code: string
  mefs_10: string[]
  nom_academie: string
  num_academie: string
  code_postal: string
  code_commune_insee: string
  num_departement: string
  nom_departement: string
  region: string
  localite: string
  uai_formation: string
  nom: string
  intitule_long: string
  intitule_court: string
  diplome: string
  niveau: string
  onisep_url: string
  onisep_intitule: string
  onisep_libelle_poursuite: string
  onisep_lien_site_onisepfr: string
  onisep_discipline: string
  onisep_domaine_sousdomaine: string
  rncp_code: string
  rncp_intitule: string
  rncp_eligible_apprentissage: boolean
  rncp_details: object
  rome_codes: string[]
  capacite: string
  duree: string
  annee: string
  email: string
  parcoursup_statut: string
  parcoursup_error: string
  parcoursup_statut_history: object[]
  parcoursup_reference: boolean
  parcoursup_a_charger: boolean
  parcoursup_id: string
  affelnet_reference: boolean
  affelnet_a_charger: boolean
  affelnet_statut: string
  affelnet_statut_history: object[]
  source: string
  commentaires: string
  opcos: string[]
  info_opcos: number
  info_opcos_intitule: string
  published: boolean
  rco_published: boolean
  draft: boolean
  created_at: Date
  updates_history: object[]
  last_update_at: Date
  last_update_who: string
  to_update: boolean
  update_error: string
  lieu_formation_geo_coordonnees: string
  lieu_formation_adresse: string
  lieu_formation_adresse_computed: string
  lieu_formation_siret: string
  id_rco_formation: string
  id_formation: string
  id_action: string
  ids_action: string[]
  id_certifinfo: string
  tags: string[]
  libelle_court: string[]
  niveau_formation_diplome: string
  affelnet_infos_offre: string
  affelnet_code_nature: string
  affelnet_secteur: string
  affelnet_raison_depublication: string
  bcn_mefs_10: object[]
  editedFields: object
  parcoursup_raison_depublication: string
  distance_lieu_formation_etablissement_formateur: number
  niveau_entree_obligatoire: number
  entierement_a_distance: boolean
  catalogue_published: boolean
  contenu: string
  objectif: string
  date_debut: Date[]
  date_fin: Date[]
  modalites_entrees_sorties: boolean[]
}

export { IEtablissementFormateur, IEtablissementGestionnaire, IEtablissementReference, IFormationCatalogue }

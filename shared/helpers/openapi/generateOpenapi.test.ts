import { describe, it, expect } from "vitest"

import { generateOpenApiSchema } from "./generateOpenapi"

describe("generateOpenApiSchema", () => {
  it("should generate proper schema", async () => {
    expect(generateOpenApiSchema()).toEqual({
      paths: {
        "/api": {},
        "/api/etablissements/:id": {},
        "/api/healthcheck": {},
      },

      // "paths": {
      //   "/api/V1/formations": {
      //     "get": {
      //       "description": "Rechercher des formations en alternance pour un métier ou un ensemble de métiers autour d'un point géographique",

      //       "produces": ["application/xml", "application/json"],

      //       "parameters": [
      //         {
      //           "$ref": "#/parameters/romes"
      //         },
      //         {
      //           "$ref": "#/parameters/romeDomain"
      //         },
      //         {
      //           "$ref": "#/parameters/latitude"
      //         },
      //         {
      //           "$ref": "#/parameters/longitude"
      //         },
      //         {
      //           "$ref": "#/parameters/radius"
      //         },
      //         {
      //           "$ref": "#/parameters/diploma"
      //         },
      //         {
      //           "$ref": "#/parameters/caller"
      //         },
      //         {
      //           "$ref": "#/parameters/opco"
      //         }
      //       ],

      //       "responses": {
      //         "200": {
      //           "description": "Un tableau contenant la liste des formations correspondants aux critères transmis en paramètre de la requête. Le tableau peut être vide si aucune formation ne correspond.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "$ref": "#/definitions/Formations"
      //               }
      //             }
      //           }
      //         },

      //         "400": {
      //           "$ref": "#/responses/WrongParameters"
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/formationsParRegion": {
      //     "get": {
      //       "description": "Rechercher des formations en alternance dans un département ou dans une région ou dans la France entière pour un métier ou un ensemble de métiers",

      //       "parameters": [
      //         {
      //           "$ref": "#/parameters/regionRomes"
      //         },
      //         {
      //           "$ref": "#/parameters/regionRomeDomain"
      //         },
      //         {
      //           "$ref": "#/parameters/region"
      //         },
      //         {
      //           "$ref": "#/parameters/departement"
      //         },
      //         {
      //           "$ref": "#/parameters/diploma"
      //         },
      //         {
      //           "$ref": "#/parameters/caller"
      //         }
      //       ],

      //       "responses": {
      //         "200": {
      //           "description": "Un tableau contenant la liste des formations correspondants aux critères transmis en paramètre de la requête. Le tableau peut être vide si aucune formation ne correspond.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "$ref": "#/definitions/Formations"
      //               }
      //             }
      //           }
      //         },

      //         "400": {
      //           "$ref": "#/responses/WrongParameters"
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/jobs": {
      //     "get": {
      //       "description": "Rechercher les entreprises recrutant ou susceptibles de recruter en alternance référencées par les APIs de Pôle emploi, pour un métier ou un ensemble de métiers, autour d'un point géographique ou sur la France entière",

      //       "parameters": [
      //         {
      //           "$ref": "#/parameters/requiredRomes"
      //         },
      //         {
      //           "$ref": "#/parameters/requiredRncp"
      //         },
      //         {
      //           "$ref": "#/parameters/latitude"
      //         },
      //         {
      //           "$ref": "#/parameters/longitude"
      //         },
      //         {
      //           "$ref": "#/parameters/radius"
      //         },
      //         {
      //           "$ref": "#/parameters/insee"
      //         },
      //         {
      //           "$ref": "#/parameters/jobSources"
      //         },
      //         {
      //           "$ref": "#/parameters/caller"
      //         },
      //         {
      //           "$ref": "#/parameters/opco"
      //         }
      //       ],

      //       "responses": {
      //         "200": {
      //           "description": "tableau contenant la liste des opportunités d'emploi correspondants aux critères transmis en paramètre de la requête. Le tableau peut être vide si aucune opportunité d'emploi ne correspond.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "$ref": "#/definitions/Jobs"
      //               }
      //             }
      //           }
      //         },

      //         "400": {
      //           "$ref": "#/responses/WrongParameters"
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/jobsEtFormations": {
      //     "get": {
      //       "description": "Rechercher des formations en alternance et des entreprises recrutant ou susceptibles de recruter en alternance référencées par les APIs de Pôle emploi, pour un métier ou un ensemble de métiers, autour d'un point géographique ou sur la France entière",
      //       "parameters": [
      //         {
      //           "$ref": "#/parameters/requiredRomes"
      //         },
      //         {
      //           "$ref": "#/parameters/requiredRncp"
      //         },
      //         {
      //           "$ref": "#/parameters/latitude"
      //         },
      //         {
      //           "$ref": "#/parameters/longitude"
      //         },
      //         {
      //           "$ref": "#/parameters/radius"
      //         },
      //         {
      //           "$ref": "#/parameters/diploma"
      //         },
      //         {
      //           "$ref": "#/parameters/insee"
      //         },
      //         {
      //           "$ref": "#/parameters/sources"
      //         },
      //         {
      //           "$ref": "#/parameters/caller"
      //         },
      //         {
      //           "$ref": "#/parameters/opco"
      //         }
      //       ],

      //       "responses": {
      //         "200": {
      //           "description": "Un objet contenant la liste des formations et les opportunités d'emploi correspondants aux critères transmis en paramètre de la requête.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "type": "",
      //                 "properties": {
      //                   "formations": {
      //                     "$ref": "#/definitions/Formations"
      //                   },
      //                   "jobs": {
      //                     "$ref": "#/definitions/Jobs"
      //                   }
      //                 }
      //               }
      //             }
      //           }
      //         },

      //         "400": {
      //           "$ref": "#/responses/WrongParameters"
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/metiers": {
      //     "get": {
      //       "description": "Rechercher des métiers et les codes ROMEs et RNCPs correspondants pour un titre, des codes ROMEs ou des codes RNCPs",

      //       "produces": ["application/xml", "application/json"],

      //       "parameters": [
      //         {
      //           "$ref": "#/parameters/title"
      //         },
      //         {
      //           "$ref": "#/parameters/romes_2"
      //         },
      //         {
      //           "$ref": "#/parameters/rncps"
      //         },
      //         {
      //           "$ref": "#/parameters/withRomeLabels"
      //         }
      //       ],

      //       "responses": {
      //         "200": {
      //           "description": "Un tableau contenant la liste des métiers correspondants aux critères transmis en paramètre de la requête. Le tableau peut être vide si aucun métier ne correspond.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "$ref": "#/definitions/Metiers"
      //               }
      //             }
      //           }
      //         },

      //         "400": {
      //           "$ref": "#/responses/WrongParameters"
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/metiers/all": {
      //     "get": {
      //       "description": "Récupérer la liste des noms des métiers du référentiel de La bonne alternance",

      //       "produces": ["application/xml", "application/json"],

      //       "responses": {
      //         "200": {
      //           "description": "Un tableau contenant la liste de tous les noms de métiers.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "$ref": "#/definitions/Liste_des_metiers"
      //               }
      //             }
      //           }
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/metiers/metiersParFormation/{cfd}": {
      //     "get": {
      //       "description": "Récupérer la liste des noms des métiers du référentiel de La bonne alternance pour une formation donnée",

      //       "parameters": [
      //         {
      //           "name": "cfd",
      //           "in": "path",
      //           "required": true,
      //           "type": "string",
      //           "description": "L'identifiant CFD de la formation.",
      //           "example": "50022137"
      //         }
      //       ],

      //       "produces": ["application/xml", "application/json"],

      //       "responses": {
      //         "200": {
      //           "description": "Un tableau contenant la liste de tous les noms de métiers.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "$ref": "#/definitions/Liste_des_metiers"
      //               }
      //             }
      //           }
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/metiers/metiersParEtablissement/{siret}": {
      //     "get": {
      //       "description": "Récupérer la liste des noms des métiers du référentiel de La bonne alternance pour un établissement de formation",

      //       "parameters": [
      //         {
      //           "name": "siret",
      //           "in": "path",
      //           "required": true,
      //           "type": "string",
      //           "description": "Le siret de l'établissement de formation.",
      //           "example": "1234567890123"
      //         }
      //       ],

      //       "produces": ["application/xml", "application/json"],

      //       "responses": {
      //         "200": {
      //           "description": "Un tableau contenant la liste de tous les noms de métiers.",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "$ref": "#/definitions/Liste_des_metiers"
      //               }
      //             }
      //           }
      //         }
      //       }
      //     }
      //   },

      //   "/api/V1/application": {
      //     "post": {
      //       "description": "Envoi d'un email de candidature à une offre postée sur La bonne alternance recruteur ou une candidature spontanée à une entreprise identifiée par La bonne alternance.\nL'email est envoyé depuis l'adresse générique \"Ne pas répondre\" de La bonne alternance.\n",
      //       "produces": ["application/xml", "application/json"],

      //       "parameters": [
      //         {
      //           "$ref": "#/parameters/applicantEmail"
      //         },
      //         {
      //           "$ref": "#/parameters/applicantLastName"
      //         },
      //         {
      //           "$ref": "#/parameters/applicantFirstName"
      //         },
      //         {
      //           "$ref": "#/parameters/applicantPhone"
      //         },
      //         {
      //           "$ref": "#/parameters/applicantFileName"
      //         },
      //         {
      //           "$ref": "#/parameters/applicantFileContent"
      //         },
      //         {
      //           "$ref": "#/parameters/companyAddress"
      //         },
      //         {
      //           "$ref": "#/parameters/companyNaf"
      //         },
      //         {
      //           "$ref": "#/parameters/companyName"
      //         },
      //         {
      //           "$ref": "#/parameters/companySiret"
      //         },
      //         {
      //           "$ref": "#/parameters/companyType"
      //         },
      //         {
      //           "$ref": "#/parameters/companyEmail"
      //         },
      //         {
      //           "$ref": "#/parameters/iv"
      //         },
      //         {
      //           "$ref": "#/parameters/jobId"
      //         },
      //         {
      //           "$ref": "#/parameters/jobTitle"
      //         },
      //         {
      //           "$ref": "#/parameters/message"
      //         },
      //         {
      //           "$ref": "#/parameters/caller"
      //         }
      //       ],

      //       "responses": {
      //         "200": {
      //           "description": "L'accusé de réception d'un envoi de candidature ",
      //           "content": {
      //             "application/json": {
      //               "schema": {
      //                 "type": "",
      //                 "properties": {
      //                   "result": {
      //                     "type": "string",
      //                     "description": "Indique le succès ou l'échec de l'opération",
      //                     "example": "ok"
      //                   },
      //                   "message": {
      //                     "type": "string",
      //                     "description": "message sent"
      //                   }
      //                 }
      //               }
      //             }
      //           }
      //         },

      //         "400": {
      //           "$ref": "#/responses/WrongParameters"
      //         },

      //         "429": {
      //           "$ref": "#/responses/TooManyRequests"
      //         }
      //       }
      //     }
      //   }
      // },

      // "responses": {
      //   "WrongParameters": {
      //     "description": "Mauvais paramètres",
      //     "content": {
      //       "application/json": {
      //         "schema": {
      //           "$ref": "#/definitions/Error"
      //         }
      //       }
      //     }
      //   },
      //   "TooManyRequests": {
      //     "description": "Trop d'appels consécutifs. Les en-têtes de la réponse indiquent le temps d'attente nécessaire entre deux requêtes. Ré-émettez la requête après ce temps d'attente."
      //   }
      // },

      // "parameters": {
      //   "caller": {
      //     "name": "caller",
      //     "in": "query",
      //     "required": true,
      //     "type": "string",
      //     "description": "Votre raison sociale ou le nom de votre produit qui fait appel à l'API idéalement préfixé par une adresse email de contact",
      //     "example": "contact@domaine nom_de_societe"
      //   },

      //   "romes": {
      //     "name": "romes",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s). Maximum 20.<br />rome et romeDomain sont incompatibles.<br/><strong>Au moins un des deux doit être renseigné.</strong>",
      //     "example": "F1603,I1308"
      //   },

      //   "romes_2": {
      //     "name": "romes",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s).",
      //     "example": "F1603,I1308"
      //   },

      //   "withRomeLabels": {
      //     "name": "withRomeLabels",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "La présence d'une valeur pour ce paramètre fait remonter les couples romes / libellés",
      //     "example": "1, true"
      //   },

      //   "title": {
      //     "name": "title",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Un terme libre de recherche de métier.",
      //     "example": "Décoration"
      //   },

      //   "opco": {
      //     "name": "opco",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Un filtre sur les sociétés affectées à un opérateur de compétences. Valeurs acceptées : akto",
      //     "example": "akto"
      //   },

      //   "rncps": {
      //     "name": "rncps",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Une liste de codes RNCP séparés par des virgules correspondant au(x) métier(s) recherché(s).",
      //     "example": "RNCP500,RNCP806"
      //   },

      //   "regionRomes": {
      //     "name": "romes",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s). Maximum 20.<br />rome et romeDomain sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné dans le cas d'une recherche France entière.</strong>",
      //     "example": "F1603,I1308"
      //   },

      //   "requiredRomes": {
      //     "name": "romes",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s). Maximum 20.<br />romes et rncp sont incompatibles.<br/><strong>Au moins un des deux doit être renseigné.</strong>",
      //     "example": "F1603,I1308"
      //   },

      //   "requiredRncp": {
      //     "name": "rncp",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Un code RNCP.<br />romes et rncp sont incompatibles.<br/><strong>Au moins un des deux doit être renseigné.</strong>",
      //     "example": "RNCP31899"
      //   },

      //   "romeDomain": {
      //     "name": "romeDomain",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Un domaine ROME (1 lettre et deux chiffres) ou un grand domaine ROME (1 lettre). <br />rome et romeDomain sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné.</strong>",
      //     "example": "F ou I13"
      //   },

      //   "regionRomeDomain": {
      //     "name": "romeDomain",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Un domaine ROME (1 lettre et deux chiffres) ou un grand domaine ROME (1 lettre).<br />rome et romeDomain sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné dans le cas d'une recherche France entière.</strong>",
      //     "example": "F ou I13"
      //   },

      //   "region": {
      //     "name": "region",
      //     "in": "query",
      //     "required": false,
      //     "schema": {
      //       "type": "string",
      //       "enum": ["01", "02", "03", "04", "06", "11", "24", "27", "28", "32", "44", "52", "53", "75", "76", "84", "93", "94"]
      //     },
      //     "description": "Le code Insee d'une région française.<br />region et departement sont incompatibles.<br /><strong>Si aucun des deux n'est renseigné la recherche portera sur France entière.</strong><br /><strong>France entière ne peut être utilisé sans rome ou romeDomain.</strong><br /><ul><li>84 : Auvergne-Rhône-Alpes</li><li>27 : Bourgogne-Franche-Comté</li><li>53 : Bretagne</li><li>24 : Centre-Val de Loire</li><li>94 : Corse</li><li>44 : Grand Est</li><li>32 : Hauts-de-France</li><li>11 : Île-de-France</li><li>28 : Normandie</li><li>75 : Nouvelle-Aquitaine</li><li>76 : Occitanie</li><li>52 : Pays de la Loire</li><li>93 : Provence-Alpes-Côte d'Azur</li><li>01 : Guadeloupe</li><li>02 : Martinique</li><li>03 : Guyane</li><li>04 : La Réunion</li><li>06 : Mayotte</li></ul>",
      //     "example": "84"
      //   },

      //   "departement": {
      //     "name": "departement",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Le numéro à 2 chiffres d'un département français ou à 3 chiffres pour un département d'outre-mer.<br />region et departement sont incompatibles.<br /><strong>Si aucun des deux n'est renseigné la recherche portera sur France entière.</strong><br /><strong>France entière ne peut être utilisé sans rome ou romeDomain.</strong>",
      //     "example": "09 ou 974"
      //   },

      //   "insee": {
      //     "name": "insee",
      //     "in": "query",
      //     "required": false,
      //     "type": "string",
      //     "description": "Le code Insee de la commune de recherche. Ce doit être un nombre à cinq chiffres. Nécessaire avec latitude et longitude pour une recherche localisée.",
      //     "example": "94071"
      //   },

      //   "latitude": {
      //     "name": "latitude",
      //     "in": "query",
      //     "required": false,
      //     "type": "number",
      //     "description": "La latitude du centre de recherche. Nécessaire avec insee et longitude pour une recherche localisée.",
      //     "example": "48.845"
      //   },

      //   "longitude": {
      //     "name": "longitude",
      //     "in": "query",
      //     "required": false,
      //     "type": "number",
      //     "description": "La longitude du centre de recherche. Nécessaire avec latitude et insee pour une recherche localisée.",
      //     "example": "2.3752"
      //   },

      //   "radius": {
      //     "name": "radius",
      //     "in": "query",
      //     "required": false,
      //     "type": "integer",
      //     "description": "Le rayon de recherche en kilomètres",
      //     "example": 30,
      //     "default": 30
      //   },

      //   "diploma": {
      //     "name": "diploma",
      //     "in": "query",
      //     "required": false,
      //     "schema": {
      //       "type": "string",
      //       "enum": ["3 (CAP...)", "4 (BAC...)", "5 (BTS, DEUST...)", "6 (Licence...)", "7 (Master, titre ingénieur...)"]
      //     },
      //     "description": "Le niveau de diplôme requis. Si précisé, doit contenir à minima le chiffre d'une seule des valeurs autorisées",
      //     "example": "3"
      //   },

      //   "sources": {
      //     "name": "sources",
      //     "in": "query",
      //     "required": false,
      //     "explode": false,
      //     "schema": {
      //       "type": "array",
      //       "minItems": 1,
      //       "collectionFormat": "csv",
      //       "default": "formations,lba,matcha,offres",
      //       "items": {
      //         "type": "string",
      //         "enum": ["formations", "lba", "matcha", "offres"]
      //       }
      //     },
      //     "description": "Les sources de données dans lesquelles la recherche aura lieu. Ces sources doivent être séparées par des virgules",
      //     "example": "formations,offres"
      //   },

      //   "jobSources": {
      //     "name": "sources",
      //     "in": "query",
      //     "required": false,
      //     "explode": false,
      //     "schema": {
      //       "type": "array",
      //       "minItems": 1,
      //       "collectionFormat": "csv",
      //       "default": "lba,offres,matcha",
      //       "items": {
      //         "type": "string",
      //         "enum": ["lba", "offres", "matcha"]
      //       }
      //     },
      //     "description": "Les sources de données dans lesquelles la recherche aura lieu. Ces sources doivent être séparées par des virgules",
      //     "example": "offres"
      //   },

      //   "applicantEmail": {
      //     "name": "applicant_email",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "L'adresse email du candidat à laquelle l'entreprise contactée pourra répondre. Les adresses emails temporaires ne sont pas acceptées.",
      //     "example": "john.smith@mail.com"
      //   },

      //   "applicantFirstName": {
      //     "name": "applicant_first_name",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le prénom du candidat.",
      //     "example": "Jean"
      //   },

      //   "applicantLastName": {
      //     "name": "applicant_last_name",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le nom du candidat.",
      //     "example": "Dupont"
      //   },

      //   "applicantPhone": {
      //     "name": "applicant_phone",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le numéro de téléphone du candidat.",
      //     "example": "0101010101"
      //   },

      //   "applicantFileName": {
      //     "name": "applicant_file_name",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le nom du fichier du CV du candidat. Seuls les .docx et .pdf sont autorisés.",
      //     "example": "cv.pdf"
      //   },

      //   "applicantFileContent": {
      //     "name": "applicant_file_content",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le contenu du fichier du CV du candidat. La taille maximale autorisée est de 3 Mo.",
      //     "example": "data:application/pdf;base64,JVBERi0xLjQKJ..."
      //   },

      //   "message": {
      //     "name": "message",
      //     "in": "body",
      //     "required": false,
      //     "type": "string",
      //     "description": "Un message du candidat vers le recruteur. Ce champ peut contenir la lettre de motivation du candidat.",
      //     "example": "Madame, monsieur..."
      //   },

      //   "companyEmail": {
      //     "name": "company_email",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "L'adresse email de la société pour postuler. Vous devez impérativement utiliser les valeurs émises par l'API LBA avec le vecteur d'initialisation correspondant à l'adresse.",
      //     "example": "...f936e4352b5ae5..."
      //   },

      //   "iv": {
      //     "name": "iv",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le vecteur d'initialisation permettant de déchiffrer l'adresse email de la société. Cette valeur est fournie par les apis de LBA.",
      //     "example": "...59c24c059b..."
      //   },

      //   "jobId": {
      //     "name": "job_id",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "L'identifiant de l'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est \"matcha\" . La valeur est fournie par La bonne alternance. ",
      //     "example": "...59c24c059b..."
      //   },

      //   "jobTitle": {
      //     "name": "job_title",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le titre de l'offre La bonne alternance Recruteur pour laquelle la candidature est envoyée. Seulement si le type de la société (company_type) est \"matcha\" . La valeur est fournie par La bonne alternance. ",
      //     "example": "Téléconseil, vente à distance"
      //   },

      //   "companyAddress": {
      //     "name": "company_address",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "L'adresse postale de la société. Fournie par La bonne alternance. (champs : place.fullAddress)",
      //     "example": "38 RUE DES HAMECONS, 75021 PARIS-21"
      //   },

      //   "companyNaf": {
      //     "name": "company_naf",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "La valeur associée au code NAF de l'entreprise. Fournie par La bonne alternance. ",
      //     "example": "Boulangerie et boulangerie-pâtisserie"
      //   },

      //   "companyName": {
      //     "name": "company_name",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le nom de la société. Fourni par La bonne alternance. ",
      //     "example": "Au bon pain d'antan"
      //   },

      //   "companySiret": {
      //     "name": "company_siret",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le siret de l'entreprise. Fourni par La bonne alternance. ",
      //     "example": "00004993900000"
      //   },

      //   "companyType": {
      //     "name": "company_type",
      //     "in": "body",
      //     "required": true,
      //     "type": "string",
      //     "description": "Le type de société selon la nomenclature La bonne alternance. Fourni par La bonne alternance.",
      //     "example": "lba|lbb|matcha"
      //   }
      // },

      // "definitions": {
      //   "Error": {
      //     "type": "",
      //     "required": ["error"],
      //     "properties": {
      //       "error": {
      //         "type": "string",
      //         "description": "Le type générique de l'erreur",
      //         "example": "wrong_parameters"
      //       },
      //       "error_messages": {
      //         "type": "array",
      //         "items": {
      //           "type": "string"
      //         },
      //         "description": "Une liste d'erreurs détaillées. Ex : les erreurs de paramétrage de la requête.",
      //         "example": ["romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234", "romes : Too many rome codes. Maximum is 20."]
      //       }
      //     }
      //   },

      //   "Formations": {
      //     "type": "",
      //     "required": ["results"],
      //     "properties": {
      //       "results": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Formation"
      //         },
      //         "description": "Un tableau de formations correspondantes aux critères"
      //       }
      //     }
      //   },

      //   "Jobs": {
      //     "type": "",
      //     "description": "Cet objet contient les types d'opportunité d'emploi demandé dans le champ <strong>source</strong> de la requête.",
      //     "properties": {
      //       "peJobs": {
      //         "$ref": "#/definitions/Offres"
      //       },
      //       "lbaCompanies": {
      //         "$ref": "#/definitions/Societes"
      //       },
      //       "matchas": {
      //         "$ref": "#/definitions/OffresMatchas"
      //       }
      //     }
      //   },

      //   "Offres": {
      //     "type": "",
      //     "required": ["results"],
      //     "description": "Un tableau d'offres d'emploi en alternance correspondantes aux critères",
      //     "properties": {
      //       "results": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Offre"
      //         }
      //       }
      //     }
      //   },

      //   "Societes": {
      //     "type": "",
      //     "required": ["results"],
      //     "description": "Un tableau de sociétés susceptibles de recruter en alternance correspondantes aux critères.<br />Les lba ont déjà recruté des apprentis par le passé.",
      //     "properties": {
      //       "results": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Societe"
      //         }
      //       }
      //     }
      //   },

      //   "OffresMatchas": {
      //     "type": "",
      //     "required": ["results"],
      //     "description": "Un tableau d'offres d'emploi en alternance correspondantes aux critères.",
      //     "properties": {
      //       "results": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/OffreMatcha"
      //         }
      //       }
      //     }
      //   },

      //   "Formation": {
      //     "type": "",
      //     "required": ["title", "ideaType", "id"],
      //     "properties": {
      //       "title": {
      //         "type": "string",
      //         "example": "CAP Monteur en Installation Thermique",
      //         "description": "Le titre de la formation"
      //       },
      //       "longTitle": {
      //         "type": "string",
      //         "example": "MONTEUR EN INSTALLATIONS THERMIQUES (CAP)",
      //         "description": "Le titre en version longue de la formation"
      //       },
      //       "ideaType": {
      //         "type": "string",
      //         "value": "formation",
      //         "example": "formation",
      //         "description": "Le type labonnealternance d'objet, ici la seule valeur possible est 'formation'"
      //       },
      //       "id": {
      //         "type": "string",
      //         "example": "5e8dfad720ff3b2161269d86",
      //         "description": "L'identifiant de la formation dans le catalogue de la mission apprentissage."
      //       },
      //       "diplomaLevel": {
      //         "type": "string",
      //         "example": "3 (CAP...)",
      //         "description": "Le niveau de la formation."
      //       },
      //       "diploma": {
      //         "type": "string",
      //         "example": "CERTIFICAT D'APTITUDES PROFESSIONNELLES",
      //         "description": "Le diplôme délivré par la formation."
      //       },
      //       "cfd": {
      //         "type": "string",
      //         "example": "50023324",
      //         "description": "Le code formation diplôme de l'éducation nationale."
      //       },
      //       "rncpCode": {
      //         "type": "string",
      //         "example": "RNCP31899",
      //         "description": "Le code RNCP."
      //       },
      //       "rncpLabel": {
      //         "type": "string",
      //         "example": "Intégrateur - Développeur Web",
      //         "description": "L'intitulé RNCP."
      //       },
      //       "rncpEligibleApprentissage": {
      //         "type": "string",
      //         "example": "true",
      //         "description": "Indique si le titre RNCP est éligible en apprentissage."
      //       },
      //       "period": {
      //         "type": "string",
      //         "example": "[\"Septembre\"]",
      //         "description": "Période d'inscription à la formation."
      //       },
      //       "capacity": {
      //         "type": "string",
      //         "example": "15",
      //         "description": "Capacité d'accueil."
      //       },
      //       "createdAt": {
      //         "type": "string",
      //         "example": "2020-11-30T21:33:23.481Z",
      //         "description": "Date d'ajout en base de données de la formation"
      //       },
      //       "lastUpdateAt": {
      //         "type": "string",
      //         "example": "2020-11-30T21:33:23.481Z",
      //         "description": "Date de dernières mise à jour"
      //       },
      //       "onisepUrl": {
      //         "type": "string",
      //         "example": "http://www.onisep.fr/http/redirection/formation/identifiant/7872",
      //         "description": "Le lien vers la description de la formation sur le site de l'ONISEP"
      //       },
      //       "contact": {
      //         "$ref": "#/definitions/Contact"
      //       },
      //       "place": {
      //         "description": "Le lieu de formation",
      //         "$ref": "#/definitions/Place"
      //       },
      //       "company": {
      //         "$ref": "#/definitions/Company"
      //       },
      //       "romes": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Rome"
      //         }
      //       }
      //     }
      //   },

      //   "Offre": {
      //     "type": "",
      //     "required": ["title", "ideaType", "url", "job"],
      //     "properties": {
      //       "title": {
      //         "type": "string",
      //         "example": "Monteur / Monteuse en chauffage (H/F)",
      //         "description": "Le titre de l'offre"
      //       },
      //       "ideaType": {
      //         "type": "string",
      //         "value": "peJob",
      //         "example": "peJob",
      //         "description": "Le type d'objet, ici la seule valeur possible est 'peJob'"
      //       },
      //       "url": {
      //         "type": "string",
      //         "example": "https://candidat.pole-emploi.fr/offres/recherche/detail/106ZWVB",
      //         "description": "Le lien Internet vers l'offre sur le site de Pôle emploi"
      //       },
      //       "job": {
      //         "$ref": "#/definitions/Job"
      //       },
      //       "contact": {
      //         "$ref": "#/definitions/Contact"
      //       },
      //       "place": {
      //         "description": "Les coordonnées de la société proposant l'offre",
      //         "$ref": "#/definitions/Place"
      //       },
      //       "company": {
      //         "$ref": "#/definitions/Company"
      //       },
      //       "romes": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Rome"
      //         }
      //       }
      //     }
      //   },

      //   "OffreMatcha": {
      //     "type": "",
      //     "required": ["title", "ideaType", "job"],
      //     "properties": {
      //       "title": {
      //         "type": "string",
      //         "example": "Monteur / Monteuse en chauffage (H/F)",
      //         "description": "Le titre de l'offre"
      //       },
      //       "ideaType": {
      //         "type": "string",
      //         "value": "matcha",
      //         "example": "matcha",
      //         "description": "Le type d'objet, ici la seule valeur possible est 'matcha'"
      //       },
      //       "job": {
      //         "$ref": "#/definitions/Job"
      //       },
      //       "contact": {
      //         "$ref": "#/definitions/Contact"
      //       },
      //       "place": {
      //         "description": "Les coordonnées de la société proposant l'offre",
      //         "$ref": "#/definitions/Place"
      //       },
      //       "company": {
      //         "$ref": "#/definitions/Company"
      //       },
      //       "romes": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Rome"
      //         }
      //       },
      //       "diplomaLevel": {
      //         "type": "string",
      //         "example": "CAP, BEP",
      //         "description": "Le(s) niveau(x) d'étude requis"
      //       }
      //     }
      //   },

      //   "Societe": {
      //     "type": "",
      //     "required": ["title", "ideaType", "url"],
      //     "properties": {
      //       "title": {
      //         "type": "string",
      //         "example": "COMPAGNIE PARISIENNE DE CHAUFFAGE URBAIN",
      //         "description": "La raison sociale de la société"
      //       },
      //       "ideaType": {
      //         "type": "string",
      //         "example": "lba",
      //         "description": "Le type d'objet, une société peut être de type lba si elle a déjà recruté en alternance ou de type lbb si elle a recruté sur le métier recherché"
      //       },
      //       "contact": {
      //         "$ref": "#/definitions/Contact"
      //       },
      //       "place": {
      //         "description": "L'adresse de la société",
      //         "$ref": "#/definitions/Place"
      //       },
      //       "company": {
      //         "$ref": "#/definitions/Company"
      //       },
      //       "romes": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Rome"
      //         }
      //       },
      //       "nafs": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Naf"
      //         }
      //       }
      //     }
      //   },

      //   "Contact": {
      //     "type": "",
      //     "properties": {
      //       "email": {
      //         "type": "string",
      //         "example": "contact@domaine.fr",
      //         "description": "L'adresse email du contact de référence"
      //       },
      //       "name": {
      //         "type": "string",
      //         "example": "Mme Dupont",
      //         "description": "Le nom du contact de référence"
      //       },
      //       "phone": {
      //         "type": "string",
      //         "example": "0X XX XX XX XX",
      //         "description": "Le numéro de téléphone du contact de référence"
      //       },
      //       "info": {
      //         "type": "string",
      //         "description": "Des informations complémentaires concernant le contact de référence"
      //       }
      //     }
      //   },

      //   "Place": {
      //     "type": "",
      //     "description": "Un lieu. Selon le contexte il peut s'agir du lieu de formation, du lieu du centre de formation responsable de la formation ou de l'emplacement d'une entreprise offrant une opportunité d'emploi",

      //     "properties": {
      //       "distance": {
      //         "type": "number",
      //         "example": "3.5",
      //         "description": "La distance du lieu par rapport au centre de recherche en kilomètres"
      //       },
      //       "fullAddress": {
      //         "type": "string",
      //         "example": "4 RUE DES ROSIERS PARIS 4 75004",
      //         "description": "L'adresse postale complète du lieu"
      //       },
      //       "latitude": {
      //         "type": "number",
      //         "example": "48.845",
      //         "description": "La latitude du lieu"
      //       },
      //       "longitude": {
      //         "type": "string",
      //         "example": "2.3752",
      //         "description": "La longitude du lieu"
      //       },
      //       "city": {
      //         "type": "string",
      //         "example": "PARIS 4",
      //         "description": "La ville"
      //       },
      //       "address": {
      //         "type": "string",
      //         "example": "4 RUE DES ROSIERS",
      //         "description": "L'adresse du lieu"
      //       },
      //       "cedex": {
      //         "type": "string",
      //         "example": null,
      //         "description": "L'éventuel CEDEX de l'adresse"
      //       },
      //       "zipCode": {
      //         "type": "string",
      //         "example": "75004",
      //         "description": "Le code postal du lieu"
      //       },
      //       "insee": {
      //         "type": "string",
      //         "example": null,
      //         "description": "L'éventuel code Insee de la commune du lieu"
      //       },
      //       "departementNumber": {
      //         "type": "string",
      //         "example": "44",
      //         "description": "Numéro de département"
      //       },
      //       "region": {
      //         "type": "string",
      //         "example": "11",
      //         "description": "Région administrative"
      //       }
      //     }
      //   },

      //   "Job": {
      //     "type": "",
      //     "description": "Les informations d'une offre d'emploi servie par l'api Offres de Pôle emploi ou par l'api Matcha de la mission apprentissage",
      //     "required": ["id", "description"],
      //     "properties": {
      //       "id": {
      //         "type": "string",
      //         "example": "106CBHM",
      //         "description": "L'identifiant de l'offre"
      //       },
      //       "creationDate": {
      //         "type": "string",
      //         "example": "2020-10-01T16:43:24+02:00",
      //         "description": "La date de création de l'offre"
      //       },
      //       "jobStartDate": {
      //         "type": "string",
      //         "example": "2020-10-01T16:43:24+02:00",
      //         "description": "La date de début de l'offre"
      //       },
      //       "description": {
      //         "type": "string",
      //         "description": "La description de l'offre d'emploi"
      //       },
      //       "contractType": {
      //         "type": "string",
      //         "example": "CDD",
      //         "description": "Le type de contrat proposé"
      //       },
      //       "contractDescription": {
      //         "type": "string",
      //         "example": "Contrat à durée déterminée - 24 Mois",
      //         "description": "Des informations plus détaillées sur le type de contrat proposé"
      //       },
      //       "duration": {
      //         "type": "string",
      //         "example": "39H Horaires normaux",
      //         "description": "Le volume horaire de l'offre d'emploi"
      //       }
      //     }
      //   },

      //   "Company": {
      //     "type": "",
      //     "description": "Les informations de la société. Selon le contexte il peut s'agir du centre de formation ou de l'entreprise offrant une opportunité d'emploi.",
      //     "properties": {
      //       "name": {
      //         "type": "string",
      //         "example": "ECOLE DE TRAVAIL ORT",
      //         "description": "La raison sociale de l'entreprise"
      //       },
      //       "siret": {
      //         "type": "string",
      //         "example": "78424186100011",
      //         "description": "Le numéro de SIRET de l'établissement"
      //       },
      //       "size": {
      //         "type": "string",
      //         "description": "La tranche d'effectifs de l'entreprise"
      //       },
      //       "logo": {
      //         "type": "string",
      //         "description": "L'url du logo de l'entreprise"
      //       },
      //       "description": {
      //         "type": "string",
      //         "description": "La description de l'entreprise"
      //       },
      //       "socialNetwork": {
      //         "type": "string",
      //         "description": "Un lien vers un réseau social présentant l'entreprise"
      //       },
      //       "url": {
      //         "type": "string",
      //         "description": "Un lien vers le site de l'entreprise"
      //       },
      //       "id": {
      //         "type": "string",
      //         "description": "Lieu de formation seulement : l'identifiant du lieu de formation"
      //       },
      //       "uai": {
      //         "type": "string",
      //         "description": "Lieu de formation seulement : l'uai du lieu de formation"
      //       },
      //       "mandataire": {
      //         "type": "boolean",
      //         "description": "Indique si l'offre est déposée par un CFA mandataire (offres Matcha seulement)"
      //       },
      //       "headquarter": {
      //         "type": "",
      //         "properties": {
      //           "name": {
      //             "type": "string",
      //             "example": "ECOLE DE TRAVAIL ORT",
      //             "description": "La raison sociale du centre de formation auquel est affilié la formation"
      //           },
      //           "id": {
      //             "type": "string",
      //             "description": "Lieu de formation seulement : l'identifiant de l'établissement gestionnaire"
      //           },
      //           "uai": {
      //             "type": "string",
      //             "description": "Lieu de formation seulement : l'uai de l'établissement gestionnaire"
      //           },
      //           "type": {
      //             "type": "string",
      //             "description": "Lieu de formation seulement : le type de l'établissement gestionnaire"
      //           },
      //           "hasConvention": {
      //             "type": "string",
      //             "description": "Lieu de formation seulement : indique si l'établissement gestionnaire est conventionné"
      //           },
      //           "place": {
      //             "$ref": "#/definitions/Place"
      //           }
      //         }
      //       }
      //     }
      //   },

      //   "Rome": {
      //     "type": "",
      //     "required": ["code"],
      //     "properties": {
      //       "code": {
      //         "type": "string",
      //         "example": "F1603",
      //         "description": "Un code ROME provenant de la nomenclature des métiers de Pôle emploi"
      //       },
      //       "label": {
      //         "type": "string",
      //         "example": "Installation d'équipements sanitaires et thermiques",
      //         "description": "Le libellé correspondant au code ROME"
      //       }
      //     }
      //   },

      //   "Naf": {
      //     "type": "",
      //     "required": ["code"],
      //     "properties": {
      //       "code": {
      //         "type": "string",
      //         "example": "3530Z",
      //         "description": "Un code NAF (ou APE) provenant de la nomenclature des activités de l'Insee"
      //       },
      //       "label": {
      //         "type": "string",
      //         "example": "Production et distribution de vapeur et d'air conditionné",
      //         "description": "Le libellé correspondant au code NAF"
      //       }
      //     }
      //   },

      //   "Metiers": {
      //     "type": "",
      //     "required": ["labelsAndRomes"],
      //     "properties": {
      //       "labelsAndRomes": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/Metier"
      //         },
      //         "description": "Un tableau de métiers correspondantes aux critères"
      //       }
      //     }
      //   },

      //   "Liste_des_metiers": {
      //     "type": "",
      //     "required": ["metiers"],
      //     "properties": {
      //       "metiers": {
      //         "type": "array",
      //         "items": {
      //           "type": "string",
      //           "example": "Accueil touristique",
      //           "description": "Un nom de métier du référentiel La bonne alternance"
      //         },
      //         "description": "Un tableau des noms des métiers triés par ordre alphabétique"
      //       }
      //     }
      //   },

      //   "Metier": {
      //     "type": "",
      //     "description": "Les informations d'un métier de la liste définie par la mission apprentissage",
      //     "required": ["label", "romes", "rncps", "type"],
      //     "properties": {
      //       "label": {
      //         "type": "string",
      //         "example": "Décor et accessoires pour le spectacle",
      //         "description": "Le nom du métier"
      //       },

      //       "romes": {
      //         "type": "array",
      //         "example": ["L1503", "L1502", "L1506"],
      //         "description": "La liste des codes ROMEs correspondants au métier"
      //       },
      //       "rncps": {
      //         "type": "array",
      //         "example": ["RNCP500", "RNCP806"],
      //         "description": "La liste des codes RNCPs correspondants au métier"
      //       },
      //       "type": {
      //         "type": "string",
      //         "example": "job",
      //         "description": "Indique que l'objet est de type job"
      //       },
      //       "romeTitles": {
      //         "type": "array",
      //         "items": {
      //           "$ref": "#/definitions/RomeTitle"
      //         },
      //         "description": "Optionnel : tableau de couples romes / libellés"
      //       }
      //     }
      //   },
      //   "RomeTitle": {
      //     "type": "",
      //     "description": "Couple code ROME / Libellé ",
      //     "required": ["label", "romes", "rncps", "type"],
      //     "properties": {
      //       "codeRome": {
      //         "type": "string",
      //         "example": "L1503",
      //         "description": "Le code rome"
      //       },

      //       "intitule": {
      //         "type": "string",
      //         "example": "Décor et accessoires spectacle",
      //         "description": "Un intitulé du code ROME"
      //       }
      //     }
      //   }
      // }
    })
  })
})

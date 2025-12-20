/**
 * Sample Documents for Medical Device Certification
 * Content examples for the CerteaFiles demo
 */

export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  initialContent?: string;
}

/**
 * Document categories for medical device certification
 */
export const DOCUMENT_CATEGORIES = {
  REGULATORY: 'Réglementaire',
  QUALITY: 'Qualité',
  TECHNICAL: 'Technique',
  VALIDATION: 'Validation',
  RISK: 'Gestion des Risques',
} as const;

/**
 * Sample document templates
 */
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'ce-certificate',
    title: 'Certificat de Conformité CE',
    description: 'Déclaration de conformité aux exigences essentielles du Règlement (UE) 2017/745',
    category: DOCUMENT_CATEGORIES.REGULATORY,
    icon: 'Award',
    color: '#3B82F6',
  },
  {
    id: 'validation-protocol',
    title: 'Protocole de Validation IQ/OQ/PQ',
    description: 'Protocole de qualification d\'installation, opérationnelle et de performance',
    category: DOCUMENT_CATEGORIES.VALIDATION,
    icon: 'ClipboardCheck',
    color: '#10B981',
  },
  {
    id: 'risk-analysis',
    title: 'Analyse de Risques ISO 14971',
    description: 'Application de la gestion des risques aux dispositifs médicaux',
    category: DOCUMENT_CATEGORIES.RISK,
    icon: 'AlertTriangle',
    color: '#F59E0B',
  },
  {
    id: 'technical-file',
    title: 'Fiche Technique Produit',
    description: 'Spécifications techniques et caractéristiques du dispositif médical',
    category: DOCUMENT_CATEGORIES.TECHNICAL,
    icon: 'FileText',
    color: '#8B5CF6',
  },
  {
    id: 'quality-manual',
    title: 'Manuel Qualité ISO 13485',
    description: 'Système de management de la qualité pour les dispositifs médicaux',
    category: DOCUMENT_CATEGORIES.QUALITY,
    icon: 'Shield',
    color: '#EC4899',
  },
  {
    id: 'clinical-evaluation',
    title: 'Évaluation Clinique',
    description: 'Évaluation des données cliniques conformément au MDR',
    category: DOCUMENT_CATEGORIES.REGULATORY,
    icon: 'Stethoscope',
    color: '#06B6D4',
  },
  {
    id: 'design-history',
    title: 'Design History File (DHF)',
    description: 'Dossier historique de conception selon FDA 21 CFR Part 820',
    category: DOCUMENT_CATEGORIES.TECHNICAL,
    icon: 'FileText',
    color: '#0EA5E9',
  },
  {
    id: 'usability-engineering',
    title: 'Ingénierie de l\'Aptitude à l\'Utilisation',
    description: 'Processus d\'aptitude à l\'utilisation conforme à IEC 62366-1',
    category: DOCUMENT_CATEGORIES.VALIDATION,
    icon: 'ClipboardCheck',
    color: '#14B8A6',
  },
  {
    id: 'post-market-surveillance',
    title: 'Plan de Surveillance Post-Marché',
    description: 'Plan PMS conformément à l\'Article 84 du MDR',
    category: DOCUMENT_CATEGORIES.QUALITY,
    icon: 'Shield',
    color: '#A855F7',
  },
  {
    id: 'software-documentation',
    title: 'Documentation Logicielle IEC 62304',
    description: 'Documentation du cycle de vie logiciel dispositif médical',
    category: DOCUMENT_CATEGORIES.TECHNICAL,
    icon: 'FileText',
    color: '#6366F1',
  },
  {
    id: 'biocompatibility',
    title: 'Évaluation de Biocompatibilité',
    description: 'Évaluation biologique selon ISO 10993-1',
    category: DOCUMENT_CATEGORIES.VALIDATION,
    icon: 'Stethoscope',
    color: '#22C55E',
  },
  {
    id: 'labeling-review',
    title: 'Revue de l\'Étiquetage',
    description: 'Vérification de conformité de l\'étiquetage selon EN ISO 15223-1',
    category: DOCUMENT_CATEGORIES.REGULATORY,
    icon: 'Award',
    color: '#F97316',
  },
];

/**
 * Initial content for CE Certificate
 */
export const CE_CERTIFICATE_CONTENT = `
DÉCLARATION UE DE CONFORMITÉ

Conformément au Règlement (UE) 2017/745 relatif aux dispositifs médicaux

═══════════════════════════════════════════════════════════

FABRICANT

Nom: {nom_fabricant}
Adresse: {adresse_fabricant}
Numéro EUDAMED: {numero_eudamed}

═══════════════════════════════════════════════════════════

DISPOSITIF MÉDICAL

Nom du dispositif: {nom_dispositif}
Modèle/Référence: {reference_produit}
Classification: Classe {classe_risque}
Code UDI-DI: {udi_di}
Destination: {destination_usage}

═══════════════════════════════════════════════════════════

DÉCLARATION

Le fabricant soussigné déclare, sous sa seule responsabilité, que le dispositif médical décrit ci-dessus est conforme aux exigences applicables du Règlement (UE) 2017/745.

Normes harmonisées appliquées:
• EN ISO 13485:2016 - Systèmes de management de la qualité
• EN ISO 14971:2019 - Application de la gestion des risques
• EN 62366-1:2015 - Ingénierie de l'aptitude à l'utilisation
• {normes_specifiques}

Organisme notifié (si applicable):
Nom: {organisme_notifie}
Numéro: {numero_organisme}
Certificat N°: {numero_certificat}

═══════════════════════════════════════════════════════════

SIGNATURE

Lieu: {lieu_signature}
Date: {date_signature}

Nom du signataire: {nom_signataire}
Fonction: {fonction_signataire}

[Signature]

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Validation Protocol
 */
export const VALIDATION_PROTOCOL_CONTENT = `
PROTOCOLE DE VALIDATION IQ/OQ/PQ

Dispositif Médical: {nom_dispositif}
Référence Document: VAL-{reference_document}
Version: {version}
Date d'émission: {date_emission}

═══════════════════════════════════════════════════════════

1. OBJECTIF

Ce protocole définit les exigences de qualification pour le dispositif médical {nom_dispositif}. Il couvre les trois phases de qualification:
• IQ (Installation Qualification) - Qualification d'installation
• OQ (Operational Qualification) - Qualification opérationnelle
• PQ (Performance Qualification) - Qualification de performance

═══════════════════════════════════════════════════════════

2. PORTÉE

2.1 Équipements concernés
• {equipement_1}
• {equipement_2}
• {equipement_3}

2.2 Critères d'acceptation
Tous les tests doivent atteindre un taux de réussite de 100% pour les critères critiques.

═══════════════════════════════════════════════════════════

3. QUALIFICATION D'INSTALLATION (IQ)

3.1 Vérifications préliminaires

| Réf. | Description | Critère | Résultat | Conforme |
|------|-------------|---------|----------|----------|
| IQ-01 | Documentation fournie | Complète | {result_iq01} | ☐ |
| IQ-02 | État de l'équipement | Sans dommage | {result_iq02} | ☐ |
| IQ-03 | Alimentation électrique | {spec_elec} | {result_iq03} | ☐ |
| IQ-04 | Conditions environnementales | T: 20±5°C, HR: 45±20% | {result_iq04} | ☐ |

═══════════════════════════════════════════════════════════

4. QUALIFICATION OPÉRATIONNELLE (OQ)

4.1 Tests fonctionnels

| Réf. | Test | Paramètres | Critère | Résultat |
|------|------|------------|---------|----------|
| OQ-01 | Mise sous tension | N/A | Démarrage normal | {result_oq01} |
| OQ-02 | Auto-diagnostic | N/A | Aucune erreur | {result_oq02} |
| OQ-03 | Calibration | {param_cal} | ±{tolerance_cal} | {result_oq03} |
| OQ-04 | Alarmes | Simulation | Déclenchement correct | {result_oq04} |

═══════════════════════════════════════════════════════════

5. QUALIFICATION DE PERFORMANCE (PQ)

5.1 Tests en conditions réelles

| Réf. | Scénario | Durée | Critère | Résultat |
|------|----------|-------|---------|----------|
| PQ-01 | Utilisation standard | 8h | Stabilité | {result_pq01} |
| PQ-02 | Charge maximale | 4h | Performance maintenue | {result_pq02} |
| PQ-03 | Répétabilité | 10 cycles | CV < 5% | {result_pq03} |

═══════════════════════════════════════════════════════════

6. CONCLUSIONS ET APPROBATIONS

6.1 Résultats globaux
• IQ: {statut_iq}
• OQ: {statut_oq}
• PQ: {statut_pq}

6.2 Décision finale
Le dispositif est déclaré: {decision_finale}

═══════════════════════════════════════════════════════════

APPROBATIONS

| Rôle | Nom | Signature | Date |
|------|-----|-----------|------|
| Exécutant | {nom_executant} | | {date_exec} |
| Vérificateur | {nom_verificateur} | | {date_verif} |
| Approbateur | {nom_approbateur} | | {date_appro} |

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Risk Analysis
 */
export const RISK_ANALYSIS_CONTENT = `
ANALYSE DE RISQUES
Conforme à ISO 14971:2019

Dispositif: {nom_dispositif}
Référence: RA-{reference_document}
Version: {version}
Classification: Classe {classe_risque}

═══════════════════════════════════════════════════════════

1. INFORMATIONS GÉNÉRALES

1.1 Description du dispositif
{description_dispositif}

1.2 Utilisation prévue
{utilisation_prevue}

1.3 Caractéristiques de sécurité
• {caracteristique_1}
• {caracteristique_2}
• {caracteristique_3}

═══════════════════════════════════════════════════════════

2. ESTIMATION DES RISQUES

2.1 Échelle de gravité (S)
| Niveau | Description | Définition |
|--------|-------------|------------|
| 1 | Négligeable | Aucun préjudice ou préjudice léger |
| 2 | Mineure | Préjudice temporaire sans intervention |
| 3 | Grave | Préjudice nécessitant intervention médicale |
| 4 | Critique | Préjudice permanent ou potentiellement mortel |
| 5 | Catastrophique | Décès |

2.2 Échelle de probabilité (P)
| Niveau | Description | Probabilité |
|--------|-------------|-------------|
| 1 | Improbable | < 10⁻⁶ |
| 2 | Rare | 10⁻⁶ à 10⁻⁴ |
| 3 | Occasionnel | 10⁻⁴ à 10⁻² |
| 4 | Probable | 10⁻² à 10⁻¹ |
| 5 | Fréquent | > 10⁻¹ |

2.3 Matrice d'acceptabilité
| S\\P | 1 | 2 | 3 | 4 | 5 |
|-----|---|---|---|---|---|
| 5 | 🟡 | 🟠 | 🔴 | 🔴 | 🔴 |
| 4 | 🟢 | 🟡 | 🟠 | 🔴 | 🔴 |
| 3 | 🟢 | 🟢 | 🟡 | 🟠 | 🔴 |
| 2 | 🟢 | 🟢 | 🟢 | 🟡 | 🟠 |
| 1 | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 |

🟢 Acceptable | 🟡 ALARP | 🟠 Inacceptable (réduction requise) | 🔴 Inacceptable

═══════════════════════════════════════════════════════════

3. IDENTIFICATION DES DANGERS

| ID | Danger | Source | Situation dangereuse |
|----|--------|--------|---------------------|
| H-01 | {danger_1} | {source_1} | {situation_1} |
| H-02 | {danger_2} | {source_2} | {situation_2} |
| H-03 | {danger_3} | {source_3} | {situation_3} |
| H-04 | {danger_4} | {source_4} | {situation_4} |
| H-05 | {danger_5} | {source_5} | {situation_5} |

═══════════════════════════════════════════════════════════

4. ÉVALUATION ET MAÎTRISE DES RISQUES

| ID | Dommage | S₀ | P₀ | R₀ | Mesure de maîtrise | S₁ | P₁ | R₁ |
|----|---------|----|----|----|--------------------|----|----|---- |
| R-01 | {dommage_1} | {s0_1} | {p0_1} | {r0_1} | {mesure_1} | {s1_1} | {p1_1} | {r1_1} |
| R-02 | {dommage_2} | {s0_2} | {p0_2} | {r0_2} | {mesure_2} | {s1_2} | {p1_2} | {r1_2} |
| R-03 | {dommage_3} | {s0_3} | {p0_3} | {r0_3} | {mesure_3} | {s1_3} | {p1_3} | {r1_3} |

S₀/P₀/R₀: Estimation initiale | S₁/P₁/R₁: Estimation après maîtrise

═══════════════════════════════════════════════════════════

5. RISQUE RÉSIDUEL GLOBAL

5.1 Synthèse
• Nombre total de risques identifiés: {total_risques}
• Risques acceptables: {risques_acceptables}
• Risques ALARP: {risques_alarp}
• Risques résiduels à surveiller: {risques_surveiller}

5.2 Évaluation du bénéfice/risque
{evaluation_benefice_risque}

5.3 Conclusion
{conclusion_risque}

═══════════════════════════════════════════════════════════

6. APPROBATIONS

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Analyste | {nom_analyste} | {date_analyse} | |
| Responsable Qualité | {nom_resp_qualite} | {date_qualite} | |
| Direction | {nom_direction} | {date_direction} | |

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Technical File
 */
export const TECHNICAL_FILE_CONTENT = `
FICHE TECHNIQUE
Dispositif Médical

═══════════════════════════════════════════════════════════

IDENTIFICATION DU PRODUIT

Nom commercial: {nom_commercial}
Modèle: {modele}
Référence: {reference}
Code UDI-DI: {udi_di}
Classification MDR: Classe {classe}
Code GMDN: {gmdn_code} - {gmdn_description}

═══════════════════════════════════════════════════════════

1. DESCRIPTION GÉNÉRALE

1.1 Vue d'ensemble
{description_generale}

1.2 Principe de fonctionnement
{principe_fonctionnement}

1.3 Composants principaux
• {composant_1}
• {composant_2}
• {composant_3}
• {composant_4}

═══════════════════════════════════════════════════════════

2. DESTINATION

2.1 Utilisation prévue
{utilisation_prevue}

2.2 Population cible
• Patients: {population_patients}
• Utilisateurs: {population_utilisateurs}
• Environnement: {environnement_utilisation}

2.3 Indications
• {indication_1}
• {indication_2}
• {indication_3}

2.4 Contre-indications
• {contre_indication_1}
• {contre_indication_2}

═══════════════════════════════════════════════════════════

3. SPÉCIFICATIONS TECHNIQUES

3.1 Dimensions et poids
| Paramètre | Valeur | Tolérance |
|-----------|--------|-----------|
| Longueur | {longueur} mm | ±{tol_l} |
| Largeur | {largeur} mm | ±{tol_w} |
| Hauteur | {hauteur} mm | ±{tol_h} |
| Poids | {poids} kg | ±{tol_p} |

3.2 Caractéristiques électriques
| Paramètre | Valeur |
|-----------|--------|
| Alimentation | {alimentation} |
| Consommation | {consommation} |
| Classe de protection | {classe_protection} |
| Type partie appliquée | {type_partie_appliquee} |

3.3 Performances
| Paramètre | Spécification | Méthode de test |
|-----------|---------------|-----------------|
| {param_perf_1} | {spec_1} | {methode_1} |
| {param_perf_2} | {spec_2} | {methode_2} |
| {param_perf_3} | {spec_3} | {methode_3} |

═══════════════════════════════════════════════════════════

4. CONDITIONS D'UTILISATION

4.1 Conditions environnementales
| Condition | Fonctionnement | Stockage |
|-----------|----------------|----------|
| Température | {temp_fonct} | {temp_stock} |
| Humidité relative | {hr_fonct} | {hr_stock} |
| Pression | {pression_fonct} | {pression_stock} |

4.2 Durée de vie
• Durée de vie du dispositif: {duree_vie}
• Fréquence de maintenance: {freq_maintenance}
• Pièces de rechange: {pieces_rechange}

═══════════════════════════════════════════════════════════

5. MATÉRIAUX

5.1 Matériaux en contact avec le patient
| Composant | Matériau | Biocompatibilité |
|-----------|----------|------------------|
| {comp_mat_1} | {materiau_1} | ISO 10993 - {test_bio_1} |
| {comp_mat_2} | {materiau_2} | ISO 10993 - {test_bio_2} |

5.2 Substances préoccupantes
{substances_preoccupantes}

═══════════════════════════════════════════════════════════

6. STÉRILISATION (si applicable)

Méthode: {methode_sterilisation}
SAL: {sal}
Validation: {ref_validation_steril}

═══════════════════════════════════════════════════════════

7. EMBALLAGE ET ÉTIQUETAGE

7.1 Configuration de l'emballage
{config_emballage}

7.2 Symboles utilisés
• Conformes à EN ISO 15223-1
• {symboles_specifiques}

═══════════════════════════════════════════════════════════

8. NORMES APPLICABLES

| Norme | Titre | Application |
|-------|-------|-------------|
| EN ISO 13485 | SMQ dispositifs médicaux | Applicable |
| EN ISO 14971 | Gestion des risques | Applicable |
| EN 60601-1 | Sécurité électrique | {applicable_60601} |
| EN 62366-1 | Aptitude à l'utilisation | Applicable |
| {norme_spec_1} | {titre_norme_1} | {application_1} |

═══════════════════════════════════════════════════════════

HISTORIQUE DES RÉVISIONS

| Version | Date | Modifications | Auteur |
|---------|------|---------------|--------|
| 1.0 | {date_v1} | Création | {auteur_v1} |
| {version_actuelle} | {date_actuelle} | {modif_actuelle} | {auteur_actuel} |

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Quality Manual
 */
export const QUALITY_MANUAL_CONTENT = `
MANUEL QUALITÉ
Système de Management de la Qualité ISO 13485:2016

Organisme: {nom_organisme}
Référence: MQ-{reference}
Version: {version}
Date d'approbation: {date_approbation}

═══════════════════════════════════════════════════════════

1. INTRODUCTION

1.1 Présentation de l'organisme
{presentation_organisme}

1.2 Domaine d'application
Le présent manuel qualité s'applique à la conception, développement, production et distribution de dispositifs médicaux conformément aux exigences de:
• ISO 13485:2016
• Règlement (UE) 2017/745 (MDR)
• Exigences réglementaires applicables

1.3 Exclusions
{exclusions_justifiees}

═══════════════════════════════════════════════════════════

2. RÉFÉRENCES NORMATIVES

| Référence | Titre |
|-----------|-------|
| ISO 13485:2016 | Dispositifs médicaux - SMQ - Exigences à des fins réglementaires |
| ISO 14971:2019 | Application de la gestion des risques aux dispositifs médicaux |
| ISO 10993-1 | Évaluation biologique des dispositifs médicaux |
| EN 62366-1 | Ingénierie de l'aptitude à l'utilisation |
| MDR 2017/745 | Règlement relatif aux dispositifs médicaux |

═══════════════════════════════════════════════════════════

3. TERMES ET DÉFINITIONS

• SMQ: Système de Management de la Qualité
• DM: Dispositif Médical
• CAPA: Corrective and Preventive Actions
• NC: Non-Conformité
• ON: Organisme Notifié

═══════════════════════════════════════════════════════════

4. SYSTÈME DE MANAGEMENT DE LA QUALITÉ

4.1 Exigences générales
L'organisme a établi, documenté, mis en œuvre et maintenu un SMQ et en améliore en permanence l'efficacité conformément aux exigences de la norme ISO 13485.

4.2 Exigences relatives à la documentation

4.2.1 Généralités
La documentation du SMQ comprend:
• La politique qualité et les objectifs qualité
• Le présent manuel qualité
• Les procédures documentées
• Les documents de planification, de fonctionnement et de maîtrise
• Les enregistrements requis

4.2.2 Manuel qualité
Ce manuel définit le domaine d'application, les procédures ou leur référence, et l'interaction des processus.

4.2.3 Dossier du dispositif médical
Chaque type de dispositif dispose d'un dossier comprenant:
• Description et spécifications
• Procédés de fabrication
• Exigences d'étiquetage et d'emballage
• Procédures de mesure et surveillance

═══════════════════════════════════════════════════════════

5. RESPONSABILITÉ DE LA DIRECTION

5.1 Engagement de la direction
La direction s'engage à développer et mettre en œuvre le SMQ, à établir la politique et les objectifs qualité, et à mener des revues de direction.

5.2 Orientation client
Les exigences des clients et réglementaires sont déterminées et satisfaites.

5.3 Politique qualité
{politique_qualite}

5.4 Objectifs qualité

| Objectif | Indicateur | Cible | Fréquence |
|----------|------------|-------|-----------|
| Satisfaction client | {indicateur_1} | {cible_1} | {freq_1} |
| Conformité produit | {indicateur_2} | {cible_2} | {freq_2} |
| Délais de livraison | {indicateur_3} | {cible_3} | {freq_3} |

5.5 Responsabilité et autorité
L'organigramme et les fiches de fonction définissent les responsabilités.

5.6 Représentant de la direction
Nom: {representant_direction}
Responsabilités: Assurer l'établissement, la mise en œuvre et le maintien du SMQ.

═══════════════════════════════════════════════════════════

6. MANAGEMENT DES RESSOURCES

6.1 Mise à disposition des ressources
Les ressources nécessaires sont déterminées et fournies.

6.2 Ressources humaines
• Compétences requises définies
• Formation dispensée
• Efficacité évaluée
• Enregistrements conservés

6.3 Infrastructure
• Bâtiments et espaces de travail
• Équipements et logiciels
• Services support

6.4 Environnement de travail
Conditions maîtrisées: {conditions_environnement}

═══════════════════════════════════════════════════════════

7. RÉALISATION DU PRODUIT

7.1 Planification de la réalisation
Chaque projet fait l'objet d'un plan de développement.

7.2 Processus relatifs aux clients
• Exigences déterminées
• Revue des exigences
• Communication client

7.3 Conception et développement
| Phase | Éléments d'entrée | Éléments de sortie | Vérification |
|-------|-------------------|--------------------| -------------|
| Spécification | Besoins utilisateur | Spécifications | Revue |
| Conception | Spécifications | Design | Revue |
| Vérification | Design | Résultats tests | Rapport |
| Validation | Produit final | Validation clinique | Approbation |

7.4 Achats
• Fournisseurs évalués et qualifiés
• Critères de sélection définis
• Vérifications à la réception

7.5 Production et prestation de service
• Maîtrise de la production
• Identification et traçabilité
• Propriété du client
• Préservation du produit

═══════════════════════════════════════════════════════════

8. MESURE, ANALYSE ET AMÉLIORATION

8.1 Surveillance et mesure
• Retour d'information client
• Audit interne (programme annuel)
• Surveillance des processus
• Surveillance du produit

8.2 Maîtrise du produit non conforme
Procédure: {ref_procedure_nc}

8.3 Analyse des données
Données analysées: satisfaction client, conformité produit, tendances, fournisseurs.

8.4 Amélioration
• Actions correctives: {ref_procedure_capa}
• Actions préventives: {ref_procedure_capa}

═══════════════════════════════════════════════════════════

APPROBATIONS

| Fonction | Nom | Signature | Date |
|----------|-----|-----------|------|
| Rédacteur | {redacteur} | | {date_redaction} |
| Vérificateur | {verificateur} | | {date_verification} |
| Approbateur | {approbateur} | | {date_approbation} |

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Clinical Evaluation
 */
export const CLINICAL_EVALUATION_CONTENT = `
ÉVALUATION CLINIQUE
Conformément à l'Annexe XIV du Règlement (UE) 2017/745

Dispositif: {nom_dispositif}
Référence: CER-{reference}
Version: {version}
Classification: Classe {classe_risque}

═══════════════════════════════════════════════════════════

RÉSUMÉ EXÉCUTIF

Ce rapport d'évaluation clinique démontre que le dispositif {nom_dispositif} satisfait aux exigences générales de sécurité et de performance pertinentes lorsqu'il est utilisé conformément à sa destination prévue.

Conclusions principales:
• {conclusion_1}
• {conclusion_2}
• {conclusion_3}

Bénéfice/Risque: {ratio_benefice_risque}

═══════════════════════════════════════════════════════════

1. PORTÉE DE L'ÉVALUATION CLINIQUE

1.1 Identification du dispositif
| Élément | Description |
|---------|-------------|
| Nom commercial | {nom_commercial} |
| Modèle/Référence | {modele_reference} |
| Code UDI-DI | {udi_di} |
| Classification MDR | Classe {classe} |
| Destination | {destination} |

1.2 Description du dispositif
{description_dispositif}

1.3 Destination et indications
{destination_indications}

1.4 Population cible
• Patients: {population_patients}
• Utilisateurs: {population_utilisateurs}

1.5 Contre-indications
• {contre_indication_1}
• {contre_indication_2}

═══════════════════════════════════════════════════════════

2. CONTEXTE CLINIQUE

2.1 État de l'art
{etat_art}

2.2 Alternatives thérapeutiques
| Alternative | Avantages | Inconvénients |
|-------------|-----------|---------------|
| {alt_1} | {avantages_1} | {inconvenients_1} |
| {alt_2} | {avantages_2} | {inconvenients_2} |

2.3 Dispositifs équivalents
| Caractéristique | Dispositif évalué | Dispositif équivalent |
|-----------------|-------------------|----------------------|
| Technique | {tech_eval} | {tech_equiv} |
| Biologique | {bio_eval} | {bio_equiv} |
| Clinique | {clin_eval} | {clin_equiv} |

Justification de l'équivalence: {justification_equivalence}

═══════════════════════════════════════════════════════════

3. DONNÉES CLINIQUES

3.1 Identification des données
Sources recherchées:
• Bases de données: PubMed, Embase, Cochrane
• Registres: ClinicalTrials.gov, EUDAMED
• Données post-marché du fabricant
• Vigilance: MAUDE, BfArM

3.2 Stratégie de recherche
Termes utilisés: {termes_recherche}
Période: {periode_recherche}
Critères d'inclusion/exclusion: {criteres_selection}

3.3 Résultats de la recherche

| Source | Études identifiées | Retenues | Exclues |
|--------|-------------------|----------|---------|
| PubMed | {pubmed_id} | {pubmed_ret} | {pubmed_excl} |
| Embase | {embase_id} | {embase_ret} | {embase_excl} |
| Fabricant | {fab_id} | {fab_ret} | {fab_excl} |

═══════════════════════════════════════════════════════════

4. ÉVALUATION DES DONNÉES

4.1 Évaluation de la qualité des données

| Étude | Design | Niveau preuve | Score qualité |
|-------|--------|---------------|---------------|
| {etude_1} | {design_1} | {niveau_1} | {score_1} |
| {etude_2} | {design_2} | {niveau_2} | {score_2} |
| {etude_3} | {design_3} | {niveau_3} | {score_3} |

4.2 Analyse de la sécurité

Événements indésirables rapportés:
| Événement | Fréquence | Gravité | Relation causale |
|-----------|-----------|---------|------------------|
| {ei_1} | {freq_1} | {grav_1} | {relation_1} |
| {ei_2} | {freq_2} | {grav_2} | {relation_2} |

4.3 Analyse des performances

| Critère de performance | Résultat | Objectif | Atteint |
|-----------------------|----------|----------|---------|
| {critere_1} | {resultat_1} | {objectif_1} | {atteint_1} |
| {critere_2} | {resultat_2} | {objectif_2} | {atteint_2} |
| {critere_3} | {resultat_3} | {objectif_3} | {atteint_3} |

═══════════════════════════════════════════════════════════

5. ANALYSE BÉNÉFICE/RISQUE

5.1 Bénéfices cliniques identifiés
• {benefice_1}
• {benefice_2}
• {benefice_3}

5.2 Risques résiduels
• {risque_1}
• {risque_2}

5.3 Conclusion de l'analyse
{conclusion_benefice_risque}

═══════════════════════════════════════════════════════════

6. SUIVI CLINIQUE POST-MARCHÉ (SCPM)

6.1 Plan de SCPM
Un plan de SCPM a été établi pour:
• Confirmer la sécurité et les performances
• Identifier les risques émergents
• Mettre à jour l'évaluation clinique

6.2 Activités prévues
| Activité | Fréquence | Responsable |
|----------|-----------|-------------|
| Revue de littérature | {freq_litt} | {resp_litt} |
| Analyse des réclamations | {freq_recl} | {resp_recl} |
| Enquête de satisfaction | {freq_enq} | {resp_enq} |

6.3 Critères de déclenchement
{criteres_declenchement}

═══════════════════════════════════════════════════════════

7. CONCLUSIONS

7.1 Conformité aux EGSP
Le dispositif satisfait aux exigences générales de sécurité et de performance de l'Annexe I du MDR.

7.2 Bénéfice/Risque acceptable
Le rapport bénéfice/risque est jugé acceptable pour la destination prévue.

7.3 Prochaine mise à jour
Date prévue: {date_prochaine_maj}
Ou plus tôt si événement significatif.

═══════════════════════════════════════════════════════════

APPROBATIONS

| Rôle | Nom | Qualification | Date | Signature |
|------|-----|---------------|------|-----------|
| Évaluateur clinique | {nom_evaluateur} | {qualif_evaluateur} | {date_eval} | |
| Responsable Affaires Réglementaires | {nom_rar} | {qualif_rar} | {date_rar} | |
| Directeur Médical | {nom_dm} | {qualif_dm} | {date_dm} | |

═══════════════════════════════════════════════════════════

ANNEXES

A. Liste complète des références bibliographiques
B. Tableaux d'extraction des données
C. Analyse critique détaillée de chaque étude
D. Curriculum vitae des évaluateurs cliniques

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Design History File
 */
export const DESIGN_HISTORY_CONTENT = `
DESIGN HISTORY FILE (DHF)
Dossier Historique de Conception
Conforme à FDA 21 CFR Part 820.30

═══════════════════════════════════════════════════════════

IDENTIFICATION DU PROJET

Nom du projet: {nom_projet}
Référence DHF: DHF-{reference}
Version: {version}
Dispositif: {nom_dispositif}
Classification FDA: Classe {classe_fda}

═══════════════════════════════════════════════════════════

1. PLAN DE CONCEPTION

1.1 Objectifs du projet
{objectifs_projet}

1.2 Phases du développement
| Phase | Description | Livrables | Date cible |
|-------|-------------|-----------|------------|
| Phase 1 | Définition des besoins | User Needs | {date_phase1} |
| Phase 2 | Spécifications | Design Input | {date_phase2} |
| Phase 3 | Conception | Design Output | {date_phase3} |
| Phase 4 | Vérification | Rapports de tests | {date_phase4} |
| Phase 5 | Validation | Validation clinique | {date_phase5} |

═══════════════════════════════════════════════════════════

2. BESOINS UTILISATEURS (USER NEEDS)

| ID | Besoin | Source | Priorité |
|----|--------|--------|----------|
| UN-01 | {besoin_1} | {source_1} | Essentiel |
| UN-02 | {besoin_2} | {source_2} | Important |
| UN-03 | {besoin_3} | {source_3} | Souhaitable |

═══════════════════════════════════════════════════════════

3. DESIGN INPUT (Données d'entrée de conception)

| ID | Exigence | Type | Traçabilité UN |
|----|----------|------|----------------|
| DI-01 | {exigence_1} | Fonctionnelle | UN-01 |
| DI-02 | {exigence_2} | Performance | UN-01, UN-02 |
| DI-03 | {exigence_3} | Sécurité | UN-03 |

═══════════════════════════════════════════════════════════

4. DESIGN OUTPUT (Données de sortie de conception)

4.1 Spécifications techniques
{specifications_techniques}

4.2 Dessins et schémas
| Référence | Titre | Version |
|-----------|-------|---------|
| {ref_dessin_1} | {titre_1} | {ver_1} |
| {ref_dessin_2} | {titre_2} | {ver_2} |

═══════════════════════════════════════════════════════════

5. REVUES DE CONCEPTION

| Revue | Date | Participants | Décision |
|-------|------|--------------|----------|
| Revue préliminaire | {date_revue_1} | {participants_1} | {decision_1} |
| Revue critique | {date_revue_2} | {participants_2} | {decision_2} |
| Revue finale | {date_revue_3} | {participants_3} | {decision_3} |

═══════════════════════════════════════════════════════════

6. VÉRIFICATION DE CONCEPTION

| ID Test | Design Output vérifié | Méthode | Résultat |
|---------|----------------------|---------|----------|
| VER-01 | DI-01 | Test fonctionnel | {resultat_ver_1} |
| VER-02 | DI-02 | Mesure | {resultat_ver_2} |
| VER-03 | DI-03 | Inspection | {resultat_ver_3} |

═══════════════════════════════════════════════════════════

7. VALIDATION DE CONCEPTION

7.1 Protocole de validation
{protocole_validation}

7.2 Résultats de validation
| Critère | Objectif | Résultat | Conforme |
|---------|----------|----------|----------|
| {critere_val_1} | {objectif_1} | {resultat_1} | ☐ |
| {critere_val_2} | {objectif_2} | {resultat_2} | ☐ |

═══════════════════════════════════════════════════════════

8. TRANSFERT EN PRODUCTION

8.1 Design Transfer Checklist
☐ Spécifications de fabrication complètes
☐ Procédures de contrôle qualité établies
☐ Formation du personnel effectuée
☐ Validation des procédés réalisée

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Usability Engineering
 */
export const USABILITY_ENGINEERING_CONTENT = `
DOSSIER D'APTITUDE À L'UTILISATION
Conforme à IEC 62366-1:2015

═══════════════════════════════════════════════════════════

IDENTIFICATION

Dispositif: {nom_dispositif}
Référence: UE-{reference}
Version: {version}

═══════════════════════════════════════════════════════════

1. SPÉCIFICATION DE L'UTILISATION

1.1 Utilisateurs prévus
| Type d'utilisateur | Caractéristiques | Formation requise |
|-------------------|------------------|-------------------|
| Professionnel de santé | {caract_pro} | {formation_pro} |
| Patient | {caract_patient} | {formation_patient} |

1.2 Environnement d'utilisation
{environnement_utilisation}

1.3 Profil d'utilisation
{profil_utilisation}

═══════════════════════════════════════════════════════════

2. ANALYSE DES TÂCHES

| ID | Tâche | Fréquence | Criticité |
|----|-------|-----------|-----------|
| T-01 | {tache_1} | {freq_1} | {crit_1} |
| T-02 | {tache_2} | {freq_2} | {crit_2} |
| T-03 | {tache_3} | {freq_3} | {crit_3} |

═══════════════════════════════════════════════════════════

3. IDENTIFICATION DES DANGERS LIÉS À L'UTILISATION

| ID | Erreur d'utilisation | Danger associé | Gravité |
|----|---------------------|----------------|---------|
| UE-01 | {erreur_1} | {danger_1} | {gravite_1} |
| UE-02 | {erreur_2} | {danger_2} | {gravite_2} |

═══════════════════════════════════════════════════════════

4. TESTS D'UTILISABILITÉ

4.1 Tests formatifs
| Session | Date | Participants | Problèmes identifiés |
|---------|------|--------------|---------------------|
| TF-01 | {date_tf1} | {nb_part_1} | {problemes_1} |

4.2 Tests sommatifs
| Tâche | Succès | Temps moyen | Erreurs |
|-------|--------|-------------|---------|
| {tache_test_1} | {succes_1}% | {temps_1} | {erreurs_1} |

═══════════════════════════════════════════════════════════

5. CONCLUSION

Déclaration de conformité à l'aptitude à l'utilisation:
{conclusion_aptitude}

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Post-Market Surveillance
 */
export const POST_MARKET_SURVEILLANCE_CONTENT = `
PLAN DE SURVEILLANCE POST-MARCHÉ
Conformément à l'Article 84 du Règlement (UE) 2017/745

═══════════════════════════════════════════════════════════

IDENTIFICATION

Dispositif: {nom_dispositif}
Référence PMS: PMS-{reference}
Version: {version}
Classe: {classe_risque}

═══════════════════════════════════════════════════════════

1. OBJECTIFS DE LA SURVEILLANCE

• Collecter et analyser les données de sécurité et de performance
• Identifier les tendances et événements émergents
• Maintenir le rapport bénéfice/risque acceptable
• Alimenter le processus d'amélioration continue

═══════════════════════════════════════════════════════════

2. SOURCES DE DONNÉES

| Source | Type de données | Fréquence |
|--------|-----------------|-----------|
| Réclamations clients | Qualité, sécurité | Continue |
| Vigilance (EUDAMED) | Incidents | Continue |
| Littérature scientifique | Clinique | {freq_litt} |
| Retours terrain | Performance | Mensuelle |

═══════════════════════════════════════════════════════════

3. INDICATEURS DE PERFORMANCE

| Indicateur | Seuil d'alerte | Seuil critique |
|------------|----------------|----------------|
| Taux de réclamations | {seuil_recl_alerte} | {seuil_recl_crit} |
| Incidents graves | {seuil_inc_alerte} | {seuil_inc_crit} |
| Retours produits | {seuil_ret_alerte} | {seuil_ret_crit} |

═══════════════════════════════════════════════════════════

4. RAPPORTS

| Type de rapport | Fréquence | Destinataire |
|-----------------|-----------|--------------|
| PSUR | Annuel | Autorités |
| Rapport PMS interne | {freq_interne} | Direction |
| Mise à jour CER | {freq_cer} | Dossier technique |

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Software Documentation
 */
export const SOFTWARE_DOCUMENTATION_CONTENT = `
DOCUMENTATION DU CYCLE DE VIE LOGICIEL
Conforme à IEC 62304:2006/AMD1:2015

═══════════════════════════════════════════════════════════

IDENTIFICATION DU LOGICIEL

Nom: {nom_logiciel}
Version: {version_logiciel}
Référence: SWD-{reference}
Classe de sécurité logiciel: Classe {classe_securite}

═══════════════════════════════════════════════════════════

1. PLAN DE DÉVELOPPEMENT LOGICIEL

1.1 Modèle de cycle de vie
{modele_cycle_vie}

1.2 Activités de développement
| Phase | Activité | Livrable |
|-------|----------|----------|
| Exigences | Analyse des besoins | SRS |
| Architecture | Conception système | SAD |
| Conception détaillée | Conception modules | SDD |
| Implémentation | Codage | Code source |
| Tests | Vérification | Rapports de tests |

═══════════════════════════════════════════════════════════

2. EXIGENCES LOGICIELLES (SRS)

| ID | Exigence | Type | Traçabilité |
|----|----------|------|-------------|
| SRS-01 | {exigence_sw_1} | Fonctionnelle | {trace_1} |
| SRS-02 | {exigence_sw_2} | Performance | {trace_2} |
| SRS-03 | {exigence_sw_3} | Sécurité | {trace_3} |

═══════════════════════════════════════════════════════════

3. ARCHITECTURE LOGICIELLE

3.1 Vue d'ensemble
{vue_architecture}

3.2 Composants logiciels
| SOUP | Version | Classification |
|------|---------|----------------|
| {soup_1} | {ver_soup_1} | {class_soup_1} |
| {soup_2} | {ver_soup_2} | {class_soup_2} |

═══════════════════════════════════════════════════════════

4. TESTS ET VÉRIFICATION

| Niveau | Méthode | Couverture cible |
|--------|---------|------------------|
| Unitaire | Automatisé | {couv_unit}% |
| Intégration | Manuel/Auto | {couv_integ}% |
| Système | Manuel | {couv_sys}% |

═══════════════════════════════════════════════════════════

5. GESTION DES ANOMALIES

| Catégorie | Priorité | Délai de résolution |
|-----------|----------|---------------------|
| Critique (sécurité) | Haute | Immédiat |
| Majeure | Moyenne | {delai_majeure} |
| Mineure | Basse | {delai_mineure} |

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Biocompatibility
 */
export const BIOCOMPATIBILITY_CONTENT = `
ÉVALUATION DE BIOCOMPATIBILITÉ
Conforme à ISO 10993-1:2018

═══════════════════════════════════════════════════════════

IDENTIFICATION

Dispositif: {nom_dispositif}
Référence: BIO-{reference}
Version: {version}

═══════════════════════════════════════════════════════════

1. CATÉGORISATION DU DISPOSITIF

1.1 Nature du contact
☐ Contact avec surface (peau, muqueuse, surface compromise)
☐ Contact externe communiquant (voie sanguine, tissu/os)
☐ Dispositif implantable

1.2 Durée de contact
☐ Contact limité (< 24h)
☐ Contact prolongé (24h - 30 jours)
☐ Contact permanent (> 30 jours)

═══════════════════════════════════════════════════════════

2. IDENTIFICATION DES MATÉRIAUX

| Composant | Matériau | Contact patient | Fournisseur |
|-----------|----------|-----------------|-------------|
| {comp_1} | {mat_1} | {contact_1} | {fourn_1} |
| {comp_2} | {mat_2} | {contact_2} | {fourn_2} |

═══════════════════════════════════════════════════════════

3. ENDPOINTS BIOLOGIQUES

| Endpoint | Requis | Test | Résultat |
|----------|--------|------|----------|
| Cytotoxicité | Oui | ISO 10993-5 | {res_cyto} |
| Sensibilisation | Oui | ISO 10993-10 | {res_sens} |
| Irritation | Oui | ISO 10993-23 | {res_irrit} |
| Génotoxicité | {req_geno} | ISO 10993-3 | {res_geno} |
| Hémocompatibilité | {req_hemo} | ISO 10993-4 | {res_hemo} |

═══════════════════════════════════════════════════════════

4. CONCLUSION

Évaluation globale: {conclusion_bio}
Rapport bénéfice/risque: {ratio_bio}

═══════════════════════════════════════════════════════════
`;

/**
 * Initial content for Labeling Review
 */
export const LABELING_REVIEW_CONTENT = `
REVUE DE L'ÉTIQUETAGE
Conforme à EN ISO 15223-1 et MDR Annexe I, Chapitre III

═══════════════════════════════════════════════════════════

IDENTIFICATION

Dispositif: {nom_dispositif}
Référence: LAB-{reference}
Version étiquetage: {version}

═══════════════════════════════════════════════════════════

1. VÉRIFICATION DES SYMBOLES ISO 15223-1

| Symbole | Signification | Requis | Présent | Conforme |
|---------|---------------|--------|---------|----------|
| 5.1.1 | Fabricant | Oui | ☐ | ☐ |
| 5.1.2 | Date de fabrication | Oui | ☐ | ☐ |
| 5.1.3 | Date de péremption | {req_peremption} | ☐ | ☐ |
| 5.1.4 | Numéro de lot | Oui | ☐ | ☐ |
| 5.1.6 | Numéro de série | {req_serie} | ☐ | ☐ |
| 5.2.4 | Référence catalogue | Oui | ☐ | ☐ |
| 5.4.2 | Consulter les instructions | Oui | ☐ | ☐ |
| 5.4.3 | Attention | {req_attention} | ☐ | ☐ |

═══════════════════════════════════════════════════════════

2. INFORMATIONS OBLIGATOIRES MDR

| Élément | Référence MDR | Présent | Conforme |
|---------|---------------|---------|----------|
| Nom ou raison sociale du fabricant | Art. 10(9) | ☐ | ☐ |
| Adresse du fabricant | Art. 10(9) | ☐ | ☐ |
| UDI-DI | Art. 27 | ☐ | ☐ |
| Destination du dispositif | Annexe I, 23.1 | ☐ | ☐ |
| Avertissements/précautions | Annexe I, 23.1 | ☐ | ☐ |

═══════════════════════════════════════════════════════════

3. NOTICE D'UTILISATION (IFU)

| Section | Contenu requis | Présent | Conforme |
|---------|----------------|---------|----------|
| Destination | Description claire | ☐ | ☐ |
| Indications | Liste complète | ☐ | ☐ |
| Contre-indications | Si applicable | ☐ | ☐ |
| Avertissements | Risques résiduels | ☐ | ☐ |
| Mode d'emploi | Instructions claires | ☐ | ☐ |

═══════════════════════════════════════════════════════════

4. CONCLUSION

Résultat de la revue: {conclusion_revue}
Actions requises: {actions_requises}

═══════════════════════════════════════════════════════════
`;

/**
 * Get document template by ID
 */
export function getDocumentTemplate(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find(doc => doc.id === id);
}

/**
 * Get initial content for a document type
 */
export function getDocumentContent(id: string): string {
  switch (id) {
    case 'ce-certificate':
      return CE_CERTIFICATE_CONTENT;
    case 'validation-protocol':
      return VALIDATION_PROTOCOL_CONTENT;
    case 'risk-analysis':
      return RISK_ANALYSIS_CONTENT;
    case 'technical-file':
      return TECHNICAL_FILE_CONTENT;
    case 'quality-manual':
      return QUALITY_MANUAL_CONTENT;
    case 'clinical-evaluation':
      return CLINICAL_EVALUATION_CONTENT;
    case 'design-history':
      return DESIGN_HISTORY_CONTENT;
    case 'usability-engineering':
      return USABILITY_ENGINEERING_CONTENT;
    case 'post-market-surveillance':
      return POST_MARKET_SURVEILLANCE_CONTENT;
    case 'software-documentation':
      return SOFTWARE_DOCUMENTATION_CONTENT;
    case 'biocompatibility':
      return BIOCOMPATIBILITY_CONTENT;
    case 'labeling-review':
      return LABELING_REVIEW_CONTENT;
    default:
      return '';
  }
}

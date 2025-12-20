/**
 * Rich Document Examples - Lexical Editor States
 * These are serialized Lexical editor states with proper formatting
 */

export interface RichDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  editorState: string;
}

/**
 * Helper to create a text node
 */
const text = (content: string, format: number = 0, style: string = "") => ({
  detail: 0,
  format,
  mode: "normal",
  style,
  text: content,
  type: "text",
  version: 1,
});

/**
 * Helper to create a paragraph
 */
const para = (children: unknown[], format: string = "") => ({
  children,
  direction: "ltr",
  format,
  indent: 0,
  type: "paragraph",
  version: 1,
});

/**
 * Helper to create a table cell
 */
const cell = (children: unknown[], headerState: number = 0) => ({
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  type: "tablecell",
  version: 1,
  colSpan: 1,
  rowSpan: 1,
  headerState,
  backgroundColor: null,
});

/**
 * Helper to create a table row
 */
const row = (cells: unknown[]) => ({
  children: cells,
  direction: "ltr",
  format: "",
  indent: 0,
  type: "tablerow",
  version: 1,
});

/**
 * Helper to create a table
 */
const table = (rows: unknown[]) => ({
  children: rows,
  direction: "ltr",
  format: "",
  indent: 0,
  type: "table",
  version: 1,
});

/**
 * Empty paragraph
 */
const emptyPara = () => para([]);

/**
 * Helper to wrap content in a folio node for proper editor integration
 */
const wrapInFolio = (children: unknown[], folioId: string = "folio-1") => ({
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  type: "folio",
  version: 1,
  folioId,
  folioIndex: 0,
  orientation: "portrait",
  sectionId: null,
});

/**
 * Helper to create document state with folio wrapper
 */
const createDocState = (content: unknown[]) => ({
  root: {
    children: [wrapInFolio(content)],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

/**
 * CE Certificate State
 */
const CE_CERTIFICATE_STATE = createDocState([
  para([text("DÉCLARATION UE DE CONFORMITÉ", 1)], "center"),
  para([text("Conformément au Règlement (UE) 2017/745 relatif aux dispositifs médicaux", 2)], "center"),
  emptyPara(),
  para([text("1. FABRICANT", 1)]),
  table([
    row([
      cell([text("Champ", 1)], 1),
      cell([text("Valeur", 1)], 1),
    ]),
    row([
      cell([text("Nom")]),
      cell([text("MedTech Solutions SAS", 1, "color: #3B82F6;")]),
    ]),
    row([
      cell([text("Adresse")]),
      cell([text("123 Avenue de l'Innovation, 75001 Paris, France")]),
    ]),
    row([
      cell([text("SRN")]),
      cell([text("FR-MF-000123456")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. DISPOSITIF MÉDICAL", 1)]),
  table([
    row([
      cell([text("Paramètre", 1)], 1),
      cell([text("Valeur", 1)], 1),
    ]),
    row([
      cell([text("Nom commercial")]),
      cell([text("CardioMonitor Pro X1", 1, "color: #3B82F6;")]),
    ]),
    row([
      cell([text("Référence")]),
      cell([text("CM-PRO-X1-2024")]),
    ]),
    row([
      cell([text("Classification")]),
      cell([text("Classe IIa", 1, "color: #F59E0B;")]),
    ]),
    row([
      cell([text("UDI-DI")]),
      cell([text("3760123456789012345")]),
    ]),
  ]),
  emptyPara(),
  para([text("3. CONFORMITÉ", 1)]),
  para([
    text("Ce dispositif est conforme aux "),
    text("exigences générales en matière de sécurité et de performances", 1),
    text(" énoncées à l'Annexe I du Règlement (UE) 2017/745."),
  ]),
  emptyPara(),
  para([text("4. ORGANISME NOTIFIÉ", 1)]),
  table([
    row([
      cell([text("Information", 1)], 1),
      cell([text("Détail", 1)], 1),
    ]),
    row([
      cell([text("Nom de l'ON")]),
      cell([text("BSI Group", 1)]),
    ]),
    row([
      cell([text("Numéro")]),
      cell([text("0086", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Certificat")]),
      cell([text("CE 123456")]),
    ]),
  ]),
  emptyPara(),
  para([text("5. SIGNATURE", 1)]),
  para([text("Lieu: Paris, France")]),
  para([text("Date: 15 Décembre 2024", 0, "color: #6B7280;")]),
  emptyPara(),
  para([text("_____________________________")]),
  para([text("Signature du représentant légal", 2)]),
]);

/**
 * Risk Analysis State (ISO 14971)
 */
const RISK_ANALYSIS_STATE = createDocState([
  para([text("ANALYSE DES RISQUES", 1)], "center"),
  para([text("Conformément à ISO 14971:2019", 2)], "center"),
  emptyPara(),
  para([text("1. INFORMATIONS GÉNÉRALES", 1)]),
  table([
    row([
      cell([text("Élément", 1)], 1),
      cell([text("Description", 1)], 1),
    ]),
    row([
      cell([text("Dispositif")]),
      cell([text("CardioMonitor Pro X1")]),
    ]),
    row([
      cell([text("Référence")]),
      cell([text("RA-CM-2024-001")]),
    ]),
    row([
      cell([text("Version")]),
      cell([text("2.0")]),
    ]),
    row([
      cell([text("Date")]),
      cell([text("15/12/2024")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. MATRICE DE CRITICITÉ", 1)]),
  table([
    row([
      cell([text("Probabilité / Gravité", 1)], 1),
      cell([text("Négligeable", 1)], 1),
      cell([text("Mineure", 1)], 1),
      cell([text("Grave", 1)], 1),
      cell([text("Critique", 1)], 1),
    ]),
    row([
      cell([text("Fréquent", 1)]),
      cell([text("M", 1, "color: #F59E0B;")]),
      cell([text("H", 1, "color: #EF4444;")]),
      cell([text("H", 1, "color: #EF4444;")]),
      cell([text("H", 1, "color: #EF4444;")]),
    ]),
    row([
      cell([text("Probable", 1)]),
      cell([text("L", 1, "color: #22C55E;")]),
      cell([text("M", 1, "color: #F59E0B;")]),
      cell([text("H", 1, "color: #EF4444;")]),
      cell([text("H", 1, "color: #EF4444;")]),
    ]),
    row([
      cell([text("Occasionnel", 1)]),
      cell([text("L", 1, "color: #22C55E;")]),
      cell([text("L", 1, "color: #22C55E;")]),
      cell([text("M", 1, "color: #F59E0B;")]),
      cell([text("H", 1, "color: #EF4444;")]),
    ]),
    row([
      cell([text("Rare", 1)]),
      cell([text("L", 1, "color: #22C55E;")]),
      cell([text("L", 1, "color: #22C55E;")]),
      cell([text("L", 1, "color: #22C55E;")]),
      cell([text("M", 1, "color: #F59E0B;")]),
    ]),
  ]),
  para([text("L = Low (Acceptable) | M = Medium (ALARP) | H = High (Inacceptable)", 2)]),
  emptyPara(),
  para([text("3. REGISTRE DES RISQUES", 1)]),
  table([
    row([
      cell([text("ID", 1)], 1),
      cell([text("Danger", 1)], 1),
      cell([text("P", 1)], 1),
      cell([text("G", 1)], 1),
      cell([text("Risque", 1)], 1),
      cell([text("Mesure", 1)], 1),
      cell([text("Résiduel", 1)], 1),
    ]),
    row([
      cell([text("R-001")]),
      cell([text("Choc électrique")]),
      cell([text("2")]),
      cell([text("4")]),
      cell([text("H", 1, "color: #EF4444;")]),
      cell([text("Isolation double")]),
      cell([text("L", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("R-002")]),
      cell([text("Fausse alarme")]),
      cell([text("3")]),
      cell([text("2")]),
      cell([text("M", 1, "color: #F59E0B;")]),
      cell([text("Algorithme amélioré")]),
      cell([text("L", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("R-003")]),
      cell([text("Données erronées")]),
      cell([text("2")]),
      cell([text("3")]),
      cell([text("M", 1, "color: #F59E0B;")]),
      cell([text("Validation capteur")]),
      cell([text("L", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("R-004")]),
      cell([text("Allergie cutanée")]),
      cell([text("2")]),
      cell([text("1")]),
      cell([text("L", 1, "color: #22C55E;")]),
      cell([text("Matériaux biocompat.")]),
      cell([text("L", 1, "color: #22C55E;")]),
    ]),
  ]),
  emptyPara(),
  para([text("4. CONCLUSION", 1)]),
  para([
    text("Tous les risques identifiés ont été évalués et des mesures de maîtrise appropriées ont été mises en place. Le "),
    text("rapport bénéfice/risque est FAVORABLE", 1, "color: #22C55E;"),
    text("."),
  ]),
]);

/**
 * Technical Documentation (IFU)
 */
const TECHNICAL_DOC_STATE = createDocState([
  para([text("NOTICE D'UTILISATION", 1)], "center"),
  para([text("Instructions For Use (IFU)", 2)], "center"),
  emptyPara(),
  para([text("INFORMATIONS PRODUIT", 1)]),
  table([
    row([
      cell([text("Information", 1)], 1),
      cell([text("Valeur", 1)], 1),
    ]),
    row([
      cell([text("Nom commercial")]),
      cell([text("CardioMonitor Pro X1", 1, "color: #3B82F6;")]),
    ]),
    row([
      cell([text("Référence")]),
      cell([text("CM-PRO-X1-2024")]),
    ]),
    row([
      cell([text("Version logiciel")]),
      cell([text("3.2.1")]),
    ]),
  ]),
  emptyPara(),
  para([text("DESTINATION D'UTILISATION", 1)]),
  para([text("Ce dispositif médical est destiné à la surveillance continue des paramètres cardiaques chez les patients adultes en milieu hospitalier et ambulatoire.")]),
  emptyPara(),
  para([text("CONTRE-INDICATIONS", 1)]),
  para([text("• Patients porteurs de pacemaker")]),
  para([text("• Environnements à forte interférence électromagnétique")]),
  para([text("• Utilisation en présence de gaz anesthésiques inflammables")]),
  emptyPara(),
  para([text("AVERTISSEMENTS", 1)]),
  table([
    row([
      cell([text("Symbole", 1)], 1),
      cell([text("Signification", 1)], 1),
    ]),
    row([
      cell([text("!", 1, "color: #EF4444;")]),
      cell([text("Lire attentivement les instructions avant utilisation")]),
    ]),
    row([
      cell([text("IPX4", 1, "color: #F59E0B;")]),
      cell([text("Protection contre les projections d'eau")]),
    ]),
    row([
      cell([text("CE", 1, "color: #22C55E;")]),
      cell([text("Conforme aux exigences européennes")]),
    ]),
  ]),
]);

/**
 * Clinical Evaluation Report
 */
const CLINICAL_EVALUATION_STATE = createDocState([
  para([text("RAPPORT D'ÉVALUATION CLINIQUE", 1)], "center"),
  para([text("Conformément à l'Annexe XIV du MDR 2017/745", 2)], "center"),
  emptyPara(),
  para([text("1. IDENTIFICATION DU DISPOSITIF", 1)]),
  table([
    row([
      cell([text("Paramètre", 1)], 1),
      cell([text("Valeur", 1)], 1),
    ]),
    row([
      cell([text("Dispositif évalué")]),
      cell([text("CardioMonitor Pro X1", 1, "color: #3B82F6;")]),
    ]),
    row([
      cell([text("Classification")]),
      cell([text("Classe IIa - Annexe IX Chapitre I", 1)]),
    ]),
    row([
      cell([text("Date d'évaluation")]),
      cell([text("15/12/2024")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. DONNÉES CLINIQUES ANALYSÉES", 1)]),
  table([
    row([
      cell([text("Source", 1)], 1),
      cell([text("Études", 1)], 1),
      cell([text("Patients", 1)], 1),
      cell([text("Pertinence", 1)], 1),
    ]),
    row([
      cell([text("Littérature scientifique")]),
      cell([text("45")]),
      cell([text("12,500")]),
      cell([text("Élevée", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Études cliniques propres")]),
      cell([text("3")]),
      cell([text("850")]),
      cell([text("Directe", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Données de PMS")]),
      cell([text("N/A")]),
      cell([text("25,000")]),
      cell([text("Élevée", 1, "color: #22C55E;")]),
    ]),
  ]),
  emptyPara(),
  para([text("3. CONCLUSION", 1)]),
  para([
    text("Sur la base des données cliniques analysées, le rapport bénéfice/risque du dispositif est "),
    text("FAVORABLE", 1, "color: #22C55E;"),
    text(". Les performances cliniques revendiquées sont démontrées et les risques résiduels sont acceptables."),
  ]),
]);

/**
 * Post-Market Surveillance Plan
 */
const PMS_PLAN_STATE = createDocState([
  para([text("PLAN DE SURVEILLANCE APRÈS MISE SUR LE MARCHÉ", 1)], "center"),
  para([text("Post-Market Surveillance (PMS) - Article 83 MDR", 2)], "center"),
  emptyPara(),
  para([text("1. SOURCES DE DONNÉES", 1)]),
  table([
    row([
      cell([text("Source", 1)], 1),
      cell([text("Fréquence", 1)], 1),
      cell([text("Responsable", 1)], 1),
    ]),
    row([
      cell([text("Réclamations clients")]),
      cell([text("Continue")]),
      cell([text("Service Qualité")]),
    ]),
    row([
      cell([text("Incidents et vigilance")]),
      cell([text("Continue")]),
      cell([text("PRRC")]),
    ]),
    row([
      cell([text("Veille scientifique")]),
      cell([text("Mensuelle")]),
      cell([text("Affaires Réglementaires")]),
    ]),
    row([
      cell([text("EUDAMED")]),
      cell([text("Hebdomadaire")]),
      cell([text("Affaires Réglementaires")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. INDICATEURS DE PERFORMANCE (KPIs)", 1)]),
  table([
    row([
      cell([text("KPI", 1)], 1),
      cell([text("Cible", 1)], 1),
      cell([text("Actuel", 1)], 1),
      cell([text("Statut", 1)], 1),
    ]),
    row([
      cell([text("Taux de réclamations")]),
      cell([text("< 0.5%")]),
      cell([text("0.3%")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Incidents graves")]),
      cell([text("0")]),
      cell([text("0")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Temps réponse CAPA")]),
      cell([text("< 30j")]),
      cell([text("25j")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
  ]),
]);

/**
 * Software Documentation (IEC 62304)
 */
const SOFTWARE_DOC_STATE = createDocState([
  para([text("DOCUMENTATION LOGICIEL DISPOSITIF MÉDICAL", 1)], "center"),
  para([text("Conformément à IEC 62304:2006/AMD1:2015", 2)], "center"),
  emptyPara(),
  para([text("1. CLASSIFICATION DU LOGICIEL", 1)]),
  table([
    row([
      cell([text("Élément", 1)], 1),
      cell([text("Valeur", 1)], 1),
    ]),
    row([
      cell([text("Nom du logiciel")]),
      cell([text("CardioMonitor Firmware", 1, "color: #3B82F6;")]),
    ]),
    row([
      cell([text("Version")]),
      cell([text("3.2.1-release")]),
    ]),
    row([
      cell([text("Classification de sécurité")]),
      cell([text("Classe B", 1, "color: #F59E0B;")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. ARCHITECTURE LOGICIELLE", 1)]),
  table([
    row([
      cell([text("Module", 1)], 1),
      cell([text("Description", 1)], 1),
      cell([text("Classe", 1)], 1),
    ]),
    row([
      cell([text("Signal Processing")]),
      cell([text("Traitement des signaux ECG en temps réel")]),
      cell([text("C", 1, "color: #EF4444;")]),
    ]),
    row([
      cell([text("Alarm Manager")]),
      cell([text("Gestion des alarmes et notifications")]),
      cell([text("B", 1, "color: #F59E0B;")]),
    ]),
    row([
      cell([text("Data Logger")]),
      cell([text("Enregistrement et stockage des données")]),
      cell([text("A", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("UI Controller")]),
      cell([text("Interface utilisateur et affichage")]),
      cell([text("A", 1, "color: #22C55E;")]),
    ]),
  ]),
  emptyPara(),
  para([text("Classe A: Pas de blessure | Classe B: Blessure non grave | Classe C: Mort ou blessure grave", 2)]),
]);

/**
 * Design History File (DHF)
 */
const DHF_STATE = createDocState([
  para([text("DOSSIER HISTORIQUE DE CONCEPTION", 1)], "center"),
  para([text("Design History File (DHF) - 21 CFR 820.30", 2)], "center"),
  emptyPara(),
  para([text("1. INFORMATIONS PROJET", 1)]),
  table([
    row([
      cell([text("Champ", 1)], 1),
      cell([text("Valeur", 1)], 1),
    ]),
    row([
      cell([text("Nom du projet")]),
      cell([text("CardioMonitor Pro X1", 1, "color: #3B82F6;")]),
    ]),
    row([
      cell([text("Chef de projet")]),
      cell([text("Dr. Marie Dubois")]),
    ]),
    row([
      cell([text("Date de début")]),
      cell([text("15/01/2023")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. PHASES DE CONCEPTION", 1)]),
  table([
    row([
      cell([text("Phase", 1)], 1),
      cell([text("Livrables", 1)], 1),
      cell([text("Statut", 1)], 1),
    ]),
    row([
      cell([text("Design Input")]),
      cell([text("URS, SRS, Design Specification")]),
      cell([text("Approuvé", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Design Output")]),
      cell([text("Schémas, BOM, Firmware")]),
      cell([text("Approuvé", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Design Verification")]),
      cell([text("Protocoles et rapports de tests")]),
      cell([text("Approuvé", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Design Validation")]),
      cell([text("Validation clinique, Usability")]),
      cell([text("En cours", 1, "color: #F59E0B;")]),
    ]),
    row([
      cell([text("Design Transfer")]),
      cell([text("DMR, Production docs")]),
      cell([text("Planifié", 1, "color: #6B7280;")]),
    ]),
  ]),
]);

/**
 * Usability Engineering File (IEC 62366)
 */
const USABILITY_STATE = createDocState([
  para([text("DOSSIER D'INGÉNIERIE DE L'APTITUDE À L'UTILISATION", 1)], "center"),
  para([text("Conformément à IEC 62366-1:2015", 2)], "center"),
  emptyPara(),
  para([text("1. PROFILS UTILISATEURS", 1)]),
  table([
    row([
      cell([text("Utilisateur", 1)], 1),
      cell([text("Formation", 1)], 1),
      cell([text("Expérience", 1)], 1),
    ]),
    row([
      cell([text("Médecin cardiologue")]),
      cell([text("Bac+11 minimum")]),
      cell([text("> 5 ans pratique clinique")]),
    ]),
    row([
      cell([text("Infirmier(ère)")]),
      cell([text("Diplôme IDE")]),
      cell([text("> 2 ans en cardiologie")]),
    ]),
    row([
      cell([text("Technicien biomédical")]),
      cell([text("BTS/DUT biomédical")]),
      cell([text("> 1 an maintenance DM")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. ANALYSE DES TÂCHES CRITIQUES", 1)]),
  table([
    row([
      cell([text("Tâche", 1)], 1),
      cell([text("Risque", 1)], 1),
      cell([text("Validation", 1)], 1),
    ]),
    row([
      cell([text("Configuration des seuils d'alarme")]),
      cell([text("Élevé", 1, "color: #EF4444;")]),
      cell([text("Validé", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Interprétation de l'ECG")]),
      cell([text("Élevé", 1, "color: #EF4444;")]),
      cell([text("Validé", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Nettoyage et désinfection")]),
      cell([text("Moyen", 1, "color: #F59E0B;")]),
      cell([text("Validé", 1, "color: #22C55E;")]),
    ]),
  ]),
]);

/**
 * Biocompatibility Assessment (ISO 10993)
 */
const BIOCOMPATIBILITY_STATE = createDocState([
  para([text("ÉVALUATION DE LA BIOCOMPATIBILITÉ", 1)], "center"),
  para([text("Conformément à ISO 10993-1:2018", 2)], "center"),
  emptyPara(),
  para([text("1. CATÉGORISATION DU CONTACT", 1)]),
  table([
    row([
      cell([text("Nature du contact", 1)], 1),
      cell([text("Catégorie", 1)], 1),
      cell([text("Durée", 1)], 1),
    ]),
    row([
      cell([text("Contact avec la peau")]),
      cell([text("Surface", 1)]),
      cell([text("< 24h (Contact limité)")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. TESTS REQUIS (ISO 10993-1 Tableau A.1)", 1)]),
  table([
    row([
      cell([text("Point final biologique", 1)], 1),
      cell([text("Requis", 1)], 1),
      cell([text("Statut", 1)], 1),
    ]),
    row([
      cell([text("Cytotoxicité")]),
      cell([text("X", 1)]),
      cell([text("PASS", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Sensibilisation")]),
      cell([text("X", 1)]),
      cell([text("PASS", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Irritation / Réaction intracutanée")]),
      cell([text("X", 1)]),
      cell([text("PASS", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("Toxicité systémique")]),
      cell([text("-")]),
      cell([text("N/A", 0, "color: #6B7280;")]),
    ]),
  ]),
  emptyPara(),
  para([text("3. CONCLUSION", 1)]),
  para([
    text("Tous les tests requis ont été réalisés avec succès. Le dispositif est "),
    text("BIOCOMPATIBLE", 1, "color: #22C55E;"),
    text(" pour l'utilisation prévue."),
  ]),
]);

/**
 * Labeling Review (ISO 15223)
 */
const LABELING_STATE = createDocState([
  para([text("REVUE DE L'ÉTIQUETAGE", 1)], "center"),
  para([text("Conformément à ISO 15223-1:2021 et MDR Annexe I Chapitre III", 2)], "center"),
  emptyPara(),
  para([text("1. SYMBOLES REQUIS", 1)]),
  table([
    row([
      cell([text("Symbole", 1)], 1),
      cell([text("Signification", 1)], 1),
      cell([text("Référence", 1)], 1),
      cell([text("Présent", 1)], 1),
    ]),
    row([
      cell([text("CE 0086", 1)]),
      cell([text("Marquage CE avec ON")]),
      cell([text("MDR Art. 20")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("REF", 1)]),
      cell([text("Numéro de catalogue")]),
      cell([text("ISO 15223-1:5.1.6")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("SN", 1)]),
      cell([text("Numéro de série")]),
      cell([text("ISO 15223-1:5.1.7")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("UDI", 1)]),
      cell([text("Identifiant unique")]),
      cell([text("MDR Art. 27")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
    row([
      cell([text("!", 1)]),
      cell([text("Consulter la notice")]),
      cell([text("ISO 15223-1:5.4.4")]),
      cell([text("OK", 1, "color: #22C55E;")]),
    ]),
  ]),
  emptyPara(),
  para([text("2. VERDICT", 1)]),
  para([
    text("L'étiquetage est "),
    text("CONFORME", 1, "color: #22C55E;"),
    text(" aux exigences réglementaires."),
  ]),
]);

/**
 * Rich document examples
 */
export const RICH_DOCUMENTS: RichDocument[] = [
  {
    id: "rich-ce-certificate",
    title: "Déclaration CE de Conformité",
    description: "Déclaration UE avec tableaux et mise en forme",
    category: "Réglementaire",
    color: "#3B82F6",
    editorState: JSON.stringify(CE_CERTIFICATE_STATE),
  },
  {
    id: "rich-risk-analysis",
    title: "Analyse de Risques (ISO 14971)",
    description: "Matrice de criticité et registre des risques",
    category: "Gestion des Risques",
    color: "#F59E0B",
    editorState: JSON.stringify(RISK_ANALYSIS_STATE),
  },
  {
    id: "rich-technical-doc",
    title: "Notice d'Utilisation (IFU)",
    description: "Instructions avec symboles et avertissements",
    category: "Documentation Technique",
    color: "#8B5CF6",
    editorState: JSON.stringify(TECHNICAL_DOC_STATE),
  },
  {
    id: "rich-clinical-evaluation",
    title: "Rapport d'Évaluation Clinique",
    description: "CER Annexe XIV MDR avec données cliniques",
    category: "Clinique",
    color: "#EC4899",
    editorState: JSON.stringify(CLINICAL_EVALUATION_STATE),
  },
  {
    id: "rich-pms-plan",
    title: "Plan de Surveillance PMS",
    description: "Post-Market Surveillance avec KPIs",
    category: "Surveillance",
    color: "#14B8A6",
    editorState: JSON.stringify(PMS_PLAN_STATE),
  },
  {
    id: "rich-software-doc",
    title: "Documentation Logiciel (IEC 62304)",
    description: "Classification et architecture logicielle",
    category: "Logiciel",
    color: "#6366F1",
    editorState: JSON.stringify(SOFTWARE_DOC_STATE),
  },
  {
    id: "rich-dhf",
    title: "Dossier Historique de Conception",
    description: "Design History File avec phases",
    category: "Conception",
    color: "#0EA5E9",
    editorState: JSON.stringify(DHF_STATE),
  },
  {
    id: "rich-usability",
    title: "Dossier d'Aptitude à l'Utilisation",
    description: "IEC 62366-1 avec profils utilisateurs",
    category: "Utilisabilité",
    color: "#84CC16",
    editorState: JSON.stringify(USABILITY_STATE),
  },
  {
    id: "rich-biocompatibility",
    title: "Évaluation Biocompatibilité",
    description: "ISO 10993-1 avec tests requis",
    category: "Biocompatibilité",
    color: "#F97316",
    editorState: JSON.stringify(BIOCOMPATIBILITY_STATE),
  },
  {
    id: "rich-labeling",
    title: "Revue de l'Étiquetage",
    description: "ISO 15223-1 avec symboles requis",
    category: "Étiquetage",
    color: "#EF4444",
    editorState: JSON.stringify(LABELING_STATE),
  },
];

/**
 * Get rich document by ID
 */
export function getRichDocument(id: string): RichDocument | undefined {
  return RICH_DOCUMENTS.find((doc) => doc.id === id);
}

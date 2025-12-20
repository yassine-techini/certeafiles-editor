/**
 * Massive Document Generator - Creates 500+ page documents
 * with rich content: text, images, tables, headers, footers
 */

// Demo images as SVG data URLs
const DEMO_IMAGES = [
  // Bar chart
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHJlY3QgeD0iNTAiIHk9IjE4MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzQ5OGRiIi8+PHJlY3QgeD0iMTIwIiB5PSIxMjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMTAiIGZpbGw9IiMzNDk4ZGIiLz48cmVjdCB4PSIxOTAiIHk9IjgwIiB3aWR0aD0iNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzQ5OGRiIi8+PHJlY3QgeD0iMjYwIiB5PSIxMDAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMzAiIGZpbGw9IiMzNDk4ZGIiLz48cmVjdCB4PSIzMzAiIHk9IjYwIiB3aWR0aD0iNTAiIGhlaWdodD0iMTcwIiBmaWxsPSIjMzQ5OGRiIi8+PHJlY3QgeD0iNDAwIiB5PSI0MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjE5MCIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjI1MCIgeT0iMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMzMzIj5DaGlmZnJlIGQnQWZmYWlyZXMgVHJpbWVzdHJpZWw8L3RleHQ+PC9zdmc+',
  // Pie chart
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PGNpcmNsZSBjeD0iMTMwIiBjeT0iMTMwIiByPSI4MCIgZmlsbD0iIzM0OThkYiIvPjxwYXRoIGQ9Ik0xMzAsMTMwIEwxMzAsNTAgQSA4MCw4MCAwIDAsMSAyMDAsOTAgWiIgZmlsbD0iIzI3YWU2MCIvPjxwYXRoIGQ9Ik0xMzAsMTMwIEwyMDAsOTAgQSA4MCw4MCAwIDAsMSAyMDAsMTcwIFoiIGZpbGw9IiNlNzRjM2MiLz48cGF0aCBkPSJNMTMwLDEzMCBMMjAwLDE3MCBBIDgwLDgwIDAgMCwxIDEzMCwyMTAgWiIgZmlsbD0iI2YzOWMxMiIvPjx0ZXh0IHg9IjIwMCIgeT0iMjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMzMzIj5Sw6lwYXJ0aXRpb24gZHUgQ2hpZmZyZTwvdGV4dD48cmVjdCB4PSIyNTAiIHk9IjYwIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIGZpbGw9IiMyN2FlNjAiLz48dGV4dCB4PSIyNzAiIHk9IjcwIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzMzIj5Qcm9kdWl0cyAzNSU8L3RleHQ+PHJlY3QgeD0iMjUwIiB5PSI4NSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEyIiBmaWxsPSIjZTc0YzNjIi8+PHRleHQgeD0iMjcwIiB5PSI5NSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzMzMyI+U2VydmljZXMgMzAlPC90ZXh0PjxyZWN0IHg9IjI1MCIgeT0iMTEwIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIGZpbGw9IiNmMzljMTIiLz48dGV4dCB4PSIyNzAiIHk9IjEyMCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzMzMyI+Q29uc2VpbCAyMCU8L3RleHQ+PHJlY3QgeD0iMjUwIiB5PSIxMzUiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjI3MCIgeT0iMTQ1IiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzMzIj5BdXRyZXMgMTUlPC90ZXh0Pjwvc3ZnPg==',
  // Line chart
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlRlbmRhbmNlcyBkZSBDcm9pc3NhbmNlPC90ZXh0PjxsaW5lIHgxPSI1MCIgeTE9IjIwMCIgeDI9IjQ1MCIgeTI9IjIwMCIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjEiLz48cG9seWxpbmUgcG9pbnRzPSI1MCwxNzAgMTIwLDE1MCAxOTAsMTIwIDI2MCwxMzAgMzMwLDkwIDQwMCw2MCA0NTAsNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBvbHlsaW5lIHBvaW50cz0iNTAsMTgwIDEyMCwxNzAgMTkwLDE1MCAyNjAsMTQwIDMzMCwxMzAgNDAwLDExMCA0NTAsMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMyN2FlNjAiIHN0cm9rZS13aWR0aD0iMyIvPjxjaXJjbGUgY3g9IjQ1MCIgY3k9IjQwIiByPSI0IiBmaWxsPSIjMzQ5OGRiIi8+PGNpcmNsZSBjeD0iNDUwIiBjeT0iMTAwIiByPSI0IiBmaWxsPSIjMjdhZTYwIi8+PC9zdmc+',
  // Process diagram
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlByb2Nlc3N1cyBkZSBWYWxpZGF0aW9uPC90ZXh0PjxyZWN0IHg9IjMwIiB5PSI2MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjUwIiByeD0iNSIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjcwIiB5PSI5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiPlNvdW1pc3Npb248L3RleHQ+PGxpbmUgeDE9IjExMCIgeTE9Ijg1IiB4Mj0iMTQwIiB5Mj0iODUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTQwIiB5PSI2MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjUwIiByeD0iNSIgZmlsbD0iI2YzOWMxMiIvPjx0ZXh0IHg9IjE4MCIgeT0iOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIj5BbmFseXNlPC90ZXh0PjxsaW5lIHgxPSIyMjAiIHkxPSI4NSIgeDI9IjI1MCIgeTI9Ijg1IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjI1MCIgeT0iNjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI1MCIgcng9IjUiIGZpbGw9IiNlNzRjM2MiLz48dGV4dCB4PSIyOTAiIHk9IjkwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSI+VmFsaWRhdGlvbjwvdGV4dD48bGluZSB4MT0iMzMwIiB5MT0iODUiIHgyPSIzNjAiIHkyPSI4NSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIzNjAiIHk9IjYwIiB3aWR0aD0iODAiIGhlaWdodD0iNTAiIHJ4PSI1IiBmaWxsPSIjMjdhZTYwIi8+PHRleHQgeD0iNDAwIiB5PSI5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCIgZmlsbD0id2hpdGUiPkFwcHJvYmF0aW9uPC90ZXh0Pjwvc3ZnPg==',
  // KPI Dashboard
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlRhYmxlYXUgZGUgQm9yZCBLUEk8L3RleHQ+PHJlY3QgeD0iMzAiIHk9IjQ1IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjcwIiByeD0iOCIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjgwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj4rMjMlPC90ZXh0Pjx0ZXh0IHg9IjgwIiB5PSI5NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI5IiBmaWxsPSJ3aGl0ZSI+Q3JvaXNzYW5jZTwvdGV4dD48cmVjdCB4PSIxNTAiIHk9IjQ1IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjcwIiByeD0iOCIgZmlsbD0iIzI3YWU2MCIvPjx0ZXh0IHg9IjIwMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+OTIlPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iOTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iOSIgZmlsbD0id2hpdGUiPlNhdGlzZmFjdGlvbjwvdGV4dD48cmVjdCB4PSIyNzAiIHk9IjQ1IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjcwIiByeD0iOCIgZmlsbD0iI2YzOWMxMiIvPjx0ZXh0IHg9IjMyMCIgeT0iNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+MTUwSzwvdGV4dD48dGV4dCB4PSIzMjAiIHk9Ijk1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjkiIGZpbGw9IndoaXRlIj5DbGllbnRzPC90ZXh0PjxyZWN0IHg9IjM5MCIgeT0iNDUiIHdpZHRoPSIxMDAiIGhlaWdodD0iNzAiIHJ4PSI4IiBmaWxsPSIjZTc0YzNjIi8+PHRleHQgeD0iNDQwIiB5PSI3NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj4zLjJNPC90ZXh0Pjx0ZXh0IHg9IjQ0MCIgeT0iOTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iOSIgZmlsbD0id2hpdGUiPlJldmVudXM8L3RleHQ+PC9zdmc+',
  // Gantt chart
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlBsYW5uaW5nIFByb2pldDwvdGV4dD48dGV4dCB4PSI2MCIgeT0iNTUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiMzMzMiPkNvbmNlcHRpb248L3RleHQ+PHJlY3QgeD0iMTQwIiB5PSI0MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjIwIiByeD0iMyIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjYwIiB5PSI4NSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzMzMyI+RMOpdmVsb3BwZW1lbnQ8L3RleHQ+PHJlY3QgeD0iMjAwIiB5PSI3MCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMCIgcng9IjMiIGZpbGw9IiMyN2FlNjAiLz48dGV4dCB4PSI2MCIgeT0iMTE1IiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzMzIj5UZXN0czwvdGV4dD48cmVjdCB4PSIzMjAiIHk9IjEwMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIyMCIgcng9IjMiIGZpbGw9IiNmMzljMTIiLz48dGV4dCB4PSI2MCIgeT0iMTQ1IiBmb250LXNpemU9IjEwIiBmaWxsPSIjMzMzIj5Ew6lwbG9pZW1lbnQ8L3RleHQ+PHJlY3QgeD0iMzgwIiB5PSIxMzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgcng9IjMiIGZpbGw9IiNlNzRjM2MiLz48L3N2Zz4=',
];

// Professional paragraphs for content
const PARAGRAPHS = [
  "Ce document présente une analyse approfondie des données collectées au cours du dernier trimestre. Les résultats montrent une progression significative des indicateurs clés de performance, avec une augmentation moyenne de 23% par rapport à la période précédente.",
  "L'étude comparative réalisée auprès de 500 participants a permis d'identifier les facteurs déterminants de la satisfaction client. Les données recueillies révèlent que la qualité du service reste le critère principal.",
  "La méthodologie employée combine une approche quantitative et qualitative, garantissant ainsi la robustesse des conclusions présentées dans ce rapport. Les échantillons ont été sélectionnés selon un protocole rigoureux.",
  "Les investissements réalisés dans l'infrastructure technologique ont permis d'améliorer significativement les performances opérationnelles de l'ensemble des services.",
  "L'analyse des tendances du marché révèle des opportunités de croissance substantielles dans les segments émergents identifiés par notre équipe d'analystes.",
  "La gestion des risques constitue un pilier fondamental de notre approche stratégique et fait l'objet d'une attention particulière de la direction.",
  "Le programme de formation mis en place a permis de développer les compétences de plus de 200 collaborateurs au sein de l'organisation.",
  "L'intégration des nouvelles technologies d'intelligence artificielle ouvre des perspectives prometteuses pour l'automatisation des processus métier.",
  "La collaboration inter-services s'est intensifiée grâce à la mise en place d'outils collaboratifs adaptés aux besoins spécifiques de chaque département.",
  "Les retours clients collectés via notre plateforme digitale confirment une satisfaction globale en hausse constante depuis le début de l'année.",
  "Notre stratégie d'expansion internationale a franchi une étape décisive avec l'ouverture de trois nouvelles filiales en Europe.",
  "L'optimisation de la chaîne logistique a généré des économies substantielles tout en améliorant les délais de livraison.",
];

const TITLES = [
  "Rapport d'Analyse Stratégique",
  "Étude de Marché Approfondie",
  "Bilan des Performances",
  "Plan d'Action Commercial",
  "Analyse Financière Détaillée",
  "Revue des Opérations",
  "Synthèse Trimestrielle",
  "Rapport de Gestion",
  "Audit de Conformité",
  "Évaluation des Risques",
];

const SUBTITLES = [
  "Vue d'ensemble et contexte",
  "Méthodologie et approche",
  "Analyse des données clés",
  "Résultats et observations",
  "Recommandations stratégiques",
  "Plan de mise en œuvre",
];

// Table data
const TABLE_HEADERS = [
  ["Trimestre", "CA", "Marge", "Résultat", "Variation"],
  ["Indicateur", "Objectif", "Réalisé", "Écart", "Statut"],
  ["Phase", "Début", "Fin", "Budget", "Responsable"],
  ["Région", "2023", "2024", "Croissance", "Part"],
];

const TABLE_DATA = [
  [
    ["T1 2024", "2,45 M€", "735 K€", "245 K€", "+12%"],
    ["T2 2024", "2,89 M€", "867 K€", "312 K€", "+18%"],
    ["T3 2024", "3,15 M€", "945 K€", "378 K€", "+21%"],
    ["T4 2024", "3,52 M€", "1,06 M€", "423 K€", "+25%"],
  ],
  [
    ["Conversion", "15%", "17.2%", "+2.2%", "Dépassé"],
    ["Satisfaction", "85%", "92%", "+7%", "Dépassé"],
    ["Délai", "48h", "36h", "-12h", "Conforme"],
    ["Retour", "<5%", "3.2%", "-1.8%", "OK"],
  ],
];

const LIST_ITEMS = [
  "Augmenter le chiffre d'affaires de 25%",
  "Améliorer la satisfaction client de 10 points",
  "Réduire les coûts opérationnels de 15%",
  "Développer 3 nouveaux produits innovants",
  "Étendre la présence sur 2 nouveaux marchés",
  "Renforcer les compétences des équipes",
];

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
 * Helper to create a heading
 */
const heading = (content: string, tag: "h1" | "h2" | "h3") => ({
  children: [text(content, 1)],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "heading",
  tag,
  version: 1,
});

/**
 * Helper to create an image node
 */
const image = (src: string, altText: string, width: number = 450, height: number = 200) => ({
  type: "image",
  version: 1,
  src,
  altText,
  width,
  height,
  alignment: "center" as const,
  caption: "",
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
 * Helper to create a header node
 */
const headerNode = (folioId: string, pageNum: number, docTitle: string) => ({
  children: [
    para([
      text(docTitle, 1),
      text(" | ", 0),
      text(`Page ${pageNum}`, 0, "color: #6B7280;"),
    ]),
  ],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "header",
  version: 1,
  folioId,
  contentId: null,
  isDefault: true,
  height: 15,
});

/**
 * Helper to create a footer node
 */
const footerNode = (folioId: string, pageNum: number, totalPages: number) => ({
  children: [
    para([
      text(`Document confidentiel - ${new Date().toLocaleDateString('fr-FR')}`, 0, "color: #9CA3AF;"),
      text(` | Page ${pageNum}/${totalPages}`, 0, "color: #6B7280;"),
    ]),
  ],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "footer",
  version: 1,
  folioId,
  contentId: null,
  isDefault: true,
  height: 12,
});

/**
 * Helper to create a folio node with content
 */
const folio = (
  folioId: string,
  folioIndex: number,
  children: unknown[],
  orientation: "portrait" | "landscape" = "portrait"
) => ({
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  type: "folio",
  version: 1,
  folioId,
  folioIndex,
  orientation,
  sectionId: null,
});

/**
 * Generate content for a single page
 */
function generatePageContent(pageIndex: number, totalPages: number, docTitle: string): unknown[] {
  const content: unknown[] = [];
  const isFirstPage = pageIndex === 0;
  const chapterNum = Math.floor(pageIndex / 10) + 1;
  const sectionNum = (pageIndex % 10) + 1;

  // First page: Title page
  if (isFirstPage) {
    content.push(para([], "center"));
    content.push(para([], "center"));
    content.push(heading(docTitle, "h1"));
    content.push(para([text("Document officiel", 2)], "center"));
    content.push(para([], "center"));
    content.push(para([text(`Total: ${totalPages} pages`, 0, "color: #6B7280;")], "center"));
    content.push(para([text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 0, "color: #6B7280;")], "center"));
    content.push(para([], "center"));
    content.push(image(DEMO_IMAGES[4], "Dashboard KPI", 450, 200));
    return content;
  }

  // Section header every 10 pages
  if (sectionNum === 1) {
    content.push(heading(`Chapitre ${chapterNum}`, "h1"));
    content.push(para([text(TITLES[(chapterNum - 1) % TITLES.length], 2)]));
    content.push(para([]));
  }

  // Regular section header
  content.push(heading(`${chapterNum}.${sectionNum} ${SUBTITLES[(pageIndex) % SUBTITLES.length]}`, "h2"));

  // First paragraph
  content.push(para([text(PARAGRAPHS[pageIndex % PARAGRAPHS.length])]));

  // Add image every 3 pages
  if (pageIndex % 3 === 1) {
    const imgIdx = pageIndex % DEMO_IMAGES.length;
    content.push(para([text(`Figure ${pageIndex}: Visualisation des données`, 2)], "center"));
    content.push(image(DEMO_IMAGES[imgIdx], `Figure ${pageIndex}`, 450, 200));
    content.push(para([text("Source: Analyse interne", 0, "color: #6B7280;")], "center"));
  }

  // Second paragraph
  content.push(para([text(PARAGRAPHS[(pageIndex + 1) % PARAGRAPHS.length])]));

  // Add table every 4 pages
  if (pageIndex % 4 === 2) {
    const headerIdx = pageIndex % TABLE_HEADERS.length;
    const dataIdx = pageIndex % TABLE_DATA.length;

    content.push(heading(`Tableau ${Math.floor(pageIndex / 4) + 1}: Synthèse`, "h3"));
    content.push(
      table([
        row(TABLE_HEADERS[headerIdx].map(h => cell([text(h, 1)], 1))),
        ...TABLE_DATA[dataIdx].map(rowData =>
          row(rowData.map(cellData => cell([text(cellData)])))
        ),
      ])
    );
  }

  // Third paragraph
  content.push(para([text(PARAGRAPHS[(pageIndex + 2) % PARAGRAPHS.length])]));

  // Add list every 5 pages
  if (pageIndex % 5 === 3) {
    content.push(heading("Points clés", "h3"));
    const startIdx = pageIndex % LIST_ITEMS.length;
    for (let i = 0; i < 4; i++) {
      const idx = (startIdx + i) % LIST_ITEMS.length;
      content.push(para([text(`• ${LIST_ITEMS[idx]}`)]));
    }
  }

  // Fourth paragraph
  content.push(para([text(PARAGRAPHS[(pageIndex + 3) % PARAGRAPHS.length])]));

  // Add another table on even pages without the first table
  if (pageIndex % 4 === 0 && pageIndex > 0) {
    const headerIdx = (pageIndex + 2) % TABLE_HEADERS.length;
    const dataIdx = (pageIndex + 2) % TABLE_DATA.length;

    content.push(heading("Données complémentaires", "h3"));
    content.push(
      table([
        row(TABLE_HEADERS[headerIdx].map(h => cell([text(h, 1)], 1))),
        ...TABLE_DATA[dataIdx].map(rowData =>
          row(rowData.map(cellData => cell([text(cellData)])))
        ),
      ])
    );
  }

  // Fifth paragraph
  content.push(para([text(PARAGRAPHS[(pageIndex + 4) % PARAGRAPHS.length])]));

  // Conclusion paragraph with formatting
  content.push(para([
    text("En résumé, ", 0),
    text("les analyses présentées", 1),
    text(" démontrent une ", 0),
    text("progression significative", 3),
    text(" des indicateurs clés.", 0),
  ]));

  return content;
}

/**
 * Generate a massive document with specified number of pages
 */
export function generateMassiveDocument(
  totalPages: number,
  docTitle: string = "Document Technique Complet"
): { root: { children: unknown[]; direction: string; format: string; indent: number; type: string; version: number } } {
  const folios: unknown[] = [];

  for (let i = 0; i < totalPages; i++) {
    const folioId = `folio-${i + 1}`;
    const pageContent = generatePageContent(i, totalPages, docTitle);

    // Create folio with header, content, and footer
    const folioChildren: unknown[] = [
      headerNode(folioId, i + 1, docTitle),
      ...pageContent,
      footerNode(folioId, i + 1, totalPages),
    ];

    folios.push(folio(folioId, i, folioChildren));
  }

  return {
    root: {
      children: folios,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

/**
 * Generate a 500-page document
 */
export function generate500PageDocument(): string {
  return JSON.stringify(generateMassiveDocument(500, "Rapport Technique 500 Pages"));
}

/**
 * Generate a 100-page document
 */
export function generate100PageDocument(): string {
  return JSON.stringify(generateMassiveDocument(100, "Dossier Technique 100 Pages"));
}

/**
 * Generate a 50-page document
 */
export function generate50PageDocument(): string {
  return JSON.stringify(generateMassiveDocument(50, "Document Standard 50 Pages"));
}

export interface MassiveDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  pageCount: number;
  generator: () => string;
}

/**
 * List of available massive documents
 */
export const MASSIVE_DOCUMENTS: MassiveDocument[] = [
  {
    id: "massive-500",
    title: "Rapport Technique 500 Pages",
    description: "Document massif avec texte, images, tableaux, headers et footers",
    category: "Massif",
    color: "#DC2626",
    pageCount: 500,
    generator: generate500PageDocument,
  },
  {
    id: "massive-100",
    title: "Dossier Technique 100 Pages",
    description: "Document complet avec contenu riche varié",
    category: "Large",
    color: "#F59E0B",
    pageCount: 100,
    generator: generate100PageDocument,
  },
  {
    id: "massive-50",
    title: "Document Standard 50 Pages",
    description: "Document de taille moyenne avec tous les éléments",
    category: "Standard",
    color: "#10B981",
    pageCount: 50,
    generator: generate50PageDocument,
  },
];

/**
 * Get massive document by ID
 */
export function getMassiveDocument(id: string): MassiveDocument | undefined {
  return MASSIVE_DOCUMENTS.find((doc) => doc.id === id);
}

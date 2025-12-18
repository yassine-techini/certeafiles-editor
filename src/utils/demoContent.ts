/**
 * Demo Content Generator
 * Generates realistic content for demo pages with rich formatting
 */

// Rich professional paragraphs
const PARAGRAPHS = [
  "Ce document présente une analyse approfondie des données collectées au cours du dernier trimestre. Les résultats montrent une progression significative des indicateurs clés de performance, avec une augmentation moyenne de 23% par rapport à la période précédente. Cette tendance positive confirme l'efficacité des mesures mises en place et ouvre des perspectives prometteuses pour l'avenir.",
  "L'étude comparative réalisée auprès de 500 participants a permis d'identifier les facteurs déterminants de la satisfaction client. Les données recueillies révèlent que la qualité du service reste le critère principal, suivi de près par la réactivité et la personnalisation de l'offre. Ces insights orientent notre stratégie de développement.",
  "La méthodologie employée combine une approche quantitative et qualitative, garantissant ainsi la robustesse des conclusions présentées dans ce rapport. Les échantillons ont été sélectionnés selon un protocole rigoureux, assurant une représentativité optimale de la population cible. Les biais potentiels ont été identifiés et minimisés.",
  "Les investissements réalisés dans l'infrastructure technologique ont permis d'améliorer significativement les performances opérationnelles de l'ensemble des services. Le temps de traitement moyen a été réduit de 40%, tandis que la capacité de traitement simultané a triplé. Ces améliorations se traduisent par une expérience utilisateur nettement optimisée.",
  "L'analyse des tendances du marché révèle des opportunités de croissance substantielles dans les segments émergents identifiés par notre équipe d'analystes. Les projections indiquent un potentiel de développement de 35% sur les trois prochaines années, sous réserve d'une adaptation continue de notre offre aux évolutions de la demande.",
  "La gestion des risques constitue un pilier fondamental de notre approche stratégique et fait l'objet d'une attention particulière de la direction. Un système de surveillance continue permet d'identifier les menaces potentielles et de déployer rapidement les mesures correctives appropriées. Cette vigilance proactive a permis d'éviter des pertes significatives.",
  "Le programme de formation mis en place a permis de développer les compétences de plus de 200 collaborateurs au sein de l'organisation. Les évaluations post-formation montrent une amélioration moyenne de 45% des performances individuelles, avec un impact direct sur la productivité globale des équipes concernées par ce programme.",
  "L'intégration des nouvelles technologies d'intelligence artificielle ouvre des perspectives prometteuses pour l'automatisation des processus métier. Les premiers tests pilotes démontrent un gain de temps de 60% sur les tâches répétitives, libérant ainsi des ressources précieuses pour les activités à plus forte valeur ajoutée.",
  "La collaboration inter-services s'est intensifiée grâce à la mise en place d'outils collaboratifs adaptés aux besoins spécifiques de chaque département. Les échanges d'information sont désormais fluides et tracés, favorisant une prise de décision éclairée et rapide. Cette transversalité renforce la cohésion organisationnelle.",
  "Les retours clients collectés via notre plateforme digitale confirment une satisfaction globale en hausse constante depuis le début de l'année. Le Net Promoter Score a progressé de 15 points sur l'année, témoignant de l'attachement croissant de notre clientèle à nos produits et services premium.",
  "Notre stratégie d'expansion internationale a franchi une étape décisive avec l'ouverture de trois nouvelles filiales en Europe. Ces implantations stratégiques nous permettent de renforcer notre présence sur des marchés à fort potentiel et de diversifier nos sources de revenus de manière significative.",
  "L'optimisation de la chaîne logistique a généré des économies substantielles tout en améliorant les délais de livraison. La mise en œuvre de solutions innovantes de tracking en temps réel offre une visibilité complète sur le parcours des produits, de la production à la livraison finale.",
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
  "Plan de Développement",
  "Analyse Concurrentielle",
  "Rapport d'Activité",
  "Étude d'Impact",
  "Prévisions et Tendances",
  "Rapport Technique",
  "Analyse des Processus",
  "Bilan Opérationnel",
  "Synthèse Exécutive",
  "Rapport de Projet",
];

const SUBTITLES = [
  "Vue d'ensemble et contexte",
  "Méthodologie et approche",
  "Analyse des données clés",
  "Résultats et observations",
  "Recommandations stratégiques",
  "Plan de mise en œuvre",
  "Indicateurs de performance",
  "Facteurs de succès",
  "Points d'attention",
  "Perspectives d'évolution",
  "Synthèse des conclusions",
  "Actions prioritaires",
];

// Rich table data
const TABLE_HEADERS = [
  ["Trimestre", "Chiffre d'Affaires", "Marge Brute", "Résultat Net", "Variation"],
  ["Indicateur", "Objectif", "Réalisé", "Écart", "Statut"],
  ["Phase", "Date Début", "Date Fin", "Budget", "Responsable"],
  ["Ressource", "Disponibilité", "Allocation", "Coût/Jour", "Total"],
  ["Région", "Ventes 2023", "Ventes 2024", "Croissance", "Part Marché"],
  ["Produit", "Stock Initial", "Entrées", "Sorties", "Stock Final"],
];

const TABLE_DATA = [
  [
    ["T1 2024", "2 450 000 €", "735 000 €", "245 000 €", "+12%"],
    ["T2 2024", "2 890 000 €", "867 000 €", "312 000 €", "+18%"],
    ["T3 2024", "3 150 000 €", "945 000 €", "378 000 €", "+21%"],
    ["T4 2024", "3 520 000 €", "1 056 000 €", "423 000 €", "+25%"],
  ],
  [
    ["Taux conversion", "15%", "17.2%", "+2.2%", "Dépassé"],
    ["Satisfaction", "85%", "92%", "+7%", "Dépassé"],
    ["Délai livraison", "48h", "36h", "-12h", "Dépassé"],
    ["Taux retour", "<5%", "3.2%", "-1.8%", "Conforme"],
  ],
  [
    ["Conception", "01/01/2024", "28/02/2024", "150 000 €", "J. Martin"],
    ["Développement", "01/03/2024", "31/05/2024", "450 000 €", "S. Dubois"],
    ["Tests", "01/06/2024", "31/07/2024", "120 000 €", "M. Laurent"],
    ["Déploiement", "01/08/2024", "30/09/2024", "80 000 €", "P. Bernard"],
  ],
  [
    ["Chef projet", "100%", "50%", "800 €", "40 000 €"],
    ["Dev Senior", "100%", "100%", "650 €", "65 000 €"],
    ["Designer UX", "80%", "60%", "550 €", "26 400 €"],
    ["Testeur QA", "100%", "40%", "450 €", "18 000 €"],
  ],
  [
    ["Île-de-France", "1 250 000 €", "1 580 000 €", "+26%", "32%"],
    ["Auvergne-RA", "890 000 €", "1 050 000 €", "+18%", "21%"],
    ["PACA", "720 000 €", "890 000 €", "+24%", "18%"],
    ["Occitanie", "540 000 €", "680 000 €", "+26%", "14%"],
  ],
  [
    ["Produit A", "1 500", "2 800", "2 100", "2 200"],
    ["Produit B", "800", "1 500", "1 200", "1 100"],
    ["Produit C", "2 200", "3 000", "2 800", "2 400"],
    ["Produit D", "650", "1 200", "900", "950"],
  ],
];

const LIST_ITEMS = [
  "Augmenter le chiffre d'affaires de 25% sur l'exercice en cours",
  "Améliorer le taux de satisfaction client de 10 points minimum",
  "Réduire les coûts opérationnels de 15% via l'automatisation",
  "Développer 3 nouveaux produits innovants d'ici fin d'année",
  "Étendre notre présence sur 2 nouveaux marchés européens",
  "Renforcer les compétences des équipes par la formation continue",
  "Optimiser les processus de production et de livraison",
  "Mettre en place un système de qualité certifié ISO 9001",
  "Digitaliser l'ensemble des interactions avec les clients",
  "Réduire l'empreinte carbone de 20% conformément aux objectifs RSE",
];

// Demo images as SVG data URLs - More variety
const DEMO_IMAGES = [
  // Bar chart - Ventes
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHJlY3QgeD0iNTAiIHk9IjIyMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzQ5OGRiIi8+PHJlY3QgeD0iMTIwIiB5PSIxNTAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMzNDk4ZGIiLz48cmVjdCB4PSIxOTAiIHk9IjEwMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjE3MCIgZmlsbD0iIzM0OThkYiIvPjxyZWN0IHg9IjI2MCIgeT0iMTMwIiB3aWR0aD0iNTAiIGhlaWdodD0iMTQwIiBmaWxsPSIjMzQ5OGRiIi8+PHJlY3QgeD0iMzMwIiB5PSI3MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM0OThkYiIvPjxyZWN0IHg9IjQwMCIgeT0iOTAiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzNDk4ZGIiLz48dGV4dCB4PSIyNTAiIHk9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzMyI+w4l2b2x1dGlvbiBkZXMgVmVudGVzIDIwMjQ8L3RleHQ+PHRleHQgeD0iNzUiIHk9IjI5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NiI+SmFuPC90ZXh0Pjx0ZXh0IHg9IjE0NSIgeT0iMjkwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2Ij5Gw6l2PC90ZXh0Pjx0ZXh0IHg9IjIxNSIgeT0iMjkwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2Ij5NYXI8L3RleHQ+PHRleHQgeD0iMjg1IiB5PSIyOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2NjYiPkF2cjwvdGV4dD48dGV4dCB4PSIzNTUiIHk9IjI5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NiI+TWFpPC90ZXh0Pjx0ZXh0IHg9IjQyNSIgeT0iMjkwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2Ij5KdWluPC90ZXh0Pjwvc3ZnPg==',
  // Pie chart - Répartition
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMTYwIiByPSIxMDAiIGZpbGw9IiMzNDk4ZGIiLz48cGF0aCBkPSJNMTUwLDE2MCBMMTUwLDYwIEEgMTAwLDEwMCAwIDAsMSAyMzYuNjAsMTEwIFoiIGZpbGw9IiMyN2FlNjAiLz48cGF0aCBkPSJNMTUwLDE2MCBMMjM2LjYwLDExMCBBIDEwMCwxMDAgMCAwLDEgMjM2LjYwLDIxMCBaIiBmaWxsPSIjZTc0YzNjIi8+PHBhdGggZD0iTTE1MCwxNjAgTDIzNi42MCwyMTAgQSAxMDAsMTAwIDAgMCwxIDE1MCwyNjAgWiIgZmlsbD0iI2YzOWMxMiIvPjx0ZXh0IHg9IjIwMCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMzMzIj5Sw6lwYXJ0aXRpb24gZHUgQ0E8L3RleHQ+PHJlY3QgeD0iMjgwIiB5PSI4MCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjE1IiBmaWxsPSIjMjdhZTYwIi8+PHRleHQgeD0iMzAwIiB5PSI5MiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyI+UHJvZHVpdHMgKDM1JSk8L3RleHQ+PHJlY3QgeD0iMjgwIiB5PSIxMTAiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0iI2U3NGMzYyIvPjx0ZXh0IHg9IjMwMCIgeT0iMTIyIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMzMzIj5TZXJ2aWNlcyAoMzAlKTwvdGV4dD48cmVjdCB4PSIyODAiIHk9IjE0MCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjE1IiBmaWxsPSIjZjM5YzEyIi8+PHRleHQgeD0iMzAwIiB5PSIxNTIiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMzMzMiPkNvbnNlaWwgKDIwJSk8L3RleHQ+PHJlY3QgeD0iMjgwIiB5PSIxNzAiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjMwMCIgeT0iMTgyIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMzMzIj5BdXRyZXMgKDE1JSk8L3RleHQ+PC9zdmc+',
  // Line chart - Tendances
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlRlbmRhbmNlcyBkZSBDcm9pc3NhbmNlPC90ZXh0PjxsaW5lIHgxPSI1MCIgeTE9IjI1MCIgeDI9IjQ1MCIgeTI9IjI1MCIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iNTAiIHkxPSI1MCIgeDI9IjUwIiB5Mj0iMjUwIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIvPjxwb2x5bGluZSBwb2ludHM9IjUwLDIwMCAxMjAsMTgwIDE5MCwxNTAgMjYwLDE2MCAzMzAsMTIwIDQwMCw4MCA0NTAsNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM0OThkYiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBvbHlsaW5lIHBvaW50cz0iNTAsMjIwIDEyMCwyMTAgMTkwLDE5MCAyNjAsMTgwIDMzMCwxNzAgNDAwLDE1MCA0NTAsMTMwIiBmaWxsPSJub25lIiBzdHJva2U9IiMyN2FlNjAiIHN0cm9rZS13aWR0aD0iMyIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMjAwIiByPSI0IiBmaWxsPSIjMzQ5OGRiIi8+PGNpcmNsZSBjeD0iMTIwIiBjeT0iMTgwIiByPSI0IiBmaWxsPSIjMzQ5OGRiIi8+PGNpcmNsZSBjeD0iMTkwIiBjeT0iMTUwIiByPSI0IiBmaWxsPSIjMzQ5OGRiIi8+PGNpcmNsZSBjeD0iMjYwIiBjeT0iMTYwIiByPSI0IiBmaWxsPSIjMzQ5OGRiIi8+PGNpcmNsZSBjeD0iMzMwIiBjeT0iMTIwIiByPSI0IiBmaWxsPSIjMzQ5OGRiIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iODAiIHI9IjQiIGZpbGw9IiMzNDk4ZGIiLz48Y2lyY2xlIGN4PSI0NTAiIGN5PSI2MCIgcj0iNCIgZmlsbD0iIzM0OThkYiIvPjxyZWN0IHg9IjMwMCIgeT0iMjYwIiB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIGZpbGw9IiMzNDk4ZGIiLz48dGV4dCB4PSIzMjAiIHk9IjI3MiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzMzMyI+T2JqZWN0aWY8L3RleHQ+PHJlY3QgeD0iMzgwIiB5PSIyNjAiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0iIzI3YWU2MCIvPjx0ZXh0IHg9IjQwMCIgeT0iMjcyIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMzMzIj5Sw6lhbGlzw6k8L3RleHQ+PC9zdmc+',
  // Process diagram
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlByb2Nlc3N1cyBkZSBWYWxpZGF0aW9uPC90ZXh0PjxyZWN0IHg9IjMwIiB5PSI4MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiByeD0iNSIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjcwIiB5PSIxMTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIj5Tb3VtaXNzaW9uPC90ZXh0PjxsaW5lIHgxPSIxMTAiIHkxPSIxMTAiIHgyPSIxNTAiIHkyPSIxMTAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93KSIvPjxyZWN0IHg9IjE1MCIgeT0iODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgcng9IjUiIGZpbGw9IiNmMzljMTIiLz48dGV4dCB4PSIxOTAiIHk9IjExNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiPkFuYWx5c2U8L3RleHQ+PGxpbmUgeDE9IjIzMCIgeTE9IjExMCIgeDI9IjI3MCIgeTI9IjExMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIyNzAiIHk9IjgwIiB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHJ4PSI1IiBmaWxsPSIjZTc0YzNjIi8+PHRleHQgeD0iMzEwIiB5PSIxMTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIj5WYWxpZGF0aW9uPC90ZXh0PjxsaW5lIHgxPSIzNTAiIHkxPSIxMTAiIHgyPSIzOTAiIHkyPSIxMTAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMzkwIiB5PSI4MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiByeD0iNSIgZmlsbD0iIzI3YWU2MCIvPjx0ZXh0IHg9IjQzMCIgeT0iMTE1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSI+QXBwcm9iYXRpb248L3RleHQ+PHRleHQgeD0iNzAiIHk9IjE2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NiI+w4l0YXBlIDE8L3RleHQ+PHRleHQgeD0iMTkwIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2NjYiPsOJdGFwZSAyPC90ZXh0Pjx0ZXh0IHg9IjMxMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNjY2Ij7DiXRhcGUgMzwvdGV4dD48dGV4dCB4PSI0MzAiIHk9IjE2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NiI+w4l0YXBlIDQ8L3RleHQ+PC9zdmc+',
  // KPI Dashboard
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlRhYmxlYXUgZGUgQm9yZCBLUEk8L3RleHQ+PHJlY3QgeD0iMzAiIHk9IjUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjgwIiB5PSI4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj4rMjMlPC90ZXh0Pjx0ZXh0IHg9IjgwIiB5PSIxMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIj5Dcm9pc3NhbmNlPC90ZXh0PjxyZWN0IHg9IjE1MCIgeT0iNTAiIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIHJ4PSI4IiBmaWxsPSIjMjdhZTYwIi8+PHRleHQgeD0iMjAwIiB5PSI4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj45MiU8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIxMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIj5TYXRpc2ZhY3Rpb248L3RleHQ+PHJlY3QgeD0iMjcwIiB5PSI1MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI4MCIgcng9IjgiIGZpbGw9IiNmMzljMTIiLz48dGV4dCB4PSIzMjAiIHk9Ijg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPjE1MEs8L3RleHQ+PHRleHQgeD0iMzIwIiB5PSIxMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIj5DbGllbnRzPC90ZXh0PjxyZWN0IHg9IjM5MCIgeT0iNTAiIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIHJ4PSI4IiBmaWxsPSIjZTc0YzNjIi8+PHRleHQgeD0iNDQwIiB5PSI4NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj4zLjJNPC90ZXh0Pjx0ZXh0IHg9IjQ0MCIgeT0iMTEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSI+UmV2ZW51czwvdGV4dD48cmVjdCB4PSIzMCIgeT0iMTUwIiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjgwIiByeD0iOCIgZmlsbD0iI2VjZjBmMSIgc3Ryb2tlPSIjYmRjM2M3Ii8+PHRleHQgeD0iMTQwIiB5PSIxNzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMzMzIj5PYmplY3RpZiBUMTogMi41TSDigqw8L3RleHQ+PHJlY3QgeD0iNDAiIHk9IjE5MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIyMCIgcng9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iNDAiIHk9IjE5MCIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIyMCIgcng9IjEwIiBmaWxsPSIjMjdhZTYwIi8+PHRleHQgeD0iMjIwIiB5PSIyMDUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMzMzMiPjgwJTwvdGV4dD48L3N2Zz4=',
  // Organization chart
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjI4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPk9yZ2FuaWdyYW1tZTwvdGV4dD48cmVjdCB4PSIxOTAiIHk9IjQwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiByeD0iNSIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjI1MCIgeT0iNjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IndoaXRlIj5EaXJlY3Rpb24gR8OpbsOpcmFsZTwvdGV4dD48bGluZSB4MT0iMjUwIiB5MT0iODAiIHgyPSIyNTAiIHkyPSIxMTAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjgwIiB5MT0iMTEwIiB4Mj0iNDIwIiB5Mj0iMTEwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSI4MCIgeTE9IjExMCIgeDI9IjgwIiB5Mj0iMTMwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxNjUiIHkxPSIxMTAiIHgyPSIxNjUiIHkyPSIxMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjI1MCIgeTE9IjExMCIgeDI9IjI1MCIgeTI9IjEzMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMzM1IiB5MT0iMTEwIiB4Mj0iMzM1IiB5Mj0iMTMwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSI0MjAiIHkxPSIxMTAiIHgyPSI0MjAiIHkyPSIxMzAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMjAiIHk9IjEzMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiMyN2FlNjAiLz48dGV4dCB4PSI4MCIgeT0iMTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSI+RmluYW5jZXM8L3RleHQ+PHJlY3QgeD0iMTA1IiB5PSIxMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSIjZjM5YzEyIi8+PHRleHQgeD0iMTY1IiB5PSIxNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIj5SZXNzb3VyY2VzIEh1bWFpbmVzPC90ZXh0PjxyZWN0IHg9IjE5MCIgeT0iMTMwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiByeD0iNSIgZmlsbD0iI2U3NGMzYyIvPjx0ZXh0IHg9IjI1MCIgeT0iMTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSI+T3DDqXJhdGlvbnM8L3RleHQ+PHJlY3QgeD0iMjc1IiB5PSIxMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSIjOWI1OWI2Ii8+PHRleHQgeD0iMzM1IiB5PSIxNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIj5NYXJrZXRpbmc8L3RleHQ+PHJlY3QgeD0iMzYwIiB5PSIxMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSIjMWFiYzljIi8+PHRleHQgeD0iNDIwIiB5PSIxNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIj5UZWNOPC90ZXh0Pjwvc3ZnPg==',
  // Gantt chart
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlBsYW5uaW5nIFByb2pldDwvdGV4dD48dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiMzMzMiPkNvbmNlcHRpb248L3RleHQ+PHJlY3QgeD0iMTQwIiB5PSI0NSIgd2lkdGg9IjgwIiBoZWlnaHQ9IjIwIiByeD0iMyIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjYwIiB5PSI5NSIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzMzMyI+RMOpdmVsb3BwZW1lbnQ8L3RleHQ+PHJlY3QgeD0iMjAwIiB5PSI4MCIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMCIgcng9IjMiIGZpbGw9IiMyN2FlNjAiLz48dGV4dCB4PSI2MCIgeT0iMTMwIiBmb250LXNpemU9IjExIiBmaWxsPSIjMzMzIj5UZXN0czwvdGV4dD48cmVjdCB4PSIzMjAiIHk9IjExNSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIyMCIgcng9IjMiIGZpbGw9IiNmMzljMTIiLz48dGV4dCB4PSI2MCIgeT0iMTY1IiBmb250LXNpemU9IjExIiBmaWxsPSIjMzMzIj5Ew6lwbG9pZW1lbnQ8L3RleHQ+PHJlY3QgeD0iMzgwIiB5PSIxNTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgcng9IjMiIGZpbGw9IiNlNzRjM2MiLz48dGV4dCB4PSI2MCIgeT0iMjAwIiBmb250LXNpemU9IjExIiBmaWxsPSIjMzMzIj5TdXBwb3J0PC90ZXh0PjxyZWN0IHg9IjQyMCIgeT0iMTg1IiB3aWR0aD0iNjAiIGhlaWdodD0iMjAiIHJ4PSIzIiBmaWxsPSIjOWI1OWI2Ii8+PGxpbmUgeDE9IjE0MCIgeTE9IjQwIiB4Mj0iMTQwIiB5Mj0iMjIwIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSIyMjAiIHkxPSI0MCIgeDI9IjIyMCIgeTI9IjIyMCIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iMzAwIiB5MT0iNDAiIHgyPSIzMDAiIHkyPSIyMjAiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIxIi8+PGxpbmUgeDE9IjM4MCIgeTE9IjQwIiB4Mj0iMzgwIiB5Mj0iMjIwIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSI0NjAiIHkxPSI0MCIgeDI9IjQ2MCIgeTI9IjIyMCIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48dGV4dCB4PSIxODAiIHk9IjIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI5IiBmaWxsPSIjNjY2Ij5KYW48L3RleHQ+PHRleHQgeD0iMjYwIiB5PSIyMzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iOSIgZmlsbD0iIzY2NiI+RsOpdjwvdGV4dD48dGV4dCB4PSIzNDAiIHk9IjIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI5IiBmaWxsPSIjNjY2Ij5NYXI8L3RleHQ+PHRleHQgeD0iNDIwIiB5PSIyMzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iOSIgZmlsbD0iIzY2NiI+QXZyPC90ZXh0Pjwvc3ZnPg==',
  // Map/Geography
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iMjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiPlLDqXBhcnRpdGlvbiBHw6lvZ3JhcGhpcXVlPC90ZXh0PjxlbGxpcHNlIGN4PSIxNTAiIGN5PSIxNTAiIHJ4PSIxMDAiIHJ5PSI4MCIgZmlsbD0iI2VjZjBmMSIgc3Ryb2tlPSIjYmRjM2M3Ii8+PGNpcmNsZSBjeD0iMTIwIiBjeT0iMTIwIiByPSIxNSIgZmlsbD0iIzM0OThkYiIvPjx0ZXh0IHg9IjEyMCIgeT0iMTI1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSI+MzIlPC90ZXh0PjxjaXJjbGUgY3g9IjE4MCIgY3k9IjE0MCIgcj0iMTIiIGZpbGw9IiMyN2FlNjAiLz48dGV4dCB4PSIxODAiIHk9IjE0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI4IiBmaWxsPSJ3aGl0ZSI+MjElPC90ZXh0PjxjaXJjbGUgY3g9IjE0MCIgY3k9IjE4MCIgcj0iMTAiIGZpbGw9IiNmMzljMTIiLz48dGV4dCB4PSIxNDAiIHk9IjE4NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI3IiBmaWxsPSJ3aGl0ZSI+MTglPC90ZXh0PjxjaXJjbGUgY3g9IjEwMCIgY3k9IjE2MCIgcj0iOCIgZmlsbD0iI2U3NGMzYyIvPjx0ZXh0IHg9IjEwMCIgeT0iMTYzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjYiIGZpbGw9IndoaXRlIj4xNCU8L3RleHQ+PHJlY3QgeD0iMjgwIiB5PSI2MCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjE1IiBmaWxsPSIjMzQ5OGRiIi8+PHRleHQgeD0iMzAwIiB5PSI3MiIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzMzMyI+w45sZS1kZS1GcmFuY2U8L3RleHQ+PHJlY3QgeD0iMjgwIiB5PSI5MCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjE1IiBmaWxsPSIjMjdhZTYwIi8+PHRleHQgeD0iMzAwIiB5PSIxMDIiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiMzMzMiPkF1dmVyZ25lLVJBPC90ZXh0PjxyZWN0IHg9IjI4MCIgeT0iMTIwIiB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIGZpbGw9IiNmMzljMTIiLz48dGV4dCB4PSIzMDAiIHk9IjEzMiIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzMzMyI+UEFDQTL8L3RleHQ+PHJlY3QgeD0iMjgwIiB5PSIxNTAiIHdpZHRoPSIxNSIgaGVpZ2h0PSIxNSIgZmlsbD0iI2U3NGMzYyIvPjx0ZXh0IHg9IjMwMCIgeT0iMTYyIiBmb250LXNpemU9IjExIiBmaWxsPSIjMzMzIj5PY2NpdGFuaWU8L3RleHQ+PC9zdmc+',
];


/**
 * Get a random element from an array
 */
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get random elements from an array
 */
function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generate HTML content for a single page
 */
export function generatePageContent(pageIndex: number, includeTable: boolean = false): string {
  const parts: string[] = [];

  // Add title
  const title = TITLES[pageIndex % TITLES.length];
  parts.push(`<h1>${title}</h1>`);

  // Add subtitle
  if (pageIndex % 3 === 0) {
    const subtitle = randomElement(SUBTITLES);
    parts.push(`<h2>${subtitle}</h2>`);
  }

  // Add paragraphs
  const paragraphCount = 2 + (pageIndex % 3);
  const paragraphs = randomElements(PARAGRAPHS, paragraphCount);
  paragraphs.forEach(p => {
    parts.push(`<p>${p}</p>`);
  });

  // Add a list every few pages
  if (pageIndex % 4 === 1) {
    parts.push('<h3>Points importants</h3>');
    parts.push('<ul>');
    const items = randomElements(LIST_ITEMS, 4);
    items.forEach(item => {
      parts.push(`<li>${item}</li>`);
    });
    parts.push('</ul>');
  }

  // Add table if requested
  if (includeTable && pageIndex % 5 === 2) {
    const headerIndex = pageIndex % TABLE_HEADERS.length;
    const dataIndex = pageIndex % TABLE_DATA.length;

    parts.push('<h3>Tableau récapitulatif</h3>');
    parts.push('<table style="width:100%; border-collapse: collapse; margin: 16px 0;">');
    parts.push('<thead><tr>');
    TABLE_HEADERS[headerIndex].forEach(h => {
      parts.push(`<th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; text-align: left;">${h}</th>`);
    });
    parts.push('</tr></thead>');
    parts.push('<tbody>');
    TABLE_DATA[dataIndex].forEach(row => {
      parts.push('<tr>');
      row.forEach(cell => {
        parts.push(`<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`);
      });
      parts.push('</tr>');
    });
    parts.push('</tbody></table>');
  }

  // Add more paragraphs
  if (pageIndex % 2 === 0) {
    const moreParagraphs = randomElements(PARAGRAPHS, 2);
    moreParagraphs.forEach(p => {
      parts.push(`<p>${p}</p>`);
    });
  }

  // Add numbered list
  if (pageIndex % 6 === 3) {
    parts.push('<h3>Étapes du processus</h3>');
    parts.push('<ol>');
    for (let i = 1; i <= 5; i++) {
      parts.push(`<li>Étape ${i}: ${randomElement(LIST_ITEMS)}</li>`);
    }
    parts.push('</ol>');
  }

  return parts.join('\n');
}

/**
 * Helper to create a paragraph node
 */
function createParagraph(text: string, format: number = 0): object {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text, format, mode: 'normal' }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  };
}

/**
 * Helper to create a heading node
 */
function createHeading(text: string, tag: 'h1' | 'h2' | 'h3'): object {
  return {
    type: 'heading',
    tag,
    children: [{ type: 'text', text, format: 0, mode: 'normal' }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  };
}

/**
 * Helper to create an image node - matches SerializedImageNode format
 */
function createImage(src: string, altText: string, width: number = 500, height: number = 280): object {
  return {
    type: 'image',
    version: 1,
    src,
    altText,
    width,
    height,
    alignment: 'center',
    caption: '',
  };
}

/**
 * Helper to create a table node
 */
function createTable(headerIndex: number, dataIndex: number): object {
  const tableRows = [
    {
      type: 'tablerow',
      children: TABLE_HEADERS[headerIndex].map(h => ({
        type: 'tablecell',
        headerState: 1,
        children: [{ type: 'paragraph', children: [{ type: 'text', text: h, format: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        colSpan: 1,
        rowSpan: 1,
        backgroundColor: null,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
    ...TABLE_DATA[dataIndex].map(row => ({
      type: 'tablerow',
      children: row.map(cell => ({
        type: 'tablecell',
        headerState: 0,
        children: [{ type: 'paragraph', children: [{ type: 'text', text: cell, format: 0 }], direction: 'ltr', format: '', indent: 0, version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        colSpan: 1,
        rowSpan: 1,
        backgroundColor: null,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })),
  ];

  return {
    type: 'table',
    children: tableRows,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  };
}

/**
 * Helper to create a bullet list - simplified for Lexical
 */
function createBulletList(items: string[]): object[] {
  // Return individual paragraphs with bullet character as Lexical lists can be complex
  return items.map(item => ({
    type: 'paragraph',
    children: [{ type: 'text', text: `• ${item}`, format: 0, mode: 'normal' }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }));
}

/**
 * Helper to create a numbered list - simplified for Lexical
 */
function createNumberedList(items: string[]): object[] {
  // Return individual paragraphs with numbers as Lexical lists can be complex
  return items.map((item, idx) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: `${idx + 1}. ${item}`, format: 0, mode: 'normal' }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }));
}

/**
 * Generate rich Lexical editor state JSON for a page - DENSE content version
 */
export function generateLexicalContent(pageIndex: number, options: { includeTable?: boolean; includeImage?: boolean; totalPages?: number } = {}): object {
  const { includeTable = true, includeImage = true, totalPages = 1 } = options;
  const isRichDoc = totalPages > 1;

  const children: object[] = [];

  // ===== SECTION 1: Title and Introduction =====
  const title = TITLES[pageIndex % TITLES.length];
  children.push(createHeading(title, 'h1'));

  const subtitle = SUBTITLES[pageIndex % SUBTITLES.length];
  children.push(createHeading(subtitle, 'h2'));

  // Intro paragraph (italic)
  children.push(createParagraph(
    `Cette section présente les éléments clés relatifs à la page ${pageIndex + 1} sur ${totalPages} du document. Les informations ci-dessous ont été compilées à partir de sources fiables et vérifiées par notre équipe d'experts.`,
    2 // italic
  ));

  // First content paragraph
  children.push(createParagraph(PARAGRAPHS[pageIndex % PARAGRAPHS.length]));

  // ===== SECTION 2: Image (on EVERY page for rich docs) =====
  if (isRichDoc && includeImage) {
    const imageIdx = pageIndex % DEMO_IMAGES.length;
    const figureNum = pageIndex + 1;
    const imageTitles = [
      'Évolution des indicateurs',
      'Répartition du chiffre d\'affaires',
      'Tendances de croissance',
      'Processus de validation',
      'Tableau de bord KPI',
      'Organigramme',
      'Planning projet',
      'Répartition géographique',
    ];

    children.push(createHeading(`Figure ${figureNum}: ${imageTitles[imageIdx]}`, 'h3'));
    children.push(createImage(DEMO_IMAGES[imageIdx], `Graphique ${figureNum}`, 500, 280));
    children.push(createParagraph(`Source: Analyse interne - Données consolidées au ${new Date().toLocaleDateString('fr-FR')}`, 2));
  }

  // Second paragraph
  children.push(createParagraph(PARAGRAPHS[(pageIndex + 1) % PARAGRAPHS.length]));

  // ===== SECTION 3: Table (on every 2nd page) =====
  if (isRichDoc && includeTable && pageIndex % 2 === 0) {
    const headerIndex = pageIndex % TABLE_HEADERS.length;
    const dataIndex = pageIndex % TABLE_DATA.length;
    const tableNum = Math.floor(pageIndex / 2) + 1;

    children.push(createHeading(`Tableau ${tableNum}: Synthèse des données`, 'h3'));
    children.push(createTable(headerIndex, dataIndex));
  }

  // Third paragraph
  children.push(createParagraph(PARAGRAPHS[(pageIndex + 2) % PARAGRAPHS.length]));

  // ===== SECTION 4: List (alternating bullet/numbered) =====
  if (isRichDoc) {
    const startIdx = (pageIndex * 2) % LIST_ITEMS.length;
    const items = [
      LIST_ITEMS[startIdx % LIST_ITEMS.length],
      LIST_ITEMS[(startIdx + 1) % LIST_ITEMS.length],
      LIST_ITEMS[(startIdx + 2) % LIST_ITEMS.length],
      LIST_ITEMS[(startIdx + 3) % LIST_ITEMS.length],
    ];

    if (pageIndex % 2 === 0) {
      children.push(createHeading('Points clés à retenir', 'h3'));
      children.push(...createBulletList(items));
    } else {
      children.push(createHeading('Plan d\'action recommandé', 'h3'));
      children.push(...createNumberedList(items.map((item, i) => `Phase ${i + 1}: ${item}`)));
    }
  }

  // Fourth paragraph
  children.push(createParagraph(PARAGRAPHS[(pageIndex + 3) % PARAGRAPHS.length]));

  // ===== SECTION 5: Second Table (on odd pages) =====
  if (isRichDoc && includeTable && pageIndex % 2 === 1) {
    const headerIndex = (pageIndex + 3) % TABLE_HEADERS.length;
    const dataIndex = (pageIndex + 3) % TABLE_DATA.length;
    const tableNum = Math.floor(pageIndex / 2) + 1;

    children.push(createHeading(`Tableau ${tableNum}: Données complémentaires`, 'h3'));
    children.push(createTable(headerIndex, dataIndex));
  }

  // Fifth paragraph
  children.push(createParagraph(PARAGRAPHS[(pageIndex + 4) % PARAGRAPHS.length]));

  // ===== SECTION 6: Conclusion with rich formatting =====
  children.push({
    type: 'paragraph',
    children: [
      { type: 'text', text: 'En conclusion, ', format: 0, mode: 'normal' },
      { type: 'text', text: 'les éléments présentés', format: 1, mode: 'normal' }, // Bold
      { type: 'text', text: ' dans cette section démontrent l\'importance d\'une ', format: 0, mode: 'normal' },
      { type: 'text', text: 'approche méthodique et structurée', format: 3, mode: 'normal' }, // Bold + Italic
      { type: 'text', text: ' pour atteindre les objectifs fixés. Les données analysées confirment la pertinence de notre stratégie.', format: 0, mode: 'normal' },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  });

  // Final paragraph
  children.push(createParagraph(PARAGRAPHS[(pageIndex + 5) % PARAGRAPHS.length]));

  // Additional content paragraph to fill space
  children.push(createParagraph(PARAGRAPHS[(pageIndex + 6) % PARAGRAPHS.length]));

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  };
}

/**
 * Demo types
 */
export type DemoType = 'empty' | 'small' | 'large';

/**
 * Get demo configuration from URL
 */
export function getDemoConfig(): { type: DemoType; pageCount: number } {
  const urlParams = new URLSearchParams(window.location.search);
  const demo = urlParams.get('demo') as DemoType | null;

  switch (demo) {
    case 'small':
      return { type: 'small', pageCount: 20 };
    case 'large':
      return { type: 'large', pageCount: 300 };
    case 'empty':
    default:
      return { type: 'empty', pageCount: 1 };
  }
}

export default generatePageContent;

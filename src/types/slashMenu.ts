/**
 * Slash Menu Types and Items
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import type { TypeaheadItem } from '../hooks/useTypeahead';
import type { SlotType } from './slot';
import type { CommentType } from './comment';

/**
 * Action types for slash menu items
 */
export type SlashMenuActionType =
  | 'insert_slot'
  | 'insert_heading'
  | 'insert_list'
  | 'insert_table'
  | 'insert_special_table'
  | 'insert_image'
  | 'insert_divider'
  | 'insert_quote'
  | 'insert_code'
  | 'insert_comment'
  | 'insert_footnote'
  | 'insert_symbol'
  | 'open_query_builder'
  | 'format_text'
  | 'insert_page_break'
  | 'custom';

/**
 * Slash menu item interface
 */
export interface SlashMenuItem extends TypeaheadItem {
  /** Action type */
  actionType: SlashMenuActionType;
  /** Payload for the action */
  payload?: SlashMenuPayload | undefined;
  /** Shortcut key hint */
  shortcut?: string | undefined;
}

/**
 * Special table type for payload
 */
export type SpecialTablePayloadType = 'products_by_group' | 'history' | 'validation';

/**
 * Payload types for different actions
 */
export type SlashMenuPayload =
  | { type: 'slot'; slotType: SlotType }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'list'; listType: 'bullet' | 'number' | 'check' }
  | { type: 'table'; rows?: number; cols?: number }
  | { type: 'special_table'; tableType: SpecialTablePayloadType }
  | { type: 'comment'; commentType?: CommentType }
  | { type: 'format'; format: string }
  | { type: 'custom'; handler: string };

/**
 * Slash menu categories
 * Per spec: "/" menu shows contextual menu for inserting special content
 * - For modèle: champs dynamiques, tableaux spéciaux, commentaires
 * - For document: basic document elements
 */
export const SLASH_MENU_CATEGORIES = {
  CHAMPS_DYNAMIQUES: 'Champs Dynamiques',
  TABLEAUX_SPECIAUX: 'Tableaux Spéciaux',
  COMMENTAIRES: 'Commentaires',
  ELEMENTS: 'Éléments',
} as const;

/**
 * All slash menu items - simplified per specifications
 */
export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  // === Champs Dynamiques (for modèle) ===
  {
    id: 'dynamic_content',
    label: 'Champ dynamique',
    description: 'Insérer un champ dynamique',
    category: SLASH_MENU_CATEGORIES.CHAMPS_DYNAMIQUES,
    keywords: ['dynamique', 'champ', 'variable', 'donnee'],
    icon: 'Sparkles',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'dynamic_content' },
  },
  {
    id: 'donnee',
    label: 'Donnée',
    description: 'Insérer une référence de donnée',
    category: SLASH_MENU_CATEGORIES.CHAMPS_DYNAMIQUES,
    keywords: ['data', 'donnee', 'valeur', 'reference'],
    icon: 'Database',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'donnee' },
  },
  {
    id: 'at_fetcher',
    label: 'Fetcher (@)',
    description: 'Insérer une référence de données API',
    category: SLASH_MENU_CATEGORIES.CHAMPS_DYNAMIQUES,
    keywords: ['fetcher', 'api', 'data', 'requete'],
    icon: 'AtSign',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'at_fetcher' },
  },
  {
    id: 'query_builder',
    label: 'Requête SQL',
    description: 'Ouvrir l\'éditeur de requêtes',
    category: SLASH_MENU_CATEGORIES.CHAMPS_DYNAMIQUES,
    keywords: ['query', 'requete', 'sql', 'database'],
    icon: 'Database',
    actionType: 'open_query_builder',
  },

  // === Tableaux Spéciaux (for modèle) ===
  {
    id: 'products_table',
    label: 'Produits par groupe',
    description: 'Tableau des produits concernés',
    category: SLASH_MENU_CATEGORIES.TABLEAUX_SPECIAUX,
    keywords: ['produits', 'groupe', 'tableau'],
    icon: 'Package',
    actionType: 'insert_special_table',
    payload: { type: 'special_table', tableType: 'products_by_group' },
  },
  {
    id: 'history_table',
    label: 'Historique',
    description: 'Tableau d\'historique des versions',
    category: SLASH_MENU_CATEGORIES.TABLEAUX_SPECIAUX,
    keywords: ['historique', 'versions', 'changelog'],
    icon: 'History',
    actionType: 'insert_special_table',
    payload: { type: 'special_table', tableType: 'history' },
  },
  {
    id: 'validation_table',
    label: 'Validation',
    description: 'Tableau de validation et signatures',
    category: SLASH_MENU_CATEGORIES.TABLEAUX_SPECIAUX,
    keywords: ['validation', 'signature', 'approbation'],
    icon: 'CheckCircle',
    actionType: 'insert_special_table',
    payload: { type: 'special_table', tableType: 'validation' },
  },
  {
    id: 'table',
    label: 'Tableau simple',
    description: 'Insérer un tableau',
    category: SLASH_MENU_CATEGORIES.TABLEAUX_SPECIAUX,
    keywords: ['table', 'tableau', 'grille'],
    icon: 'Table',
    actionType: 'insert_table',
    payload: { type: 'table', rows: 3, cols: 3 },
  },

  // === Commentaires ===
  {
    id: 'comment',
    label: 'Commentaire',
    description: 'Ajouter une remarque',
    category: SLASH_MENU_CATEGORIES.COMMENTAIRES,
    keywords: ['comment', 'remarque', 'note'],
    icon: 'MessageSquare',
    actionType: 'insert_comment',
    payload: { type: 'comment', commentType: 'remark' },
  },
  {
    id: 'comment_question',
    label: 'Question',
    description: 'Poser une question',
    category: SLASH_MENU_CATEGORIES.COMMENTAIRES,
    keywords: ['question', 'demande'],
    icon: 'HelpCircle',
    actionType: 'insert_comment',
    payload: { type: 'comment', commentType: 'question' },
  },
  {
    id: 'comment_suggestion',
    label: 'Suggestion',
    description: 'Proposer une modification',
    category: SLASH_MENU_CATEGORIES.COMMENTAIRES,
    keywords: ['suggestion', 'proposition', 'idee'],
    icon: 'Lightbulb',
    actionType: 'insert_comment',
    payload: { type: 'comment', commentType: 'suggestion' },
  },

  // === Éléments (basic document elements) ===
  {
    id: 'heading1',
    label: 'Titre 1',
    description: 'Grand titre de section',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['titre', 'heading', 'h1'],
    icon: 'Heading1',
    actionType: 'insert_heading',
    payload: { type: 'heading', level: 1 },
  },
  {
    id: 'heading2',
    label: 'Titre 2',
    description: 'Sous-titre de section',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['titre', 'heading', 'h2'],
    icon: 'Heading2',
    actionType: 'insert_heading',
    payload: { type: 'heading', level: 2 },
  },
  {
    id: 'bullet_list',
    label: 'Liste à puces',
    description: 'Liste non numérotée',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['liste', 'puces', 'bullet'],
    icon: 'List',
    actionType: 'insert_list',
    payload: { type: 'list', listType: 'bullet' },
  },
  {
    id: 'numbered_list',
    label: 'Liste numérotée',
    description: 'Liste ordonnée',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['liste', 'numerotee', 'nombre'],
    icon: 'ListOrdered',
    actionType: 'insert_list',
    payload: { type: 'list', listType: 'number' },
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Insérer une image',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['image', 'photo', 'illustration'],
    icon: 'Image',
    actionType: 'insert_image',
  },
  {
    id: 'divider',
    label: 'Séparateur',
    description: 'Ligne de séparation',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['separateur', 'ligne', 'divider'],
    icon: 'Minus',
    actionType: 'insert_divider',
  },
  {
    id: 'page_break',
    label: 'Saut de page',
    description: 'Nouvelle page',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['page', 'saut', 'break'],
    icon: 'FileBreak',
    actionType: 'insert_page_break',
  },
  {
    id: 'footnote',
    label: 'Note de bas de page',
    description: 'Ajouter une note',
    category: SLASH_MENU_CATEGORIES.ELEMENTS,
    keywords: ['note', 'footnote', 'reference'],
    icon: 'FileText',
    actionType: 'insert_footnote',
  },
];

/**
 * Get menu items filtered by category
 */
export function getItemsByCategory(category: string): SlashMenuItem[] {
  return SLASH_MENU_ITEMS.filter((item) => item.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set<string>();
  for (const item of SLASH_MENU_ITEMS) {
    if (item.category) {
      categories.add(item.category);
    }
  }
  return Array.from(categories);
}

export default SLASH_MENU_ITEMS;

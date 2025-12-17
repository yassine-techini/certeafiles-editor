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
  | 'insert_image'
  | 'insert_divider'
  | 'insert_quote'
  | 'insert_code'
  | 'insert_comment'
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
 * Payload types for different actions
 */
export type SlashMenuPayload =
  | { type: 'slot'; slotType: SlotType }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'list'; listType: 'bullet' | 'number' | 'check' }
  | { type: 'table'; rows?: number; cols?: number }
  | { type: 'comment'; commentType?: CommentType }
  | { type: 'format'; format: string }
  | { type: 'custom'; handler: string };

/**
 * Slash menu categories
 */
export const SLASH_MENU_CATEGORIES = {
  MODELE: 'Modèle',
  DOCUMENT: 'Document',
  FORMAT: 'Format',
  INSERT: 'Insert',
} as const;

/**
 * All slash menu items
 */
export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  // === Modèle Category ===
  {
    id: 'dynamic_content',
    label: 'Contenu Dynamique',
    description: 'Insert dynamic content placeholder',
    category: SLASH_MENU_CATEGORIES.MODELE,
    keywords: ['dynamic', 'content', 'variable', 'placeholder'],
    icon: 'Sparkles',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'dynamic_content' },
  },
  {
    id: 'at_fetcher',
    label: '@Fetcher',
    description: 'Insert data fetcher reference',
    category: SLASH_MENU_CATEGORIES.MODELE,
    keywords: ['fetcher', 'data', 'api', 'reference'],
    icon: 'AtSign',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'at_fetcher' },
  },
  {
    id: 'donnee',
    label: 'Donnée',
    description: 'Insert data field',
    category: SLASH_MENU_CATEGORIES.MODELE,
    keywords: ['data', 'field', 'donnee', 'value'],
    icon: 'Database',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'donnee' },
  },
  {
    id: 'ancre',
    label: 'Ancre',
    description: 'Insert anchor point',
    category: SLASH_MENU_CATEGORIES.MODELE,
    keywords: ['anchor', 'ancre', 'link', 'reference'],
    icon: 'Anchor',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'ancre' },
  },
  {
    id: 'section_speciale',
    label: 'Section Spéciale',
    description: 'Insert special section',
    category: SLASH_MENU_CATEGORIES.MODELE,
    keywords: ['section', 'special', 'block'],
    icon: 'LayoutTemplate',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'section_speciale' },
  },
  {
    id: 'commentaire_slot',
    label: 'Zone Commentaire',
    description: 'Insert comment zone',
    category: SLASH_MENU_CATEGORIES.MODELE,
    keywords: ['comment', 'note', 'zone'],
    icon: 'MessageSquareDashed',
    actionType: 'insert_slot',
    payload: { type: 'slot', slotType: 'commentaire' },
  },

  // === Document Category ===
  {
    id: 'heading1',
    label: 'Titre 1',
    description: 'Large section heading',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['heading', 'title', 'h1', 'titre'],
    icon: 'Heading1',
    actionType: 'insert_heading',
    payload: { type: 'heading', level: 1 },
    shortcut: '#',
  },
  {
    id: 'heading2',
    label: 'Titre 2',
    description: 'Medium section heading',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['heading', 'title', 'h2', 'titre'],
    icon: 'Heading2',
    actionType: 'insert_heading',
    payload: { type: 'heading', level: 2 },
    shortcut: '##',
  },
  {
    id: 'heading3',
    label: 'Titre 3',
    description: 'Small section heading',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['heading', 'title', 'h3', 'titre'],
    icon: 'Heading3',
    actionType: 'insert_heading',
    payload: { type: 'heading', level: 3 },
    shortcut: '###',
  },
  {
    id: 'bullet_list',
    label: 'Liste à Puces',
    description: 'Create bulleted list',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['bullet', 'list', 'unordered', 'puces'],
    icon: 'List',
    actionType: 'insert_list',
    payload: { type: 'list', listType: 'bullet' },
    shortcut: '-',
  },
  {
    id: 'numbered_list',
    label: 'Liste Numérotée',
    description: 'Create numbered list',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['number', 'list', 'ordered', 'numerotee'],
    icon: 'ListOrdered',
    actionType: 'insert_list',
    payload: { type: 'list', listType: 'number' },
    shortcut: '1.',
  },
  {
    id: 'checklist',
    label: 'Liste de Tâches',
    description: 'Create task checklist',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['check', 'todo', 'task', 'taches'],
    icon: 'ListChecks',
    actionType: 'insert_list',
    payload: { type: 'list', listType: 'check' },
    shortcut: '[]',
  },
  {
    id: 'table',
    label: 'Tableau',
    description: 'Insert table',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['table', 'grid', 'tableau'],
    icon: 'Table',
    actionType: 'insert_table',
    payload: { type: 'table', rows: 3, cols: 3 },
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Insert image',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['image', 'picture', 'photo'],
    icon: 'Image',
    actionType: 'insert_image',
  },
  {
    id: 'divider',
    label: 'Séparateur',
    description: 'Insert horizontal divider',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['divider', 'line', 'separator', 'hr'],
    icon: 'Minus',
    actionType: 'insert_divider',
    shortcut: '---',
  },
  {
    id: 'quote',
    label: 'Citation',
    description: 'Insert blockquote',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['quote', 'blockquote', 'citation'],
    icon: 'Quote',
    actionType: 'insert_quote',
    shortcut: '>',
  },
  {
    id: 'code_block',
    label: 'Bloc de Code',
    description: 'Insert code block',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['code', 'snippet', 'programming'],
    icon: 'Code',
    actionType: 'insert_code',
    shortcut: '```',
  },
  {
    id: 'page_break',
    label: 'Saut de Page',
    description: 'Insert page break',
    category: SLASH_MENU_CATEGORIES.DOCUMENT,
    keywords: ['page', 'break', 'saut'],
    icon: 'FileBreak',
    actionType: 'insert_page_break',
  },

  // === Insert Category ===
  {
    id: 'comment',
    label: 'Commentaire',
    description: 'Add comment to selection',
    category: SLASH_MENU_CATEGORIES.INSERT,
    keywords: ['comment', 'note', 'remark'],
    icon: 'MessageSquare',
    actionType: 'insert_comment',
    payload: { type: 'comment', commentType: 'remark' },
  },
  {
    id: 'comment_question',
    label: 'Question',
    description: 'Add question comment',
    category: SLASH_MENU_CATEGORIES.INSERT,
    keywords: ['question', 'ask', 'query'],
    icon: 'HelpCircle',
    actionType: 'insert_comment',
    payload: { type: 'comment', commentType: 'question' },
  },
  {
    id: 'comment_suggestion',
    label: 'Suggestion',
    description: 'Add suggestion comment',
    category: SLASH_MENU_CATEGORIES.INSERT,
    keywords: ['suggestion', 'propose', 'idea'],
    icon: 'Lightbulb',
    actionType: 'insert_comment',
    payload: { type: 'comment', commentType: 'suggestion' },
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

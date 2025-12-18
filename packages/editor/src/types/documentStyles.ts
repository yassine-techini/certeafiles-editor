/**
 * Document Styles Types - Style management for the editor
 * Per Constitution Section 1 - General Features
 */

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Font weight options
 */
export type FontWeight = 'normal' | 'bold' | 'light';

/**
 * Base text style properties
 */
export interface TextStyleProperties {
  /** Font family */
  fontFamily?: string;
  /** Font size in points */
  fontSize?: number;
  /** Font weight */
  fontWeight?: FontWeight;
  /** Italic */
  italic?: boolean;
  /** Underline */
  underline?: boolean;
  /** Text color (hex) */
  color?: string;
  /** Background/highlight color (hex) */
  backgroundColor?: string;
  /** Letter spacing */
  letterSpacing?: number;
  /** Line height multiplier */
  lineHeight?: number;
  /** Text alignment */
  textAlign?: TextAlignment;
}

/**
 * Paragraph style properties
 */
export interface ParagraphStyleProperties extends TextStyleProperties {
  /** Space before paragraph in points */
  spaceBefore?: number;
  /** Space after paragraph in points */
  spaceAfter?: number;
  /** First line indent in points */
  firstLineIndent?: number;
  /** Left indent in points */
  leftIndent?: number;
  /** Right indent in points */
  rightIndent?: number;
}

/**
 * Document style definition
 */
export interface DocumentStyle {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Style type */
  type: 'paragraph' | 'character' | 'heading';
  /** Style properties */
  properties: ParagraphStyleProperties;
  /** Is this a system style (cannot be deleted) */
  isSystem?: boolean;
  /** Parent style ID for inheritance */
  basedOn?: string;
  /** When created */
  createdAt: Date;
  /** When last modified */
  updatedAt: Date;
}

/**
 * Default font families available
 */
export const DEFAULT_FONT_FAMILIES = [
  'Times New Roman',
  'Arial',
  'Helvetica',
  'Georgia',
  'Calibri',
  'Verdana',
  'Garamond',
  'Courier New',
  'Trebuchet MS',
  'Palatino Linotype',
];

/**
 * Default font sizes available
 */
export const DEFAULT_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

/**
 * Predefined system styles
 */
export const SYSTEM_STYLES: DocumentStyle[] = [
  {
    id: 'normal',
    name: 'Normal',
    description: 'Style par défaut pour le texte',
    type: 'paragraph',
    properties: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 1.5,
      textAlign: 'left',
      spaceAfter: 8,
    },
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'heading1',
    name: 'Titre 1',
    description: 'Titre principal',
    type: 'heading',
    properties: {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 1.3,
      spaceBefore: 24,
      spaceAfter: 12,
    },
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'heading2',
    name: 'Titre 2',
    description: 'Sous-titre',
    type: 'heading',
    properties: {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      lineHeight: 1.3,
      spaceBefore: 18,
      spaceAfter: 10,
    },
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'heading3',
    name: 'Titre 3',
    description: 'Titre de section',
    type: 'heading',
    properties: {
      fontFamily: 'Arial',
      fontSize: 14,
      fontWeight: 'bold',
      lineHeight: 1.3,
      spaceBefore: 14,
      spaceAfter: 8,
    },
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'quote',
    name: 'Citation',
    description: 'Style pour les citations',
    type: 'paragraph',
    properties: {
      fontFamily: 'Georgia',
      fontSize: 12,
      fontWeight: 'normal',
      italic: true,
      leftIndent: 40,
      rightIndent: 40,
      lineHeight: 1.5,
      spaceBefore: 12,
      spaceAfter: 12,
      color: '#555555',
    },
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Style pour le code',
    type: 'paragraph',
    properties: {
      fontFamily: 'Courier New',
      fontSize: 11,
      fontWeight: 'normal',
      lineHeight: 1.4,
      backgroundColor: '#f5f5f5',
      spaceBefore: 8,
      spaceAfter: 8,
    },
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Special symbols categories
 */
export const SYMBOL_CATEGORIES = {
  COMMON: 'Symboles courants',
  ARROWS: 'Flèches',
  MATH: 'Mathématiques',
  CURRENCY: 'Devises',
  LEGAL: 'Juridique',
  PUNCTUATION: 'Ponctuation',
  GREEK: 'Grec',
} as const;

/**
 * Special symbols grouped by category
 */
export const SPECIAL_SYMBOLS: Record<keyof typeof SYMBOL_CATEGORIES, string[]> = {
  COMMON: ['©', '®', '™', '°', '€', '£', '¥', '§', '¶', '†', '‡', '•', '…', '№'],
  ARROWS: ['←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '⇑', '⇓', '⇔', '↩', '↪', '➔'],
  MATH: ['±', '×', '÷', '≠', '≈', '≤', '≥', '∞', '∑', '∏', '√', '∫', '∂', 'π'],
  CURRENCY: ['$', '€', '£', '¥', '¢', '₹', '₽', '₩', '₪', '฿', '₴', '₦', '₡', '₫'],
  LEGAL: ['©', '®', '™', '§', '¶', '†', '‡', '℗', '℠', '⚖', '✓', '✗', '✔', '✘'],
  PUNCTUATION: ['«', '»', '‹', '›', '\u201C', '\u201D', '\u2018', '\u2019', '–', '—', '·', '‚', '„', '¡', '¿'],
  GREEK: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ω', 'Ω', 'Δ', 'Σ', 'Φ'],
};

/**
 * Create a new custom style
 */
export function createDocumentStyle(
  name: string,
  type: DocumentStyle['type'],
  properties: ParagraphStyleProperties,
  basedOn?: string
): DocumentStyle {
  const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const style: DocumentStyle = {
    id,
    name,
    type,
    properties,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };
  if (basedOn !== undefined) {
    style.basedOn = basedOn;
  }
  return style;
}

/**
 * StyleMapper - Maps Word styles to editor theme
 * Per Constitution Section 8 - Import
 */

/**
 * Word style categories
 */
export type WordStyleCategory =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'character'
  | 'unknown';

/**
 * Mapped editor style
 */
export interface MappedStyle {
  /** Target node type in Lexical */
  nodeType: string;
  /** CSS class to apply */
  className?: string | undefined;
  /** Inline styles to apply */
  inlineStyles?: Record<string, string> | undefined;
  /** Heading level if applicable */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  /** List type if applicable */
  listType?: 'bullet' | 'number' | undefined;
  /** Whether to preserve original styling */
  preserveOriginal?: boolean | undefined;
}

/**
 * Style mapping configuration
 */
export interface StyleMappingConfig {
  /** Whether to preserve unknown styles */
  preserveUnknown: boolean;
  /** Whether to map custom styles */
  mapCustomStyles: boolean;
  /** Custom style mappings */
  customMappings: Record<string, MappedStyle>;
  /** Default paragraph style */
  defaultParagraphStyle: MappedStyle;
  /** Default character style */
  defaultCharacterStyle: MappedStyle;
}

/**
 * Default style mapping configuration
 */
export const DEFAULT_STYLE_CONFIG: StyleMappingConfig = {
  preserveUnknown: false,
  mapCustomStyles: true,
  customMappings: {},
  defaultParagraphStyle: {
    nodeType: 'paragraph',
    className: 'editor-paragraph',
  },
  defaultCharacterStyle: {
    nodeType: 'text',
  },
};

/**
 * Built-in Word heading style mappings
 */
const HEADING_MAPPINGS: Record<string, MappedStyle> = {
  'Heading1': { nodeType: 'heading', headingLevel: 1, className: 'editor-heading-h1' },
  'Heading2': { nodeType: 'heading', headingLevel: 2, className: 'editor-heading-h2' },
  'Heading3': { nodeType: 'heading', headingLevel: 3, className: 'editor-heading-h3' },
  'Heading4': { nodeType: 'heading', headingLevel: 4, className: 'editor-heading-h4' },
  'Heading5': { nodeType: 'heading', headingLevel: 5, className: 'editor-heading-h5' },
  'Heading6': { nodeType: 'heading', headingLevel: 6, className: 'editor-heading-h6' },
  'Title': { nodeType: 'heading', headingLevel: 1, className: 'editor-heading-h1' },
  'Subtitle': { nodeType: 'heading', headingLevel: 2, className: 'editor-heading-h2' },
};

/**
 * Built-in Word paragraph style mappings
 */
const PARAGRAPH_MAPPINGS: Record<string, MappedStyle> = {
  'Normal': { nodeType: 'paragraph', className: 'editor-paragraph' },
  'BodyText': { nodeType: 'paragraph', className: 'editor-paragraph' },
  'BodyTextIndent': { nodeType: 'paragraph', className: 'editor-paragraph', inlineStyles: { textIndent: '1em' } },
  'Quote': { nodeType: 'quote', className: 'editor-quote' },
  'IntenseQuote': { nodeType: 'quote', className: 'editor-quote editor-quote--intense' },
  'NoSpacing': { nodeType: 'paragraph', className: 'editor-paragraph', inlineStyles: { marginBottom: '0' } },
};

/**
 * Built-in Word list style mappings
 */
const LIST_MAPPINGS: Record<string, MappedStyle> = {
  'ListParagraph': { nodeType: 'listitem', listType: 'bullet' },
  'ListBullet': { nodeType: 'listitem', listType: 'bullet' },
  'ListNumber': { nodeType: 'listitem', listType: 'number' },
  'ListBullet2': { nodeType: 'listitem', listType: 'bullet' },
  'ListNumber2': { nodeType: 'listitem', listType: 'number' },
};

/**
 * Built-in Word character style mappings
 */
const CHARACTER_MAPPINGS: Record<string, MappedStyle> = {
  'Strong': { nodeType: 'text', inlineStyles: { fontWeight: 'bold' } },
  'Emphasis': { nodeType: 'text', inlineStyles: { fontStyle: 'italic' } },
  'IntenseEmphasis': { nodeType: 'text', inlineStyles: { fontStyle: 'italic', fontWeight: 'bold' } },
  'SubtleEmphasis': { nodeType: 'text', inlineStyles: { fontStyle: 'italic', color: '#666' } },
  'BookTitle': { nodeType: 'text', inlineStyles: { fontStyle: 'italic', fontVariant: 'small-caps' } },
  'SubtleReference': { nodeType: 'text', inlineStyles: { fontVariant: 'small-caps' } },
  'IntenseReference': { nodeType: 'text', inlineStyles: { fontWeight: 'bold', fontVariant: 'small-caps' } },
  'Hyperlink': { nodeType: 'link', className: 'editor-link' },
  'FootnoteReference': { nodeType: 'text', inlineStyles: { verticalAlign: 'super', fontSize: '0.8em' } },
};

/**
 * Office-specific CSS properties to clean
 */
export const OFFICE_SPECIFIC_STYLES = [
  'mso-',
  '-ms-',
  'tab-stops',
  'mso-bidi',
  'mso-ascii',
  'mso-hansi',
  'mso-font',
  'mso-style',
  'mso-spacerun',
  'mso-fareast',
  'mso-ansi',
  'mso-pagination',
  'mso-layout',
  'mso-outline',
  'mso-add-space',
  'mso-char-wrap',
  'mso-kinsoku-overflow',
  'mso-border-alt',
  'mso-padding-alt',
  'mso-shading',
  'mso-pattern',
  'mso-yfti',
  'mso-row',
  'mso-column',
  'mso-element',
  'mso-element-anchor',
  'mso-element-wrap',
  'mso-element-frame',
  'mso-generic',
  'mso-hide',
  'mso-special-character',
  'mso-bookmark',
  'mso-data-placement',
  'mso-displayed-decimal-separator',
  'mso-list',
  'mso-level-number-format',
  'mso-level-start-at',
  'mso-level-text',
  'mso-level-tab-stop',
  'mso-level-number-position',
  'mso-level-legacy',
  'text-indent:-',
];

/**
 * StyleMapper class
 */
export class StyleMapper {
  private config: StyleMappingConfig;
  private combinedMappings: Record<string, MappedStyle>;

  constructor(config: Partial<StyleMappingConfig> = {}) {
    this.config = { ...DEFAULT_STYLE_CONFIG, ...config };
    this.combinedMappings = {
      ...HEADING_MAPPINGS,
      ...PARAGRAPH_MAPPINGS,
      ...LIST_MAPPINGS,
      ...CHARACTER_MAPPINGS,
      ...this.config.customMappings,
    };
  }

  /**
   * Map a Word style name to editor style
   */
  mapStyle(styleName: string): MappedStyle {
    // Normalize style name (remove spaces, convert to PascalCase)
    const normalizedName = this.normalizeStyleName(styleName);

    // Check combined mappings
    if (this.combinedMappings[normalizedName]) {
      return this.combinedMappings[normalizedName];
    }

    // Try to infer from name
    const inferred = this.inferStyleFromName(normalizedName);
    if (inferred) {
      return inferred;
    }

    // Return default based on category
    const category = this.categorizeStyle(normalizedName);
    if (category === 'character') {
      return this.config.defaultCharacterStyle;
    }

    return this.config.defaultParagraphStyle;
  }

  /**
   * Categorize a Word style
   */
  categorizeStyle(styleName: string): WordStyleCategory {
    const lower = styleName.toLowerCase();

    if (lower.includes('heading') || lower === 'title' || lower === 'subtitle') {
      return 'heading';
    }

    if (lower.includes('list') || lower.includes('bullet') || lower.includes('number')) {
      return 'list';
    }

    if (lower.includes('table')) {
      return 'table';
    }

    // Character styles typically have certain patterns
    if (
      lower.includes('emphasis') ||
      lower.includes('strong') ||
      lower.includes('hyperlink') ||
      lower.includes('reference') ||
      lower.includes('footnote')
    ) {
      return 'character';
    }

    return 'paragraph';
  }

  /**
   * Clean Office-specific styles from HTML
   */
  cleanOfficeStyles(html: string): string {
    let cleaned = html;

    // Remove Office namespace declarations
    cleaned = cleaned.replace(/<\?xml[^>]*>/gi, '');
    cleaned = cleaned.replace(/xmlns:[^=]*="[^"]*"/gi, '');
    cleaned = cleaned.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, '');

    // Remove Office-specific elements
    cleaned = cleaned.replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '');
    cleaned = cleaned.replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '');
    cleaned = cleaned.replace(/<m:[^>]*>[\s\S]*?<\/m:[^>]*>/gi, '');
    cleaned = cleaned.replace(/<!\[if[^\]]*\]>[\s\S]*?<!\[endif\]>/gi, '');

    // Clean style attributes
    cleaned = cleaned.replace(/style="([^"]*)"/gi, (_match, styles) => {
      const cleanedStyles = this.cleanStyleAttribute(styles);
      return cleanedStyles ? `style="${cleanedStyles}"` : '';
    });

    // Remove class attributes with mso- prefix
    cleaned = cleaned.replace(/class="[^"]*mso-[^"]*"/gi, '');

    // Remove empty spans
    cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, '');

    // Remove empty paragraphs (but keep intentional line breaks)
    cleaned = cleaned.replace(/<p[^>]*>\s*&nbsp;\s*<\/p>/gi, '<p><br></p>');

    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/>\s+</g, '><');

    return cleaned.trim();
  }

  /**
   * Clean a style attribute value
   */
  cleanStyleAttribute(styles: string): string {
    const styleDeclarations = styles.split(';').filter(Boolean);
    const cleanedDeclarations: string[] = [];

    for (const declaration of styleDeclarations) {
      const [property] = declaration.split(':').map((s) => s.trim());

      // Skip Office-specific properties
      const isOfficeSpecific = OFFICE_SPECIFIC_STYLES.some((prefix) =>
        property.toLowerCase().startsWith(prefix)
      );

      if (!isOfficeSpecific && property) {
        cleanedDeclarations.push(declaration.trim());
      }
    }

    return cleanedDeclarations.join('; ');
  }

  /**
   * Normalize a style name
   */
  private normalizeStyleName(name: string): string {
    // Remove spaces and convert to PascalCase
    return name
      .split(/[\s-_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Try to infer style from name patterns
   */
  private inferStyleFromName(name: string): MappedStyle | null {
    const lower = name.toLowerCase();

    // Heading patterns
    const headingMatch = lower.match(/heading\s*(\d)/);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
      if (level >= 1 && level <= 6) {
        return {
          nodeType: 'heading',
          headingLevel: level,
          className: `editor-heading-h${level}`,
        };
      }
    }

    // Quote patterns
    if (lower.includes('quote') || lower.includes('blockquote')) {
      return { nodeType: 'quote', className: 'editor-quote' };
    }

    // Code patterns
    if (lower.includes('code') || lower.includes('monospace')) {
      return {
        nodeType: 'code',
        className: 'editor-code',
        inlineStyles: { fontFamily: 'monospace' },
      };
    }

    return null;
  }

  /**
   * Convert Word font size to CSS
   */
  convertFontSize(wordSize: number | string): string {
    // Word uses half-points, CSS uses points
    const halfPoints = typeof wordSize === 'string' ? parseInt(wordSize, 10) : wordSize;
    const points = halfPoints / 2;
    return `${points}pt`;
  }

  /**
   * Convert Word color to CSS
   */
  convertColor(wordColor: string): string {
    // Word uses various formats: auto, RGB hex, theme colors
    if (wordColor === 'auto' || wordColor === 'windowText') {
      return 'inherit';
    }

    // If it's already a valid hex color
    if (/^[0-9A-Fa-f]{6}$/.test(wordColor)) {
      return `#${wordColor}`;
    }

    // Theme colors - map to reasonable defaults
    const themeColors: Record<string, string> = {
      'dark1': '#000000',
      'dark2': '#1f497d',
      'light1': '#ffffff',
      'light2': '#eeece1',
      'accent1': '#4f81bd',
      'accent2': '#c0504d',
      'accent3': '#9bbb59',
      'accent4': '#8064a2',
      'accent5': '#4bacc6',
      'accent6': '#f79646',
      'hyperlink': '#0000ff',
      'followedHyperlink': '#800080',
    };

    return themeColors[wordColor] || wordColor;
  }

  /**
   * Add a custom style mapping
   */
  addMapping(styleName: string, mapping: MappedStyle): void {
    const normalized = this.normalizeStyleName(styleName);
    this.combinedMappings[normalized] = mapping;
    this.config.customMappings[normalized] = mapping;
  }

  /**
   * Get all available mappings
   */
  getMappings(): Record<string, MappedStyle> {
    return { ...this.combinedMappings };
  }
}

/**
 * Create a style mapper instance
 */
export function createStyleMapper(
  config?: Partial<StyleMappingConfig>
): StyleMapper {
  return new StyleMapper(config);
}

export default StyleMapper;

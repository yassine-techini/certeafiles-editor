/**
 * InsertionNode Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createEditor, $getRoot, $createParagraphNode, LexicalEditor, TextNode } from 'lexical';
import {
  InsertionNode,
  $createInsertionNode,
  $isInsertionNode,
  type SerializedInsertionNode,
} from '../InsertionNode';
import type { RevisionAuthor } from '../../types/revision';

const testAuthor: RevisionAuthor = {
  id: 'author-1',
  name: 'Test Author',
  email: 'test@example.com',
  color: '#3b82f6',
};

describe('InsertionNode', () => {
  let editor: LexicalEditor;

  beforeEach(() => {
    editor = createEditor({
      nodes: [InsertionNode],
      onError: (error) => {
        throw error;
      },
    });

    const root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    editor.setRootElement(root);
  });

  describe('getType', () => {
    it('should return "insertion" as the node type', () => {
      expect(InsertionNode.getType()).toBe('insertion');
    });
  });

  describe('$createInsertionNode', () => {
    it('should create an InsertionNode with required properties', () => {
      editor.update(() => {
        const node = $createInsertionNode({
          text: 'Inserted text',
          revisionId: 'rev-1',
          author: testAuthor,
        });

        expect(node).toBeInstanceOf(InsertionNode);
        expect(node.getTextContent()).toBe('Inserted text');
        expect(node.getRevisionId()).toBe('rev-1');
        expect(node.getAuthor()).toEqual(testAuthor);
      });
    });

    it('should set timestamp if not provided', () => {
      editor.update(() => {
        const before = Date.now();
        const node = $createInsertionNode({
          text: 'Auto timestamp',
          revisionId: 'rev-2',
          author: testAuthor,
        });
        const after = Date.now();

        expect(node.getTimestamp()).toBeGreaterThanOrEqual(before);
        expect(node.getTimestamp()).toBeLessThanOrEqual(after);
      });
    });

    it('should use provided timestamp', () => {
      editor.update(() => {
        const customTimestamp = 1700000000000;
        const node = $createInsertionNode({
          text: 'Custom timestamp',
          revisionId: 'rev-3',
          author: testAuthor,
          timestamp: customTimestamp,
        });

        expect(node.getTimestamp()).toBe(customTimestamp);
      });
    });
  });

  describe('$isInsertionNode', () => {
    it('should return true for InsertionNode', () => {
      editor.update(() => {
        const node = $createInsertionNode({
          text: 'Test',
          revisionId: 'rev-1',
          author: testAuthor,
        });
        expect($isInsertionNode(node)).toBe(true);
      });
    });

    it('should return false for null', () => {
      expect($isInsertionNode(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect($isInsertionNode(undefined)).toBe(false);
    });

    it('should return false for TextNode', () => {
      editor.update(() => {
        const textNode = new TextNode('Regular text');
        expect($isInsertionNode(textNode)).toBe(false);
      });
    });
  });

  describe('clone', () => {
    it('should clone an InsertionNode', () => {
      editor.update(() => {
        const original = $createInsertionNode({
          text: 'Clone test',
          revisionId: 'rev-clone',
          author: testAuthor,
          timestamp: 1700000000000,
        });

        const cloned = InsertionNode.clone(original);

        expect(cloned.getTextContent()).toBe(original.getTextContent());
        expect(cloned.getRevisionId()).toBe(original.getRevisionId());
        expect(cloned.getAuthor()).toEqual(original.getAuthor());
        expect(cloned.getTimestamp()).toBe(original.getTimestamp());
      });
    });
  });

  describe('exportJSON / importJSON', () => {
    it('should serialize and deserialize correctly (round-trip)', () => {
      editor.update(() => {
        const timestamp = 1700000000000;
        const original = $createInsertionNode({
          text: 'Serialization test',
          revisionId: 'rev-json',
          author: testAuthor,
          timestamp,
        });

        const json = original.exportJSON();

        expect(json.type).toBe('insertion');
        expect(json.text).toBe('Serialization test');
        expect(json.revisionId).toBe('rev-json');
        expect(json.author).toEqual(testAuthor);
        expect(json.timestamp).toBe(timestamp);

        const imported = InsertionNode.importJSON(json);

        expect(imported.getTextContent()).toBe(original.getTextContent());
        expect(imported.getRevisionId()).toBe(original.getRevisionId());
        expect(imported.getAuthor()).toEqual(original.getAuthor());
        expect(imported.getTimestamp()).toBe(original.getTimestamp());
      });
    });

    it('should preserve formatting during serialization', () => {
      editor.update(() => {
        const original = $createInsertionNode({
          text: 'Formatted',
          revisionId: 'rev-format',
          author: testAuthor,
        });
        original.setFormat(1); // Bold

        const json = original.exportJSON();
        const imported = InsertionNode.importJSON(json);

        expect(imported.getFormat()).toBe(1);
      });
    });
  });

  describe('createDOM', () => {
    it('should create an element with correct attributes', () => {
      editor.update(() => {
        const timestamp = 1700000000000;
        const node = $createInsertionNode({
          text: 'DOM test',
          revisionId: 'rev-dom',
          author: testAuthor,
          timestamp,
        });

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.getAttribute('data-revision-id')).toBe('rev-dom');
        expect(dom.getAttribute('data-revision-type')).toBe('insertion');
        expect(dom.getAttribute('data-revision-author')).toBe(JSON.stringify(testAuthor));
        expect(dom.getAttribute('data-revision-timestamp')).toBe(String(timestamp));
        expect(dom.classList.contains('insertion-node')).toBe(true);
      });
    });

    it('should apply theme class if available', () => {
      editor.update(() => {
        const node = $createInsertionNode({
          text: 'Theme test',
          revisionId: 'rev-theme',
          author: testAuthor,
        });

        const config = { namespace: 'test', theme: { insertion: 'custom-insertion-class' } };
        const dom = node.createDOM(config);

        expect(dom.classList.contains('custom-insertion-class')).toBe(true);
      });
    });

    it('should have a tooltip with author info', () => {
      editor.update(() => {
        const node = $createInsertionNode({
          text: 'Tooltip test',
          revisionId: 'rev-tooltip',
          author: testAuthor,
        });

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.title).toContain('Inserted by');
        expect(dom.title).toContain(testAuthor.name);
      });
    });
  });

  describe('exportDOM', () => {
    it('should export an ins element with data attributes', () => {
      editor.update(() => {
        const timestamp = 1700000000000;
        const node = $createInsertionNode({
          text: 'Export test',
          revisionId: 'rev-export',
          author: testAuthor,
          timestamp,
        });

        const { element } = node.exportDOM();

        expect(element?.tagName).toBe('INS');
        expect(element?.getAttribute('data-revision-id')).toBe('rev-export');
        expect(element?.getAttribute('data-revision-type')).toBe('insertion');
        expect(element?.getAttribute('data-revision-author')).toBe(JSON.stringify(testAuthor));
        expect(element?.getAttribute('data-revision-timestamp')).toBe(String(timestamp));
        expect(element?.textContent).toBe('Export test');
      });
    });
  });

  describe('updateDOM', () => {
    it('should update DOM when revision ID changes', () => {
      editor.update(() => {
        const prevNode = $createInsertionNode({
          text: 'Before',
          revisionId: 'rev-old',
          author: testAuthor,
        });

        const newNode = $createInsertionNode({
          text: 'After',
          revisionId: 'rev-new',
          author: testAuthor,
        });

        const config = { namespace: 'test', theme: {} };
        const dom = prevNode.createDOM(config);

        newNode.updateDOM(prevNode, dom, config);

        expect(dom.getAttribute('data-revision-id')).toBe('rev-new');
      });
    });

    it('should update DOM when author changes', () => {
      editor.update(() => {
        const author2: RevisionAuthor = {
          id: 'author-2',
          name: 'Second Author',
          email: 'second@example.com',
        };

        const prevNode = $createInsertionNode({
          text: 'Text',
          revisionId: 'rev-1',
          author: testAuthor,
        });

        const newNode = $createInsertionNode({
          text: 'Text',
          revisionId: 'rev-1',
          author: author2,
        });

        const config = { namespace: 'test', theme: {} };
        const dom = prevNode.createDOM(config);

        newNode.updateDOM(prevNode, dom, config);

        expect(dom.getAttribute('data-revision-author')).toBe(JSON.stringify(author2));
        expect(dom.title).toContain(author2.name);
      });
    });
  });

  describe('getters', () => {
    it('should get revision ID', () => {
      editor.update(() => {
        const node = $createInsertionNode({
          text: 'Test',
          revisionId: 'rev-getter',
          author: testAuthor,
        });

        expect(node.getRevisionId()).toBe('rev-getter');
      });
    });

    it('should get author', () => {
      editor.update(() => {
        const node = $createInsertionNode({
          text: 'Test',
          revisionId: 'rev-1',
          author: testAuthor,
        });

        expect(node.getAuthor()).toEqual(testAuthor);
      });
    });

    it('should get timestamp', () => {
      editor.update(() => {
        const timestamp = 1700000000000;
        const node = $createInsertionNode({
          text: 'Test',
          revisionId: 'rev-1',
          author: testAuthor,
          timestamp,
        });

        expect(node.getTimestamp()).toBe(timestamp);
      });
    });
  });
});

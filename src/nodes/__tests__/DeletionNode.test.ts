/**
 * DeletionNode Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createEditor, $getRoot, $createParagraphNode, LexicalEditor, TextNode } from 'lexical';
import {
  DeletionNode,
  $createDeletionNode,
  $isDeletionNode,
  type SerializedDeletionNode,
} from '../DeletionNode';
import type { RevisionAuthor } from '../../types/revision';

const testAuthor: RevisionAuthor = {
  id: 'author-1',
  name: 'Test Author',
  email: 'test@example.com',
  color: '#ef4444',
};

describe('DeletionNode', () => {
  let editor: LexicalEditor;

  beforeEach(() => {
    editor = createEditor({
      nodes: [DeletionNode],
      onError: (error) => {
        throw error;
      },
    });

    const root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    editor.setRootElement(root);
  });

  describe('getType', () => {
    it('should return "deletion" as the node type', () => {
      expect(DeletionNode.getType()).toBe('deletion');
    });
  });

  describe('$createDeletionNode', () => {
    it('should create a DeletionNode with required properties', () => {
      editor.update(() => {
        const node = $createDeletionNode({
          text: 'Deleted text',
          revisionId: 'rev-1',
          author: testAuthor,
        });

        expect(node).toBeInstanceOf(DeletionNode);
        expect(node.getTextContent()).toBe('Deleted text');
        expect(node.getRevisionId()).toBe('rev-1');
        expect(node.getAuthor()).toEqual(testAuthor);
      });
    });

    it('should set timestamp if not provided', () => {
      editor.update(() => {
        const before = Date.now();
        const node = $createDeletionNode({
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
        const node = $createDeletionNode({
          text: 'Custom timestamp',
          revisionId: 'rev-3',
          author: testAuthor,
          timestamp: customTimestamp,
        });

        expect(node.getTimestamp()).toBe(customTimestamp);
      });
    });
  });

  describe('$isDeletionNode', () => {
    it('should return true for DeletionNode', () => {
      editor.update(() => {
        const node = $createDeletionNode({
          text: 'Test',
          revisionId: 'rev-1',
          author: testAuthor,
        });
        expect($isDeletionNode(node)).toBe(true);
      });
    });

    it('should return false for null', () => {
      expect($isDeletionNode(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect($isDeletionNode(undefined)).toBe(false);
    });

    it('should return false for TextNode', () => {
      editor.update(() => {
        const textNode = new TextNode('Regular text');
        expect($isDeletionNode(textNode)).toBe(false);
      });
    });
  });

  describe('clone', () => {
    it('should clone a DeletionNode', () => {
      editor.update(() => {
        const original = $createDeletionNode({
          text: 'Clone test',
          revisionId: 'rev-clone',
          author: testAuthor,
          timestamp: 1700000000000,
        });

        const cloned = DeletionNode.clone(original);

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
        const original = $createDeletionNode({
          text: 'Serialization test',
          revisionId: 'rev-json',
          author: testAuthor,
          timestamp,
        });

        const json = original.exportJSON();

        expect(json.type).toBe('deletion');
        expect(json.text).toBe('Serialization test');
        expect(json.revisionId).toBe('rev-json');
        expect(json.author).toEqual(testAuthor);
        expect(json.timestamp).toBe(timestamp);

        const imported = DeletionNode.importJSON(json);

        expect(imported.getTextContent()).toBe(original.getTextContent());
        expect(imported.getRevisionId()).toBe(original.getRevisionId());
        expect(imported.getAuthor()).toEqual(original.getAuthor());
        expect(imported.getTimestamp()).toBe(original.getTimestamp());
      });
    });

    it('should preserve formatting during serialization', () => {
      editor.update(() => {
        const original = $createDeletionNode({
          text: 'Formatted',
          revisionId: 'rev-format',
          author: testAuthor,
        });
        original.setFormat(1); // Bold

        const json = original.exportJSON();
        const imported = DeletionNode.importJSON(json);

        expect(imported.getFormat()).toBe(1);
      });
    });
  });

  describe('createDOM', () => {
    it('should create an element with correct attributes', () => {
      editor.update(() => {
        const timestamp = 1700000000000;
        const node = $createDeletionNode({
          text: 'DOM test',
          revisionId: 'rev-dom',
          author: testAuthor,
          timestamp,
        });

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.getAttribute('data-revision-id')).toBe('rev-dom');
        expect(dom.getAttribute('data-revision-type')).toBe('deletion');
        expect(dom.getAttribute('data-revision-author')).toBe(JSON.stringify(testAuthor));
        expect(dom.getAttribute('data-revision-timestamp')).toBe(String(timestamp));
        expect(dom.classList.contains('deletion-node')).toBe(true);
      });
    });

    it('should apply strikethrough style', () => {
      editor.update(() => {
        const node = $createDeletionNode({
          text: 'Strikethrough test',
          revisionId: 'rev-strike',
          author: testAuthor,
        });

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.style.textDecoration).toContain('line-through');
      });
    });

    it('should apply theme class if available', () => {
      editor.update(() => {
        const node = $createDeletionNode({
          text: 'Theme test',
          revisionId: 'rev-theme',
          author: testAuthor,
        });

        const config = { namespace: 'test', theme: { deletion: 'custom-deletion-class' } };
        const dom = node.createDOM(config);

        expect(dom.classList.contains('custom-deletion-class')).toBe(true);
      });
    });

    it('should have a tooltip with author info', () => {
      editor.update(() => {
        const node = $createDeletionNode({
          text: 'Tooltip test',
          revisionId: 'rev-tooltip',
          author: testAuthor,
        });

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.title).toContain('Deleted by');
        expect(dom.title).toContain(testAuthor.name);
      });
    });
  });

  describe('exportDOM', () => {
    it('should export a del element with data attributes', () => {
      editor.update(() => {
        const timestamp = 1700000000000;
        const node = $createDeletionNode({
          text: 'Export test',
          revisionId: 'rev-export',
          author: testAuthor,
          timestamp,
        });

        const { element } = node.exportDOM();

        expect(element?.tagName).toBe('DEL');
        expect(element?.getAttribute('data-revision-id')).toBe('rev-export');
        expect(element?.getAttribute('data-revision-type')).toBe('deletion');
        expect(element?.getAttribute('data-revision-author')).toBe(JSON.stringify(testAuthor));
        expect(element?.getAttribute('data-revision-timestamp')).toBe(String(timestamp));
        expect(element?.textContent).toBe('Export test');
      });
    });

    it('should apply strikethrough style in exported element', () => {
      editor.update(() => {
        const node = $createDeletionNode({
          text: 'Strikethrough export',
          revisionId: 'rev-export-strike',
          author: testAuthor,
        });

        const { element } = node.exportDOM();

        expect(element?.style.textDecoration).toContain('line-through');
      });
    });
  });

  describe('updateDOM', () => {
    it('should update DOM when revision ID changes', () => {
      editor.update(() => {
        const prevNode = $createDeletionNode({
          text: 'Before',
          revisionId: 'rev-old',
          author: testAuthor,
        });

        const newNode = $createDeletionNode({
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

        const prevNode = $createDeletionNode({
          text: 'Text',
          revisionId: 'rev-1',
          author: testAuthor,
        });

        const newNode = $createDeletionNode({
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
        const node = $createDeletionNode({
          text: 'Test',
          revisionId: 'rev-getter',
          author: testAuthor,
        });

        expect(node.getRevisionId()).toBe('rev-getter');
      });
    });

    it('should get author', () => {
      editor.update(() => {
        const node = $createDeletionNode({
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
        const node = $createDeletionNode({
          text: 'Test',
          revisionId: 'rev-1',
          author: testAuthor,
          timestamp,
        });

        expect(node.getTimestamp()).toBe(timestamp);
      });
    });
  });

  describe('isSimpleText', () => {
    it('should not be simple text (not directly editable)', () => {
      editor.update(() => {
        const node = $createDeletionNode({
          text: 'Test',
          revisionId: 'rev-1',
          author: testAuthor,
        });

        expect(node.isSimpleText()).toBe(false);
      });
    });
  });
});

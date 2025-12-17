/**
 * CommentNode Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createEditor, $getRoot, $createParagraphNode, LexicalEditor, TextNode } from 'lexical';
import {
  CommentNode,
  $createCommentNode,
  $isCommentNode,
  $getCommentNodesByThreadId,
  $unwrapCommentNode,
  type SerializedCommentNode,
} from '../CommentNode';
import type { CommentType } from '../../types/comment';

describe('CommentNode', () => {
  let editor: LexicalEditor;

  beforeEach(() => {
    editor = createEditor({
      nodes: [CommentNode],
      onError: (error) => {
        throw error;
      },
    });

    const root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    editor.setRootElement(root);
  });

  describe('getType', () => {
    it('should return "comment" as the node type', () => {
      expect(CommentNode.getType()).toBe('comment');
    });
  });

  describe('$createCommentNode', () => {
    it('should create a CommentNode with required properties', () => {
      editor.update(() => {
        const node = $createCommentNode('Test comment text', 'thread-1');

        expect(node).toBeInstanceOf(CommentNode);
        expect(node.getTextContent()).toBe('Test comment text');
        expect(node.getThreadId()).toBe('thread-1');
        expect(node.getCommentType()).toBe('remark'); // default
      });
    });

    it('should create a CommentNode with specific comment type', () => {
      editor.update(() => {
        const node = $createCommentNode('Question text', 'thread-2', 'question');

        expect(node.getCommentType()).toBe('question');
      });
    });

    it('should create nodes with all comment types', () => {
      const commentTypes: CommentType[] = [
        'remark',
        'question',
        'suggestion',
        'correction',
        'validation',
        'blocker',
      ];

      editor.update(() => {
        for (const commentType of commentTypes) {
          const node = $createCommentNode(`Text for ${commentType}`, `thread-${commentType}`, commentType);
          expect(node.getCommentType()).toBe(commentType);
        }
      });
    });
  });

  describe('$isCommentNode', () => {
    it('should return true for CommentNode', () => {
      editor.update(() => {
        const node = $createCommentNode('Test', 'thread-1');
        expect($isCommentNode(node)).toBe(true);
      });
    });

    it('should return false for null', () => {
      expect($isCommentNode(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect($isCommentNode(undefined)).toBe(false);
    });

    it('should return false for TextNode', () => {
      editor.update(() => {
        const textNode = new TextNode('Regular text');
        expect($isCommentNode(textNode)).toBe(false);
      });
    });
  });

  describe('clone', () => {
    it('should clone a CommentNode', () => {
      editor.update(() => {
        const original = $createCommentNode('Clone test', 'thread-clone', 'suggestion');
        const cloned = CommentNode.clone(original);

        expect(cloned.getTextContent()).toBe(original.getTextContent());
        expect(cloned.getThreadId()).toBe(original.getThreadId());
        expect(cloned.getCommentType()).toBe(original.getCommentType());
      });
    });
  });

  describe('exportJSON / importJSON', () => {
    it('should serialize and deserialize correctly (round-trip)', () => {
      editor.update(() => {
        const original = $createCommentNode('Serialization test', 'thread-json', 'correction');

        const json = original.exportJSON();

        expect(json.type).toBe('comment');
        expect(json.text).toBe('Serialization test');
        expect(json.threadId).toBe('thread-json');
        expect(json.commentType).toBe('correction');

        const imported = CommentNode.importJSON(json);

        expect(imported.getTextContent()).toBe(original.getTextContent());
        expect(imported.getThreadId()).toBe(original.getThreadId());
        expect(imported.getCommentType()).toBe(original.getCommentType());
      });
    });

    it('should preserve formatting during serialization', () => {
      editor.update(() => {
        const original = $createCommentNode('Formatted text', 'thread-format', 'remark');
        original.setFormat(1); // Bold

        const json = original.exportJSON();
        const imported = CommentNode.importJSON(json);

        expect(imported.getFormat()).toBe(1);
      });
    });

    it('should preserve all comment types during serialization', () => {
      const commentTypes: CommentType[] = [
        'remark',
        'question',
        'suggestion',
        'correction',
        'validation',
        'blocker',
      ];

      editor.update(() => {
        for (const commentType of commentTypes) {
          const original = $createCommentNode(`Text`, `thread-${commentType}`, commentType);
          const json = original.exportJSON();
          const imported = CommentNode.importJSON(json);

          expect(imported.getCommentType()).toBe(commentType);
        }
      });
    });
  });

  describe('createDOM', () => {
    it('should create a span element with correct attributes', () => {
      editor.update(() => {
        const node = $createCommentNode('DOM test', 'thread-dom', 'question');

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.getAttribute('data-comment-thread-id')).toBe('thread-dom');
        expect(dom.getAttribute('data-comment-type')).toBe('question');
        expect(dom.className).toContain('comment-highlight');
        expect(dom.className).toContain('comment-question');
        expect(dom.style.cursor).toBe('pointer');
      });
    });

    it('should apply theme class if available', () => {
      editor.update(() => {
        const node = $createCommentNode('Theme test', 'thread-theme', 'remark');

        const config = { namespace: 'test', theme: { comment: 'custom-comment-class' } };
        const dom = node.createDOM(config);

        expect(dom.className).toContain('custom-comment-class');
      });
    });
  });

  describe('exportDOM', () => {
    it('should export a span element with data attributes', () => {
      editor.update(() => {
        const node = $createCommentNode('Export test', 'thread-export', 'validation');
        const { element } = node.exportDOM();

        expect(element?.tagName).toBe('SPAN');
        expect(element?.getAttribute('data-comment-thread-id')).toBe('thread-export');
        expect(element?.getAttribute('data-comment-type')).toBe('validation');
        expect(element?.textContent).toBe('Export test');
        expect(element?.className).toContain('comment-highlight');
      });
    });
  });

  describe('updateDOM', () => {
    it('should update DOM when properties change', () => {
      editor.update(() => {
        const prevNode = $createCommentNode('Before', 'thread-1', 'remark');
        const newNode = $createCommentNode('After', 'thread-2', 'question');

        const config = { namespace: 'test', theme: {} };
        const dom = prevNode.createDOM(config);

        newNode.updateDOM(prevNode, dom, config);

        expect(dom.getAttribute('data-comment-thread-id')).toBe('thread-2');
        expect(dom.getAttribute('data-comment-type')).toBe('question');
      });
    });
  });

  describe('setters', () => {
    it('should set thread ID', () => {
      editor.update(() => {
        const node = $createCommentNode('Setter test', 'original-thread', 'remark');

        const root = $getRoot();
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        root.append(paragraph);

        node.setThreadId('new-thread');
        expect(node.getThreadId()).toBe('new-thread');
      });
    });

    it('should set comment type', () => {
      editor.update(() => {
        const node = $createCommentNode('Type change', 'thread-1', 'remark');

        const root = $getRoot();
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        root.append(paragraph);

        node.setCommentType('blocker');
        expect(node.getCommentType()).toBe('blocker');
      });
    });
  });

  describe('text behavior', () => {
    it('should not allow inserting text before', () => {
      editor.update(() => {
        const node = $createCommentNode('Test', 'thread-1');
        expect(node.canInsertTextBefore()).toBe(false);
      });
    });

    it('should not allow inserting text after', () => {
      editor.update(() => {
        const node = $createCommentNode('Test', 'thread-1');
        expect(node.canInsertTextAfter()).toBe(false);
      });
    });

    it('should be a text entity', () => {
      editor.update(() => {
        const node = $createCommentNode('Test', 'thread-1');
        expect(node.isTextEntity()).toBe(true);
      });
    });
  });

  describe('$getCommentNodesByThreadId', () => {
    it('should find all comment nodes with matching thread ID', () => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();

        const node1 = $createCommentNode('First', 'thread-multi');
        const node2 = $createCommentNode('Second', 'thread-other');
        const node3 = $createCommentNode('Third', 'thread-multi');

        paragraph.append(node1, node2, node3);
        root.append(paragraph);

        const nodes = $getCommentNodesByThreadId(root, 'thread-multi');

        expect(nodes).toHaveLength(2);
        expect(nodes).toContain(node1);
        expect(nodes).toContain(node3);
      });
    });

    it('should return empty array if no matches', () => {
      editor.update(() => {
        const root = $getRoot();
        const nodes = $getCommentNodesByThreadId(root, 'non-existent');

        expect(nodes).toHaveLength(0);
      });
    });
  });

  describe('$unwrapCommentNode', () => {
    it('should convert CommentNode to regular TextNode', () => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();
        const commentNode = $createCommentNode('Unwrap me', 'thread-unwrap', 'remark');
        commentNode.setFormat(1); // Bold

        paragraph.append(commentNode);
        root.append(paragraph);

        const textNode = $unwrapCommentNode(commentNode);

        expect(textNode).toBeInstanceOf(TextNode);
        expect($isCommentNode(textNode)).toBe(false);
        expect(textNode.getTextContent()).toBe('Unwrap me');
        expect(textNode.getFormat()).toBe(1);
      });
    });
  });
});

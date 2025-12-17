/**
 * SlotNode Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEditor, $getRoot, $createParagraphNode, LexicalEditor } from 'lexical';
import {
  SlotNode,
  $createSlotNode,
  $isSlotNode,
  $getSlotNodesById,
  type SerializedSlotNode,
} from '../SlotNode';
import type { SlotType, SlotRole, SlotMetadata } from '../../types/slot';

// Mock the SlotMarker component
vi.mock('../../components/Slots/SlotMarker', () => ({
  SlotMarker: ({ slotId, slotType }: { slotId: string; slotType: string }) => (
    <span data-testid="slot-marker" data-slot-id={slotId} data-slot-type={slotType} />
  ),
}));

describe('SlotNode', () => {
  let editor: LexicalEditor;

  beforeEach(() => {
    editor = createEditor({
      nodes: [SlotNode],
      onError: (error) => {
        throw error;
      },
    });

    const root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    editor.setRootElement(root);
  });

  describe('getType', () => {
    it('should return "slot" as the node type', () => {
      expect(SlotNode.getType()).toBe('slot');
    });
  });

  describe('$createSlotNode', () => {
    it('should create a SlotNode with required properties', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'test-slot-1',
          slotType: 'dynamic_content',
          role: 'start',
        });

        expect(node).toBeInstanceOf(SlotNode);
        expect(node.getSlotId()).toBe('test-slot-1');
        expect(node.getSlotType()).toBe('dynamic_content');
        expect(node.getRole()).toBe('start');
      });
    });

    it('should create a SlotNode with metadata', () => {
      editor.update(() => {
        const metadata: SlotMetadata = {
          label: 'Test Label',
          description: 'Test Description',
          required: true,
        };

        const node = $createSlotNode({
          slotId: 'test-slot-2',
          slotType: 'donnee',
          role: 'end',
          metadata,
        });

        expect(node.getMetadata()).toEqual(metadata);
      });
    });

    it('should create nodes with different slot types', () => {
      const slotTypes: SlotType[] = [
        'dynamic_content',
        'at_fetcher',
        'donnee',
        'ancre',
        'section_speciale',
        'commentaire',
      ];

      editor.update(() => {
        for (const slotType of slotTypes) {
          const node = $createSlotNode({
            slotId: `slot-${slotType}`,
            slotType,
            role: 'start',
          });

          expect(node.getSlotType()).toBe(slotType);
        }
      });
    });
  });

  describe('$isSlotNode', () => {
    it('should return true for SlotNode', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'test-slot',
          slotType: 'dynamic_content',
          role: 'start',
        });

        expect($isSlotNode(node)).toBe(true);
      });
    });

    it('should return false for null', () => {
      expect($isSlotNode(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect($isSlotNode(undefined)).toBe(false);
    });

    it('should return false for other node types', () => {
      editor.update(() => {
        const paragraph = $createParagraphNode();
        expect($isSlotNode(paragraph)).toBe(false);
      });
    });
  });

  describe('clone', () => {
    it('should clone a SlotNode', () => {
      editor.update(() => {
        const original = $createSlotNode({
          slotId: 'clone-test',
          slotType: 'at_fetcher',
          role: 'end',
          metadata: { label: 'Cloned' },
        });

        const cloned = SlotNode.clone(original);

        expect(cloned.getSlotId()).toBe(original.getSlotId());
        expect(cloned.getSlotType()).toBe(original.getSlotType());
        expect(cloned.getRole()).toBe(original.getRole());
        expect(cloned.getMetadata()).toEqual(original.getMetadata());
      });
    });
  });

  describe('exportJSON / importJSON', () => {
    it('should serialize and deserialize correctly (round-trip)', () => {
      editor.update(() => {
        const metadata: SlotMetadata = {
          label: 'Round Trip Test',
          description: 'Testing serialization',
          required: true,
          defaultValue: 'default',
        };

        const original = $createSlotNode({
          slotId: 'json-test',
          slotType: 'donnee',
          role: 'start',
          metadata,
        });

        const json = original.exportJSON();

        expect(json.type).toBe('slot');
        expect(json.slotId).toBe('json-test');
        expect(json.slotType).toBe('donnee');
        expect(json.role).toBe('start');
        expect(json.metadata).toEqual(metadata);

        const imported = SlotNode.importJSON(json);

        expect(imported.getSlotId()).toBe(original.getSlotId());
        expect(imported.getSlotType()).toBe(original.getSlotType());
        expect(imported.getRole()).toBe(original.getRole());
        expect(imported.getMetadata()).toEqual(original.getMetadata());
      });
    });

    it('should preserve all slot types during serialization', () => {
      const slotTypes: SlotType[] = [
        'dynamic_content',
        'at_fetcher',
        'donnee',
        'ancre',
        'section_speciale',
        'commentaire',
      ];

      editor.update(() => {
        for (const slotType of slotTypes) {
          const original = $createSlotNode({
            slotId: `serialize-${slotType}`,
            slotType,
            role: 'start',
          });

          const json = original.exportJSON();
          const imported = SlotNode.importJSON(json);

          expect(imported.getSlotType()).toBe(slotType);
        }
      });
    });
  });

  describe('createDOM', () => {
    it('should create a span element with correct attributes', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'dom-test',
          slotType: 'dynamic_content',
          role: 'start',
        });

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.tagName).toBe('SPAN');
        expect(dom.getAttribute('data-slot-id')).toBe('dom-test');
        expect(dom.getAttribute('data-slot-type')).toBe('dynamic_content');
        expect(dom.getAttribute('data-slot-role')).toBe('start');
        expect(dom.className).toContain('slot-marker');
        expect(dom.className).toContain('slot-dynamic_content');
        expect(dom.className).toContain('slot-role-start');
      });
    });

    it('should set contentEditable to false', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'editable-test',
          slotType: 'ancre',
          role: 'end',
        });

        const config = { namespace: 'test', theme: {} };
        const dom = node.createDOM(config);

        expect(dom.contentEditable).toBe('false');
      });
    });

    it('should apply theme class if available', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'theme-test',
          slotType: 'commentaire',
          role: 'start',
        });

        const config = { namespace: 'test', theme: { slot: 'custom-slot-class' } };
        const dom = node.createDOM(config);

        expect(dom.className).toContain('custom-slot-class');
      });
    });
  });

  describe('exportDOM', () => {
    it('should export a span element with data attributes', () => {
      editor.update(() => {
        const metadata: SlotMetadata = { label: 'Export Test' };
        const node = $createSlotNode({
          slotId: 'export-dom-test',
          slotType: 'section_speciale',
          role: 'start',
          metadata,
        });

        const { element } = node.exportDOM();

        expect(element?.tagName).toBe('SPAN');
        expect(element?.getAttribute('data-slot-id')).toBe('export-dom-test');
        expect(element?.getAttribute('data-slot-type')).toBe('section_speciale');
        expect(element?.getAttribute('data-slot-role')).toBe('start');
        expect(element?.getAttribute('data-slot-metadata')).toBe(JSON.stringify(metadata));
      });
    });
  });

  describe('updateDOM', () => {
    it('should update DOM when properties change', () => {
      editor.update(() => {
        const prevNode = $createSlotNode({
          slotId: 'update-test',
          slotType: 'dynamic_content',
          role: 'start',
        });

        const newNode = $createSlotNode({
          slotId: 'update-test-changed',
          slotType: 'donnee',
          role: 'end',
        });

        const config = { namespace: 'test', theme: {} };
        const dom = prevNode.createDOM(config);

        const shouldRerender = newNode.updateDOM(prevNode, dom, config);

        expect(shouldRerender).toBe(false);
        expect(dom.getAttribute('data-slot-id')).toBe('update-test-changed');
        expect(dom.getAttribute('data-slot-type')).toBe('donnee');
        expect(dom.getAttribute('data-slot-role')).toBe('end');
      });
    });
  });

  describe('isInline', () => {
    it('should be an inline node', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'inline-test',
          slotType: 'dynamic_content',
          role: 'start',
        });

        expect(node.isInline()).toBe(true);
      });
    });
  });

  describe('setMetadata / updateMetadata', () => {
    it('should set metadata', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'meta-test',
          slotType: 'dynamic_content',
          role: 'start',
        });

        const root = $getRoot();
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        root.append(paragraph);

        node.setMetadata({ label: 'New Label', required: true });

        expect(node.getMetadata()).toEqual({ label: 'New Label', required: true });
      });
    });

    it('should update metadata partially', () => {
      editor.update(() => {
        const node = $createSlotNode({
          slotId: 'update-meta-test',
          slotType: 'dynamic_content',
          role: 'start',
          metadata: { label: 'Original', description: 'Desc', required: false },
        });

        const root = $getRoot();
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        root.append(paragraph);

        node.updateMetadata({ required: true });

        const metadata = node.getMetadata();
        expect(metadata.label).toBe('Original');
        expect(metadata.description).toBe('Desc');
        expect(metadata.required).toBe(true);
      });
    });
  });

  describe('$getSlotNodesById', () => {
    it('should find start and end slot nodes by ID', () => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();

        const startNode = $createSlotNode({
          slotId: 'paired-slot',
          slotType: 'dynamic_content',
          role: 'start',
        });

        const endNode = $createSlotNode({
          slotId: 'paired-slot',
          slotType: 'dynamic_content',
          role: 'end',
        });

        paragraph.append(startNode);
        paragraph.append(endNode);
        root.append(paragraph);

        const result = $getSlotNodesById(root, 'paired-slot');

        expect(result.start).toBe(startNode);
        expect(result.end).toBe(endNode);
      });
    });

    it('should return partial results if only start exists', () => {
      editor.update(() => {
        const root = $getRoot();
        const paragraph = $createParagraphNode();

        const startNode = $createSlotNode({
          slotId: 'start-only',
          slotType: 'donnee',
          role: 'start',
        });

        paragraph.append(startNode);
        root.append(paragraph);

        const result = $getSlotNodesById(root, 'start-only');

        expect(result.start).toBe(startNode);
        expect(result.end).toBeUndefined();
      });
    });

    it('should return empty object if slot ID not found', () => {
      editor.update(() => {
        const root = $getRoot();
        const result = $getSlotNodesById(root, 'non-existent');

        expect(result.start).toBeUndefined();
        expect(result.end).toBeUndefined();
      });
    });
  });
});

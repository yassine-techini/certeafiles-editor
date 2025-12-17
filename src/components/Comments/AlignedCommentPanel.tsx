/**
 * AlignedCommentPanel - Comment panel with visual alignment to editor anchors
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Filter,
  Plus,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import type { CommentType, CommentStatus, CommentFilter, CommentThread as CommentThreadType } from '../../types/comment';
import { COMMENT_TYPE_LABELS, COMMENT_TYPE_COLORS, COMMENT_STATUS_LABELS } from '../../types/comment';
import { useCommentStore } from '../../stores/commentStore';
import { CommentThread } from './CommentThread';
import { CommentInput } from './CommentInput';
import { useCommentAlignment, type ThreadPosition } from '../../hooks/useCommentAlignment';

export interface AlignedCommentPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to toggle panel */
  onToggle: () => void;
  /** Callback when a thread should be scrolled to in editor */
  onScrollToThread?: ((threadId: string) => void) | undefined;
  /** Callback when new comment is initiated (selection required) */
  onNewComment?: (() => void) | undefined;
  /** Editor container element for position calculation */
  editorContainer: HTMLElement | null;
  /** Callback when positions are recalculated */
  onPositionsRecalculate?: (() => void) | undefined;
}

/**
 * FilterBar - Filters for comment threads
 */
function FilterBar({
  filter,
  onFilterChange,
}: {
  filter: CommentFilter;
  onFilterChange: (filter: CommentFilter) => void;
}): JSX.Element {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
      <Filter size={14} className="text-gray-400" />

      {/* Status filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${
            filter.status ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200'
          }`}
        >
          {filter.status ? COMMENT_STATUS_LABELS[filter.status] : 'Status'}
          <ChevronDown size={12} />
        </button>

        {showStatusDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[100px]">
            <button
              type="button"
              onClick={() => {
                onFilterChange({ ...filter, status: undefined });
                setShowStatusDropdown(false);
              }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50"
            >
              All
            </button>
            {(['open', 'resolved', 'closed'] as CommentStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onFilterChange({ ...filter, status });
                  setShowStatusDropdown(false);
                }}
                className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 ${
                  filter.status === status ? 'bg-blue-50' : ''
                }`}
              >
                {COMMENT_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Type filter */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${
            filter.type ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200'
          }`}
        >
          {filter.type ? COMMENT_TYPE_LABELS[filter.type] : 'Type'}
          <ChevronDown size={12} />
        </button>

        {showTypeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[120px]">
            <button
              type="button"
              onClick={() => {
                onFilterChange({ ...filter, type: undefined });
                setShowTypeDropdown(false);
              }}
              className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50"
            >
              All
            </button>
            {(Object.keys(COMMENT_TYPE_LABELS) as CommentType[]).map((type) => {
              const colors = COMMENT_TYPE_COLORS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onFilterChange({ ...filter, type });
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 ${
                    filter.type === type ? 'bg-blue-50' : ''
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.border }}
                  />
                  {COMMENT_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear filters */}
      {(filter.status || filter.type) && (
        <button
          type="button"
          onClick={() => onFilterChange({})}
          className="p-1 text-gray-400 hover:text-gray-600"
          title="Clear filters"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * ConnectorLine - SVG line connecting thread to anchor
 */
function ConnectorLine({
  position,
  isActive,
}: {
  position: ThreadPosition;
  isActive: boolean;
}): JSX.Element | null {
  if (!position.isAnchorVisible || position.anchorLeft === 0) {
    return null;
  }

  // Calculate line coordinates
  const startY = position.alignedTop + 20; // Middle of thread header
  const endY = position.anchorTop + 10; // Middle of anchor
  const endX = -20; // Extend left into the gap

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        top: Math.min(startY, endY) - 5,
        left: endX,
        width: Math.abs(endX) + 10,
        height: Math.abs(endY - startY) + 10,
        overflow: 'visible',
      }}
    >
      <path
        d={`M ${Math.abs(endX) + 5} ${startY - Math.min(startY, endY) + 5}
            Q 0 ${startY - Math.min(startY, endY) + 5}
              0 ${(startY + endY) / 2 - Math.min(startY, endY) + 5}
            Q 0 ${endY - Math.min(startY, endY) + 5}
              ${Math.abs(endX) + 5} ${endY - Math.min(startY, endY) + 5}`}
        fill="none"
        stroke={isActive ? '#3b82f6' : '#d1d5db'}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? 'none' : '4 2'}
        className="transition-all duration-200"
      />
    </svg>
  );
}

/**
 * AlignedThreadWrapper - Wrapper for thread with absolute positioning
 */
function AlignedThreadWrapper({
  thread,
  position,
  isActive,
  onHeightChange,
  onClick,
  onScrollTo,
}: {
  thread: CommentThreadType;
  position: ThreadPosition | undefined;
  isActive: boolean;
  onHeightChange: (threadId: string, height: number) => void;
  onClick: () => void;
  onScrollTo?: ((threadId: string) => void) | undefined;
}): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Measure and report height
  useEffect(() => {
    if (wrapperRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onHeightChange(thread.id, entry.contentRect.height);
        }
      });

      resizeObserver.observe(wrapperRef.current);
      return () => resizeObserver.disconnect();
    }
    return undefined;
  }, [thread.id, onHeightChange]);

  const top = position?.alignedTop ?? 0;
  const showConnector = position?.isAnchorVisible && position.anchorLeft > 0;

  return (
    <div
      ref={wrapperRef}
      className="absolute left-0 right-0 transition-all duration-200 ease-out"
      style={{
        top: `${top}px`,
        zIndex: isActive ? 10 : 1,
      }}
    >
      {/* Connector line */}
      {showConnector && position && (
        <ConnectorLine position={position} isActive={isActive} />
      )}

      {/* Thread component */}
      <CommentThread
        thread={thread}
        isActive={isActive}
        onClick={onClick}
        onScrollTo={onScrollTo}
      />
    </div>
  );
}

/**
 * AlignedCommentPanel - Comment panel with visual alignment
 */
export function AlignedCommentPanel({
  isOpen,
  onToggle,
  onScrollToThread,
  onNewComment,
  editorContainer,
  onPositionsRecalculate,
}: AlignedCommentPanelProps): JSX.Element {
  const [filter, setFilter] = useState<CommentFilter>({});
  const [showNewComment, setShowNewComment] = useState(false);
  const [alignmentEnabled, setAlignmentEnabled] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const threadListRef = useRef<HTMLDivElement>(null);

  // Store state
  const threads = useCommentStore((state) => state.getAllThreads());
  const activeThreadId = useCommentStore((state) => state.activeThreadId);
  const setActiveThread = useCommentStore((state) => state.setActiveThread);
  const filterThreads = useCommentStore((state) => state.filterThreads);

  // Filter threads
  const filteredThreads = useMemo(() => {
    if (!filter.status && !filter.type && !filter.authorId && !filter.searchText) {
      return threads;
    }
    return filterThreads(filter);
  }, [threads, filter, filterThreads]);

  // Use alignment hook
  const { positions, updateThreadHeight } = useCommentAlignment({
    editorContainer,
    panelContainer: threadListRef.current,
    threads: filteredThreads,
    enabled: alignmentEnabled && isOpen,
    debounceMs: 100,
  });

  // Notify parent when positions recalculate
  useEffect(() => {
    onPositionsRecalculate?.();
  }, [positions, onPositionsRecalculate]);

  // Stats
  const openCount = threads.filter((t) => t.status === 'open').length;
  const resolvedCount = threads.filter((t) => t.status === 'resolved').length;

  // Calculate total height needed for positioned threads
  const totalHeight = useMemo(() => {
    let maxBottom = 0;
    for (const pos of positions.values()) {
      const bottom = pos.alignedTop + pos.height;
      if (bottom > maxBottom) {
        maxBottom = bottom;
      }
    }
    return maxBottom + 100; // Add some padding
  }, [positions]);

  // Handle new comment
  const handleNewComment = useCallback(() => {
    if (onNewComment) {
      onNewComment();
    } else {
      setShowNewComment(true);
    }
  }, [onNewComment]);

  // Handle thread click
  const handleThreadClick = useCallback(
    (threadId: string) => {
      setActiveThread(threadId);
    },
    [setActiveThread]
  );

  // Toggle alignment mode
  const toggleAlignment = useCallback(() => {
    setAlignmentEnabled((prev) => !prev);
  }, []);

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-4 px-2 bg-gray-50 border-l">
        <button
          type="button"
          onClick={onToggle}
          className="p-2 rounded hover:bg-gray-200"
          title="Open comments panel"
        >
          <PanelRightOpen size={20} />
        </button>
        {threads.length > 0 && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <AlertCircle size={12} />
              {openCount}
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle size={12} />
              {resolvedCount}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={panelRef} className="w-80 flex flex-col bg-white border-l h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Comments</h2>
          <span className="text-xs text-gray-500">({threads.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Alignment toggle */}
          <button
            type="button"
            onClick={toggleAlignment}
            className={`p-1 rounded text-xs ${
              alignmentEnabled
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            title={alignmentEnabled ? 'Disable alignment' : 'Enable alignment'}
          >
            ↔
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded hover:bg-gray-100"
            title="Close panel"
          >
            <PanelRightClose size={18} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-gray-50 text-xs">
        <div className="flex items-center gap-1 text-yellow-600">
          <AlertCircle size={12} />
          {openCount} open
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle size={12} />
          {resolvedCount} resolved
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar filter={filter} onFilterChange={setFilter} />

      {/* New comment button */}
      <div className="px-3 py-2 border-b">
        <button
          type="button"
          onClick={handleNewComment}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          New Comment
        </button>
        <p className="mt-1 text-xs text-gray-500 text-center">
          Select text in the editor first
        </p>
      </div>

      {/* New comment input (if shown) */}
      {showNewComment && (
        <div className="p-3 border-b bg-blue-50">
          <CommentInput
            onSubmit={() => {
              setShowNewComment(false);
            }}
            placeholder="Select text in the editor to add a comment..."
            autoFocus
            onCancel={() => setShowNewComment(false)}
          />
        </div>
      )}

      {/* Thread list - positioned or regular */}
      <div
        ref={threadListRef}
        className="flex-1 overflow-y-auto"
        style={alignmentEnabled ? { position: 'relative' } : undefined}
      >
        {filteredThreads.length === 0 ? (
          <div className="text-center py-8 text-gray-500 p-3">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">
              Select text and click "New Comment" to add one
            </p>
          </div>
        ) : alignmentEnabled ? (
          // Aligned mode - absolute positioning
          <div
            className="relative p-3"
            style={{ minHeight: `${totalHeight}px` }}
          >
            {filteredThreads.map((thread) => (
              <AlignedThreadWrapper
                key={thread.id}
                thread={thread}
                position={positions.get(thread.id)}
                isActive={thread.id === activeThreadId}
                onHeightChange={updateThreadHeight}
                onClick={() => handleThreadClick(thread.id)}
                onScrollTo={onScrollToThread}
              />
            ))}
          </div>
        ) : (
          // Regular mode - normal flow
          <div className="p-3 space-y-3">
            {filteredThreads.map((thread) => (
              <CommentThread
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeThreadId}
                onClick={() => handleThreadClick(thread.id)}
                onScrollTo={onScrollToThread}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlignedCommentPanel;

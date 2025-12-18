/**
 * CommentPanel - Right sidebar for managing comments (Google Docs style)
 * Per Constitution Section 6 - Comments & Collaboration
 * No popups - all interactions happen in this panel
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Send,
  Check,
  Trash2,
  Reply,
} from 'lucide-react';
import type { LexicalEditor, RangeSelection } from 'lexical';
import { $getSelection, $isRangeSelection, $setSelection } from 'lexical';
import type { CommentType, CommentFilter, CommentThread } from '../../types/comment';
import { COMMENT_TYPE_LABELS, COMMENT_TYPE_COLORS } from '../../types/comment';
import { useCommentStore } from '../../stores/commentStore';
import { CREATE_COMMENT_COMMAND, DELETE_COMMENT_COMMAND, RESOLVE_COMMENT_COMMAND } from '../../plugins/CommentPlugin';

// Default user for comments
const DEFAULT_USER = {
  id: 'user-1',
  name: 'Utilisateur',
  email: 'user@example.com',
  color: '#3B82F6',
};

export interface CommentPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to toggle panel */
  onToggle: () => void;
  /** Callback when a thread should be scrolled to in editor */
  onScrollToThread?: (threadId: string) => void;
  /** Lexical editor reference */
  editor?: LexicalEditor | null;
}

/**
 * Avatar component with gradient ring - per design
 */
function CommentAvatar({
  name,
  color = '#3B82F6',
  size = 'md',
}: {
  name: string;
  color?: string;
  size?: 'sm' | 'md';
}): JSX.Element {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isSystem = name.toLowerCase().includes('certea');
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div className="avatar-ring flex-shrink-0">
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center text-white font-semibold`}
        style={{ backgroundColor: isSystem ? '#3B82F6' : color }}
      >
        {isSystem ? (
          <svg width={size === 'sm' ? '16' : '20'} height={size === 'sm' ? '16' : '20'} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" />
            <path
              d="M9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          initials
        )}
      </div>
    </div>
  );
}

/**
 * New comment input component - appears when text is selected
 */
function NewCommentInput({
  selectedText,
  onSubmit,
  onCancel,
}: {
  selectedText: string;
  onSubmit: (content: string, type: CommentType) => void;
  onCancel: () => void;
}): JSX.Element {
  const [content, setContent] = useState('');
  const [type, setType] = useState<CommentType>('remark');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentUser = useCommentStore((state) => state.currentUser);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim(), type);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl shadow-lg overflow-hidden">
      {/* Selected text preview */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
        <p className="text-xs text-blue-600 font-medium mb-1">Texte sélectionné:</p>
        <p className="text-sm text-gray-700 italic line-clamp-2">"{selectedText}"</p>
      </div>

      {/* Comment type selector */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <span className="text-xs text-gray-500">Type:</span>
        <div className="flex gap-1">
          {(['remark', 'question', 'suggestion', 'correction'] as CommentType[]).map((t) => {
            const colors = COMMENT_TYPE_COLORS[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                  type === t
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: type === t ? colors.border : 'transparent',
                }}
              >
                {COMMENT_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input area */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {currentUser && <CommentAvatar name={currentUser.name} color={currentUser.color} size="sm" />}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ajouter un commentaire..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Send size={14} />
                Commenter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Existing comment thread card with reply functionality
 */
function CommentThreadCard({
  thread,
  isActive,
  onClick,
  onResolve,
  onDelete,
  onReply,
}: {
  thread: CommentThread;
  isActive: boolean;
  onClick: () => void;
  onResolve: () => void;
  onDelete: () => void;
  onReply: (content: string) => void;
}): JSX.Element {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const currentUser = useCommentStore((state) => state.currentUser);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date)).replace(',', ' at');
  };

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent.trim());
      setReplyContent('');
      setShowReply(false);
    }
  };

  const isHighlighted = thread.type === 'suggestion' || thread.type === 'correction';
  const colors = COMMENT_TYPE_COLORS[thread.type];

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all cursor-pointer ${
        isActive ? 'ring-2 ring-blue-500' : ''
      } ${isHighlighted ? 'comment-card-highlighted' : 'comment-card'}`}
      onClick={onClick}
    >
      {/* Thread type indicator */}
      <div
        className="h-1"
        style={{ backgroundColor: colors.border }}
      />

      {/* Quoted text */}
      {thread.quotedText && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500 italic line-clamp-2">"{thread.quotedText}"</p>
        </div>
      )}

      {/* Comments */}
      <div className="p-4 space-y-3">
        {thread.comments.map((comment, index) => (
          <div key={comment.id} className={index > 0 ? 'pt-3 border-t border-gray-100' : ''}>
            <div className="flex items-start gap-3">
              <CommentAvatar
                name={comment.author.name}
                color={comment.author.color}
                size={index === 0 ? 'md' : 'sm'}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{comment.author.name}</span>
                  {comment.isEdited && <span className="text-xs text-gray-400">(modifié)</span>}
                </div>
                <div className="text-xs text-blue-500 mt-0.5">{formatDate(comment.createdAt)}</div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Reply input */}
        {showReply && (
          <div className="pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-2">
              {currentUser && <CommentAvatar name={currentUser.name} color={currentUser.color} size="sm" />}
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Répondre..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply();
                    }
                    if (e.key === 'Escape') {
                      setShowReply(false);
                      setReplyContent('');
                    }
                  }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReply(false);
                      setReplyContent('');
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmitReply();
                    }}
                    disabled={!replyContent.trim()}
                    className="px-2 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors disabled:opacity-50"
                  >
                    Répondre
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showReply && (
          <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowReply(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <Reply size={12} />
              Répondre
            </button>
            {thread.status === 'open' && (
              <button
                type="button"
                onClick={onResolve}
                className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
              >
                <Check size={12} />
                Résoudre
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors ml-auto"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Resolved indicator */}
      {thread.status === 'resolved' && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
          <Check size={14} className="text-green-600" />
          <span className="text-xs text-green-700">Résolu</span>
        </div>
      )}
    </div>
  );
}

/**
 * CommentPanel - Right sidebar for comment management (Google Docs style)
 */
export function CommentPanel({
  isOpen,
  onToggle,
  onScrollToThread,
  editor,
}: CommentPanelProps): JSX.Element {
  const [filter, setFilter] = useState<CommentFilter>({});
  const [searchText, setSearchText] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  // Store the selection to preserve it when clicking in the panel
  const savedSelectionRef = useRef<RangeSelection | null>(null);

  // Track if the editor has been interacted with (to ignore initial selection)
  const hasUserInteractedRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Store state
  const threads = useCommentStore((state) => state.getAllThreads());
  const activeThreadId = useCommentStore((state) => state.activeThreadId);
  const setActiveThread = useCommentStore((state) => state.setActiveThread);
  const filterThreads = useCommentStore((state) => state.filterThreads);
  const addReply = useCommentStore((state) => state.addReply);
  const currentUser = useCommentStore((state) => state.currentUser);
  const setCurrentUser = useCommentStore((state) => state.setCurrentUser);

  // Initialize default user if not set
  useEffect(() => {
    if (!currentUser) {
      setCurrentUser(DEFAULT_USER);
    }
  }, [currentUser, setCurrentUser]);

  // Track user interaction with the editor
  useEffect(() => {
    if (!editor) return;

    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleMouseUp = () => {
      hasUserInteractedRef.current = true;
    };

    const handleKeyUp = () => {
      hasUserInteractedRef.current = true;
    };

    rootElement.addEventListener('mouseup', handleMouseUp);
    rootElement.addEventListener('keyup', handleKeyUp);

    // Mark as initialized after a short delay to ignore initial renders
    const timer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 500);

    return () => {
      rootElement.removeEventListener('mouseup', handleMouseUp);
      rootElement.removeEventListener('keyup', handleKeyUp);
      clearTimeout(timer);
    };
  }, [editor]);

  // Listen to editor selection changes
  useEffect(() => {
    if (!editor) return;

    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      // Skip if not initialized or user hasn't interacted yet
      if (!isInitializedRef.current || !hasUserInteractedRef.current) {
        return;
      }

      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          const text = selection.getTextContent();
          // Only trigger for meaningful selections (at least 1 character)
          if (text.trim().length > 0) {
            setSelectedText(text);
            setHasSelection(true);
            // Save the selection
            savedSelectionRef.current = selection.clone() as RangeSelection;
          }
        }
        // Note: We don't clear hasSelection here to preserve it when clicking in the panel
      });
    });

    return removeListener;
  }, [editor]);

  // Clear selection state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedText(null);
      setHasSelection(false);
      savedSelectionRef.current = null;
    }
  }, [isOpen]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    let result = threads;

    if (filter.type) {
      result = filterThreads({ type: filter.type });
    }

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((thread) =>
        thread.comments.some(
          (comment) =>
            comment.content.toLowerCase().includes(searchLower) ||
            comment.author.name.toLowerCase().includes(searchLower)
        )
      );
    }

    return result;
  }, [threads, filter, searchText, filterThreads]);

  // Sort threads by date (newest first)
  const sortedThreads = useMemo(() => {
    return [...filteredThreads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredThreads]);

  // Handle creating a new comment
  const handleCreateComment = useCallback(
    (content: string, type: CommentType) => {
      if (editor && selectedText && savedSelectionRef.current) {
        // Restore the saved selection and create the comment in one update
        editor.update(() => {
          const selection = savedSelectionRef.current;
          if (selection) {
            // Restore the selection
            $setSelection(selection.clone());
          }
        });

        // Small delay to ensure selection is set before dispatching command
        setTimeout(() => {
          // Dispatch the command to create the comment
          editor.dispatchCommand(CREATE_COMMENT_COMMAND, { content, type });

          // Clear the selection state
          setSelectedText(null);
          setHasSelection(false);
          savedSelectionRef.current = null;
        }, 10);
      }
    },
    [editor, selectedText]
  );

  // Handle cancel new comment
  const handleCancelComment = useCallback(() => {
    setSelectedText(null);
    setHasSelection(false);
    savedSelectionRef.current = null;
  }, []);

  // Handle reply to thread
  const handleReply = useCallback(
    (threadId: string, content: string) => {
      addReply(threadId, content);
    },
    [addReply]
  );

  // Handle resolve thread
  const handleResolve = useCallback(
    (threadId: string) => {
      if (editor) {
        editor.dispatchCommand(RESOLVE_COMMENT_COMMAND, { threadId });
      }
    },
    [editor]
  );

  // Handle delete thread
  const handleDelete = useCallback(
    (threadId: string) => {
      if (editor) {
        editor.dispatchCommand(DELETE_COMMENT_COMMAND, { threadId });
      }
    },
    [editor]
  );

  // Handle thread click
  const handleThreadClick = useCallback(
    (threadId: string) => {
      setActiveThread(threadId);
      if (onScrollToThread) {
        onScrollToThread(threadId);
      }
    },
    [setActiveThread, onScrollToThread]
  );

  // Handle type filter change
  const handleTypeChange = useCallback((type: CommentType | undefined) => {
    setFilter((prev) => ({ ...prev, type }));
    setShowTypeDropdown(false);
  }, []);

  // Navigation
  const currentIndex = sortedThreads.findIndex((t) => t.id === activeThreadId);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const thread = sortedThreads[currentIndex - 1];
      handleThreadClick(thread.id);
    }
  }, [currentIndex, sortedThreads, handleThreadClick]);

  const handleNext = useCallback(() => {
    if (currentIndex < sortedThreads.length - 1) {
      const thread = sortedThreads[currentIndex + 1];
      handleThreadClick(thread.id);
    }
  }, [currentIndex, sortedThreads, handleThreadClick]);

  // Collapsed state
  if (!isOpen) {
    return (
      <div className="relative flex flex-col items-center py-4 px-2 bg-gray-50 border-l border-gray-200">
        <button
          type="button"
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          title="Ouvrir le panneau commentaires"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        {threads.length > 0 && (
          <div className="mt-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {threads.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-80 flex flex-col bg-white border-l border-gray-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-lg">Commentaires</h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Commentaire précédent"
          >
            <ChevronLeft size={20} className="text-blue-500" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= sortedThreads.length - 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Commentaire suivant"
          >
            <ChevronRight size={20} className="text-blue-500" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTypeDropdown(!showTypeDropdown);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Types
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px] py-1">
              <button
                type="button"
                onClick={() => handleTypeChange(undefined)}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                  !filter.type ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                Tous
              </button>
              {(Object.keys(COMMENT_TYPE_LABELS) as CommentType[]).map((type) => {
                const colors = COMMENT_TYPE_COLORS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                      filter.type === type ? 'bg-blue-50 text-blue-700' : ''
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

        <div className="flex-1 relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Recherche"
            className="w-full px-3 py-1.5 pr-8 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 left-panel-scroll">
        {/* New comment input when text is selected */}
        {hasSelection && selectedText && (
          <NewCommentInput
            selectedText={selectedText}
            onSubmit={handleCreateComment}
            onCancel={handleCancelComment}
          />
        )}

        {/* Existing threads */}
        {sortedThreads.length === 0 && !hasSelection ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Aucun commentaire</p>
            <p className="text-xs mt-1 text-gray-400">
              Sélectionnez du texte pour ajouter un commentaire
            </p>
          </div>
        ) : (
          sortedThreads.map((thread) => (
            <CommentThreadCard
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onClick={() => handleThreadClick(thread.id)}
              onResolve={() => handleResolve(thread.id)}
              onDelete={() => handleDelete(thread.id)}
              onReply={(content) => handleReply(thread.id, content)}
            />
          ))
        )}
      </div>

      {/* Floating collapse button */}
      <button
        type="button"
        onClick={onToggle}
        className="collapse-button-float"
        style={{ left: '-16px', right: 'auto' }}
        title="Fermer le panneau"
      >
        <ChevronRight size={16} className="text-gray-500" />
      </button>
    </div>
  );
}

export default CommentPanel;

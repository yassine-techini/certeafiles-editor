/**
 * CommentInput - Input component for creating comments
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import type { CommentType, User } from '../../types/comment';
import { COMMENT_TYPE_LABELS, COMMENT_TYPE_COLORS } from '../../types/comment';

export interface CommentInputProps {
  /** Callback when comment is submitted */
  onSubmit: (content: string, type: CommentType) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show type selector */
  showTypeSelector?: boolean;
  /** Default comment type */
  defaultType?: CommentType;
  /** List of users for @mention autocomplete */
  users?: User[];
  /** Whether input is disabled */
  disabled?: boolean;
  /** Auto-focus the input */
  autoFocus?: boolean;
  /** Callback when canceled (for reply inputs) */
  onCancel?: () => void;
}

/**
 * CommentInput - Textarea with @mention autocomplete and type selector
 */
export function CommentInput({
  onSubmit,
  placeholder = 'Write a comment...',
  showTypeSelector = true,
  defaultType = 'remark',
  users = [],
  disabled = false,
  autoFocus = false,
  onCancel,
}: CommentInputProps): JSX.Element {
  const [content, setContent] = useState('');
  const [type, setType] = useState<CommentType>(defaultType);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter users for mention autocomplete
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  // Handle textarea change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);

      // Check for @mention trigger
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        setShowMentions(true);
        setMentionFilter(mentionMatch[1]);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    },
    []
  );

  // Insert mention
  const insertMention = useCallback(
    (user: User) => {
      if (!textareaRef.current) return;

      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = content.slice(0, cursorPos);
      const textAfterCursor = content.slice(cursorPos);

      // Find the @ symbol position
      const atIndex = textBeforeCursor.lastIndexOf('@');
      if (atIndex === -1) return;

      const newContent =
        textBeforeCursor.slice(0, atIndex) +
        `@${user.name.replace(/\s/g, '')} ` +
        textAfterCursor;

      setContent(newContent);
      setShowMentions(false);

      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = atIndex + user.name.replace(/\s/g, '').length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [content]
  );

  // Handle keyboard navigation in mentions
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showMentions && filteredUsers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionIndex((i) => (i + 1) % filteredUsers.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionIndex((i) => (i - 1 + filteredUsers.length) % filteredUsers.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          insertMention(filteredUsers[mentionIndex]);
        } else if (e.key === 'Escape') {
          setShowMentions(false);
        }
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [showMentions, filteredUsers, mentionIndex, insertMention]
  );

  // Submit handler
  const handleSubmit = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent || disabled) return;

    onSubmit(trimmedContent, type);
    setContent('');
  }, [content, type, disabled, onSubmit]);

  const typeColors = COMMENT_TYPE_COLORS[type];

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Type selector */}
      {showTypeSelector && (
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50">
          <span className="text-xs text-gray-500">Type:</span>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: typeColors.bg,
                color: typeColors.text,
                border: `1px solid ${typeColors.border}`,
              }}
            >
              {COMMENT_TYPE_LABELS[type]}
              <ChevronDown size={12} />
            </button>

            {showTypeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[140px]">
                {(Object.keys(COMMENT_TYPE_LABELS) as CommentType[]).map((t) => {
                  const colors = COMMENT_TYPE_COLORS[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setType(t);
                        setShowTypeDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 ${
                        type === t ? 'bg-gray-100' : ''
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.border }}
                      />
                      {COMMENT_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full px-3 py-2 text-sm resize-none focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
        />

        {/* Mention autocomplete */}
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                  index === mentionIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: user.color }}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    user.name[0].toUpperCase()
                  )}
                </div>
                <span>{user.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
        <span className="text-xs text-gray-400">
          {content.length > 0 && `${content.length} characters`}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={12} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentInput;

/**
 * CommentItem - Individual comment display
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Comment, CommentType } from '../../types/comment';
import { COMMENT_TYPE_COLORS, COMMENT_TYPE_LABELS } from '../../types/comment';

export interface CommentItemProps {
  /** The comment to display */
  comment: Comment;
  /** Whether this is the main comment in a thread */
  isMainComment?: boolean;
  /** Callback when edit is requested */
  onEdit?: (commentId: string) => void;
  /** Callback when delete is requested */
  onDelete?: (commentId: string) => void;
}

/**
 * Format @mentions in comment content
 */
function formatContentWithMentions(content: string): JSX.Element[] {
  const mentionRegex = /@(\w+)/g;
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{content.slice(lastIndex, match.index)}</span>
      );
    }
    // Add mention with highlighting
    parts.push(
      <span
        key={key++}
        className="text-blue-600 font-medium bg-blue-50 px-0.5 rounded"
      >
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{content}</span>];
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * CommentTypeBadge - Small badge showing comment type
 */
function CommentTypeBadge({ type }: { type: CommentType }): JSX.Element {
  const colors = COMMENT_TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {COMMENT_TYPE_LABELS[type]}
    </span>
  );
}

/**
 * CommentItem - Displays a single comment with author info
 */
export function CommentItem({
  comment,
  isMainComment = false,
  onEdit,
  onDelete,
}: CommentItemProps): JSX.Element {
  const formattedContent = useMemo(
    () => formatContentWithMentions(comment.content),
    [comment.content]
  );

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  }, [comment.createdAt]);

  return (
    <div
      className={`flex gap-3 ${isMainComment ? 'p-3' : 'p-2 pl-6'}`}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
        style={{ backgroundColor: comment.author.color }}
        title={comment.author.name}
      >
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          getInitials(comment.author.name)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900 truncate">
            {comment.author.name}
          </span>
          {isMainComment && <CommentTypeBadge type={comment.type} />}
          <span className="text-xs text-gray-500">{timeAgo}</span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
        </div>

        {/* Comment text */}
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
          {formattedContent}
        </p>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="mt-1 flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(comment.id)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Edit
              </button>
            )}
            {onDelete && !isMainComment && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentItem;

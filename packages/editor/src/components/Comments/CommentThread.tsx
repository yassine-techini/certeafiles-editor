/**
 * CommentThread - Thread display with main comment and replies
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { useState, useCallback } from 'react';
import {
  CheckCircle,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import type { CommentThread as CommentThreadType, CommentType } from '../../types/comment';
import { COMMENT_TYPE_COLORS, getMainComment, getReplies, getReplyCount } from '../../types/comment';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import { useCommentStore } from '../../stores/commentStore';

export interface CommentThreadProps {
  /** The thread to display */
  thread: CommentThreadType;
  /** Whether this thread is currently active/selected */
  isActive?: boolean | undefined;
  /** Callback when thread is clicked */
  onClick?: (() => void) | undefined;
  /** Callback when thread should be scrolled to in editor */
  onScrollTo?: ((threadId: string) => void) | undefined;
}

/**
 * CommentThread - Displays a complete comment thread with replies
 */
export function CommentThread({
  thread,
  isActive = false,
  onClick,
  onScrollTo,
}: CommentThreadProps): JSX.Element {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);

  // Store actions
  const addReply = useCommentStore((state) => state.addReply);
  const resolveThread = useCommentStore((state) => state.resolveThread);
  const reopenThread = useCommentStore((state) => state.reopenThread);
  const deleteThread = useCommentStore((state) => state.deleteThread);
  const editComment = useCommentStore((state) => state.editComment);
  const deleteComment = useCommentStore((state) => state.deleteComment);

  const mainComment = getMainComment(thread);
  const replies = getReplies(thread);
  const replyCount = getReplyCount(thread);
  const isResolved = thread.status === 'resolved';

  const typeColors = COMMENT_TYPE_COLORS[thread.type];

  // Handle reply submission
  const handleReply = useCallback(
    (content: string, _type: CommentType) => {
      addReply(thread.id, content);
      setShowReplyInput(false);
    },
    [thread.id, addReply]
  );

  // Handle resolve/reopen
  const handleToggleResolve = useCallback(() => {
    if (isResolved) {
      reopenThread(thread.id);
    } else {
      resolveThread(thread.id);
    }
  }, [thread.id, isResolved, resolveThread, reopenThread]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this comment thread?')) {
      deleteThread(thread.id);
    }
  }, [thread.id, deleteThread]);

  // Handle edit comment
  const handleEditComment = useCallback(
    (commentId: string) => {
      const comment = thread.comments.find((c) => c.id === commentId);
      if (!comment) return;

      const newContent = window.prompt('Edit comment:', comment.content);
      if (newContent && newContent !== comment.content) {
        editComment(thread.id, commentId, newContent);
      }
    },
    [thread.id, thread.comments, editComment]
  );

  // Handle delete comment
  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (window.confirm('Are you sure you want to delete this reply?')) {
        deleteComment(thread.id, commentId);
      }
    },
    [thread.id, deleteComment]
  );

  if (!mainComment) return <></>;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        isActive ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
      } ${isResolved ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      {/* Thread header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: typeColors.bg }}
      >
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div
            className={`w-2 h-2 rounded-full ${
              isResolved ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            title={isResolved ? 'Resolved' : 'Open'}
          />

          {/* Quoted text preview */}
          {thread.quotedText && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onScrollTo?.(thread.id);
              }}
              className="text-xs text-gray-600 truncate max-w-[180px] hover:text-blue-600 italic"
              title={`"${thread.quotedText}"`}
            >
              "{thread.quotedText.slice(0, 30)}
              {thread.quotedText.length > 30 ? '...' : ''}"
            </button>
          )}
        </div>

        {/* Thread actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleResolve();
            }}
            className={`p-1 rounded hover:bg-white/50 ${
              isResolved ? 'text-green-600' : 'text-gray-500'
            }`}
            title={isResolved ? 'Reopen' : 'Resolve'}
          >
            {isResolved ? <RotateCcw size={14} /> : <CheckCircle size={14} />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 rounded hover:bg-white/50 text-gray-500 hover:text-red-600"
            title="Delete thread"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main comment */}
      <CommentItem
        comment={mainComment}
        isMainComment={true}
        onEdit={handleEditComment}
      />

      {/* Replies section */}
      {replyCount > 0 && (
        <>
          {/* Replies toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplies(!showReplies);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-t"
          >
            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>

          {/* Replies list */}
          {showReplies && (
            <div className="border-t bg-gray-50">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Reply input section */}
      <div className="border-t">
        {showReplyInput ? (
          <div className="p-2">
            <CommentInput
              onSubmit={handleReply}
              placeholder="Write a reply..."
              showTypeSelector={false}
              autoFocus
              onCancel={() => setShowReplyInput(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyInput(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <MessageSquare size={12} />
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

export default CommentThread;

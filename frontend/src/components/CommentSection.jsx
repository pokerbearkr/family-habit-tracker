import React, { useState, useRef, useEffect } from 'react';
import { commentAPI } from '../services/api';
import { MessageSquare, Send, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function CommentSection({ habitLogId, comments = [], familyMembers = [], currentUserId, onCommentAdded }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const inputRef = useRef(null);

  // Filter family members based on mention search
  const filteredMembers = familyMembers.filter(member =>
    member.id !== currentUserId &&
    (member.username.toLowerCase().includes(mentionFilter.toLowerCase()) ||
     member.displayName.toLowerCase().includes(mentionFilter.toLowerCase()))
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setNewComment(value);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @ (still typing username)
      if (!textAfterAt.includes(' ')) {
        setShowMentionList(true);
        setMentionFilter(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        return;
      }
    }

    setShowMentionList(false);
    setMentionFilter('');
    setMentionStartIndex(-1);
  };

  const handleMentionSelect = (member) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = newComment.substring(0, mentionStartIndex);
    const afterMention = newComment.substring(mentionStartIndex + mentionFilter.length + 1);
    const newValue = `${beforeMention}@${member.username} ${afterMention}`;

    setNewComment(newValue);
    setShowMentionList(false);
    setMentionFilter('');
    setMentionStartIndex(-1);

    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await commentAPI.create(habitLogId, newComment.trim());
      setNewComment('');
      toast.success('댓글이 등록되었습니다');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('댓글 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentAPI.delete(commentId);
      toast.success('댓글이 삭제되었습니다');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('댓글 삭제에 실패했습니다');
    }
  };

  // Render comment content with highlighted mentions
  const renderCommentContent = (content) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      // Add highlighted mention
      const mentionedUser = familyMembers.find(m => m.username === match[1]);
      parts.push(
        <span key={match.index} className="text-figma-blue-100 font-medium">
          @{mentionedUser?.displayName || match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (!habitLogId) return null;

  return (
    <div className="mt-2">
      {/* Comment toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-figma-black-40 hover:text-figma-blue-100 transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        <span>댓글 {comments.length > 0 && `(${comments.length})`}</span>
      </button>

      {/* Expanded comment section */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Comments list */}
          {comments.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 p-2 bg-figma-black-10 rounded-lg group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-figma-black-100">
                        {comment.userDisplayName}
                      </span>
                      <span className="text-[10px] text-figma-black-40">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-figma-black-80 break-words">
                      {renderCommentContent(comment.content)}
                    </p>
                  </div>
                  {comment.userId === currentUserId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-figma-black-40 hover:text-figma-red transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={handleInputChange}
                  placeholder="댓글 입력... (@로 멘션)"
                  className="w-full px-3 py-2 text-xs border border-figma-black-10 rounded-lg focus:outline-none focus:border-figma-blue-100 bg-white dark:bg-gray-800"
                  disabled={isSubmitting}
                />

                {/* Mention dropdown */}
                {showMentionList && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-gray-800 border border-figma-black-10 rounded-lg shadow-lg overflow-hidden z-10">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleMentionSelect(member)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-figma-blue-10 flex items-center gap-2"
                      >
                        <span className="font-medium text-figma-black-100">{member.displayName}</span>
                        <span className="text-figma-black-40">@{member.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-3 py-2 bg-figma-blue-100 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-figma-blue-100/90 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CommentSection;

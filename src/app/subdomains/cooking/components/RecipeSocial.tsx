'use client';

import { useEffect, useState } from 'react';
import { useToast } from '~/components/Toast';
import { FlagIcon, ThumbsDownIcon } from './Icons';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface LikeInfo {
  likeCount: number;
  isLikedByUser: boolean;
}

interface DislikeInfo {
  dislikeCount: number;
  isDislikedByUser: boolean;
}

interface RecipeSocialProps {
  recipeId: string;
  currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function RecipeSocial({ recipeId, currentUser }: RecipeSocialProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeInfo, setLikeInfo] = useState<LikeInfo>({
    likeCount: 0,
    isLikedByUser: false,
  });
  const [dislikeInfo, setDislikeInfo] = useState<DislikeInfo>({
    dislikeCount: 0,
    isDislikedByUser: false,
  });
  const [newComment, setNewComment] = useState('');
  const [_isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commentsRes, likesRes, dislikesRes] = await Promise.all([
          fetch(`/api/cooking/recipes/${recipeId}/comments`),
          fetch(`/api/cooking/recipes/${recipeId}/like`),
          fetch(`/api/cooking/recipes/${recipeId}/dislike`),
        ]);
        const commentsData = (await commentsRes.json()) as Comment[];
        const likesData = (await likesRes.json()) as LikeInfo;
        const dislikesData = (await dislikesRes.json()) as DislikeInfo;
        setComments(commentsData);
        setLikeInfo(likesData);
        setDislikeInfo(dislikesData);
      } catch (error) {
        console.error('Error fetching social data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [recipeId]);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      addToast('Please provide a reason for the report.', 'error');
      return;
    }
    try {
      const response = await fetch(`/api/cooking/recipes/${recipeId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      if (!response.ok) throw new Error('Failed to submit report');
      addToast('Recipe reported. Our team will review it.', 'success');
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      addToast('Failed to submit report.', 'error');
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    setLikeInfo((prev) => ({
      likeCount: prev.isLikedByUser ? prev.likeCount - 1 : prev.likeCount + 1,
      isLikedByUser: !prev.isLikedByUser,
    }));
    if (dislikeInfo.isDislikedByUser) {
      setDislikeInfo((prev) => ({
        ...prev,
        isDislikedByUser: false,
        dislikeCount: prev.dislikeCount - 1,
      }));
    }
    await fetch(`/api/cooking/recipes/${recipeId}/like`, { method: 'POST' });
  };

  const handleDislike = async () => {
    if (!currentUser) return;
    setDislikeInfo((prev) => ({
      dislikeCount: prev.isDislikedByUser
        ? prev.dislikeCount - 1
        : prev.dislikeCount + 1,
      isDislikedByUser: !prev.isDislikedByUser,
    }));
    if (likeInfo.isLikedByUser) {
      setLikeInfo((prev) => ({
        ...prev,
        isLikedByUser: false,
        likeCount: prev.likeCount - 1,
      }));
    }
    await fetch(`/api/cooking/recipes/${recipeId}/dislike`, { method: 'POST' });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/cooking/recipes/${recipeId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment }),
        }
      );

      if (response.ok) {
        const createdComment = (await response.json()) as Comment;
        setComments((prev) => [createdComment, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Likes Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={!currentUser}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg"
        >
          <svg
            className={`w-5 h-5 ${likeInfo.isLikedByUser ? 'text-red-500 fill-current' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
            />
          </svg>
          <span>{likeInfo.likeCount}</span>
        </button>
        <button
          onClick={handleDislike}
          disabled={!currentUser}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg"
        >
          <ThumbsDownIcon />
          <span>{dislikeInfo.dislikeCount}</span>
        </button>
        <button
          onClick={() => setShowReportModal(true)}
          disabled={!currentUser}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg"
        >
          <FlagIcon />
          <span>Report</span>
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Report Recipe</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please provide a reason..."
              className="w-full p-2 border rounded"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowReportModal(false)}>Cancel</button>
              <button onClick={handleReport}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>

        {/* New Comment Form */}
        {currentUser && (
          <form
            onSubmit={(e) => void handleCommentSubmit(e)}
            className="flex items-start gap-2"
          >
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
              }}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border rounded-lg"
              rows={2}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        )}

        {/* Comment List */}
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <p>{comment.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                - {comment.author.name ?? 'Anonymous'} on{' '}
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

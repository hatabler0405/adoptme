import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, User, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ShelterReviews({ shelterId, shelterName }) {
  const { user, openAuthModal } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch reviews directly from /api/feedback/shelter/:id
  const fetchReviews = useCallback(async () => {
    if (!shelterId) return;
    setLoading(true);
    try {
      const res = await api.get(`/feedback/shelter/${shelterId}`);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load reviews from database:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [shelterId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + (typeof r.rating === 'number' ? r.rating : 5), 0) /
          reviews.length
        ).toFixed(1)
      : '5.0';

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        description: comment.trim(),
        rating: Number(rating),
        shelterId: Number(shelterId),
      };

      const res = await api.post('/feedback', payload);

      setReviews((prev) => [res.data, ...prev]);
      setComment('');
      setRating(5);
      setHoverRating(0);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#0b1329]/90 sm:p-8 transition-colors">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Adopter Reviews & Experiences
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Read feedback from past adopters at {shelterName}.
          </p>
        </div>

        {/* Rating Summary Badge */}
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 text-amber-900 border border-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300 w-fit">
          <div className="flex items-center">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-lg font-black">{averageRating}</span>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            ({reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'})
          </span>
        </div>
      </div>

      {/* Review Submission Form */}
      <form onSubmit={handleSubmitReview} className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:border-slate-800/80 dark:bg-[#070d1e] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Leave a Review for this Shelter
        </h3>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Star Selector */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => {
            const activeThreshold = hoverRating || rating;
            const isFilled = activeThreshold >= star;

            return (
              <button
                type="button"
                key={star}
                onClick={() => {
                  setRating(star);
                  setHoverRating(0);
                }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
              >
                <Star
                  className={`h-5 w-5 ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            );
          })}
          <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            {hoverRating || rating} of 5 Stars
          </span>
        </div>

        {/* Text Area */}
        <textarea
          rows={3}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Share your experience with adoptions, staff, or facilities at ${shelterName}...`}
          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-[#0f172a]/60 dark:text-white dark:placeholder-slate-500"
        />

        <div className="flex items-center justify-between">
          {submitted ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Thank you! Your review was posted.</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Posting as: <strong className="text-slate-700 dark:text-slate-300">{user?.username || 'Verified Adopter'}</strong>
            </span>
          )}

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
          </button>
        </div>
      </form>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
          No reviews yet for {shelterName}. Be the first adopter to leave one!
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-slate-100 p-4 transition-colors dark:border-slate-800 dark:bg-[#070d1e]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {rev.username || rev.author || 'Verified Adopter'}
                    </h4>
                    <span className="text-[10px] text-slate-400">{formatDate(rev.createdAt || rev.date)}</span>
                  </div>
                </div>

                {/* Star display */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const reviewRating = typeof rev.rating === 'number' ? rev.rating : 5;
                    return (
                      <Star
                        key={starIndex}
                        className={`h-3.5 w-3.5 ${
                          starIndex <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {rev.description || rev.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
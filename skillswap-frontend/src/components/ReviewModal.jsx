import { useState } from 'react';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Spinner } from './Loader';

/**
 * Modal for reviewing the other party of a completed swap.
 * Props: swapRequestId, revieweeName, onClose(), onDone().
 */
export default function ReviewModal({ swapRequestId, revieweeName, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) return toast.error('Pick a star rating first');
    setSaving(true);
    try {
      await api.post('/reviews', { swapRequest: swapRequestId, rating, comment: comment.trim() });
      toast.success('Review submitted');
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Rate your swap</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              How was your exchange with {revieweeName || 'this student'}?
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-9 w-9 ${
                    n <= (hover || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="review-comment">Comment (optional)</label>
            <textarea
              id="review-comment"
              className="input min-h-[90px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              placeholder="What went well? What could have been better?"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

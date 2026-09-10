import { ArrowLeftRight } from 'lucide-react';

/**
 * The product's signature element: teaching (violet) on the left,
 * learning (teal) on the right, with the swap arrow between them.
 * Used in the hero, on cards, and anywhere the exchange is shown.
 */
export default function SwapBadge({ teach, learn, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`chip ${pad} bg-teach-soft text-teach-ink dark:bg-teach/20 dark:text-violet-200`}>
        {teach}
      </span>
      <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="swapped for" />
      <span className={`chip ${pad} bg-learn-soft text-learn-ink dark:bg-learn/20 dark:text-teal-200`}>
        {learn}
      </span>
    </div>
  );
}

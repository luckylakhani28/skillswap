import { Link } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-teach text-white">
        <ArrowLeftRight className="h-6 w-6" />
      </span>
      <p className="mt-6 font-display text-5xl font-bold">404</p>
      <p className="mt-2 max-w-sm text-slate-500 dark:text-slate-400">
        This page isn't part of the swap. It may have moved or never existed.
      </p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}

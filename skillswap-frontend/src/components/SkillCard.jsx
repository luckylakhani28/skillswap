import { Link } from 'react-router-dom';
import { Star, Monitor, MapPin, Globe } from 'lucide-react';

const modeIcon = { Online: Monitor, Offline: MapPin, Both: Globe };

export default function SkillCard({ skill }) {
  const Icon = modeIcon[skill.mode] || Globe;
  const owner = skill.user || {};

  return (
    <Link
      to={`/skills/${skill._id}`}
      className="card group flex flex-col p-5 transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="chip bg-teach-soft text-teach-ink dark:bg-teach/20 dark:text-violet-200">
          {skill.category}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Icon className="h-3.5 w-3.5" /> {skill.mode}
        </span>
      </div>

      <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-teach dark:text-white">
        {skill.skillName}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
        {skill.description}
      </p>

      {skill.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skill.tags.slice(0, 3).map((t) => (
            <span key={t} className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-teach/15 text-xs font-semibold text-teach dark:text-violet-300">
            {owner.name?.[0]?.toUpperCase() || '?'}
          </span>
          {owner.name || 'Someone'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
          <Star className="h-3.5 w-3.5 fill-current" />
          {owner.rating?.toFixed?.(1) ?? '—'}
        </span>
      </div>
    </Link>
  );
}

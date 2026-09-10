import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../lib/api';
import SkillCard from '../components/SkillCard';
import { SkillCardSkeleton } from '../components/Loader';

const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const MODES = ['Online', 'Offline', 'Both'];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'A–Z' },
];

export default function BrowseSkills() {
  const [filters, setFilters] = useState({
    search: '', category: '', experienceLevel: '', mode: '', sort: 'newest',
  });
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ skills: [], page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 9 };
      Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
      const { data } = await api.get('/skills', { params });
      setData(data);
    } catch {
      setData({ skills: [], page: 1, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Debounce so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(fetchSkills, 300);
    return () => clearTimeout(t);
  }, [fetchSkills]);

  const update = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Browse skills</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {data.total} listing{data.total === 1 ? '' : 's'} waiting to be swapped.
        </p>
      </header>

      {/* Search + filters */}
      <div className="card mb-6 p-4">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search skills, tags, keywords…"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <Select value={filters.category} onChange={(v) => update('category', v)} placeholder="All categories">
            {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </Select>
          <Select value={filters.experienceLevel} onChange={(v) => update('experienceLevel', v)} placeholder="Any level">
            {EXPERIENCE.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
          <Select value={filters.mode} onChange={(v) => update('mode', v)} placeholder="Any mode">
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Select value={filters.sort} onChange={(v) => update('sort', v)}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkillCardSkeleton key={i} />)}
        </div>
      ) : data.skills.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-lg font-semibold">No skills match that search</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try clearing a filter or searching a broader term.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.skills.map((s) => <SkillCard key={s._id} skill={s} />)}
        </div>
      )}

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="px-2 text-sm text-slate-500">Page {data.page} of {data.pages}</span>
          <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, children, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input w-auto min-w-[9rem] py-2"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

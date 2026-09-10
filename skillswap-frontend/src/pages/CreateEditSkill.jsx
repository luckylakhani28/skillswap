import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ImageUpload from '../components/ImageUpload';
import { PageLoader, Spinner } from '../components/Loader';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const MODES = ['Online', 'Offline', 'Both'];
const toList = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

export default function CreateEditSkill() {
  const { id } = useParams(); // present => edit mode
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    skillName: '', category: '', description: '', experienceLevel: 'Beginner',
    mode: 'Online', duration: '', availability: '', image: '',
    tags: '', preferredSkills: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/skills/${id}`)
      .then(({ data }) => {
        const s = data.skill;
        setForm({
          skillName: s.skillName, category: s.category, description: s.description,
          experienceLevel: s.experienceLevel, mode: s.mode, duration: s.duration || '',
          availability: s.availability || '', image: s.image || '',
          tags: (s.tags || []).join(', '), preferredSkills: (s.preferredSkills || []).join(', '),
        });
      })
      .catch((err) => { toast.error(err.message); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: toList(form.tags), preferredSkills: toList(form.preferredSkills) };
      const { data } = isEdit
        ? await api.put(`/skills/${id}`, payload)
        : await api.post('/skills', payload);
      toast.success(isEdit ? 'Listing updated' : 'Listing published');
      navigate(`/skills/${data.skill._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold">{isEdit ? 'Edit listing' : 'New listing'}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Describe a skill you can teach. Students offer their own skills in return.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-5 p-6">
        <Field label="Skill name">
          <input className="input" value={form.skillName} onChange={set('skillName')} placeholder="Data Structures & Algorithms" required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            <select className="input" value={form.category} onChange={set('category')} required>
              <option value="" disabled>Choose a category</option>
              {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Experience level">
            <select className="input" value={form.experienceLevel} onChange={set('experienceLevel')}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Description" hint="What you'll cover, at least 10 characters">
          <textarea className="input min-h-[110px]" value={form.description} onChange={set('description')} required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Mode">
            <select className="input" value={form.mode} onChange={set('mode')}>
              {MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Duration" hint="e.g. 4 weeks">
            <input className="input" value={form.duration} onChange={set('duration')} />
          </Field>
          <Field label="Availability">
            <input className="input" value={form.availability} onChange={set('availability')} />
          </Field>
        </div>

        <Field label="Tags" hint="Comma-separated">
          <input className="input" value={form.tags} onChange={set('tags')} placeholder="dsa, interview, cpp" />
        </Field>
        <Field label="Skills you'd prefer in return" hint="Comma-separated, optional">
          <input className="input" value={form.preferredSkills} onChange={set('preferredSkills')} placeholder="Video editing, Figma" />
        </Field>
        <ImageUpload
          variant="wide"
          label="Cover image (optional)"
          value={form.image}
          onChange={(url) => setForm({ ...form, image: url })}
        />

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn-primary" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : isEdit ? 'Save changes' : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}{hint && <span className="ml-1.5 font-normal text-slate-400">— {hint}</span>}</label>
      {children}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { Spinner } from '../components/Loader';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

// Turn a comma-separated string into a clean array and back.
const toList = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    college: user?.college || '',
    degree: user?.degree || '',
    year: user?.year || '',
    experienceLevel: user?.experienceLevel || 'Beginner',
    availability: user?.availability || '',
    profilePicture: user?.profilePicture || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    portfolio: user?.portfolio || '',
    skillsCanTeach: (user?.skillsCanTeach || []).join(', '),
    skillsWantToLearn: (user?.skillsWantToLearn || []).join(', '),
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        skillsCanTeach: toList(form.skillsCanTeach),
        skillsWantToLearn: toList(form.skillsWantToLearn),
      };
      const { data } = await api.put('/users/me', payload);
      setUser(data.user);
      toast.success('Profile updated');
      navigate(`/profile/${data.user.username}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Edit profile</h1>
      <form onSubmit={onSubmit} className="card mt-6 space-y-5 p-6">
        <Field label="Full name"><input className="input" value={form.name} onChange={set('name')} required /></Field>
        <Field label="Bio" hint="A sentence or two about you.">
          <textarea className="input min-h-[90px]" value={form.bio} onChange={set('bio')} maxLength={500} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="College"><input className="input" value={form.college} onChange={set('college')} /></Field>
          <Field label="Degree"><input className="input" value={form.degree} onChange={set('degree')} /></Field>
          <Field label="Year"><input className="input" value={form.year} onChange={set('year')} /></Field>
          <Field label="Experience level">
            <select className="input" value={form.experienceLevel} onChange={set('experienceLevel')}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Availability" hint="e.g. Weekends, evenings after 6pm">
          <input className="input" value={form.availability} onChange={set('availability')} />
        </Field>

        <Field label="Skills you can teach" hint="Comma-separated">
          <input className="input" value={form.skillsCanTeach} onChange={set('skillsCanTeach')} placeholder="DSA, C++, Public speaking" />
        </Field>
        <Field label="Skills you want to learn" hint="Comma-separated">
          <input className="input" value={form.skillsWantToLearn} onChange={set('skillsWantToLearn')} placeholder="Video editing, UI design" />
        </Field>

        <ImageUpload
          variant="avatar"
          label="Profile picture"
          value={form.profilePicture}
          onChange={(url) => setForm({ ...form, profilePicture: url })}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="GitHub"><input className="input" value={form.github} onChange={set('github')} /></Field>
          <Field label="LinkedIn"><input className="input" value={form.linkedin} onChange={set('linkedin')} /></Field>
          <Field label="Portfolio"><input className="input" value={form.portfolio} onChange={set('portfolio')} /></Field>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn-primary" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Save changes'}
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

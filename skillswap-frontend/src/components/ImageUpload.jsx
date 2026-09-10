import { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Spinner } from './Loader';

/**
 * Uploads an image to the backend (which streams it to Cloudinary) and
 * returns the hosted URL via onChange. Falls back to a manual URL field so
 * the form still works when Cloudinary isn't configured.
 *
 * Props: value (url), onChange(url), label, variant: 'avatar' | 'wide'
 */
export default function ImageUpload({ value, onChange, label, variant = 'wide' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    setUploading(true);
    try {
      const { data } = await api.post('/uploads/image', fd);
      onChange(data.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isAvatar = variant === 'avatar';
  const previewClass = isAvatar
    ? 'h-20 w-20 rounded-2xl'
    : 'h-40 w-full rounded-xl';

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className={`flex ${isAvatar ? 'items-center' : 'flex-col'} gap-3`}>
        {/* Preview */}
        <div className={`${previewClass} grid shrink-0 place-items-center overflow-hidden border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50`}>
          {value ? (
            <img src={value} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-300 dark:text-slate-600" />
          )}
        </div>

        <div className={isAvatar ? '' : 'w-full'}>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            {value && (
              <button type="button" className="btn-ghost text-rose-500" onClick={() => onChange('')}>
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <input
            className="input mt-2"
            placeholder="…or paste an image URL"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

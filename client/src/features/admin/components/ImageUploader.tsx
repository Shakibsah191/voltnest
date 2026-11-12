import { useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Link2, Trash2 } from 'lucide-react';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { uploadImage } from '../api';

interface ImageUploaderProps {
  images: { url: string; alt: string }[];
  onChange: (images: { url: string; alt: string }[]) => void;
  uploadsEnabled: boolean;
  altText: string;
}

/** Product photos: upload to Cloudinary when it's set up, or paste a link. The first photo is the main one. */
export function ImageUploader({ images, onChange, uploadsEnabled, altText }: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const list = [...files].slice(0, 10 - images.length);
    setBusy(list.length);
    const added: { url: string; alt: string }[] = [];
    for (const file of list) {
      if (file.size > 8 * 1024 * 1024) {
        setError(`${file.name} is bigger than 8 MB. Use a smaller photo.`);
        setBusy((b) => b - 1);
        continue;
      }
      try {
        added.push({ url: await uploadImage(file), alt: altText });
      } catch (err) {
        setError((err as Error).message);
      }
      setBusy((b) => b - 1);
    }
    onChange([...images, ...added]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) return setError('Paste a full image link that starts with https://');
    setError('');
    onChange([...images, { url, alt: altText }]);
    setLink('');
  };

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <li key={`${img.url}-${i}`} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-surface-muted">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-pill bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">Main</span>}
              <span className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange([img, ...images.filter((_, j) => j !== i)])}
                    className="rounded-pill bg-white/95 p-1.5 shadow-card hover:text-brand"
                    aria-label="Make this the main photo"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  className="rounded-pill bg-white/95 p-1.5 shadow-card hover:text-sale"
                  aria-label="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {uploadsEnabled ? (
          <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" id="photo-input" onChange={(e) => addFiles(e.target.files)} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} loading={busy > 0} disabled={images.length >= 10}>
              <ImagePlus className="h-4 w-4" aria-hidden />
              {busy > 0 ? `Uploading ${busy}…` : 'Upload photos'}
            </Button>
          </>
        ) : (
          <p className="text-xs text-ink-muted">Photo upload turns on when the Cloudinary keys are in the server’s .env. Until then, paste image links.</p>
        )}
      </div>
      <div className="flex gap-2">
        <label htmlFor="photo-link" className="sr-only">
          Image link
        </label>
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input
            id="photo-link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
            placeholder="Or paste an image link (https://…)"
            className="h-11 w-full rounded-md border border-line pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </div>
        <Button type="button" variant="outline" onClick={addLink} disabled={!link.trim() || images.length >= 10}>
          Add
        </Button>
      </div>
    </div>
  );
}

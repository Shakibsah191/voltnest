import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useAdminMe, useAdminProduct, useIsOwner, useSaveProduct } from '@/features/admin/hooks';
import { AdminPageHeader, Panel } from '@/features/admin/components/AdminPageHeader';
import { ImageUploader } from '@/features/admin/components/ImageUploader';
import { StockEditor } from '@/features/admin/components/StockEditor';
import { VariantEditor, emptyVariant } from '@/features/admin/components/VariantEditor';
import type { ProductForm } from '@/features/admin/types';
import { useCategories } from '@/features/products/hooks';
import { ApiError } from '@/shared/api-client';
import { Alert } from '@/shared/ui/Alert';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { TextAreaField, TextField } from '@/shared/ui/TextField';
import { cn } from '@/shared/lib/utils';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle';

const EMPTY: ProductForm = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  categoryIds: [],
  images: [],
  highlights: [],
  specs: [],
  tags: [],
  status: 'active',
  isFeatured: false,
  variants: [emptyVariant()],
};

/** Form values → what the API expects (numbers as numbers, empty values left out). */
function toBody(f: ProductForm, highlights: string, specs: string, tags: string) {
  const n = (v: number | '' | null | undefined) => (v === '' || v === null || v === undefined ? undefined : Number(v));
  return {
    ...f,
    highlights: highlights.split('\n').map((s) => s.trim()).filter(Boolean),
    specs: specs
      .split('\n')
      .map((line) => line.split(':'))
      .filter((p) => p.length >= 2 && p[0]!.trim() && p.slice(1).join(':').trim())
      .map((p) => ({ label: p[0]!.trim(), value: p.slice(1).join(':').trim() })),
    tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
    variants: f.variants.map((v) => ({
      ...v,
      price: n(v.price),
      compareAtPrice: n(v.compareAtPrice),
      costPrice: n(v.costPrice),
      stock: n(v.stock),
      options: Object.fromEntries(Object.entries(v.options).filter(([, x]) => x !== '' && x !== undefined)),
    })),
  };
}

function StaffStockView({ id }: { id: string }) {
  const { data, isPending } = useAdminProduct(id);
  useDocumentTitle(data ? data.name : 'Product');
  if (isPending || !data) return <Skeleton className="h-64 rounded-card" />;
  return (
    <>
      <Breadcrumbs items={[{ label: 'Products', to: '/admin/products' }, { label: data.name }]} />
      <div className="mt-3">
        <AdminPageHeader title={data.name} subtitle="You can update stock. Prices and details are changed by the owner." />
      </div>
      <div className="max-w-xl">
        <Panel title="Stock">
          <StockEditor productId={id} variants={data.variants.map((v) => ({ sku: v.sku, name: v.name, stock: Number(v.stock) }))} />
        </Panel>
      </div>
    </>
  );
}

export function AdminProductPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const isOwner = useIsOwner();
  if (!isOwner && !isNew && id) return <StaffStockView id={id} />;
  if (!isOwner) return <p className="py-16 text-center text-ink-muted">Only the owner can add products.</p>;
  return <OwnerProductForm id={isNew ? undefined : id} />;
}

function OwnerProductForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const { data: existing, isPending } = useAdminProduct(id);
  const { data: me } = useAdminMe();
  const { data: categories = [] } = useCategories();
  const save = useSaveProduct(id);
  useDocumentTitle(id ? (existing?.name ?? 'Edit product') : 'Add product');

  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [highlights, setHighlights] = useState('');
  const [specs, setSpecs] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setForm({ ...EMPTY, ...existing, variants: existing.variants.map((v) => ({ ...v, compareAtPrice: v.compareAtPrice ?? '' })) });
    setHighlights(existing.highlights.join('\n'));
    setSpecs(existing.specs.map((s) => `${s.label}: ${s.value}`).join('\n'));
    setTags(existing.tags.join(', '));
  }, [existing]);

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  if (id && isPending) return <Skeleton className="h-96 rounded-card" />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = 'Enter a product name';
    if (!form.categoryIds.length) found.categoryIds = 'Pick at least one category';
    setErrors(found);
    if (Object.keys(found).length) return window.scrollTo({ top: 0, behavior: 'smooth' });

    save.mutate(toBody(form, highlights, specs, tags), {
      onSuccess: (r) => {
        setSaved(true);
        setErrors({});
        if (!id) navigate(`/admin/products/${r.id}`, { replace: true });
      },
      onError: (err) => {
        if (err instanceof ApiError) setErrors(err.fieldErrors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  const fieldErrorCount = Object.keys(errors).length;

  return (
    <form noValidate onSubmit={submit}>
      <Breadcrumbs items={[{ label: 'Products', to: '/admin/products' }, { label: id ? form.name || 'Edit' : 'Add product' }]} />
      <div className="mt-3">
        <AdminPageHeader
          title={id ? form.name || 'Edit product' : 'Add product'}
          actions={
            id &&
            existing?.slug &&
            form.status === 'active' && (
              <Link to={`/products/${existing.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                See it in the shop
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            )
          }
        />
      </div>

      <div className="mb-5 space-y-3">
        {save.isError && <Alert tone="error">{fieldErrorCount ? `Fix the ${fieldErrorCount === 1 ? 'field' : `${fieldErrorCount} fields`} marked in red.` : save.error.message}</Alert>}
        {saved && <Alert tone="success">Saved. The shop shows the changes now.</Alert>}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="space-y-4">
              <TextField id="p-name" label="Product name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
              <TextField
                id="p-slug"
                label="Link name"
                optional
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                error={errors.slug}
                hint="The end of the product’s web address. Leave empty to make one from the name."
              />
              <TextField id="p-short" label="Short description" maxLength={300} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} error={errors.shortDescription} hint="One line under the name." />
              <TextAreaField id="p-desc" label="Full description" optional maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} className="min-h-[8rem]" />
            </div>
          </Panel>

          <Panel title="Photos">
            <ImageUploader images={form.images} onChange={(v) => set('images', v)} uploadsEnabled={Boolean(me?.uploadsEnabled)} altText={form.name} />
          </Panel>

          <Panel title="Variants, prices and stock">
            <VariantEditor variants={form.variants} onChange={(v) => set('variants', v)} errors={errors} />
            {errors.variants && <p className="mt-2 text-sm text-sale">{errors.variants}</p>}
          </Panel>

          <Panel title="Details">
            <div className="space-y-4">
              <TextAreaField id="p-highlights" label="Highlights" optional hint="One per line, up to 8. Shown as ticks on the product page." value={highlights} onChange={(e) => (setHighlights(e.target.value), setSaved(false))} />
              <TextAreaField id="p-specs" label="Specifications" optional hint="One per line, as Label: Value. For example, Output: 65W max" value={specs} onChange={(e) => (setSpecs(e.target.value), setSaved(false))} />
              <TextField id="p-tags" label="Search words" optional hint="Separate with commas: gan, laptop, fast charging" value={tags} onChange={(e) => (setTags(e.target.value), setSaved(false))} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20">
          <Panel title="Visibility">
            <fieldset className="space-y-2">
              <legend className="sr-only">Status</legend>
              {(
                [
                  ['active', 'On sale', 'Shown in the shop'],
                  ['draft', 'Draft', 'Hidden while you work on it'],
                  ['archived', 'Hidden', 'Taken off the shop; old orders keep it'],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className={cn('flex cursor-pointer items-start gap-3 rounded-md border p-3', form.status === value ? 'border-brand bg-brand-50/60' : 'border-line')}>
                  <input type="radio" name="status" value={value} checked={form.status === value} onChange={() => set('status', value)} className="mt-1 h-4 w-4 accent-brand" />
                  <span className="text-sm">
                    <span className="block font-medium">{label}</span>
                    <span className="text-ink-muted">{hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-brand" />
              Feature on the home page
            </label>
          </Panel>

          <Panel title="Categories">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = form.categoryIds.includes(c._id);
                return (
                  <button
                    type="button"
                    key={c._id}
                    aria-pressed={on}
                    onClick={() => set('categoryIds', on ? form.categoryIds.filter((x) => x !== c._id) : [...form.categoryIds, c._id])}
                    className={cn('rounded-pill border px-3 py-1.5 text-sm', on ? 'border-brand bg-brand text-white' : 'border-line hover:border-ink-subtle')}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
            {errors.categoryIds && <p className="mt-2 text-sm text-sale">{errors.categoryIds}</p>}
          </Panel>

          <Button type="submit" size="lg" fullWidth loading={save.isPending}>
            {id ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </form>
  );
}

import { useState, type FormEvent } from 'react';
import { ApiError } from '@/shared/api-client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextAreaField, TextField } from '@/shared/ui/TextField';
import { useCreateReview } from '../hooks';
import { StarInput } from './Stars';

interface ReviewFormProps {
  orderNumber: string;
  productId: string;
  productSlug: string | null;
  productName: string;
  onCancel: () => void;
}

export function ReviewForm({ orderNumber, productId, productSlug, productName, onCancel }: ReviewFormProps) {
  const create = useCreateReview(productSlug);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const id = productId.slice(-6);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setErrors({ rating: 'Choose a star rating' });
    setErrors({});
    create.mutate(
      { orderNumber, productId, rating, title: title.trim(), body: body.trim() },
      { onError: (err) => err instanceof ApiError && setErrors(err.fieldErrors) },
    );
  };

  const banner = create.isError && !(create.error instanceof ApiError && Object.keys(create.error.fieldErrors).length);

  return (
    <form noValidate onSubmit={submit} className="mt-3 space-y-4 rounded-card border border-line bg-surface-muted p-4">
      <p className="text-sm font-medium">Review {productName}</p>
      {banner && <Alert tone="error">{create.error.message}</Alert>}
      <StarInput value={rating} onChange={setRating} error={errors.rating} />
      <TextField id={`rv-title-${id}`} label="Title" optional maxLength={120} placeholder="Sum it up in a few words" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
      <TextAreaField
        id={`rv-body-${id}`}
        label="Your review"
        optional
        maxLength={2000}
        placeholder="How is it working for you?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        error={errors.body}
      />
      <div className="flex gap-3">
        <Button type="submit" loading={create.isPending}>
          {create.isPending ? 'Posting…' : 'Post review'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={create.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

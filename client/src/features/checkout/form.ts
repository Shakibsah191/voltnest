import { isValidBdPhone, isValidEmail, normalizeBdPhone } from '@/shared/lib/validation';
import type { PlaceOrderInput } from './types';

export interface CheckoutFields {
  name: string;
  phone: string;
  email: string;
  line1: string;
  area: string;
  city: string;
  postcode: string;
  zone: string;
  note: string;
  saveAddress: boolean;
}

export type FieldName = Exclude<keyof CheckoutFields, 'saveAddress'>;
export type FieldErrors = Partial<Record<FieldName, string>>;

export const EMPTY_FIELDS: CheckoutFields = {
  name: '',
  phone: '',
  email: '',
  line1: '',
  area: '',
  city: '',
  postcode: '',
  zone: '',
  note: '',
  saveAddress: true,
};

/** Top-to-bottom order of the form, so we can focus the first field with a problem. */
export const FIELD_ORDER: FieldName[] = ['name', 'phone', 'email', 'line1', 'area', 'city', 'postcode', 'zone', 'note'];

/** Where each field sits in the API body; the server reports errors with these paths. */
const SERVER_PATH: Record<FieldName, string> = {
  name: 'contact.name',
  phone: 'contact.phone',
  email: 'contact.email',
  line1: 'shippingAddress.line1',
  area: 'shippingAddress.area',
  city: 'shippingAddress.city',
  postcode: 'shippingAddress.postcode',
  zone: 'shippingAddress.zone',
  note: 'note',
};

export function validateCheckout(f: CheckoutFields, zoneIds: string[]): FieldErrors {
  const e: FieldErrors = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name';
  if (!isValidBdPhone(f.phone)) e.phone = 'Enter a valid Bangladeshi mobile number, like 01712345678';
  if (!isValidEmail(f.email)) e.email = 'Enter a valid email address';
  if (f.line1.trim().length < 5) e.line1 = 'Enter your house, road and area';
  if (f.city.trim().length < 2) e.city = 'Enter your city or district';
  if (f.postcode.trim() && !/^\d{4}$/.test(f.postcode.trim())) e.postcode = 'Postcode is 4 digits, or leave it empty';
  if (!zoneIds.includes(f.zone)) e.zone = 'Choose your delivery area';
  if (f.note.length > 500) e.note = 'Keep the note under 500 characters';
  return e;
}

export function fromServerErrors(details: Record<string, string>): FieldErrors {
  const e: FieldErrors = {};
  for (const name of FIELD_ORDER) if (details[SERVER_PATH[name]]) e[name] = details[SERVER_PATH[name]];
  return e;
}

export function toPayload(f: CheckoutFields): PlaceOrderInput {
  return {
    contact: { name: f.name.trim(), email: f.email.trim(), phone: normalizeBdPhone(f.phone) },
    shippingAddress: {
      line1: f.line1.trim(),
      area: f.area.trim(),
      city: f.city.trim(),
      postcode: f.postcode.trim(),
      zone: f.zone,
    },
    paymentMethod: 'cod',
    note: f.note.trim(),
    saveAddress: f.saveAddress,
  };
}

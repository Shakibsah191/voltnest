import { Schema, model, type InferSchemaType } from 'mongoose';

export const USER_ROLES = ['customer', 'admin'] as const;
export const DELIVERY_ZONES = ['inside_dhaka', 'outside_dhaka'] as const;

const addressSchema = new Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    postcode: { type: String, trim: true },
    zone: { type: String, enum: DELIVERY_ZONES, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    // never returned unless a query asks for it with .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'customer' },
    // bump this to log a user out everywhere (refresh tokens carry it)
    tokenVersion: { type: Number, default: 0 },
    addresses: { type: [addressSchema], default: [] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model('User', userSchema);

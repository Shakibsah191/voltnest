export interface SavedAddress {
  line1: string;
  area: string;
  city: string;
  postcode: string;
  zone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'staff' | 'admin';
  defaultAddress: SavedAddress | null;
}

export interface SessionData {
  user: User;
  accessToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  phone?: string;
}

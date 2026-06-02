export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  STUDIO = 'STUDIO',
  HOSTEL = 'HOSTEL',
  OFFICE = 'OFFICE',
  SHOP = 'SHOP',
  TOWNHOUSE = 'TOWNHOUSE',
  VILLA = 'VILLA',
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
  RENTED = 'RENTED',
}

export type ApiMeta = { page: number; limit: number; total: number; totalPages: number };

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verified: boolean;
  verificationBadge: boolean;
};

export type Property = {
  id: string;
  title: string;
  description: string;
  price: number | string;
  currency: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  district?: string | null;
  status: PropertyStatus;
  images: { id?: string; url: string; alt?: string | null }[];
  amenities: { id?: string; name: string; icon?: string | null }[];
  landlord?: Partial<User> & { phone?: string | null };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: ApiMeta;
};

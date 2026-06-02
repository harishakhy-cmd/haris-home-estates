const fs = require('fs');
const path = require('path');

// Create directory structure
const dirs = [
  'backend',
  'frontend', 
  'shared/types'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`Created: ${fullPath}`);
});

// File contents
const files = {
  'shared/types/user.ts': `export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}`,

  'shared/types/property.ts': `export enum PropertyType {
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
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  COMING_SOON = 'COMING_SOON',
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  availabilityStatus: AvailabilityStatus;
  status: PropertyStatus;
  landlordId: string;
  images: PropertyImage[];
  amenities: Amenity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  thumbnail: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

export interface CreatePropertyDto {
  title: string;
  description: string;
  price: number;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  amenityIds?: string[];
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  availabilityStatus?: AvailabilityStatus;
  status?: PropertyStatus;
}

export interface PropertyFilterDto {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  city?: string;
  amenities?: string[];
  availabilityStatus?: AvailabilityStatus;
  page?: number;
  limit?: number;
}`,

  'shared/types/booking.ts': `export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Booking {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  viewingDate: Date;
  status: BookingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingDto {
  propertyId: string;
  viewingDate: Date;
  notes?: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  message: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInquiryDto {
  propertyId: string;
  message: string;
}`,

  'shared/types/message.ts': `export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessage?: Message;
  updatedAt: Date;
}

export interface CreateMessageDto {
  recipientId: string;
  content: string;
}`,

  'shared/types/common.ts': `export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationDto;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}`,

  'shared/types/index.ts': `export * from './user';
export * from './property';
export * from './booking';
export * from './message';
export * from './common';`,

  'shared/package.json': `{
  "name": "@haris/shared",
  "version": "1.0.0",
  "description": "Shared types and utilities for HARIS project",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "clean": "rimraf dist"
  },
  "keywords": [
    "haris",
    "shared",
    "types"
  ],
  "author": "HARIS Team",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.3.0",
    "rimraf": "^5.0.5"
  },
  "files": [
    "dist"
  ]
}`,

  'backend/.env.example': `# Application
NODE_ENV=development
PORT=3001
APP_NAME=HARIS Backend

# Database
DATABASE_URL=postgresql://haris_user:haris_password@localhost:5432/haris_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=haris_user
DATABASE_PASSWORD=haris_password
DATABASE_NAME=haris_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@haris.com

# AWS S3 (Optional for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=haris-bucket

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Pagination
DEFAULT_PAGE=1
DEFAULT_LIMIT=20`,

  'frontend/.env.example': `# Application
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=HARIS
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000

# Authentication
NEXT_PUBLIC_AUTH_STORAGE_KEY=haris_auth_token

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Environment
DEBUG=haris:*`
};

// Create files
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log(`Created: ${fullPath}`);
});

console.log('\n✅ All files and directories created successfully!');

import { PrismaClient, PropertyStatus, PropertyType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const adminPasswordHash = await bcrypt.hash('@@Hakim123', 12);
  const [wifi, parking, security, water, furnished] = await Promise.all(
    ['WiFi', 'Parking', '24/7 Security', 'Water Included', 'Furnished'].map((name) =>
      prisma.amenity.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@haris.test' },
    update: {},
    create: {
      email: 'landlord@haris.test',
      passwordHash,
      firstName: 'Amina',
      lastName: 'Kato',
      phone: '+256700000001',
      role: UserRole.LANDLORD,
      verified: true,
      verificationBadge: true,
      landlordApproved: true,
      location: 'Kampala',
    },
  });

  await prisma.user.upsert({
    where: { email: 'tenant@haris.test' },
    update: {},
    create: {
      email: 'tenant@haris.test',
      passwordHash,
      firstName: 'Daniel',
      lastName: 'Okello',
      role: UserRole.TENANT,
      verified: true,
      landlordApproved: true,
    },
  });

  await prisma.user.deleteMany({ where: { email: 'admin@haris.test' } });

  await prisma.user.upsert({
    where: { email: 'harishakhy@gmail.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      verified: true,
      landlordApproved: true,
    },
    create: {
      email: 'harishakhy@gmail.com',
      passwordHash: adminPasswordHash,
      firstName: 'Haris',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      verified: true,
      landlordApproved: true,
    },
  });

  const samples = [
    {
      title: 'Pearl Heights Furnished Apartment',
      slug: 'pearl-heights-furnished-apartment',
      city: 'Kampala',
      district: 'Kololo',
      price: 2400000,
      propertyType: PropertyType.APARTMENT,
      bedrooms: 2,
      bathrooms: 2,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Ntinda Family Townhouse',
      slug: 'ntinda-family-townhouse',
      city: 'Kampala',
      district: 'Ntinda',
      price: 1800000,
      propertyType: PropertyType.TOWNHOUSE,
      bedrooms: 3,
      bathrooms: 2,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Makerere Student Hostel Suite',
      slug: 'makerere-student-hostel-suite',
      city: 'Kampala',
      district: 'Makerere',
      price: 650000,
      propertyType: PropertyType.HOSTEL,
      bedrooms: 1,
      bathrooms: 1,
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  for (const item of samples) {
    await prisma.property.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        title: item.title,
        slug: item.slug,
        city: item.city,
        district: item.district,
        price: item.price,
        propertyType: item.propertyType,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        description: `${item.title} with reliable utilities, secure access, and quick routes to key city services.`,
        address: `${item.district}, ${item.city}`,
        country: 'Uganda',
        status: PropertyStatus.ACTIVE,
        landlordId: landlord.id,
        nearbyFacilities: ['Supermarket', 'Clinic', 'Public transport'],
        amenities: { connect: [wifi, parking, security, water, furnished].map(({ id }) => ({ id })) },
        images: { create: [{ url: item.image, alt: item.title, displayOrder: 0 }] },
        units: { create: [{ name: 'Main unit', rent: item.price, bedrooms: item.bedrooms, bathrooms: item.bathrooms }] },
      },
    });
  }
}

main().finally(async () => prisma.$disconnect());

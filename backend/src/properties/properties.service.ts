import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PropertyStatus, UserRole } from '@prisma/client';
import { paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto, PropertyFilterDto, UpdatePropertyDto } from './dto/property.dto';

const include = { images: true, amenities: true, landlord: { select: { id: true, firstName: true, lastName: true, phone: true, verified: true, verificationBadge: true } }, reviews: true };
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const cleanList = (items?: string[]) => (items ?? []).map((item) => item.trim()).filter(Boolean);

import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService, private readonly chatGateway: ChatGateway) {}

  async findAll(filter: PropertyFilterDto) {
    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.ACTIVE,
      ...(filter.city ? { city: { contains: filter.city, mode: 'insensitive' } } : {}),
      ...(filter.propertyType ? { propertyType: filter.propertyType } : {}),
      ...(filter.landlordId ? { landlordId: filter.landlordId } : {}),
      ...(filter.bedrooms ? { bedrooms: { gte: filter.bedrooms } } : {}),
      ...(filter.bathrooms ? { bathrooms: { gte: filter.bathrooms } } : {}),
      ...(filter.minPrice || filter.maxPrice ? { price: { gte: filter.minPrice, lte: filter.maxPrice } } : {}),
      ...(filter.q ? { OR: [{ title: { contains: filter.q, mode: 'insensitive' } }, { description: { contains: filter.q, mode: 'insensitive' } }, { address: { contains: filter.q, mode: 'insensitive' } }] } : {}),
    };
    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      filter.sortBy === 'price_asc' ? { price: 'asc' } :
      filter.sortBy === 'price_desc' ? { price: 'desc' } :
      filter.sortBy === 'landlord' ? { landlord: { firstName: 'asc' } } :
      { createdAt: 'desc' };
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({ where, include, orderBy, ...paginate(filter.page, filter.limit) }),
      this.prisma.property.count({ where }),
    ]);
    return { data, meta: { total, page: filter.page, limit: filter.limit, totalPages: Math.ceil(total / filter.limit) } };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({ where: { id }, include: { ...include, units: true } });
    if (!property) throw new NotFoundException('Property not found');
    const similar = await this.prisma.property.findMany({
      where: { id: { not: id }, city: property.city, status: PropertyStatus.ACTIVE },
      include: { images: true },
      take: 4,
    });
    return { ...property, similar };
  }

  async create(landlordId: string, dto: CreatePropertyDto) {
    const slug = `${slugify(dto.title)}-${Date.now().toString(36)}`;
    const amenityNames = cleanList(dto.amenityNames);
    const property = await this.prisma.property.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        price: dto.price,
        propertyType: dto.propertyType,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        address: dto.address,
        city: dto.city,
        district: dto.district,
        nearbyFacilities: cleanList(dto.nearbyFacilities),
        youtubeUrls: cleanList(dto.youtubeUrls),
        landlordId,
        status: PropertyStatus.PENDING_REVIEW,
        amenities: dto.amenityIds?.length || amenityNames.length ? {
          connect: dto.amenityIds?.map((id) => ({ id })) ?? [],
          connectOrCreate: amenityNames.map((name) => ({ where: { name }, create: { name } })),
        } : undefined,
        images: { create: (cleanList(dto.imageUrls).length ? cleanList(dto.imageUrls) : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80']).map((url, displayOrder) => ({ url, displayOrder })) },
      },
      include,
    });
    
    // Broadcast notification to all online users via WebSocket
    this.chatGateway.broadcastPropertyUpload(property);

    return property;
  }

  async update(user: any, id: string, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (user.role !== UserRole.ADMIN && property.landlordId !== user.id) throw new ForbiddenException();
    const { imageUrls, amenityIds, amenityNames, youtubeUrls, nearbyFacilities, ...propertyData } = dto;
    const cleanAmenityNames = cleanList(amenityNames);
    return this.prisma.property.update({
      where: { id },
      data: {
        ...propertyData,
        ...(nearbyFacilities ? { nearbyFacilities: cleanList(nearbyFacilities) } : {}),
        ...(youtubeUrls ? { youtubeUrls: cleanList(youtubeUrls) } : {}),
        ...(amenityIds?.length || cleanAmenityNames.length ? {
          amenities: {
            set: [],
            connect: amenityIds?.map((id) => ({ id })) ?? [],
            connectOrCreate: cleanAmenityNames.map((name) => ({ where: { name }, create: { name } })),
          },
        } : {}),
        ...(imageUrls ? { images: { deleteMany: {}, create: cleanList(imageUrls).map((url, displayOrder) => ({ url, displayOrder })) } } : {}),
      },
      include,
    });
  }

  async remove(user: any, id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (user.role !== UserRole.ADMIN && property.landlordId !== user.id) throw new ForbiddenException();
    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }

  landlordProperties(landlordId: string) {
    return this.prisma.property.findMany({ where: { landlordId }, include, orderBy: { createdAt: 'desc' } });
  }
}

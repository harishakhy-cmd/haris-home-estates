import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: any, dto: CreateInvoiceDto) {
    const recipient = await this.prisma.user.findUnique({ where: { id: dto.recipientId } });
    if (!recipient) throw new NotFoundException('Invoice recipient not found');

    if (user.role === UserRole.LANDLORD && recipient.role !== UserRole.TENANT) {
      throw new ForbiddenException('Landlords can only invoice tenants');
    }
    if (user.role === UserRole.ADMIN && recipient.role !== UserRole.LANDLORD) {
      throw new ForbiddenException('Admins can only invoice landlords');
    }
    if (![UserRole.LANDLORD, UserRole.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only landlords and admins can create invoices');
    }

    const count = await this.prisma.invoice.count();
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNo: `HARIS-INV-${String(count + 1).padStart(6, '0')}`,
        issuerId: user.id,
        recipientId: dto.recipientId,
        propertyId: dto.propertyId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency ?? 'UGX',
        dueDate: dto.dueDate,
      },
      include: { issuer: true, recipient: true, property: { include: { images: true } } },
    });

    if (user.role === UserRole.ADMIN) {
      await this.prisma.adminAction.create({
        data: { actorId: user.id, action: 'INVOICE_LANDLORD_SENT', targetType: 'Invoice', targetId: invoice.id, reason: invoice.title },
      });
    }

    return invoice;
  }

  list(user: any) {
    const where = user.role === UserRole.ADMIN
      ? {}
      : { OR: [{ issuerId: user.id }, { recipientId: user.id }] };
    return this.prisma.invoice.findMany({
      where,
      include: { issuer: true, recipient: true, property: { include: { images: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(user: any, id: string, status: InvoiceStatus) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (user.role !== UserRole.ADMIN && invoice.recipientId !== user.id && invoice.issuerId !== user.id) {
      throw new ForbiddenException();
    }
    return this.prisma.invoice.update({ where: { id }, data: { status }, include: { issuer: true, recipient: true, property: true } });
  }
}

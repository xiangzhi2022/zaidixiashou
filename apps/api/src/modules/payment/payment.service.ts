import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CreatePaymentDto } from './dto/payment.dto.js';
import { PaymentMethod, PaymentStatus, SubscriptionPlan } from '@prisma/client';

const PLAN_PRICES: Record<string, number> = {
  BASIC: 9900,       // ¥99
  PROFESSIONAL: 29900, // ¥299
  ENTERPRISE: 79900,   // ¥799
};

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const amount = PLAN_PRICES[dto.plan];
    if (!amount) throw new BadRequestException('Invalid plan');

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        method: dto.method as PaymentMethod,
        status: PaymentStatus.PENDING,
        metadata: { plan: dto.plan },
      },
    });

    // In production: generate real payment QR code via WeChat/Alipay SDK
    const qrCodeUrl = this.generateMockQrCode(payment.id, dto.method);

    return {
      paymentId: payment.id,
      amount,
      method: dto.method,
      qrCodeUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async checkPaymentStatus(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return { status: payment.status, paidAt: payment.paidAt };
  }

  async handlePaymentCallback(paymentId: string, data: { tradeNo: string }) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== PaymentStatus.PENDING) {
      return { status: payment.status };
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.COMPLETED, paidAt: new Date(), tradeNo: data.tradeNo },
    });

    // Activate subscription
    const metadata = payment.metadata as { plan: string } | null;
    if (metadata?.plan) {
      await this.prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan: metadata.plan as SubscriptionPlan,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { status: PaymentStatus.COMPLETED };
  }

  async listPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  private generateMockQrCode(paymentId: string, method: string): string {
    // In production, call WeChat/Alipay API
    return `https://mock-pay.example.com/qr/${paymentId}?method=${method}`;
  }
}

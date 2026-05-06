import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CreatePaymentDto } from './dto/payment.dto.js';
import { PaymentMethod, PaymentStatus, SubscriptionPlan } from '@prisma/client';
import * as crypto from 'crypto';

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

    const outTradeNo = `PAY${Date.now()}${crypto.randomBytes(4).toString('hex')}`;

    // Find or create active subscription for the user
    let subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: SubscriptionPlan.FREE,
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: new Date('2099-12-31'),
          aiQuotaDaily: 50,
          aiQuotaUsed: 0,
          cdpConcurrency: 1,
          acquisitionLimit: 10,
        },
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        amount,
        method: dto.paymentMethod,
        status: PaymentStatus.PENDING,
        outTradeNo,
      },
    });

    // In production: generate real payment QR code via WeChat/Alipay SDK
    const qrCodeUrl = this.generateMockQrCode(payment.id, dto.paymentMethod);

    return {
      paymentId: payment.id,
      amount,
      method: dto.paymentMethod,
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
      data: { status: PaymentStatus.COMPLETED, paidAt: new Date(), transactionId: data.tradeNo },
    });

    // Activate subscription - upgrade the plan
    await this.prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        plan: SubscriptionPlan.BASIC,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

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

import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './dto/payment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post()
  createPayment(@Req() req: { user: { id: string } }, @Body() dto: CreatePaymentDto) {
    return this.service.createPayment(req.user.id, dto);
  }

  @Get(':id/status')
  checkStatus(@Param('id') id: string) {
    return this.service.checkPaymentStatus(id);
  }

  @Post(':id/callback')
  handleCallback(@Param('id') id: string, @Body() data: { tradeNo: string }) {
    return this.service.handlePaymentCallback(id, data);
  }

  @Get()
  listPayments(@Req() req: { user: { id: string } }) {
    return this.service.listPayments(req.user.id);
  }
}

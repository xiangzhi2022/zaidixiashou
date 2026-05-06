import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get('current')
  getCurrent(@Req() req: { user: { id: string } }) {
    return this.service.getCurrentSubscription(req.user.id);
  }

  @Get('plans')
  listPlans() {
    return this.service.listPlans();
  }

  @Get('billing')
  getBillingHistory(@Req() req: { user: { id: string } }) {
    return this.service.getBillingHistory(req.user.id);
  }

  @Get('quota')
  checkQuota(@Req() req: { user: { id: string } }) {
    return this.service.checkQuota(req.user.id, 'ai');
  }
}

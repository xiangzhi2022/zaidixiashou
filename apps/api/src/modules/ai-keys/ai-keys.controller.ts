import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AiKeysService } from './ai-keys.service.js';
import { CreateAiKeyDto, UpdateAiKeyDto, UpdateAiConfigDto } from './dto/ai-keys.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('ai-keys')
export class AiKeysController {
  constructor(private readonly service: AiKeysService) {}

  @Get()
  listKeys(@Req() req: { user: { id: string } }) {
    return this.service.listKeys(req.user.id);
  }

  @Post()
  createKey(@Req() req: { user: { id: string } }, @Body() dto: CreateAiKeyDto) {
    return this.service.createKey(req.user.id, dto);
  }

  @Put(':id')
  updateKey(@Req() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: UpdateAiKeyDto) {
    return this.service.updateKey(req.user.id, id, dto);
  }

  @Delete(':id')
  deleteKey(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.service.deleteKey(req.user.id, id);
  }

  @Post(':id/set-default')
  setDefaultKey(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.service.setDefaultKey(req.user.id, id);
  }

  @Post(':id/test')
  testKey(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.service.testKey(req.user.id, id);
  }

  @Get('config')
  getConfig(@Req() req: { user: { id: string } }) {
    return this.service.getConfig(req.user.id);
  }

  @Put('config')
  updateConfig(@Req() req: { user: { id: string } }, @Body() dto: UpdateAiConfigDto) {
    return this.service.updateConfig(req.user.id, dto);
  }
}

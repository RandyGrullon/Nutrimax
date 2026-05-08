import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list() {
    return this.clients.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.clients.getById(id);
  }

  @Get(':id/timeline')
  timeline(@Param('id') id: string) {
    return this.clients.getTimeline(id);
  }

  @Post('preview-metrics')
  preview(@Body() body: unknown) {
    return this.clients.previewMetrics(body);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.clients.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.clients.update(id, body);
  }
}

import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DietsService } from './diets.service';

@Controller('diets')
@UseGuards(AuthGuard)
export class DietsController {
  constructor(private readonly diets: DietsService) {}

  @Get()
  list() {
    return this.diets.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.diets.getById(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.diets.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.diets.update(id, body);
  }
}

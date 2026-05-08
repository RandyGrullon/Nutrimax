import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
@UseGuards(AuthGuard)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Post()
  assign(
    @Body()
    body: {
      client_id: string;
      diet_id: string;
      notes?: string;
      customization?: unknown;
      starts_on?: string;
    },
  ) {
    if (!body.client_id || !body.diet_id) {
      throw new BadRequestException('client_id and diet_id required');
    }
    return this.assignments.assign(body);
  }

  @Get('client/:clientId')
  listForClient(@Param('clientId') clientId: string) {
    return this.assignments.listForClient(clientId);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.assignments.archive(id);
  }
}

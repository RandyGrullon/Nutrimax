import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { DietsModule } from './diets/diets.module';
import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ClientsModule,
    DietsModule,
    AssignmentsModule,
  ],
})
export class AppModule {}

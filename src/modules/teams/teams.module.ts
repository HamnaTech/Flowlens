import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController, InvitesController } from './teams.controller';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [TeamsController, InvitesController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}

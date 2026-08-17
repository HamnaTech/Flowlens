import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FrustrationLogsService } from './frustration-logs.service';
import { LogAttachmentsService } from './log-attachments.service';
import { CreateFrustrationLogDto } from './dto/create-frustration-log.dto';
import { UpdateFrustrationLogDto } from './dto/update-frustration-log.dto';
import { ListFrustrationLogsQueryDto } from './dto/list-frustration-logs-query.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Frustration Logs')
@ApiBearerAuth()
@Controller({ path: 'frustration-logs', version: '1' })
export class FrustrationLogsController {
  constructor(
    private readonly logsService: FrustrationLogsService,
    private readonly attachmentsService: LogAttachmentsService,
  ) {}

  @ApiOperation({
    summary: 'Log a new frustration',
    description:
      'Saves the log and returns immediately with a preliminary Friction Score. ' +
      'Full AI analysis (category suggestion, AI tags, final score) runs asynchronously ' +
      'and updates the record within a few seconds.',
  })
  @ApiResponse({ status: 201, description: 'Log created; AI analysis queued.' })
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFrustrationLogDto) {
    return this.logsService.create(user.id, dto);
  }

  @ApiOperation({ summary: "List the caller's own logs with filtering, search, and sorting." })
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListFrustrationLogsQueryDto) {
    return this.logsService.listForUser(user.id, query);
  }

  @ApiOperation({ summary: 'Autocomplete suggestions for tag input, drawn from all previously used tags.' })
  @Get('meta/tags')
  suggestTags(@Query('search') search = '') {
    return this.logsService.suggestTags(search);
  }

  @ApiOperation({ summary: 'Get a single log. 404s (not 403s) if it belongs to another user.' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.logsService.findOne(user.id, id);
  }

  @ApiOperation({
    summary: 'Update a log. Editing description or frustrationLevel re-triggers AI analysis.',
  })
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateFrustrationLogDto) {
    return this.logsService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a log. Excluded from all reads immediately, retained for historical AI reports.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.logsService.softDelete(user.id, id);
  }

  // ---- Attachments -------------------------------------------

  @ApiOperation({ summary: 'Attach a voice note, screenshot, or screen recording to a log.' })
  @UseInterceptors(FileInterceptor('file'))
  @Post(':id/attachments')
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') logId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachmentsService.upload(user.id, logId, file);
  }

  @ApiOperation({ summary: 'Remove an attachment from a log.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') logId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    await this.attachmentsService.delete(user.id, logId, attachmentId);
  }
}

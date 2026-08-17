import {
  BadRequestException,
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlatformRole } from '@prisma/client';
import { UsersService } from './users.service';
import { StorageService } from '../../storage/storage.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storage: StorageService,
  ) {}

  // --------------------------------------------------------------------
  // Self-service — any authenticated user, scoped to their own record
  // --------------------------------------------------------------------

  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/onboarding-step/:step')
  advanceOnboarding(@CurrentUser() user: AuthenticatedUser, @Param('step') step: string) {
    return this.usersService.advanceOnboarding(user.id, parseInt(step, 10));
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('me/avatar')
  async uploadAvatar(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file was provided. Attach the image under the "file" field.');
    }
    const result = await this.storage.uploadAvatar({
      userId: user.id,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
    return this.usersService.updateProfile(user.id, { avatarUrl: result.publicUrl });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('me')
  async deactivateOwnAccount(@CurrentUser() user: AuthenticatedUser) {
    await this.usersService.deactivateAccount(user.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('me/erase')
  async requestErasure(@CurrentUser() user: AuthenticatedUser) {
    await this.usersService.requestDataErasure(user.id);
  }

  // --------------------------------------------------------------------
  // Admin — PlatformRole.ADMIN only
  // --------------------------------------------------------------------

  @UseGuards(RolesGuard)
  @Roles(PlatformRole.ADMIN)
  @Get()
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  @UseGuards(RolesGuard)
  @Roles(PlatformRole.ADMIN)
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(PlatformRole.ADMIN)
  @Patch(':id/role')
  updateUserRole(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(admin.id, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(PlatformRole.ADMIN)
  @Patch(':id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.usersService.setUserActive(id, false);
  }

  @UseGuards(RolesGuard)
  @Roles(PlatformRole.ADMIN)
  @Patch(':id/reactivate')
  reactivateUser(@Param('id') id: string) {
    return this.usersService.setUserActive(id, true);
  }
}

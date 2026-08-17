import { IsEnum } from 'class-validator';
import { PlatformRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(PlatformRole)
  role: PlatformRole;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlatformRole } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/utils/pagination';

export class ListUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // matches against email / displayName

  @IsOptional()
  @IsEnum(PlatformRole)
  role?: PlatformRole;
}

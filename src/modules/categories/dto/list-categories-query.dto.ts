import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/utils/pagination';

export class ListCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by name (case-insensitive contains).' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;

  /**
   * Default view hides archived categories (isActive=false) since they
   * exist only to keep historical logs correctly labeled, not for active
   * selection. Set true for a management/settings screen that needs to
   * show and potentially reactivate archived categories.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  includeInactive?: boolean = false;

  constructor() {
    super();
    this.pageSize = 50; // categories lists are small; default to a larger page than the general 20
  }
}

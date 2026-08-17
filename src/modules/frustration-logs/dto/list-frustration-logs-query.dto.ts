import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { LogSource } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/utils/pagination';

const SORTABLE_FIELDS = ['occurredAt', 'createdAt', 'frictionScore', 'frustrationLevel'] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];

export class ListFrustrationLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search against the log description.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: LogSource })
  @IsOptional()
  @IsEnum(LogSource)
  source?: LogSource;

  @ApiPropertyOptional({ description: 'Filter by exact tag name.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  minFrustrationLevel?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  maxFrustrationLevel?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minFrictionScore?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxFrictionScore?: number;

  @ApiPropertyOptional({ description: 'ISO 8601 — inclusive lower bound on occurredAt.' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 — inclusive upper bound on occurredAt.' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({ enum: SORTABLE_FIELDS, default: 'occurredAt' })
  @IsOptional()
  @IsIn(SORTABLE_FIELDS)
  sortBy?: SortableField = 'occurredAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  /**
   * Team-view only: when true and the caller is ADMIN/OWNER of the org,
   * restrict results to their own logs instead of the whole team's.
   * Ignored on the personal /frustration-logs endpoint (always own-only).
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  mineOnly?: boolean = false;
}

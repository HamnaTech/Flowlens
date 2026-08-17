import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LogSource } from '@prisma/client';

export class CreateFrustrationLogDto {
  @ApiProperty({ example: 'Standup ran 25 minutes over with no agenda.' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ enum: LogSource, default: LogSource.TEXT })
  @IsOptional()
  @IsEnum(LogSource)
  source?: LogSource = LogSource.TEXT;

  @ApiProperty({ minimum: 1, maximum: 10, example: 7 })
  @IsInt()
  @Min(1)
  @Max(10)
  frustrationLevel: number;

  @ApiPropertyOptional({ minimum: 0, example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440) // a single incident losing more than 24h is almost certainly a data-entry error
  estimatedMinutesLost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /**
   * Present only when logging in a team context. Validated in the service
   * layer against the caller's actual OrganizationMember rows — a user
   * cannot attribute a log to an org they don't belong to.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 timestamp; defaults to now if omitted (supports backfilling past events).' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPubliclyShared?: boolean = false;
}

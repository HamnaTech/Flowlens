import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportPeriod } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateReportDto {
    @ApiProperty({ enum: ReportPeriod })
    @IsEnum(ReportPeriod)
    period: ReportPeriod;

    @ApiPropertyOptional({ description: 'Inclusive lower bound for the report window in ISO 8601 format.' })
    @IsOptional()
    @IsDateString()
    periodStart?: string;

    @ApiPropertyOptional({ description: 'Inclusive upper bound for the report window in ISO 8601 format.' })
    @IsOptional()
    @IsDateString()
    periodEnd?: string;
}
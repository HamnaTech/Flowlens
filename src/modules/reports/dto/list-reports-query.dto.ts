import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportPeriod, ReportStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/utils/pagination';

export class ListReportsQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ enum: ReportPeriod })
    @IsOptional()
    @IsEnum(ReportPeriod)
    period?: ReportPeriod;

    @ApiPropertyOptional({ enum: ReportStatus })
    @IsOptional()
    @IsEnum(ReportStatus)
    status?: ReportStatus;

    constructor() {
        super();
        this.pageSize = 10;
    }
}
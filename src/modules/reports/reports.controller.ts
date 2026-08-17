import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrgRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgRoles } from '../../common/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../../common/guards/org-roles.guard';

@ApiTags('AI Reports')
@ApiBearerAuth()
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @ApiOperation({ summary: "List the caller's personal AI reports." })
    @Get()
    list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListReportsQueryDto) {
        return this.reportsService.listForUser(user.id, query);
    }

    @ApiOperation({ summary: 'Create and queue a new personal AI report.' })
    @Post()
    create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReportDto) {
        return this.reportsService.createForUser(user.id, dto);
    }

    @ApiOperation({ summary: 'Get a single personal AI report.' })
    @Get(':id')
    findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
        return this.reportsService.findOneForUser(user.id, id);
    }
}

@ApiTags('AI Reports - Organization')
@ApiBearerAuth()
@Controller({ path: 'organizations/:organizationId/reports', version: '1' })
@UseGuards(OrgRolesGuard)
export class OrgReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @ApiOperation({ summary: 'List organization-scoped AI reports. Any member may read.' })
    @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER)
    @Get()
    list(@Param('organizationId') organizationId: string, @Query() query: ListReportsQueryDto) {
        return this.reportsService.listForOrganization(organizationId, query);
    }

    @ApiOperation({ summary: 'Create and queue a new organization-scoped AI report.' })
    @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
    @Post()
    create(
        @Param('organizationId') organizationId: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: CreateReportDto,
    ) {
        return this.reportsService.createForOrganization(organizationId, user.id, dto);
    }

    @ApiOperation({ summary: 'Get a single organization-scoped AI report.' })
    @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER)
    @Get(':id')
    findOne(@Param('organizationId') organizationId: string, @Param('id') id: string) {
        return this.reportsService.findOneForOrganization(organizationId, id);
    }
}
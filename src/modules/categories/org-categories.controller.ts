import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrgRole } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { OrgRoles } from '../../common/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../../common/guards/org-roles.guard';

@ApiTags('Categories — Organization')
@ApiBearerAuth()
@Controller({ path: 'organizations/:organizationId/categories', version: '1' })
@UseGuards(OrgRolesGuard)
export class OrgCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a team-shared category. OWNER/ADMIN only.' })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @Post()
  create(@Param('organizationId') organizationId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.createForOrganization(organizationId, dto);
  }

  @ApiOperation({ summary: "List the team's shared categories. Any member may read." })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER)
  @Get()
  list(@Param('organizationId') organizationId: string, @Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.listForOrganization(organizationId, query);
  }

  @ApiOperation({ summary: 'Get a single team category.' })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER)
  @Get(':id')
  findOne(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    return this.categoriesService.findOneForOrganization(organizationId, id);
  }

  @ApiOperation({ summary: 'Update a team category. OWNER/ADMIN only.' })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @Patch(':id')
  update(@Param('organizationId') organizationId: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateForOrganization(organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Archive a team category. OWNER/ADMIN only.' })
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    await this.categoriesService.deleteForOrganization(organizationId, id);
  }
}

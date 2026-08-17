import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { OrgRole } from '@prisma/client';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgRoles } from '../../common/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../../common/guards/org-roles.guard';

class TransferOwnershipDto {
  @IsString()
  newOwnerId: string;
}

@Controller({ path: 'organizations', version: '1' })
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listForUser(user.id);
  }

  @Get(':organizationId')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER) // any member may view
  findOne(@Param('organizationId') organizationId: string) {
    return this.organizationsService.findById(organizationId);
  }

  @Patch(':organizationId')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  update(@Param('organizationId') organizationId: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(organizationId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':organizationId/transfer-ownership')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.OWNER)
  async transferOwnership(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TransferOwnershipDto,
  ) {
    await this.organizationsService.transferOwnership(organizationId, user.id, dto.newOwnerId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':organizationId')
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.OWNER)
  async remove(@Param('organizationId') organizationId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.organizationsService.delete(organizationId, user.id);
  }
}

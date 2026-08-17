import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { buildPaginatedResult, toSkipTake } from '../../common/utils/pagination';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------
  // Personal categories
  // --------------------------------------------------------------------

  async createPersonal(userId: string, dto: CreateCategoryDto) {
    await this.assertNameAvailable(dto.name, { userId });
    return this.prisma.category.create({
      data: { name: dto.name, color: dto.color, icon: dto.icon, userId },
    });
  }

  async listPersonal(userId: string, query: ListCategoriesQueryDto) {
    const where: Prisma.CategoryWhereInput = {
      userId,
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    return this.paginatedQuery(where, query);
  }

  async findOnePersonal(userId: string, categoryId: string) {
    const category = await this.findByIdOrThrow(categoryId);
    if (category.userId !== userId) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  async updatePersonal(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.findOnePersonal(userId, categoryId);
    this.assertMutable(category);
    if (dto.name && dto.name !== category.name) {
      await this.assertNameAvailable(dto.name, { userId }, categoryId);
    }
    return this.prisma.category.update({ where: { id: categoryId }, data: dto });
  }

  async deletePersonal(userId: string, categoryId: string): Promise<void> {
    const category = await this.findOnePersonal(userId, categoryId);
    this.assertMutable(category);
    await this.prisma.category.update({ where: { id: categoryId }, data: { isActive: false } });
  }

  // --------------------------------------------------------------------
  // Organization categories (RBAC enforced at controller via OrgRolesGuard;
  // this layer trusts organizationId has already been validated as the
  // caller's org and only applies category-specific rules)
  // --------------------------------------------------------------------

  async createForOrganization(organizationId: string, dto: CreateCategoryDto) {
    await this.assertNameAvailable(dto.name, { organizationId });
    return this.prisma.category.create({
      data: { name: dto.name, color: dto.color, icon: dto.icon, organizationId },
    });
  }

  async listForOrganization(organizationId: string, query: ListCategoriesQueryDto) {
    const where: Prisma.CategoryWhereInput = {
      organizationId,
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    return this.paginatedQuery(where, query);
  }

  async findOneForOrganization(organizationId: string, categoryId: string) {
    const category = await this.findByIdOrThrow(categoryId);
    if (category.organizationId !== organizationId) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  async updateForOrganization(organizationId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.findOneForOrganization(organizationId, categoryId);
    this.assertMutable(category);
    if (dto.name && dto.name !== category.name) {
      await this.assertNameAvailable(dto.name, { organizationId }, categoryId);
    }
    return this.prisma.category.update({ where: { id: categoryId }, data: dto });
  }

  async deleteForOrganization(organizationId: string, categoryId: string): Promise<void> {
    const category = await this.findOneForOrganization(organizationId, categoryId);
    this.assertMutable(category);
    await this.prisma.category.update({ where: { id: categoryId }, data: { isActive: false } });
  }

  // --------------------------------------------------------------------
  // Shared helpers
  // --------------------------------------------------------------------

  private async paginatedQuery(where: Prisma.CategoryWhereInput, query: ListCategoriesQueryDto) {
    const { skip, take } = toSkipTake(query.page, query.pageSize);
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }], // system defaults surface first, then alphabetical
        include: { _count: { select: { frustrationLogs: true } } },
      }),
      this.prisma.category.count({ where }),
    ]);
    return buildPaginatedResult(items, totalItems, query.page, query.pageSize);
  }

  private async findByIdOrThrow(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found.');
    return category;
  }

  /** System-seeded categories are immutable and permanent — matches the schema's own comment on isSystem. */
  private assertMutable(category: { isSystem: boolean }): void {
    if (category.isSystem) {
      throw new ForbiddenException('Default system categories cannot be edited or removed.');
    }
  }

  /**
   * App-layer uniqueness check (no DB unique constraint — nullable-FK
   * partial uniqueness across personal/org scopes doesn't express cleanly
   * in Postgres, and this table is small/low-write enough that a
   * check-then-write race is an acceptable trade-off over a schema change).
   */
  private async assertNameAvailable(
    name: string,
    scope: { userId?: string; organizationId?: string },
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.category.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        isActive: true,
        ...(scope.userId ? { userId: scope.userId } : {}),
        ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(`A category named "${name}" already exists.`);
    }
  }
}

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a personal category.' })
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.createPersonal(user.id, dto);
  }

  @ApiOperation({ summary: "List the caller's personal categories." })
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.listPersonal(user.id, query);
  }

  @ApiOperation({ summary: 'Get a single personal category.' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.categoriesService.findOnePersonal(user.id, id);
  }

  @ApiOperation({ summary: 'Rename or restyle a personal category. System defaults cannot be edited.' })
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updatePersonal(user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Archive a category (soft-delete). Historical logs keep showing it; it disappears from new-log selection.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.categoriesService.deletePersonal(user.id, id);
  }
}

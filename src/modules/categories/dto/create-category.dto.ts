import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Client escalations' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: '#D14A2D', default: '#D14A2D' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ description: 'Icon identifier for the frontend icon set, e.g. "alert-triangle".' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}

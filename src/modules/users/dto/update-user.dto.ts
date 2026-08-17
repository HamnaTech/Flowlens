import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  /**
   * IANA timezone string, e.g. "America/New_York". Validated as a
   * non-empty string here; format correctness (existence in the IANA DB)
   * is verified in the service layer via `Intl.supportedValuesOf('timeZone')`
   * rather than an enum, so this DTO doesn't need to ship/maintain a
   * duplicate timezone list that drifts from the platform's own data.
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

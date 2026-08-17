import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { VERSION_NEUTRAL } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({ summary: 'Application health check for load balancers / container orchestrators.' })
  @ApiResponse({ status: 200, description: 'All components healthy or degraded (non-fatal).' })
  @ApiResponse({ status: 503, description: 'One or more critical components are down.' })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    const report = await this.healthService.check();

    // Docker/k8s health checks key off the HTTP status code, not just the
    // body — a 200 with status:"down" in the JSON would be misread as
    // healthy by most orchestrators. "degraded" still returns 200 since
    // the app is usable, just not at full capacity.
    if (report.status === 'down') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return report;
  }
}

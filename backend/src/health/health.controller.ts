import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check if API is running' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is running',
    };
  }
}

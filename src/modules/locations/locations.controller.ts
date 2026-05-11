import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

@ApiTags('Locations (Nicaragua)')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('departments')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener la lista de departamentos' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User Token inválido' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  getDepartments() {
    return this.locationsService.getDepartments();
  }

  @Get('departments/:id/municipalities')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener los municipios de un departamento' })
  @ApiResponse({ status: 200, description: 'Lista de municipios' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User Token inválido' })
  @ApiResponse({ status: 404, description: 'Not Found - Departamento no encontrado' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  getMunicipalities(@Param('id') id: string) {
    return this.locationsService.getMunicipalities(id);
  }
}

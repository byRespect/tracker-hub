import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Post()
  async create(@Body() createSessionDto: CreateSessionDto) {
    return await this.sessionsService.create(createSessionDto);
  }

  @Get('stats')
  async getGlobalStats() {
    return await this.sessionsService.getGlobalStats();
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    return await this.sessionsService.findAllSummaries(pageNum, limitNum);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('consoleLogsPage') consoleLogsPage: number = 1,
    @Query('consoleLogsLimit') consoleLogsLimit: number = 20,
    @Query('networkLogsPage') networkLogsPage: number = 1,
    @Query('networkLogsLimit') networkLogsLimit: number = 20,
    @Query('domEventsPage') domEventsPage: number = 1,
    @Query('domEventsLimit') domEventsLimit: number = 20,
    @Query('consoleLogsSearch') consoleLogsSearch?: string,
    @Query('networkLogsSearch') networkLogsSearch?: string,
    @Query('domEventsSearch') domEventsSearch?: string,
  ) {
    return await this.sessionsService.findOne(
      id,
      Number(consoleLogsPage) || 1,
      Number(consoleLogsLimit) || 20,
      Number(networkLogsPage) || 1,
      Number(networkLogsLimit) || 20,
      Number(domEventsPage) || 1,
      Number(domEventsLimit) || 20,
      consoleLogsSearch,
      networkLogsSearch,
      domEventsSearch,
    );
  }

  @Get(':id/rrweb-events')
  async getRrwebEvents(
    @Param('id') id: string
  ) {
    return await this.sessionsService.getRrwebEvents(id);
  }

  @Get(':id/console-logs')
  async getConsoleLogs(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return await this.sessionsService.getPaginatedConsoleLogs(id, Number(page) || 1, Number(limit) || 20, search);
  }

  @Get(':id/network-logs')
  async getNetworkLogs(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return await this.sessionsService.getPaginatedNetworkLogs(id, Number(page) || 1, Number(limit) || 20, search);
  }

  @Get(':sessionId/network-logs/:networkLogId/details')
  async getNetworkLogDetails(
    @Param('sessionId') sessionId: string,
    @Param('networkLogId') networkLogId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.sessionsService.getNetworkLogDetailsById(
      sessionId,
      networkLogId,
      Number(page) || 1,
      Number(limit) || 20
    );
  }

  @Get(':id/dom-events')
  async getDomEvents(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return await this.sessionsService.getPaginatedDomEvents(id, Number(page) || 1, Number(limit) || 20, search);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return await this.sessionsService.update(id, updateSessionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.sessionsService.remove(id);
  }
}
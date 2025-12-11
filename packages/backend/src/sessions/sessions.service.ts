import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Session, SessionDocument } from './schemas/session.schema';

type ConsoleLog = { level?: string; type?: string; method?: string } & Record<string, any>;
type NetworkLog = { id?: string; ok?: boolean; status?: number } & Record<string, any>;
type DomEvent = Record<string, any>;
type SessionLean = Session & {
  _id?: string;
  consoleLogs?: ConsoleLog[];
  networkLogs?: NetworkLog[];
  domEvents?: DomEvent[];
  rrwebEvents?: Record<string, any>[];
  user?: Record<string, any>;
  url?: string;
  userAgent?: string;
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) { }

  /**
   * Tüm session'ların global istatistiklerini ve trend verilerini döndürür
   */
  async getGlobalStats(): Promise<{
    totalSessions: number;
    totalRequests: number;
    totalLogs: number;
    totalErrors: number;
    trends: {
      requests: { percent: string; isUp: boolean };
      logs: { percent: string; isUp: boolean };
      errors: { percent: string; isUp: boolean };
    };
    weeklyTraffic: number[];
  }> {
    // Session'ları timestamp'e göre sıralı getir
    const sessions: SessionLean[] = await this.sessionModel
      .find({}, { consoleLogs: 1, networkLogs: 1, timestamp: 1 })
      .sort({ timestamp: 1 })
      .lean<SessionLean[]>()
      .exec();

    // Her session için metrikleri hesapla
    const sessionMetrics: Array<{
      requests: number;
      logs: number;
      errors: number;
    }> = [];

    let totalRequests = 0;
    let totalLogs = 0;
    let totalErrors = 0;

    for (const session of sessions) {
      // Network logs - deduplicate by id
      let networkLogs: NetworkLog[] = Array.isArray(session.networkLogs)
        ? (session.networkLogs as NetworkLog[])
        : [];
      const seenNetworkIds = new Set<string>();
      networkLogs = networkLogs.filter((log: NetworkLog) => {
        if (log.id && seenNetworkIds.has(log.id)) return false;
        if (log.id) seenNetworkIds.add(log.id);
        return true;
      });

      const requests = networkLogs.length;
      totalRequests += requests;

      // Console logs
      const consoleLogs: ConsoleLog[] = Array.isArray(session.consoleLogs)
        ? (session.consoleLogs as ConsoleLog[])
        : [];
      const logs = consoleLogs.length;
      totalLogs += logs;

      // Errors from console
      let errors = consoleLogs.filter(
        (log: ConsoleLog) =>
          (log.level && log.level.toLowerCase() === 'error') ||
          (log.type && log.type.toLowerCase() === 'error') ||
          (log.method && log.method.toLowerCase() === 'error')
      ).length;

      // Errors from network
      errors += networkLogs.filter(
        (log: NetworkLog) => log.ok === false || (log.status && log.status >= 400)
      ).length;
      totalErrors += errors;

      sessionMetrics.push({ requests, logs, errors });
    }

    const totalSessions = sessions.length;

    // Trend hesaplama: İlk yarı vs son yarı karşılaştırması
    const calcTrend = (getValue: (m: typeof sessionMetrics[0]) => number): { percent: string; isUp: boolean } => {
      if (sessionMetrics.length < 2) {
        return { percent: '0%', isUp: true };
      }

      const half = Math.floor(sessionMetrics.length / 2);
      const firstHalf = sessionMetrics.slice(0, half || 1);
      const secondHalf = sessionMetrics.slice(half || 1);

      const firstSum = firstHalf.reduce((acc, m) => acc + getValue(m), 0);
      const secondSum = secondHalf.reduce((acc, m) => acc + getValue(m), 0);

      if (firstSum === 0 && secondSum === 0) return { percent: '0%', isUp: true };
      if (firstSum === 0) return { percent: '+100%', isUp: true };

      const change = ((secondSum - firstSum) / firstSum) * 100;
      const sign = change >= 0 ? '+' : '';
      return {
        percent: `${sign}${change.toFixed(1)}%`,
        isUp: change >= 0,
      };
    };

    // Son 7 günlük network traffic verisi hesapla
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Günlük network request toplamları
    const dailyTraffic: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      // O güne ait session'ların network request toplamı
      let dayTotal = 0;
      for (const session of sessions) {
        const sessionDate = new Date(session.timestamp as unknown as string);
        if (sessionDate >= dayStart && sessionDate <= dayEnd) {
          // Bu session o güne ait, network loglarını say
          let networkLogs: NetworkLog[] = Array.isArray(session.networkLogs)
            ? (session.networkLogs as NetworkLog[])
            : [];
          const seenIds = new Set<string>();
          networkLogs = networkLogs.filter((log: NetworkLog) => {
            if (log.id && seenIds.has(log.id)) return false;
            if (log.id) seenIds.add(log.id);
            return true;
          });
          dayTotal += networkLogs.length;
        }
      }
      dailyTraffic.push(dayTotal);
    }

    return {
      totalSessions,
      totalRequests,
      totalLogs,
      totalErrors,
      trends: {
        requests: calcTrend(m => m.requests),
        logs: calcTrend(m => m.logs),
        errors: calcTrend(m => m.errors),
      },
      weeklyTraffic: dailyTraffic,
    };
  }

  async create(createSessionDto: CreateSessionDto): Promise<Session> {
    const createdSession = new this.sessionModel(createSessionDto);
    // Persist raw session payload; Mongo validation handled by schema.
    return createdSession.save();
  }

  // Sayfalandırmalı ve özet verili listeleyici
  async findAllSummaries(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    const sessions: SessionLean[] = await this.sessionModel
      .find(
        {},
        {
          _id: 1,
          id: 1,
          networkLogs: 1,
          consoleLogs: 1,
          timestamp: 1,
          user: 1,
          url: 1,
          userAgent: 1,
        },
      )
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean<SessionLean[]>()
      .exec();

    const summaryList = sessions.map((session: SessionLean) => {
      // Deduplicate network logs by id before counting
      let networkLogs: NetworkLog[] = Array.isArray(session.networkLogs)
        ? (session.networkLogs as NetworkLog[])
        : [];
      const seenNetworkIds = new Set<string>();
      networkLogs = networkLogs.filter((log: NetworkLog) => {
        if (log.id && seenNetworkIds.has(log.id)) {
          return false;
        }
        if (log.id) {
          seenNetworkIds.add(log.id);
        }
        return true;
      });

      const totalNetworkLogs = networkLogs.length;
      const totalLogs = Array.isArray(session.consoleLogs)
        ? (session.consoleLogs as ConsoleLog[]).length
        : 0;
      let totalErrors = 0;

      // Error control - console
      if (Array.isArray(session.consoleLogs)) {
        totalErrors += (session.consoleLogs as ConsoleLog[]).filter(
          (log: ConsoleLog) =>
            (log.level && log.level.toLowerCase() === 'error') ||
            (log.type && log.type.toLowerCase() === 'error') ||
            (log.method && log.method.toLowerCase() === 'error')
        ).length;
      }
      // Error control - network (use deduplicated network logs)
      totalErrors += networkLogs.filter(
        (log: NetworkLog) => log.ok === false || (log.status && log.status >= 400),
      ).length;

      return {
        _id: session._id?.toString(),
        id: session.id,
        totalNetworkLogs,
        totalLogs,
        totalErrors,
        timestamp: session.timestamp,
        user: session.user,
        url: session.url,
        userAgent: session.userAgent,
      };
    });

    // Toplam session sayısını hesapla
    const total = await this.sessionModel.countDocuments().exec();
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      items: summaryList,
    };
  }

  async findAll(): Promise<Session[]> {
    return this.sessionModel.find().exec();
  }

  async findOne(
    id: string,
    consoleLogsPage: number = 1,
    consoleLogsLimit: number = 20,
    networkLogsPage: number = 1,
    networkLogsLimit: number = 20,
    domEventsPage: number = 1,
    domEventsLimit: number = 20,
    consoleLogsSearch?: string,
    networkLogsSearch?: string,
    domEventsSearch?: string,
  ): Promise<any> {
    const session = await this.sessionModel.findById(id).lean<SessionLean>().exec();
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }

    // Paginate + Search consoleLogs
    let logs: ConsoleLog[] = Array.isArray(session.consoleLogs)
      ? (session.consoleLogs as ConsoleLog[])
      : [];
    if (consoleLogsSearch) {
      logs = logs.filter((log: ConsoleLog) =>
        JSON.stringify(log).toLowerCase().includes(consoleLogsSearch.toLowerCase()),
      );
    }
    const totalConsoleLogs = logs.length;
    const startIdx = (consoleLogsPage - 1) * consoleLogsLimit;
    const endIdx = startIdx + consoleLogsLimit;
    const paginatedLogs = logs.slice(startIdx, endIdx);

    // Paginate + Search networkLogs
    let netLogs: NetworkLog[] = Array.isArray(session.networkLogs)
      ? (session.networkLogs as NetworkLog[])
      : [];
    if (networkLogsSearch) {
      netLogs = netLogs.filter((log: NetworkLog) =>
        JSON.stringify(log).toLowerCase().includes(networkLogsSearch.toLowerCase()),
      );
    }

    // Deduplicate by id - keep only first occurrence of each unique id
    const seenNetworkIds = new Set<string>();
    netLogs = netLogs.filter((log: NetworkLog) => {
      if (log.id && seenNetworkIds.has(log.id)) {
        return false;
      }
      if (log.id) {
        seenNetworkIds.add(log.id);
      }
      return true;
    });

    const totalNetworkLogs = netLogs.length;
    const netStartIdx = (networkLogsPage - 1) * networkLogsLimit;
    const netEndIdx = netStartIdx + networkLogsLimit;
    const paginatedNetLogs = netLogs.slice(netStartIdx, netEndIdx);

    // Paginate + Search domEvents
    let domLogs: DomEvent[] = Array.isArray(session.domEvents)
      ? (session.domEvents as DomEvent[])
      : [];
    if (domEventsSearch) {
      domLogs = domLogs.filter((log: DomEvent) =>
        JSON.stringify(log).toLowerCase().includes(domEventsSearch.toLowerCase()),
      );
    }
    const totalDomEvents = domLogs.length;
    const domStartIdx = (domEventsPage - 1) * domEventsLimit;
    const domEndIdx = domStartIdx + domEventsLimit;
    const paginatedDomEvents = domLogs.slice(domStartIdx, domEndIdx);

    return {
      ...session,
      consoleLogs: paginatedLogs,
      consoleLogsPagination: {
        page: consoleLogsPage,
        limit: consoleLogsLimit,
        total: totalConsoleLogs,
        totalPages: Math.ceil(totalConsoleLogs / consoleLogsLimit),
        search: consoleLogsSearch || null,
      },
      networkLogs: paginatedNetLogs,
      networkLogsPagination: {
        page: networkLogsPage,
        limit: networkLogsLimit,
        total: totalNetworkLogs,
        totalPages: Math.ceil(totalNetworkLogs / networkLogsLimit),
        search: networkLogsSearch || null,
      },
      domEvents: paginatedDomEvents,
      domEventsPagination: {
        page: domEventsPage,
        limit: domEventsLimit,
        total: totalDomEvents,
        totalPages: Math.ceil(totalDomEvents / domEventsLimit),
        search: domEventsSearch || null,
      },
    };
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    const updated = await this.sessionModel
      .findByIdAndUpdate(id, updateSessionDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<Session> {
    const deleted = await this.sessionModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return deleted;
  }

  async getRrwebEvents(id: string): Promise<any[]> {
    const session = await this.sessionModel.findById(id).lean<SessionLean>().exec();
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return session.rrwebEvents || [];
  }

  async getPaginatedConsoleLogs(id: string, page: number = 1, limit: number = 20, search?: string) {
    const session = await this.sessionModel.findById(id).lean<SessionLean>().exec();
    if (!session) throw new NotFoundException(`Session with id ${id} not found`);
    let logs: ConsoleLog[] = Array.isArray(session.consoleLogs)
      ? (session.consoleLogs as ConsoleLog[])
      : [];
    if (search) {
      logs = logs.filter((log: ConsoleLog) =>
        JSON.stringify(log).toLowerCase().includes(search.toLowerCase()),
      );
    }
    const total = logs.length;
    const start = (page - 1) * limit;
    const items = logs.slice(start, start + limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        search: search || null
      }
    }
  }

  async getPaginatedNetworkLogs(id: string, page: number = 1, limit: number = 20, search?: string) {
    const session = await this.sessionModel.findById(id).lean<SessionLean>().exec();
    if (!session) throw new NotFoundException(`Session with id ${id} not found`);
    let logs: NetworkLog[] = Array.isArray(session.networkLogs)
      ? (session.networkLogs as NetworkLog[])
      : [];
    if (search) {
      logs = logs.filter((log: NetworkLog) =>
        JSON.stringify(log).toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Deduplicate by id - keep only first occurrence of each unique id
    const seenIds = new Set<string>();
    logs = logs.filter((log: NetworkLog) => {
      if (log.id && seenIds.has(log.id)) {
        return false;
      }
      if (log.id) {
        seenIds.add(log.id);
      }
      return true;
    });

    const total = logs.length;
    const start = (page - 1) * limit;
    const items = logs.slice(start, start + limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        search: search || null
      }
    }
  }

  async getPaginatedDomEvents(id: string, page: number = 1, limit: number = 20, search?: string) {
    const session = await this.sessionModel.findById(id).lean<SessionLean>().exec();
    if (!session) throw new NotFoundException(`Session with id ${id} not found`);
    let logs: DomEvent[] = Array.isArray(session.domEvents)
      ? (session.domEvents as DomEvent[])
      : [];
    if (search) {
      logs = logs.filter((log: DomEvent) =>
        JSON.stringify(log).toLowerCase().includes(search.toLowerCase()),
      );
    }
    const total = logs.length;
    const start = (page - 1) * limit;
    const items = logs.slice(start, start + limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        search: search || null
      }
    }
  }

  async getNetworkLogDetailsById(sessionId: string, networkLogId: string, page: number = 1, limit: number = 20) {
    const session = await this.sessionModel.findById(sessionId).lean<SessionLean>().exec();
    if (!session) throw new NotFoundException(`Session with id ${sessionId} not found`);

    // Filter network logs to only those with the specified networkLogId
    let logs: NetworkLog[] = Array.isArray(session.networkLogs)
      ? (session.networkLogs as NetworkLog[])
      : [];
    logs = logs.filter((log: NetworkLog) => log.id === networkLogId);

    const total = logs.length;
    const start = (page - 1) * limit;
    const items = logs.slice(start, start + limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        networkLogId
      }
    };
  }
}

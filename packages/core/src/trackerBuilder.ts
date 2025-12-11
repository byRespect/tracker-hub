import { initNetworkLogger, setNetworkRetention } from "./logger/network.js";
import { initConsoleLogger, setConsoleAutoReportTriggers, setConsoleRetention } from "./logger/console.js";
import { initDomEventLogger, setDomEventLimit } from "./logger/dom.js";
import { startRrwebRecorder, setRrwebRetention } from "./logger/rrweb.js";
import { configureSession, setUser, createSessionReport } from "./core/session.js";
import { TrackerConfig, UserInfo, LogTriggerLevel, TrackerFeatures, FeatureFlags } from "./shared/types.js";

/**
 * Tracking yeteneklerini fluent API ile ayağa kaldıran builder.
 */
export class TrackerBuilder {
  private features: TrackerFeatures = {
    console: true,
    network: true,
    dom: true,
    rrweb: true,
    autoError: true,
    manual: true,
    consoleAutoReport: false,
  };

  private featureFlags: FeatureFlags = { captureNetwork: true, captureRrweb: true };
  private consoleReportTriggers: LogTriggerLevel[] = [];
  private logRetentionMinutes = 5;
  private userInfo?: UserInfo;
  private reportEndpoint?: string;

  withConsoleLogging(enabled: boolean = true): TrackerBuilder {
    this.features.console = enabled;
    return this;
  }

  withNetworkLogging(enabled: boolean = true): TrackerBuilder {
    this.features.network = enabled;
    return this;
  }

  withDOMEventLogging(enabled: boolean = true): TrackerBuilder {
    this.features.dom = enabled;
    return this;
  }

  withRRWebLogging(enabled: boolean = true): TrackerBuilder {
    this.features.rrweb = enabled;
    this.featureFlags.captureRrweb = enabled;
    return this;
  }

  withAutoErrorReporting(enabled: boolean = true): TrackerBuilder {
    this.features.autoError = enabled;
    return this;
  }

  withManualReporting(enabled: boolean = true): TrackerBuilder {
    this.features.manual = enabled;
    return this;
  }

  withLogRetention(minutes: number): TrackerBuilder {
    this.logRetentionMinutes = minutes;
    return this;
  }

  withUser(userInfo: UserInfo): TrackerBuilder {
    this.userInfo = userInfo;
    return this;
  }

  withRRWebConfig(rrwebConfig: TrackerConfig["rrwebConfig"]): TrackerBuilder {
    if (rrwebConfig) {
      this.featureFlags.captureRrweb = true;
    }
    return this;
  }

  withFeatureFlags(flags: FeatureFlags): TrackerBuilder {
    this.featureFlags = { ...this.featureFlags, ...flags };
    return this;
  }

  withConsoleAutoReporting(triggers: LogTriggerLevel[]): TrackerBuilder {
    this.features.consoleAutoReport = triggers.length > 0;
    this.consoleReportTriggers = triggers;
    return this;
  }

  withReportEndpoint(endpoint: string): TrackerBuilder {
    this.reportEndpoint = endpoint;
    return this;
  }

  /** Aktif oturumdayken user meta'yı günceller. */
  updateUser(userInfo: UserInfo): void {
    setUser(userInfo);
  }

  /**
   * Seçilen feature'lara göre logger'ları boot eder, manual report hook'unu ekler.
   */
  build(): void {
    const config: TrackerConfig = {
      features: this.features,
      consoleReportTriggers: this.consoleReportTriggers,
      logRetentionMinutes: this.logRetentionMinutes,
      featureFlags: this.featureFlags,
      user: this.userInfo,
      reportEndpoint: this.reportEndpoint,
    };

    configureSession(config);

    if (this.features.console) {
      initConsoleLogger();
      if (this.features.consoleAutoReport) {
        setConsoleAutoReportTriggers(this.consoleReportTriggers);
      }
      setConsoleRetention(this.logRetentionMinutes);
    }

    if (this.features.network) {
      initNetworkLogger(this.featureFlags);
      setNetworkRetention(this.logRetentionMinutes);
    }

    if (this.features.dom) {
      initDomEventLogger();
      setDomEventLimit(500);
    }

    if (this.features.rrweb) {
      startRrwebRecorder();
      setRrwebRetention(this.logRetentionMinutes);
    }

    if (this.userInfo) {
      setUser(this.userInfo);
    }

    if (this.features.manual) {
      (window as any).reportSession = () => createSessionReport("manual");
    }
  }
}

export function createTracker(): TrackerBuilder {
  return new TrackerBuilder();
}

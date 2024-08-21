import { Analytics as SegmentAnalytics } from '@segment/analytics-node';
import { v4 as uuid } from 'uuid';
import { type ANALYTICS_EVENTS } from './types';

const APP_ID = 'decentraland-launcher';
const SEGMENT_KEY = '4gsiGKen1LyWATLxpZpsGI9iGYyAEBAF';

const noopAnalytics = {
  track() {},
};

export class Analytics {
  private static instance: Analytics | null = null;
  private analytics: SegmentAnalytics | { track(): void } = noopAnalytics;
  private userId: string;
  private appId: string = APP_ID;
  private sessionId: string = uuid();
  private os: string;
  private launcherVersion: string;
  private ipAddress?: string;

  constructor(userId: string, os: string, launcherVersion: string, ipAddress?: string) {
    this.userId = userId;
    this.os = os;
    this.launcherVersion = launcherVersion;
    this.ipAddress = ipAddress;

    if (!import.meta.env.PROD) {
      return;
    }

    if (Analytics.instance) {
      return Analytics.instance;
    }

    this.analytics = new SegmentAnalytics({ writeKey: SEGMENT_KEY });

    Analytics.instance = this;
  }

  getAnalytics(): SegmentAnalytics {
    return this.analytics as SegmentAnalytics;
  }

  async closeAndFlush(): Promise<void> {
    if (this.analytics instanceof SegmentAnalytics) {
      return this.analytics.closeAndFlush({ timeout: 20000 });
    }

    return Promise.resolve();
  }

  getProperties() {
    let properties: Record<string, unknown> = {};

    if (this.appId) {
      properties = {
        ...properties,
        appId: this.appId,
      };
    }

    if (this.sessionId) {
      properties = {
        ...properties,
        sessionId: this.sessionId,
      };
    }

    if (this.os) {
      properties = {
        ...properties,
        os: this.os,
      };
    }

    if (this.launcherVersion) {
      properties = {
        ...properties,
        launcherVersion: this.launcherVersion,
      };
    }

    if (this.ipAddress) {
      properties = {
        ...properties,
        ip: this.ipAddress,
      };
    }

    return properties;
  }

  track<T extends keyof ANALYTICS_EVENTS>(eventName: T, eventProps: ANALYTICS_EVENTS[T] | undefined = undefined) {
    const trackInfo = {
      event: eventName,
      anonymousId: this.userId,
      properties: {
        ...this.getProperties(),
        ...eventProps,
      },
    };

    this.getAnalytics().track(trackInfo);
  }
}

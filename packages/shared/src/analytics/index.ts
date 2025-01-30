import { Analytics as SegmentAnalytics } from '@segment/analytics-node';
import { v4 as uuid } from 'uuid';
import { type ANALYTICS_EVENTS } from './types';

const APP_ID = 'decentraland-launcher';
const SEGMENT_KEY = import.meta.env.VITE_SEGMENT_API_KEY;

const noopAnalytics = {
  track(_: Record<string, string>, resolve: () => void) {
    return resolve();
  },
};

export class Analytics {
  private static instance: Analytics | null = null;
  private analytics: SegmentAnalytics | typeof noopAnalytics = noopAnalytics;
  private anonymousId: string;
  private appId: string = APP_ID;
  private sessionId: string = uuid();
  private os: string;
  private launcherVersion: string;

  constructor(anonymousId: string, os: string, launcherVersion: string) {
    this.anonymousId = anonymousId;
    this.os = os;
    this.launcherVersion = launcherVersion;

    if (!import.meta.env.PROD) {
      return;
    }

    if (Analytics.instance) {
      return Analytics.instance;
    }

    this.analytics = new SegmentAnalytics({ writeKey: SEGMENT_KEY, flushAt: 1 });

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

    return properties;
  }

  getAnonymousId() {
    return this.anonymousId;
  }

  getSessionId() {
    return this.sessionId;
  }

  async track<T extends keyof ANALYTICS_EVENTS>(eventName: T, eventProps: ANALYTICS_EVENTS[T] | undefined = undefined) {
    const trackInfo = {
      event: eventName,
      anonymousId: this.anonymousId,
      properties: {
        ...this.getProperties(),
        ...eventProps,
      },
      context: {
        direct: true,
      },
    };

    return new Promise(resolve => {
      this.getAnalytics().track(trackInfo, resolve);
    });
  }
}

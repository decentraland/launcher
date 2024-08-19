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

  constructor(userId: string, os: string, launcherVersion: string) {
    this.userId = userId;
    this.os = os;
    this.launcherVersion = launcherVersion;

    if (!import.meta.env.PROD) {
      return;
    }

    if (Analytics.instance) {
      return Analytics.instance;
    }

    this.analytics = new SegmentAnalytics({ writeKey: SEGMENT_KEY });

    this.analytics.identify({
      userId: this.userId,
      traits: this.getTraits(),
    });

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

  getTraits() {
    let traits: Record<string, unknown> = {};

    if (this.appId) {
      traits = {
        ...traits,
        appId: this.appId,
      };
    }

    if (this.sessionId) {
      traits = {
        ...traits,
        sessionId: this.sessionId,
      };
    }

    if (this.os) {
      traits = {
        ...traits,
        os: this.os,
      };
    }

    if (this.launcherVersion) {
      traits = {
        ...traits,
        launcherVersion: this.launcherVersion,
      };
    }

    return traits;
  }

  track<T extends keyof ANALYTICS_EVENTS>(eventName: T, eventProps: ANALYTICS_EVENTS[T] | undefined = undefined) {
    const trackInfo = {
      event: eventName,
      userId: this.userId,
      properties: {
        ...this.getTraits(),
        ...eventProps,
      },
    };

    this.getAnalytics().track(trackInfo);
  }
}

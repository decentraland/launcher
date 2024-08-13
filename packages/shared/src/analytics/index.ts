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

  constructor(userId: string) {
    this.userId = userId;

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

  getAnalytics() {
    return this.analytics;
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

    return traits;
  }

  track<T extends keyof ANALYTICS_EVENTS>(eventName: T, eventProps: ANALYTICS_EVENTS[T]) {
    const trackInfo = {
      event: eventName,
      userId: this.userId,
      properties: {
        ...this.getTraits(),
        ...eventProps,
      },
    };

    this.analytics.track(trackInfo);
  }
}

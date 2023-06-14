export abstract class Analytics {
  constructor(protected readonly token: string) { }

  abstract trackEvent(event: string, userId?: string): void | Promise<void>;
  abstract trackPageView(title: string, userId?: string): void | Promise<void>;
}

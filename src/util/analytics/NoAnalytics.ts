import { Analytics } from './Analytics';

export class NoAnayltics extends Analytics {
  constructor() {
    super('');
  }

  override async trackEvent() {
    // Do nothing
  }
  override async trackPageView() {
    // Do nothing
  }
}

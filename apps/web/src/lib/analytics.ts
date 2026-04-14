type EventName =
  | 'page_view'
  | 'onboarding_started'
  | 'onboarding_step'
  | 'profile_completed'
  | 'photo_uploaded'
  | 'swipe_right'
  | 'swipe_left'
  | 'match_created'
  | 'match_shared'
  | 'chat_started'
  | 'message_sent'
  | 'duel_started'
  | 'duel_completed'
  | 'invite_created'
  | 'invite_accepted'
  | 'invite_shared'
  | 'credit_purchased'
  | 'funnel_drop';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

const FUNNEL_STEPS = [
  'onboarding_started',
  'profile_completed',
  'swipe_right',
  'match_created',
  'chat_started',
  'duel_started',
  'duel_completed',
] as const;

class Analytics {
  private queue: { name: EventName; data?: EventData; timestamp: string }[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionStart: string;

  constructor() {
    this.sessionStart = new Date().toISOString();
    if (typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => this.flush(), 30000);
      // Track session start
      this.track('page_view', { url: window.location.pathname });
    }
  }

  track(name: EventName, data?: EventData) {
    const event = {
      name,
      data: {
        ...data,
        session_start: this.sessionStart,
      },
      timestamp: new Date().toISOString(),
    };

    this.queue.push(event);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${name}`, data || '');
    }

    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  // Track funnel progression and detect drop-offs
  trackFunnel(currentStep: typeof FUNNEL_STEPS[number]) {
    const funnelProgress = this.getFunnelProgress();
    const stepIndex = FUNNEL_STEPS.indexOf(currentStep);

    // Record the step
    funnelProgress[currentStep] = new Date().toISOString();
    this.saveFunnelProgress(funnelProgress);

    // Check for skipped steps (potential drop-off points)
    if (stepIndex > 0) {
      const prevStep = FUNNEL_STEPS[stepIndex - 1];
      if (!funnelProgress[prevStep]) {
        this.track('funnel_drop', {
          expected_step: prevStep,
          actual_step: currentStep,
          funnel_position: stepIndex,
        });
      }
    }

    this.track(currentStep, { funnel_position: stepIndex });
  }

  getFunnelProgress(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem('cupidme-funnel') || '{}');
    } catch {
      return {};
    }
  }

  private saveFunnelProgress(progress: Record<string, string>) {
    try {
      localStorage.setItem('cupidme-funnel', JSON.stringify(progress));
    } catch { /* ignore */ }
  }

  getFunnelReport(): { step: string; reached: boolean; timestamp?: string }[] {
    const progress = this.getFunnelProgress();
    return FUNNEL_STEPS.map((step) => ({
      step,
      reached: !!progress[step],
      timestamp: progress[step],
    }));
  }

  private flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const existing = JSON.parse(localStorage.getItem('cupidme-events') || '[]');
      const combined = [...existing, ...events].slice(-500);
      localStorage.setItem('cupidme-events', JSON.stringify(combined));
    } catch { /* storage full */ }
  }

  getEvents(): { name: string; data?: EventData; timestamp: string }[] {
    try {
      return JSON.parse(localStorage.getItem('cupidme-events') || '[]');
    } catch {
      return [];
    }
  }
}

export const analytics = new Analytics();

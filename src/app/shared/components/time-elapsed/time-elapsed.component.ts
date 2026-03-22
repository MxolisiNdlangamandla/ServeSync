import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-time-elapsed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ display() }}`
})
export class TimeElapsedComponent implements OnDestroy {
  readonly createdAt = input.required<string>();
  private readonly now = signal(Date.now());
  private readonly timer = window.setInterval(() => this.now.set(Date.now()), 1000);

  readonly display = computed(() => {
    const start = new Date(this.createdAt()).getTime();
    const total = Math.max(0, Math.floor((this.now() - start) / 1000));
    const mm = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  });

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
  }
}

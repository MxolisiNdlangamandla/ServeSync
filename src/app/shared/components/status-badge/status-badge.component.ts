import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { minutesSince } from '../../../core/utils/formatters';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state()) {
      <span class="rounded-full px-2 py-1 text-xs font-semibold"
            [class]="state() === 'urgent'
              ? 'rounded-full px-2 py-1 text-xs font-semibold bg-red-500/10 text-red-600'
              : state() === 'progress'
                ? 'rounded-full px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600'
                : 'rounded-full px-2 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600'">
        {{ state() === 'urgent' ? 'Urgent' : state() === 'progress' ? 'In Progress' : 'Open' }}
      </span>
    }
  `
})
export class StatusBadgeComponent {
  readonly createdAt = input.required<string>();
  private readonly now = signal(Date.now());
  private readonly timer = window.setInterval(() => this.now.set(Date.now()), 1000);

  readonly state = computed(() => {
    const mins = minutesSince(this.createdAt(), this.now());
    if (mins >= 20) return 'urgent';
    if (mins >= 10) return 'progress';
    return 'open';
  });

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
  }
}

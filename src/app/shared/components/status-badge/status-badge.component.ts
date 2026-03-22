import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { minutesSince } from '../../../core/utils/formatters';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state() !== 'none') {
      <span class="rounded-full px-2 py-1 text-xs font-semibold"
            [class]="state() === 'urgent' ? 'rounded-full px-2 py-1 text-xs font-semibold bg-red-500/10 text-red-600' : 'rounded-full px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-600'">
        {{ state() === 'urgent' ? 'Urgent' : 'Waiting' }}
      </span>
    }
  `
})
export class StatusBadgeComponent {
  readonly createdAt = input.required<string>();

  readonly state = computed(() => {
    const mins = minutesSince(this.createdAt());
    if (mins >= 20) return 'urgent';
    if (mins >= 10) return 'waiting';
    return 'none';
  });
}

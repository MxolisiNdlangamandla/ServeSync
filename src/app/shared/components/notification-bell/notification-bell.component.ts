import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Bell, CirclePlus, CreditCard, Hand, LucideAngularModule } from 'lucide-angular';
import { AppNotification } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-notification-bell',
  imports: [DatePipe, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <button class="relative rounded-lg p-2 hover:bg-slate-100" (click)="open.set(!open())" aria-label="Notifications">
        <lucide-angular [img]="bellIcon" class="h-5 w-5 text-slate-600"></lucide-angular>
        @if (unreadCount() > 0) {
          <span class="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">{{ unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div class="mb-2 flex items-center justify-between">
            <h4 class="text-sm font-bold text-primary">Notifications</h4>
            <button class="text-xs font-medium text-accent hover:underline" (click)="markAllRead()">Mark all as read</button>
          </div>
          <div class="max-h-80 space-y-2 overflow-auto">
            @for (n of notifications(); track n.id) {
              <div class="rounded-lg border border-slate-100 p-2.5 transition-colors" [class.bg-orange-50]="!n.read">
                <div class="flex items-center gap-2">
                  <lucide-angular [img]="iconFor(n.type)" class="h-4 w-4 text-accent"></lucide-angular>
                  <p class="text-[11px] font-semibold uppercase text-slate-400">{{ n.type }}</p>
                </div>
                <p class="mt-0.5 text-sm text-slate-700">{{ n.message }}</p>
                <p class="mt-0.5 text-[11px] text-slate-400">{{ n.created_at | date: 'shortTime' }}</p>
              </div>
            }
            @if (notifications().length === 0) {
              <p class="py-4 text-center text-sm text-slate-400">No notifications yet</p>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationBellComponent implements OnDestroy {
  readonly bellIcon = Bell;
  private readonly service = inject(NotificationService);
  readonly open = signal(false);
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);
  private poll = window.setInterval(() => this.load(), 10000);

  constructor() {
    this.load();
  }

  iconFor(type: AppNotification['type']) {
    if (type === 'bill_request') return CreditCard;
    if (type === 'call_staff') return Hand;
    return CirclePlus;
  }

  load(): void {
    this.service.getNotifications().subscribe((rows) => this.notifications.set(rows));
  }

  markAllRead(): void {
    this.service.markAllAsRead().then(() => {
      this.notifications.update((rows) => rows.map((row) => ({ ...row, read: true })));
      this.open.set(false);
      toast.success('All notifications marked as read');
    });
  }

  ngOnDestroy(): void {
    window.clearInterval(this.poll);
  }
}

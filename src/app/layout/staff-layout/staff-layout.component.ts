import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, ChartColumnIncreasing, Plus, UtensilsCrossed, Users, LogOut, Settings } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { IndustryService } from '../../core/services/industry.service';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-staff-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, NotificationBellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col bg-slate-50">
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a routerLink="/dashboard" class="flex items-center gap-2">
            <img src="logo.png" alt="ServeSync" class="h-8 w-8 rounded-lg object-cover" />
            <span class="text-lg font-extrabold text-primary">ServeSync</span>
          </a>
          <div class="flex items-center gap-2">
            @if (auth.profile(); as p) {
              <span class="hidden text-sm font-medium text-slate-600 sm:inline">{{ p.full_name || p.email }}</span>
            }
            <app-notification-bell />
            <a routerLink="/settings" class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Settings">
              <lucide-angular [img]="settingsIcon" class="h-5 w-5"></lucide-angular>
            </a>
            <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" (click)="auth.logout()" aria-label="Logout">
              <lucide-angular [img]="logOutIcon" class="h-5 w-5"></lucide-angular>
            </button>
          </div>
        </div>
      </header>
      <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24"><router-outlet /></main>
      <nav class="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white">
        <div class="mx-auto grid max-w-lg grid-cols-5">
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="!text-accent font-semibold" [routerLinkActiveOptions]="{exact: item.exact}"
               class="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-slate-400 transition-colors">
              <lucide-angular [img]="item.icon" class="h-5 w-5"></lucide-angular>
              <span>{{ item.label }}</span>
            </a>
          }
        </div>
      </nav>
    </div>
  `
})
export class StaffLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly industryService = inject(IndustryService);
  readonly labels = this.industryService.labels;
  readonly logOutIcon = LogOut;
  readonly settingsIcon = Settings;

  readonly navItems = computed(() => [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/overview', label: 'Overview', icon: ChartColumnIncreasing, exact: true },
    { path: '/orders/new', label: 'New ' + this.labels().order, icon: Plus, exact: true },
    { path: '/menu', label: 'Menu', icon: UtensilsCrossed, exact: true },
    { path: '/staff', label: 'Staff', icon: Users, exact: true }
  ]);
}

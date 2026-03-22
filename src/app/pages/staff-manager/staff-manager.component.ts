import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, Plus, Shield, Trash2, X, Users, Copy } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { IndustryService } from '../../core/services/industry.service';
import { Profile, UserRole } from '../../core/models/profile.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-staff-manager',
  imports: [ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-primary">Staff</h1>
          <p class="text-sm text-slate-500">{{ staff().length }} members</p>
        </div>
        <button class="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-orange-600" (click)="showInvite.set(true)">
          <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
          Invite {{ labels().staff }}
        </button>
      </header>

      <!-- Invite Modal -->
      @if (showInvite()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="showInvite.set(false)">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-primary">Invite {{ labels().staff }} Member</h3>
              <button class="rounded-lg p-1 hover:bg-slate-100" (click)="showInvite.set(false)">
                <lucide-angular [img]="xIcon" class="h-5 w-5 text-slate-400"></lucide-angular>
              </button>
            </div>
            @if (inviteLink()) {
              <div class="space-y-3">
                <p class="text-sm text-slate-600">Share this link with the invited staff member:</p>
                <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span class="flex-1 truncate text-xs text-slate-700">{{ inviteLink() }}</span>
                  <button class="rounded-lg p-1.5 hover:bg-slate-200" (click)="copyLink()">
                    <lucide-angular [img]="copyIcon" class="h-4 w-4 text-slate-500"></lucide-angular>
                  </button>
                </div>
                <button class="w-full rounded-full bg-primary px-4 py-3 font-bold text-white hover:bg-primary/90" (click)="inviteLink.set(''); showInvite.set(false)">Done</button>
              </div>
            } @else {
              <form class="space-y-3" [formGroup]="inviteForm" (ngSubmit)="invite()">
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="fullName" placeholder="e.g. John Smith" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                  <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" type="email" formControlName="email" placeholder="staff@example.com" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Role</label>
                  <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="role">
                    <option value="user">Waiter</option>
                    <option value="admin">Manager</option>
                  </select>
                </div>
                <button class="w-full rounded-full bg-accent px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50" [disabled]="inviteForm.invalid">Send Invite</button>
              </form>
            }
          </div>
        </div>
      }

      <!-- Managers -->
      @if (managers().length) {
        <section>
          <div class="mb-3 flex items-center gap-2">
            <lucide-angular [img]="shieldIcon" class="h-4 w-4 text-accent"></lucide-angular>
            <h2 class="text-xs font-bold uppercase tracking-wide text-accent">Managers</h2>
          </div>
          <div class="space-y-3">
            @for (member of managers(); track member.id) {
              <article class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {{ initials(member) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-primary">{{ member.full_name || member.email }}</h3>
                  <p class="truncate text-xs text-slate-400">{{ member.email }}</p>
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  [class]="statusClass(member)">
                  <span class="h-2 w-2 rounded-full" [class]="statusDotClass(member)"></span>
                  {{ statusLabel(member) }}
                </span>
                <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Manager</span>
                <button class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" (click)="remove(member.id)">
                  <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                </button>
              </article>
            }
          </div>
        </section>
      }

      <!-- Waiters -->
      @if (waiters().length) {
        <section>
          <div class="mb-3 flex items-center gap-2">
            <lucide-angular [img]="usersIcon" class="h-4 w-4 text-accent"></lucide-angular>
            <h2 class="text-xs font-bold uppercase tracking-wide text-accent">Waiters</h2>
          </div>
          <div class="space-y-3">
            @for (member of waiters(); track member.id) {
              <article class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                  {{ initials(member) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-primary">{{ member.full_name || member.email }}</h3>
                  <p class="truncate text-xs text-slate-400">{{ member.email }}</p>
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  [class]="statusClass(member)">
                  <span class="h-2 w-2 rounded-full" [class]="statusDotClass(member)"></span>
                  {{ statusLabel(member) }}
                </span>
                <span class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">Waiter</span>
                <button class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" (click)="remove(member.id)">
                  <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                </button>
              </article>
            }
          </div>
        </section>
      }

      @if (!staff().length) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p class="text-slate-400">No staff members yet. Invite your team!</p>
        </div>
      }
    </section>
  `
})
export class StaffManagerComponent {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly industryService = inject(IndustryService);
  readonly labels = this.industryService.labels;
  private readonly fb = inject(FormBuilder);
  private readonly api = environment.apiUrl;

  readonly plusIcon = Plus;
  readonly shieldIcon = Shield;
  readonly trashIcon = Trash2;
  readonly xIcon = X;
  readonly usersIcon = Users;
  readonly copyIcon = Copy;

  readonly staff = signal<Profile[]>([]);
  readonly showInvite = signal(false);
  readonly inviteLink = signal('');

  readonly managers = signal<Profile[]>([]);
  readonly waiters = signal<Profile[]>([]);

  readonly inviteForm = this.fb.nonNullable.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    role: ['user' as UserRole]
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.http.get<Profile[]>(`${this.api}/staff`).subscribe({
      next: (profiles) => {
        this.staff.set(profiles);
        this.managers.set(profiles.filter((p) => p.role === 'admin'));
        this.waiters.set(profiles.filter((p) => p.role === 'user'));
      },
      error: (err) => toast.error(err.error?.error ?? 'Failed to load staff')
    });
  }

  initials(member: Profile): string {
    if (member.full_name) {
      return member.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return member.email.slice(0, 2).toUpperCase();
  }

  statusLabel(member: Profile): string {
    if (member.invite_token) return 'Pending';
    if (this.isRecentlySeen(member) && member.is_online) return 'Online';
    return 'Offline';
  }

  statusClass(member: Profile): string {
    if (member.invite_token) return 'bg-amber-50 text-amber-700';
    if (this.isRecentlySeen(member) && member.is_online) return 'bg-emerald-50 text-emerald-700';
    return 'bg-slate-100 text-slate-500';
  }

  statusDotClass(member: Profile): string {
    if (member.invite_token) return 'bg-amber-500';
    if (this.isRecentlySeen(member) && member.is_online) return 'bg-emerald-500';
    return 'bg-slate-400';
  }

  private isRecentlySeen(member: Profile): boolean {
    if (!member.last_seen_at) return false;
    return Date.now() - new Date(member.last_seen_at).getTime() < 5 * 60 * 1000;
  }

  async invite(): Promise<void> {
    const { fullName, email, role } = this.inviteForm.getRawValue();
    try {
      const res = await this.auth.inviteStaff(email, role, fullName || undefined);
      toast.success('Invitation created for ' + email);
      this.inviteForm.reset({ fullName: '', email: '', role: 'user' });
      if (res?.inviteToken) {
        const link = `${location.origin}/accept-invite?token=${res.inviteToken}`;
        this.inviteLink.set(link);
      } else {
        this.showInvite.set(false);
      }
      this.load();
    } catch (e: any) {
      toast.error(e.error?.error ?? 'Failed to invite');
    }
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.inviteLink());
    toast.success('Invite link copied!');
  }

  remove(id: string): void {
    this.http.delete(`${this.api}/staff/${id}`).subscribe({
      next: () => { toast.success('Staff member removed'); this.load(); },
      error: (err) => toast.error(err.error?.error ?? 'Failed to remove')
    });
  }
}

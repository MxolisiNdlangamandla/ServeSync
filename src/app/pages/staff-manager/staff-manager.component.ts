import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, Plus, Shield, Trash2, X, Users, Copy, Pencil } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { IndustryService } from '../../core/services/industry.service';
import { Profile, UserRole } from '../../core/models/profile.model';
import { StoreService } from '../../core/services/store.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-staff-manager',
  imports: [ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-black text-primary">Admin Team</h1>
          <p class="text-sm text-slate-500">{{ staff().length }} members across your operating team</p>
        </div>
        <div class="flex items-center gap-3">
          @if (showSiteFilter()) {
            <div class="min-w-[180px]">
              <label class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Site View</label>
              <select class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none"
                [value]="selectedStoreId()"
                (change)="selectStore($event)">
                @for (site of siteOptions(); track site.id) {
                  <option [value]="site.id">{{ site.name }}</option>
                }
              </select>
            </div>
          }
          @if (canInvite()) {
            <button class="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-orange-600" (click)="showInvite.set(true)">
              <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
              Invite {{ labels().staff }}
            </button>
          }
        </div>
      </header>

      @if (showInvite()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="closeInvite()">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-primary">Invite Team Member</h3>
              <button class="rounded-lg p-1 hover:bg-slate-100" (click)="closeInvite()">
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
                <button class="w-full rounded-full bg-primary px-4 py-3 font-bold text-white hover:bg-primary/90" (click)="closeInvite()">Done</button>
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
                    @for (option of inviteRoleOptions(); track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </div>
                @if (showSiteFilter()) {
                  <div>
                    <label class="mb-1 block text-sm font-semibold text-slate-700">Assign To Site</label>
                    <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="storeId">
                      @for (site of assignableSites(); track site.id) {
                        <option [value]="site.id">{{ site.name }}</option>
                      }
                    </select>
                  </div>
                }
                <button class="w-full rounded-full bg-accent px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50" [disabled]="inviteForm.invalid">Send Invite</button>
              </form>
            }
          </div>
        </div>
      }

      @if (selectedMember()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="closeEdit()">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-primary">Edit Team Member</h3>
              <button class="rounded-lg p-1 hover:bg-slate-100" (click)="closeEdit()">
                <lucide-angular [img]="xIcon" class="h-5 w-5 text-slate-400"></lucide-angular>
              </button>
            </div>
            <form class="space-y-3" [formGroup]="editForm" (ngSubmit)="saveEdit()">
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="fullName" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Role</label>
                <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="role">
                  @for (option of editRoleOptions(); track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </div>
              @if (showSiteFilter()) {
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Assigned Site</label>
                  <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="storeId">
                    @for (site of assignableSites(); track site.id) {
                      <option [value]="site.id">{{ site.name }}</option>
                    }
                  </select>
                </div>
              }
              <button class="w-full rounded-full bg-primary px-4 py-3 font-bold text-white disabled:opacity-50" [disabled]="editForm.invalid">Save Changes</button>
            </form>
          </div>
        </div>
      }

      @if (admins().length) {
        <section>
          <div class="mb-3 flex items-center gap-2">
            <lucide-angular [img]="shieldIcon" class="h-4 w-4 text-primary"></lucide-angular>
            <h2 class="text-xs font-bold uppercase tracking-wide text-primary">Account Admins</h2>
          </div>
          <div class="space-y-3">
            @for (member of admins(); track member.id) {
              <article class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {{ initials(member) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-primary">{{ member.full_name || member.email }}</h3>
                  <p class="truncate text-xs text-slate-400">{{ member.email }}</p>
                  @if (showSiteFilter()) {
                    <p class="mt-1 text-xs text-slate-400">{{ member.assigned_store_name || 'Current site' }}</p>
                  }
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(member)">
                  <span class="h-2 w-2 rounded-full" [class]="statusDotClass(member)"></span>
                  {{ statusLabel(member) }}
                </span>
                <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Admin</span>
              </article>
            }
          </div>
        </section>
      }

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
                  @if (showSiteFilter()) {
                    <p class="mt-1 text-xs text-slate-400">{{ member.assigned_store_name || 'Current site' }}</p>
                  }
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(member)">
                  <span class="h-2 w-2 rounded-full" [class]="statusDotClass(member)"></span>
                  {{ statusLabel(member) }}
                </span>
                <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Manager</span>
                @if (canEditMember(member)) {
                  <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary" (click)="edit(member)">
                    <lucide-angular [img]="pencilIcon" class="h-4 w-4"></lucide-angular>
                  </button>
                }
                @if (canDeleteMember(member)) {
                  <button class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" (click)="remove(member.id)">
                    <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                  </button>
                }
              </article>
            }
          </div>
        </section>
      }

      @if (supervisors().length) {
        <section>
          <div class="mb-3 flex items-center gap-2">
            <lucide-angular [img]="shieldIcon" class="h-4 w-4 text-sky-600"></lucide-angular>
            <h2 class="text-xs font-bold uppercase tracking-wide text-sky-600">Supervisors</h2>
          </div>
          <div class="space-y-3">
            @for (member of supervisors(); track member.id) {
              <article class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                  {{ initials(member) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-primary">{{ member.full_name || member.email }}</h3>
                  <p class="truncate text-xs text-slate-400">{{ member.email }}</p>
                  @if (showSiteFilter()) {
                    <p class="mt-1 text-xs text-slate-400">{{ member.assigned_store_name || 'Current site' }}</p>
                  }
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(member)">
                  <span class="h-2 w-2 rounded-full" [class]="statusDotClass(member)"></span>
                  {{ statusLabel(member) }}
                </span>
                <span class="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">Supervisor</span>
                @if (canEditMember(member)) {
                  <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary" (click)="edit(member)">
                    <lucide-angular [img]="pencilIcon" class="h-4 w-4"></lucide-angular>
                  </button>
                }
                @if (canDeleteMember(member)) {
                  <button class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" (click)="remove(member.id)">
                    <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                  </button>
                }
              </article>
            }
          </div>
        </section>
      }

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
                  @if (showSiteFilter()) {
                    <p class="mt-1 text-xs text-slate-400">{{ member.assigned_store_name || 'Current site' }}</p>
                  }
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="statusClass(member)">
                  <span class="h-2 w-2 rounded-full" [class]="statusDotClass(member)"></span>
                  {{ statusLabel(member) }}
                </span>
                <span class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">Waiter</span>
                @if (canEditMember(member)) {
                  <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary" (click)="edit(member)">
                    <lucide-angular [img]="pencilIcon" class="h-4 w-4"></lucide-angular>
                  </button>
                }
                @if (canDeleteMember(member)) {
                  <button class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" (click)="remove(member.id)">
                    <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                  </button>
                }
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
  private readonly storeService = inject(StoreService);
  readonly labels = this.industryService.labels;
  private readonly fb = inject(FormBuilder);
  private readonly api = environment.apiUrl;

  readonly plusIcon = Plus;
  readonly shieldIcon = Shield;
  readonly trashIcon = Trash2;
  readonly xIcon = X;
  readonly usersIcon = Users;
  readonly copyIcon = Copy;
  readonly pencilIcon = Pencil;
  readonly siteOptions = this.storeService.siteOptions;
  readonly selectedStoreId = this.storeService.selectedStoreId;
  readonly showSiteFilter = computed(() => this.storeService.isEnterprise());
  readonly assignableSites = computed(() => this.storeService.stores());
  readonly currentUser = this.auth.profile;
  readonly canInvite = computed(() => ['admin', 'manager'].includes(this.currentUser()?.role ?? 'user'));

  readonly staff = signal<Profile[]>([]);
  readonly showInvite = signal(false);
  readonly inviteLink = signal('');
  readonly selectedMember = signal<Profile | null>(null);

  readonly admins = computed(() => this.staff().filter((profile) => profile.role === 'admin'));
  readonly managers = computed(() => this.staff().filter((profile) => profile.role === 'manager'));
  readonly supervisors = computed(() => this.staff().filter((profile) => profile.role === 'supervisor'));
  readonly waiters = computed(() => this.staff().filter((profile) => profile.role === 'user'));

  readonly inviteRoleOptions = computed(() => this.roleOptionsFor(this.currentUser()?.role ?? 'user'));
  readonly editRoleOptions = computed(() => this.roleOptionsFor(this.currentUser()?.role ?? 'user'));

  readonly inviteForm = this.fb.nonNullable.group({
    fullName: [''],
    email: ['', [Validators.required, Validators.email]],
    role: ['user' as UserRole],
    storeId: ['']
  });

  readonly editForm = this.fb.nonNullable.group({
    fullName: [''],
    role: ['user' as UserRole],
    storeId: ['']
  });

  constructor() {
    this.storeService.loadStores().catch(() => undefined);
    effect(() => {
      const stores = this.assignableSites();
      const selectedStoreId = this.selectedStoreId();
      const fallbackStoreId = selectedStoreId !== 'all' ? selectedStoreId : (stores[0]?.id ?? '');

      if (this.showSiteFilter() && fallbackStoreId && !this.inviteForm.controls.storeId.value) {
        this.inviteForm.controls.storeId.setValue(fallbackStoreId);
      }

      if (this.showSiteFilter() && fallbackStoreId && !this.editForm.controls.storeId.value) {
        this.editForm.controls.storeId.setValue(fallbackStoreId);
      }

      const allowedRoles = this.inviteRoleOptions();
      if (!allowedRoles.some((option) => option.value === this.inviteForm.controls.role.value)) {
        this.inviteForm.controls.role.setValue(allowedRoles[0]?.value ?? 'user');
      }

      this.load();
    });
  }

  private roleOptionsFor(actorRole: UserRole) {
    if (actorRole === 'admin' || actorRole === 'manager') {
      return [
        { value: 'manager' as UserRole, label: 'Manager' },
        { value: 'supervisor' as UserRole, label: 'Supervisor' },
        { value: 'user' as UserRole, label: 'Waiter' },
      ];
    }

    if (actorRole === 'supervisor') {
      return [
        { value: 'supervisor' as UserRole, label: 'Supervisor' },
        { value: 'user' as UserRole, label: 'Waiter' },
      ];
    }

    return [{ value: 'user' as UserRole, label: 'Waiter' }];
  }

  load(): void {
    const selectedStoreId = this.storeService.selectedStoreId();
    const params = selectedStoreId && selectedStoreId !== 'all' ? { storeId: selectedStoreId } : selectedStoreId === 'all' ? { storeId: 'all' } : undefined;

    this.http.get<Profile[]>(`${this.api}/staff`, { params }).subscribe({
      next: (profiles) => this.staff.set(profiles),
      error: (err) => toast.error(err.error?.error ?? 'Failed to load staff')
    });
  }

  initials(member: Profile): string {
    if (member.full_name) {
      return member.full_name.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2);
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

  canEditMember(member: Profile): boolean {
    const actorRole = this.currentUser()?.role;
    if (!actorRole || member.role === 'admin') {
      return false;
    }

    if (actorRole === 'admin' || actorRole === 'manager') {
      return member.id !== this.currentUser()?.id;
    }

    return actorRole === 'supervisor' && (member.role === 'supervisor' || member.role === 'user');
  }

  canDeleteMember(member: Profile): boolean {
    const actorRole = this.currentUser()?.role;
    if (!actorRole || !['admin', 'manager'].includes(actorRole)) {
      return false;
    }

    return member.id !== this.currentUser()?.id && member.role !== 'admin';
  }

  private isRecentlySeen(member: Profile): boolean {
    if (!member.last_seen_at) return false;
    return Date.now() - new Date(member.last_seen_at).getTime() < 5 * 60 * 1000;
  }

  async invite(): Promise<void> {
    const { fullName, email, role, storeId } = this.inviteForm.getRawValue();
    try {
      const targetStoreId = this.showSiteFilter() ? storeId || this.assignableSites()[0]?.id : undefined;
      if (this.showSiteFilter() && !targetStoreId) {
        toast.error('Select a site before sending the invite');
        return;
      }

      const res = await this.auth.inviteStaff(email, role, fullName || undefined, targetStoreId);
      toast.success('Invitation created for ' + email);
      this.inviteForm.reset({ fullName: '', email: '', role: this.inviteRoleOptions()[0]?.value ?? 'user', storeId: targetStoreId ?? '' });
      if (res?.inviteToken) {
        this.inviteLink.set(`${location.origin}/accept-invite?token=${res.inviteToken}`);
      } else {
        this.showInvite.set(false);
      }
      this.load();
    } catch (error: any) {
      toast.error(error.error?.error ?? 'Failed to invite');
    }
  }

  edit(member: Profile): void {
    this.selectedMember.set(member);
    this.editForm.reset({
      fullName: member.full_name ?? '',
      role: this.editRoleOptions().some((option) => option.value === member.role) ? member.role : 'user',
      storeId: member.store_id ?? this.assignableSites()[0]?.id ?? ''
    });
  }

  async saveEdit(): Promise<void> {
    const member = this.selectedMember();
    if (!member) {
      return;
    }

    try {
      const payload = this.editForm.getRawValue();
      await firstValueFrom(this.http.patch(`${this.api}/staff/${member.id}`, {
        full_name: payload.fullName,
        role: payload.role,
        storeId: this.showSiteFilter() ? payload.storeId : undefined,
      }));
      toast.success('Team member updated');
      this.closeEdit();
      this.load();
    } catch (error: any) {
      toast.error(error.error?.error ?? 'Failed to update team member');
    }
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.inviteLink());
    toast.success('Invite link copied!');
  }

  selectStore(event: Event): void {
    this.storeService.setSelectedStore((event.target as HTMLSelectElement).value);
  }

  remove(id: string): void {
    this.http.delete(`${this.api}/staff/${id}`).subscribe({
      next: () => {
        toast.success('Staff member removed');
        this.load();
      },
      error: (err) => toast.error(err.error?.error ?? 'Failed to remove')
    });
  }

  closeInvite(): void {
    this.inviteLink.set('');
    this.showInvite.set(false);
  }

  closeEdit(): void {
    this.selectedMember.set(null);
  }
}

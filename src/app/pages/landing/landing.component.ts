import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_45%,_#ffffff_100%)]">
      <div aria-hidden="true" class="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_20%_20%,_rgba(249,115,22,0.18),_transparent_34%),radial-gradient(circle_at_80%_0%,_rgba(15,23,42,0.08),_transparent_30%)]"></div>

      <!-- Nav -->
      <header class="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div class="flex items-center gap-2">
            <img ngSrc="logo.png" width="32" height="32" alt="ServeSync" class="h-8 w-8 rounded-lg shadow-sm" />
            <h1 class="text-xl font-extrabold text-primary">ServeSync</h1>
          </div>
          <div class="flex gap-2">
            <a routerLink="/login" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">Sign In</a>
            <a routerLink="/register" class="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-600">Get Started</a>
          </div>
        </div>
      </header>

      <!-- Hero -->
      <section class="mx-auto max-w-7xl px-4 pb-24 pt-16 md:pb-28 md:pt-20 lg:pb-32 lg:pt-24">
        <div class="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-12">
          <div class="text-center lg:text-left">
            <span class="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-accent shadow-sm">
              Built For Fast-Paced Service
            </span>
            <h2 class="mt-6 text-5xl font-black leading-[0.95] tracking-tight text-primary md:text-6xl lg:text-7xl">
              ServeSync keeps your
              <span class="text-accent">customers and staff in sync</span>
              during service.
            </h2>
            <p class="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 lg:mx-0 lg:text-xl">
              Help your staff manage multiple tables at once by letting customers request service, add items, or call a waiter using a simple QR code.
            </p>
            <div class="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a routerLink="/register" class="rounded-full bg-accent px-6 py-3.5 font-bold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-600">Start Free</a>
              <a href="#pricing" class="rounded-full border border-slate-300 bg-white px-6 py-3.5 font-bold text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5">View Pricing</a>
            </div>
            <p class="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500 lg:mx-0 lg:text-base">
              Serve more tables faster and increase orders for less than the cost of one meal per day.
            </p>
            <div class="mt-10 grid gap-3 sm:grid-cols-3">
              @for (stat of heroStats; track stat.label) {
                <div class="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-left shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
                  <p class="text-2xl font-black text-primary">{{ stat.value }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ stat.label }}</p>
                </div>
              }
            </div>
          </div>

          <div class="relative">
            <div aria-hidden="true" class="absolute inset-x-6 top-6 -z-10 h-full rounded-[2rem] bg-gradient-to-br from-orange-200/60 via-white to-slate-200 blur-2xl"></div>
            <div class="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Live Floor</p>
                  <p class="mt-1 text-lg font-black text-primary">Today's Service Snapshot</p>
                </div>
                <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Live</span>
              </div>

              <div class="mt-5 space-y-3">
                @for (preview of floorPreview; track preview.title) {
                  <div class="flex items-center justify-between rounded-2xl border px-4 py-4"
                    [class]="preview.accent === 'orange'
                      ? 'border-orange-200 bg-orange-50/70'
                      : preview.accent === 'slate'
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-emerald-200 bg-emerald-50/70'">
                    <div>
                      <p class="text-sm font-bold text-primary">{{ preview.title }}</p>
                      <p class="mt-1 text-sm text-slate-500">{{ preview.detail }}</p>
                    </div>
                    <span class="text-sm font-black"
                      [class]="preview.accent === 'orange'
                        ? 'text-accent'
                        : preview.accent === 'slate'
                          ? 'text-slate-600'
                          : 'text-emerald-600'">{{ preview.value }}</span>
                  </div>
                }
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl bg-primary p-4 text-white shadow-lg shadow-slate-200">
                  <p class="text-xs font-bold uppercase tracking-[0.24em] text-white/60">Customer Flow</p>
                  <p class="mt-3 text-3xl font-black">14</p>
                  <p class="mt-1 text-sm text-white/70">Active tables served without queue confusion.</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                  <p class="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Team Response</p>
                  <p class="mt-3 text-3xl font-black text-primary">02:14</p>
                  <p class="mt-1 text-sm text-slate-500">Average time to pick up a new request.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="mx-auto max-w-7xl px-4 pb-28">
        <div class="mb-10 flex flex-col gap-3 text-center md:mb-12">
          <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Why Teams Choose ServeSync</span>
          <h3 class="text-3xl font-black text-primary md:text-4xl">A smoother service flow from first order to final bill.</h3>
          <p class="mx-auto max-w-3xl text-base leading-7 text-slate-500 md:text-lg">The product stays simple for staff on the floor, but the experience feels tighter for customers and managers throughout the shift.</p>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          @for (f of features; track f.title) {
            <article class="rounded-[1.75rem] border border-slate-200/80 bg-white p-7 text-center shadow-[0_24px_60px_-38px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_30px_70px_-34px_rgba(15,23,42,0.45)]">
              <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 text-3xl shadow-inner">{{ f.icon }}</div>
              <h3 class="text-xl font-black text-primary">{{ f.title }}</h3>
              <p class="mt-3 text-sm leading-7 text-slate-600">{{ f.text }}</p>
            </article>
          }
        </div>
      </section>

      <!-- How It Works -->
      <section id="how-it-works" class="mx-auto max-w-7xl px-4 pb-28">
        <div class="mb-10 text-center md:mb-12">
          <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">How It Works</span>
          <h3 class="mt-3 text-3xl font-black text-primary md:text-4xl">Set up fast. Run smoother every shift.</h3>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          @for (step of steps; track step.num) {
            <div class="relative rounded-[1.75rem] border border-slate-200 bg-white p-7 text-center shadow-[0_24px_60px_-38px_rgba(15,23,42,0.35)]">
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-black text-white">{{ step.num }}</div>
              <h4 class="text-lg font-black text-primary">{{ step.title }}</h4>
              <p class="mt-2 text-sm leading-7 text-slate-500">{{ step.text }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Industries section intentionally hidden for launch.
           Keep the shortlist in the component for future vertical expansion. -->

      <!-- Pricing -->
      <section id="pricing" class="mx-auto max-w-7xl px-4 pb-24 pt-14 md:pt-18">
        <div class="rounded-[2rem] border border-slate-200/80 bg-white/80 px-5 py-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur md:px-8 md:py-10 lg:px-10 lg:py-12">
          <h3 class="mb-3 text-center text-3xl font-black text-primary">Simple, Transparent Pricing</h3>
          <p class="text-center text-slate-500 md:text-lg">Choose the plan that fits your business today.</p>
          <p class="mb-10 mt-3 text-center text-sm font-medium uppercase tracking-[0.18em] text-slate-400 md:text-base md:tracking-[0.22em]">Upgrade for more staff, better insight, and stronger multi-location control.</p>
          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            @for (plan of plans; track plan.name) {
              <div class="relative flex flex-col rounded-[1.75rem] border-2 p-7 shadow-[0_22px_55px_-38px_rgba(15,23,42,0.38)] transition-transform duration-200"
                [class]="plan.popular ? 'border-accent bg-gradient-to-b from-orange-50 to-white md:-translate-y-3' : 'border-slate-200 bg-white'">
                @if (plan.popular) {
                  <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow-lg shadow-orange-200">Most Popular</span>
                }
                <h4 class="text-xl font-black text-primary">{{ plan.name }}</h4>
                <p class="mt-2 text-sm leading-6 text-slate-500">{{ plan.tagline }}</p>
                <div class="mt-3 flex items-baseline gap-1">
                  <span class="text-4xl font-black text-primary">{{ plan.priceLabel }}</span>
                  @if (plan.unit) {
                    <span class="text-sm text-slate-500">{{ plan.unit }}</span>
                  }
                </div>
                <ul class="mt-6 flex-1 space-y-3">
                  @for (f of plan.features; track f) {
                    <li class="flex items-start gap-2 text-sm text-slate-700">
                      <span class="mt-0.5 text-accent">&#10003;</span>
                      <span>{{ f }}</span>
                    </li>
                  }
                  @for (f of plan.excluded; track f) {
                    <li class="flex items-start gap-2 text-sm text-slate-400 line-through">
                      <span class="mt-0.5">&#10005;</span>
                      <span>{{ f }}</span>
                    </li>
                  }
                </ul>
                <a routerLink="/register" class="mt-7 block rounded-full py-3 text-center text-sm font-bold transition-colors" [class]="plan.popular ? 'bg-accent text-white shadow-lg shadow-orange-200 hover:bg-orange-600' : 'bg-primary/10 text-primary hover:bg-primary/20'">{{ plan.cta }}</a>
              </div>
            }
          </div>

          <div class="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6 md:p-8">
            <div class="flex flex-col gap-3 text-center md:text-left">
              <span class="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Proof From The Floor</span>
              <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h4 class="text-2xl font-black text-primary">What each stage looks like in real service.</h4>
                  <p class="mt-2 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">Short examples from operators who needed cleaner handoffs, faster response times, and more control as they grew.</p>
                </div>
                <a routerLink="/case-studies" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-primary transition-colors hover:border-primary/40 hover:bg-primary/5">Read Case Studies</a>
              </div>
            </div>

            <div class="mt-8 grid gap-5 md:grid-cols-3">
              @for (story of proofStories; track story.tier) {
                <article class="rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.4)]">
                  <div class="flex items-center justify-between gap-3">
                    <span class="rounded-full bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">{{ story.tier }}</span>
                    <span class="text-xs font-semibold text-slate-400">{{ story.business }}</span>
                  </div>
                  <p class="mt-4 text-base font-bold leading-7 text-primary">“{{ story.quote }}”</p>
                  <p class="mt-4 text-sm leading-7 text-slate-500">{{ story.summary }}</p>
                  <p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{{ story.result }}</p>
                </article>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-primary">
        <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2">
            <img ngSrc="logo.png" width="24" height="24" alt="ServeSync" class="h-6 w-6 rounded" />
            <span class="text-sm font-bold text-white">ServeSync</span>
          </div>
          <nav class="flex flex-wrap items-center gap-4 text-sm font-medium text-white/70">
            <a routerLink="/case-studies" class="transition-colors hover:text-white">Case Studies</a>
            <a href="#pricing" class="transition-colors hover:text-white">Pricing</a>
            <a routerLink="/register" class="transition-colors hover:text-white">Get Started</a>
          </nav>
          <p class="text-sm text-white/60">&copy; {{ year }} ServeSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `
})
export class LandingComponent {
  readonly year = new Date().getFullYear();

  readonly heroStats = [
    { value: '3 min', label: 'Average order setup' },
    { value: 'Live', label: 'Floor notifications' },
    { value: 'QR Ready', label: 'Customer ordering' },
  ];

  readonly floorPreview = [
    { title: 'Table 06', detail: 'Bill requested and ready for closeout', value: '02:18', accent: 'orange' },
    { title: 'Table 11', detail: 'New item added from customer QR flow', value: 'Live', accent: 'slate' },
    { title: 'Table 03', detail: 'Service completed smoothly with no delays', value: 'Done', accent: 'green' },
  ];

  readonly features = [
    { icon: '📋', title: 'Manage Multiple Customers Easily', text: 'Track orders and requests across all tables or clients in real-time.' },
    { icon: '⚡', title: 'Reduce Waiting Time', text: 'Customers can call staff, add items, or request the bill without delays.' },
    { icon: '📈', title: 'Increase Efficiency', text: 'Serve more customers with less effort using a simple digital workflow.' },
  ];

  readonly steps = [
    { num: 1, title: 'Register Your Business', text: 'Create your account and set up your store in seconds.' },
    { num: 2, title: 'Create Orders & Generate QR', text: 'Add orders and share QR codes with customers.' },
    { num: 3, title: 'Customers Self-Serve', text: 'Staff track live alerts while customers order and request help.' },
  ];

  readonly industries = [
    { name: 'Restaurant', icon: '🍽️', enabled: true },
    // Strongest next verticals for ServeSync:
    // { name: 'Barbershop', icon: '💈', enabled: false },
    // { name: 'Hair Salon', icon: '💇', enabled: false },
    // { name: 'Lounge / VIP', icon: '🍸', enabled: false },
    // Good later expansions:
    // { name: 'Hotel Guest Services', icon: '🏨', enabled: false },
    // { name: 'Wine Estate Tasting Room', icon: '🍷', enabled: false },
    // { name: 'Clinic Waiting Room', icon: '🏥', enabled: false },
    // { name: 'Gaming Lounge / Internet Cafe', icon: '🎮', enabled: false },
    // { name: 'Repair Service Centre', icon: '🛠️', enabled: false },
    // { name: 'Food Court / Fast Casual', icon: '🍽️', enabled: false },
  ];

  readonly plans: ReadonlyArray<{
    name: string;
    tagline: string;
    priceLabel: string;
    unit: string;
    popular: boolean;
    cta: string;
    features: string[];
    excluded: string[];
  }> = [
    {
      name: 'Starter',
      tagline: 'A clean starting point for a single venue getting organized.',
      priceLabel: 'Free',
      unit: '',
      popular: false,
      cta: 'Get Started Free',
      features: [
        '1 store / location',
        'Up to 3 staff accounts',
        'Live order dashboard',
        'Customer requests and bill calls',
        'Manual custom-item order entry',
      ],
      excluded: [
        'Saved menu items',
        'Accept online payments',
        'Advanced analytics',
        'Multi-location management',
      ],
    },
    {
      name: 'Essentials',
      tagline: 'For smaller menu-based businesses that need more than free without jumping into full Professional.',
      priceLabel: 'R259',
      unit: '/month',
      popular: false,
      cta: 'Start Essentials',
      features: [
        '1 store / location',
        'Basic saved menu support',
        'Simple combos and line items',
        'Faster repeat order entry',
        'Lightweight business reporting',
      ],
      excluded: [
        'Advanced analytics',
        'Multi-location management',
        'Priority support',
      ],
    },
    {
      name: 'Professional',
      tagline: 'Built for growing teams that need better control across the floor.',
      priceLabel: 'R499',
      unit: '/month',
      popular: true,
      cta: 'Start Professional',
      features: [
        'Everything in Starter',
        'Up to 12 staff accounts',
        'Full menu management',
        'Accept online payments',
        'Advanced analytics',
        'Staff performance reporting',
      ],
      excluded: [
        'Multi-location management',
        'Priority support',
      ],
    },
    {
      name: 'Enterprise',
      tagline: 'For operators running multiple shops and more complex service teams.',
      priceLabel: 'From R450',
      unit: '/shop/month',
      popular: false,
      cta: 'Contact Sales',
      features: [
        'Everything in Professional',
        'Multiple shops and locations',
        'Centralized management across stores',
        'Priority support',
        'Custom branding',
        'Dedicated onboarding',
      ],
      excluded: [],
    },
  ];

  readonly proofStories = [
    {
      tier: 'Starter',
      business: 'Rosebank Corner Cafe',
      quote: 'We stopped shouting across the floor just to keep lunch service moving.',
      summary: 'A small team brought order tracking, bill calls, and live table requests into one clear flow without adding unnecessary process.',
      result: 'Clearer handoffs for a lean team',
    },
    {
      tier: 'Essentials',
      business: 'QuickPlate Kitchen',
      quote: 'The menu stayed simple, but saved items finally made repeat orders fast enough for a small team.',
      summary: 'Essentials fits smaller menu-driven businesses that need saved items and repeat ordering without jumping into the heavier Professional plan.',
      result: 'Stronger menu flow for small operators',
    },
    {
      tier: 'Professional',
      business: 'Durban Grill Room',
      quote: 'Once the floor got busier, we needed better visibility into who was handling what and where service was slipping.',
      summary: 'The team gained stronger reporting, clearer oversight, and a more manageable service flow during busy periods.',
      result: 'More control during peak service',
    },
    {
      tier: 'Enterprise',
      business: 'Atlantic Crest Hotels',
      quote: 'The biggest win was finally running multiple properties without every location becoming its own island.',
      summary: 'The group gained stronger property coordination, faster support, and better central oversight as more locations came online.',
      result: 'Stronger oversight across locations',
    },
  ];
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      <!-- Nav -->
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div class="flex items-center gap-2">
            <img src="logo.png" alt="ServeSync" class="h-8 w-8 rounded-lg" />
            <h1 class="text-xl font-extrabold text-primary">ServeSync</h1>
          </div>
          <div class="flex gap-2">
            <a routerLink="/login" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Sign In</a>
            <a routerLink="/register" class="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Get Started</a>
          </div>
        </div>
      </header>

      <!-- Hero -->
      <section class="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 class="text-5xl font-black leading-tight text-primary md:text-6xl">ServeSync</h2>
        <p class="mx-auto mt-4 max-w-2xl text-xl font-medium text-slate-700">
          Keep your clients and staff in sync during service.
        </p>
        <p class="mx-auto mt-3 max-w-xl text-slate-500">
          ServeSync helps any business that serves multiple clients manage orders, requests, and communication in real-time.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a routerLink="/register" class="rounded-lg bg-accent px-6 py-3 font-bold text-white hover:bg-orange-600">Get Started</a>
          <a href="#how-it-works" class="rounded-lg border-2 border-primary px-6 py-3 font-bold text-primary hover:bg-primary/5">See How It Works</a>
        </div>
      </section>

      <!-- Features -->
      <section class="mx-auto max-w-7xl px-4 pb-20">
        <div class="grid gap-6 md:grid-cols-3">
          @for (f of features; track f.title) {
            <article class="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl">{{ f.icon }}</div>
              <h3 class="text-lg font-bold text-primary">{{ f.title }}</h3>
              <p class="mt-2 text-sm text-slate-600">{{ f.text }}</p>
            </article>
          }
        </div>
      </section>

      <!-- How It Works -->
      <section id="how-it-works" class="mx-auto max-w-7xl px-4 pb-20">
        <h3 class="mb-8 text-center text-2xl font-black text-primary">How It Works</h3>
        <div class="grid gap-6 md:grid-cols-3">
          @for (step of steps; track step.num) {
            <div class="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">{{ step.num }}</div>
              <h4 class="font-bold text-primary">{{ step.title }}</h4>
              <p class="mt-1 text-sm text-slate-500">{{ step.text }}</p>
            </div>
          }
        </div>
      </section>

      <!-- Industries -->
      <section class="mx-auto max-w-7xl px-4 pb-20">
        <h3 class="mb-6 text-center text-2xl font-black text-primary">Built for service businesses</h3>
        <p class="mb-8 text-center text-slate-500">Restaurants, barbershops, salons, car washes, lounges and more.</p>
        <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          @for (ind of industries; track ind.name) {
            <div class="rounded-xl border border-slate-200 bg-white px-5 py-4 text-center">
              <div class="mb-2 text-3xl">{{ ind.icon }}</div>
              <div class="text-sm font-semibold text-slate-800">{{ ind.name }}</div>
              @if (!ind.enabled) {
                <span class="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">Coming Soon</span>
              }
            </div>
          }
        </div>
        <div class="mt-8 text-center">
          <a routerLink="/register" class="inline-block rounded-lg bg-accent px-6 py-3 font-bold text-white hover:bg-orange-600">Get Started Free</a>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="mx-auto max-w-7xl px-4 pb-20">
        <h3 class="mb-3 text-center text-2xl font-black text-primary">Simple, Transparent Pricing</h3>
        <p class="mb-10 text-center text-slate-500">Choose the plan that fits your business.</p>
        <div class="grid gap-6 md:grid-cols-3">
          @for (plan of plans; track plan.name) {
            <div class="relative flex flex-col rounded-2xl border-2 p-6" [class]="plan.popular ? 'border-accent bg-accent/5' : 'border-slate-200 bg-white'">
              @if (plan.popular) {
                <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-white">Most Popular</span>
              }
              <h4 class="text-lg font-bold text-primary">{{ plan.name }}</h4>
              <div class="mt-3 flex items-baseline gap-1">
                @if (plan.price === 0) {
                  <span class="text-3xl font-black text-primary">Free</span>
                } @else {
                  <span class="text-3xl font-black text-primary">R{{ plan.price }}</span>
                  <span class="text-sm text-slate-500">{{ plan.unit }}</span>
                }
              </div>
              <ul class="mt-5 flex-1 space-y-2.5">
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
              <a routerLink="/register" class="mt-6 block rounded-lg py-2.5 text-center text-sm font-bold transition-colors" [class]="plan.popular ? 'bg-accent text-white hover:bg-orange-600' : 'bg-primary/10 text-primary hover:bg-primary/20'">{{ plan.cta }}</a>
            </div>
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-primary">
        <div class="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
          <div class="flex items-center gap-2">
            <img src="logo.png" alt="ServeSync" class="h-6 w-6 rounded" />
            <span class="text-sm font-bold text-white">ServeSync</span>
          </div>
          <p class="text-sm text-white/60">&copy; {{ year }} ServeSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `
})
export class LandingComponent {
  readonly year = new Date().getFullYear();

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
    { name: 'Barbershop', icon: '💈', enabled: false },
    { name: 'Hair Salon', icon: '💇', enabled: false },
    { name: 'Car Wash', icon: '🚗', enabled: false },
    { name: 'Lounge', icon: '🍸', enabled: false },
  ];

  readonly plans = [
    {
      name: 'Starter',
      price: 'Free',
      unit: '',
      popular: false,
      cta: 'Get Started Free',
      features: [
        'Register your business',
        'Add your team members',
        'Create & manage orders',
        'QR code for customers',
        'Real-time notifications',
      ],
      excluded: [
        'Menu management',
        'Accept online payments',
      ],
    },
    {
      name: 'Professional',
      price: 500,
      unit: '/month',
      popular: true,
      cta: 'Start Professional',
      features: [
        'Everything in Starter',
        'Add up to 20 menu items',
        '1 store / location',
        'Accept online payments',
        'Priority support',
      ],
      excluded: [] as string[],
    },
    {
      name: 'Enterprise',
      price: 450,
      unit: '/shop per month',
      popular: false,
      cta: 'Contact Sales',
      features: [
        'Everything in Professional',
        'Multiple shops & locations',
        'Each shop manages own team & menu',
        'Accept online payments',
        'Dedicated account manager',
      ],
      excluded: [] as string[],
    },
  ];
}

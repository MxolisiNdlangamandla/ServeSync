import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-case-studies',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#f8fafc_48%,_#ffffff_100%)]">
      <header class="border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a routerLink="/" class="text-lg font-black text-primary">ServeSync</a>
          <div class="flex gap-2">
            <a routerLink="/" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">Home</a>
            <a routerLink="/register" class="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600">Get Started</a>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 pb-24 pt-14 md:pt-18">
        <section class="text-center">
          <span class="inline-flex rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-accent shadow-sm">Case Studies</span>
          <h1 class="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-tight text-primary md:text-6xl">How operators grow with ServeSync.</h1>
          <p class="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">Three simple examples of how service changes when teams move orders, requests, and floor coordination into one clearer system.</p>
        </section>

        <section class="mt-12 grid gap-6">
          @for (story of stories; track story.tier) {
            <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.35)] md:p-8">
              <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="rounded-full bg-primary/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">{{ story.tier }}</span>
                    <span class="text-sm font-semibold text-slate-400">{{ story.business }}</span>
                  </div>
                  <h2 class="mt-4 text-2xl font-black text-primary md:text-3xl">{{ story.headline }}</h2>
                </div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3 text-left md:min-w-64">
                  <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Best Fit</p>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ story.bestFit }}</p>
                </div>
              </div>

              <div class="mt-8 grid gap-5 md:grid-cols-3">
                <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-5">
                  <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Before</p>
                  <p class="mt-3 text-sm leading-7 text-slate-600">{{ story.before }}</p>
                </div>
                <div class="rounded-[1.5rem] border border-orange-200 bg-orange-50/70 p-5">
                  <p class="text-xs font-bold uppercase tracking-[0.18em] text-accent">Pain Points</p>
                  <ul class="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                    @for (pain of story.painPoints; track pain) {
                      <li class="flex gap-2">
                        <span class="text-accent">•</span>
                        <span>{{ pain }}</span>
                      </li>
                    }
                  </ul>
                </div>
                <div class="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-5">
                  <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">After ServeSync</p>
                  <p class="mt-3 text-sm leading-7 text-slate-700">{{ story.after }}</p>
                </div>
              </div>

              <div class="mt-6 rounded-[1.5rem] bg-primary px-5 py-5 text-white">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Operator Perspective</p>
                <p class="mt-3 text-lg font-bold leading-8">“{{ story.quote }}”</p>
              </div>
            </article>
          }
        </section>
      </main>
    </div>
  `,
})
export class CaseStudiesComponent {
  readonly stories = [
    {
      tier: 'Starter',
      business: 'Neighbourhood cafe',
      headline: 'A small cafe needed smoother service without adding more admin.',
      bestFit: 'Single-location teams getting their first structured floor workflow in place.',
      before: 'Orders, bill requests, and table updates were handled informally, which worked until the lunch rush put pressure on the whole floor at once.',
      painPoints: [
        'Staff depended on verbal updates across the room',
        'Customers waited too long to get attention for simple requests',
        'Managers had no clear live view of active service',
      ],
      after: 'The team brought order tracking and customer requests into one shared flow. Service stayed simple, but handoffs became far more consistent during busy periods.',
      quote: 'ServeSync gave us just enough structure to feel sharper without changing how we already work.',
    },
    {
      tier: 'Professional',
      business: 'Busy grill house',
      headline: 'A growing floor team needed better visibility, not more chaos.',
      bestFit: 'Operators with a larger team, heavier service windows, and a need for deeper insight into performance.',
      before: 'Dinner service was getting busier, the team was expanding, and managers needed a clearer way to see where requests, payments, and staff execution were slowing down.',
      painPoints: [
        'Peak periods made it hard to see which staff member was handling which table',
        'Managers lacked useful reporting once the shift ended',
        'Payment and floor coordination needed to feel more connected',
      ],
      after: 'The business gained stronger reporting, better payment flow, and clearer operational control. The floor felt more manageable because leaders could finally see patterns instead of reacting late.',
      quote: 'ServeSync helped us move from surviving the rush to actually managing it properly.',
    },
    {
      tier: 'Enterprise',
      business: 'Multi-branch hospitality brand',
      headline: 'A multi-location operator needed coordination across branches, not isolated systems.',
      bestFit: 'Brands managing more than one site and wanting more control over how operations scale from branch to branch.',
      before: 'Each location was solving service issues locally, which left leadership with inconsistent visibility and no reliable way to keep processes aligned across branches.',
      painPoints: [
        'Different branches drifted into different service habits',
        'Operational oversight weakened as new sites were added',
        'Support needed to move faster when issues affected multiple teams',
      ],
      after: 'The business gained a central view across locations while still allowing each branch to run its own floor. The result was cleaner oversight and a more scalable operating model.',
      quote: 'ServeSync gave us a better grip on growth because every branch stopped feeling like its own separate system.',
    },
  ];
}
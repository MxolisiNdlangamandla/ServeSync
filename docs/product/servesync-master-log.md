# ServeSync Master Product Log

## Purpose

This document is the working source of truth for ServeSync product decisions, rollout notes, pricing direction, feature scope, scaling ideas, and case-study content.

Use this file to:
- record what has already been decided
- keep a running product log as the app evolves
- separate launch features from future-version features
- track scaling ideas before they are activated
- keep case-study content ready for marketing and sales use

## Folder Location

This file is stored inside the project at `docs/product/` so it stays easy to find, easy to version, and separate from runtime code.

Recommended folder reference going forward:
- `docs/product/`

Recommended file reference going forward:
- `docs/product/servesync-master-log.md`

## Important Note About History

This file starts on 2026-03-25.

Anything before this date is a reconstructed baseline based on:
- the current codebase state
- the current UI copy
- the active pricing structure in the app
- product discussions captured during this project

From this point onward, new product decisions should be added here as they happen.

## Product Positioning

ServeSync is a service-flow platform for operators who need customers and staff to stay coordinated during active service.

Current strongest fit:
- restaurants
- cafes
- grill houses
- office-park food sellers
- takeaway counters
- hotels and guest-service environments
- lounges with live service flow
- tasting rooms and premium hospitality environments

Not the strongest immediate fit:
- salons with tightly fixed chair-based sessions
- barbershops where the whole interaction often stays one-to-one from start to finish

## Current Product Snapshot

Known working product areas already reflected in the codebase:
- register and login flow
- profile and store updates
- staff invites
- menu management
- current-plan visibility
- order workflow updates
- MySQL and Express backend in `server/`
- Angular frontend using same-origin `/api` in production

## Live Plans In The Current App

These are the plans currently represented by the live subscription model in the app:

### 1. Starter

Positioning:
- the free starting point for a single service business

Live value:
- 1 store or location
- up to 3 staff accounts
- live order dashboard
- customer requests and bill calls
- manual custom-item order flow

Current limits:
- no saved menu management
- no online payments
- no advanced analytics
- no multi-location oversight

### 2. Essentials

Positioning:
- the live paid step for smaller menu-based businesses that need more than free without moving straight to Professional

Live value:
- everything in Starter
- saved menu items
- faster repeat ordering
- one-location workflow for smaller operators

Current limits:
- no advanced analytics
- no online payments
- no multi-location oversight

### 3. Professional

Positioning:
- the live plan for growing teams that need stronger floor control

Live value:
- everything in Starter
- up to 12 staff accounts
- full menu management
- online payments
- advanced analytics
- staff performance reporting

Current limits:
- no multi-location management
- no enterprise onboarding/support layer

### 4. Enterprise

Positioning:
- the live plan for operators managing more than one branch or location

Live value:
- everything in Professional
- multiple shops and locations
- centralized management across stores
- priority support
- custom branding
- dedicated onboarding

Essentials target fit:
- small independent food businesses
- office-park lunch sellers
- takeaway kitchens
- compact menu-based service operators
- smaller vendors who need saved items and faster repeat ordering

Pricing note:
- live at R259 / month

## Pricing Direction

### Recommended public pricing ladder

1. Starter
- Free

2. Essentials
- R259 / month

3. Professional
- R499 / month

4. Enterprise
- From R450 / shop / month

## Dashboard Experience By Plan

The dashboard should make plan differences visible immediately after login.

### Starter dashboard should emphasize
- active orders
- staff alerts
- simple manual order creation
- upgrade prompts for saved menu items
- visibility that analytics, payments, and branch controls are still locked

### Essentials dashboard should emphasize
- menu-based ordering for small businesses
- saved menu items
- faster repeat order entry
- a cleaner paid step between Starter and Professional
- clear upgrade path to Professional for heavier volume

### Professional dashboard should emphasize
- stronger daily floor control
- menu performance visibility
- payment readiness
- advanced reporting
- clear indication that multi-location controls require Enterprise

### Enterprise dashboard should emphasize
- multi-location visibility
- branch-level oversight
- centralized management
- support and onboarding benefits
- stronger scaling controls

## Launch Scope Versus Later Scope

### Current launch-oriented scope

Keep focus on:
- service-provider flow
- single-location execution for most users
- fast order handling
- staff and customer coordination
- clean dashboard visibility
- Essentials as the live entry paid tier
- menu management for higher live plans

### Next version candidates

These are good features to hold for the next version rather than forcing into the current release:
- combo builder for menu-based vendors
- line-item modifiers and ingredient options
- more detailed menu performance reporting
- smarter upgrade prompts inside the product
- clearer plan comparison inside settings and dashboard
- onboarding tuned to business type

## Scaling Ideas

This section is reserved for ideas that are strong for growth but should be activated deliberately.

### Scaling backlog

- combo and bundle support for menu sellers
- branch comparison reporting for Enterprise
- centralized brand controls across branches
- role-based dashboards by operator type
- more industry-specific onboarding templates
- location performance summaries
- upsell prompts tied to plan limits
- industry packs for food, hotel, lounge, and hospitality operators

### Activation tracking

Use the status labels below whenever an idea changes state:
- backlog
- shortlisted
- approved
- in design
- in build
- released
- parked

## Decision Log

### 2026-03-25

- Created the master product log inside `docs/product/`.
- Agreed that the new mid-tier should be called Essentials.
- Activated Essentials as a live paid tier at R259 / month.
- Kept ServeSync focused on service-provider use cases where live customer-staff coordination matters most.
- Refined case-study direction away from car-wash examples and toward stronger hotel, lounge, and hospitality use cases.
- Reduced the case-study bank to one stronger example per industry to avoid repetition and keep the positioning clearer.

## Case Study Bank

These can be used in the site, pitch material, and future product pages.

### 1. Starter

Business:
- Rosebank Corner Cafe

Before:
- Orders, bill requests, and table updates were handled informally until the lunch rush created confusion.

Pain points:
- staff relied on verbal updates
- customers waited too long for simple requests
- managers had no live floor view

After ServeSync:
- the team used one shared service flow for requests and order progress without adding heavy admin

### 2. Essentials

Business:
- QuickPlate Kitchen

Before:
- Popular repeat meals were sold all day, but every order still needed too much manual input.

Pain points:
- repeat orders took too long to enter
- saved items were missing from the workflow
- the business needed a paid plan between free and full Professional

After ServeSync:
- Essentials gives the operator saved menu items and faster repeat order entry without pushing them into a heavier operating layer

### 3. Professional

Business:
- Durban Grill Room

Before:
- A growing floor team needed stronger visibility into requests, payments, and staff execution during peak service.

Pain points:
- hard to see who was handling which table
- reporting after the shift was too weak
- the team reacted late during rush periods

After ServeSync:
- the business gained stronger floor visibility, better reporting, and tighter service control during dinner rushes

### 4. Professional

Business:
- Sandton Suites Hotel

Before:
- Guest-service requests moved across multiple teams, but the hotel still needed one clear live service flow to keep handoffs sharp.

Pain points:
- service updates were fragmented
- guest follow-up depended on scattered communication
- managers could not see live workload clearly enough

After ServeSync:
- the hotel gained a clearer live dashboard for active requests and better coordination across guest-service teams

### 5. Professional

Business:
- Cape Quarter Lounge

Before:
- The team wanted smoother floor coordination, but service still depended too much on manually spotting who needed attention next.

Pain points:
- requests were easy to miss during busy periods
- managers had weak live oversight of service bottlenecks
- high-touch service still needed structure behind the scenes

After ServeSync:
- the team kept the customer experience polished while making requests and service flow far easier to manage in real time

### 6. Professional

Business:
- Willow Events Kitchen

Before:
- Function service relied on runners, kitchen staff, and floor staff passing updates across multiple moving parts.

Pain points:
- request handoff between teams was inconsistent
- managers struggled to spot delays early enough
- busy events exposed every communication gap

After ServeSync:
- the venue gained a clearer live request flow during peak function periods

### 7. Professional

Business:
- Silver Oak Tasting Room

Before:
- Weekend traffic was strong, but staff still depended on manually spotting which tables needed another round, payment, or assistance.

Pain points:
- busy periods made table attention uneven
- guests waited longer for follow-up than they should have
- managers could not easily see where service was slipping

After ServeSync:
- the team gained better live visibility while keeping the guest experience relaxed

### 8. Enterprise

Business:
- Atlantic Crest Hotels

Before:
- Each branch handled service flow in its own way, which weakened oversight as the brand expanded.

Pain points:
- branch processes drifted apart
- leaders had weak cross-site visibility
- support became harder as more branches launched

After ServeSync:
- the business gained centralized visibility while each location still kept control of its own daily floor


## Ongoing Update Template

Use this section format for future entries.

### YYYY-MM-DD

- what changed
- why it changed
- whether it is live, planned, or parked
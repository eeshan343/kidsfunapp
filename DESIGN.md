# Design Brief

## Direction

Neon Playground — playful neon theme with focused additions for admin-claim and merged Games Hub Scary category.

## Tone

Vibrant neon-on-dark arcade aesthetic; existing design language preserved, only scoped accents added.

## Differentiation

A single amber-glowing admin-claim moment and a blood-red Scary category accent that flickers — both extend the neon system, never replace it.

## Color Palette

| Token          | OKLCH (dark)       | Role                                |
| -------------- | ------------------ | ----------------------------------- |
| background     | 15% 0.02 264       | app base (unchanged)                |
| foreground     | 98% 0.01 264       | text (unchanged)                    |
| primary        | 70% 0.25 264       | brand neon (unchanged)              |
| accent         | 75% 0.2 330        | pink highlight (unchanged)          |
| scary          | 62% 0.26 350       | Scary category accent (NEW)         |
| scary-glow     | 68% 0.30 350       | Scary neon glow (NEW)               |
| admin-claim     | 82% 0.20 75        | admin-claim CTA amber (NEW)         |
| admin-claim-glow | 86% 0.24 75       | admin-claim neon glow (NEW)         |

## Typography

- Display: Luckiest Guy — hero/section headers (unchanged)
- Body: Varela Round / Poppins — UI text (unchanged)
- Scale: hero `font-hero`, section `font-section`, body default sans

## Elevation & Depth

Neon box-shadows layered by intensity (`shadow-neon-sm/md/lg`, `shadow-scary-md/lg`, `shadow-admin-claim-md/lg`); no flat surfaces on interactive cards.

## Structural Zones

| Zone          | Background  | Border                | Notes                              |
| ------------- | ----------- | --------------------- | ---------------------------------- |
| Header        | bg-card     | border-b border-border| unchanged                          |
| Content       | bg-background | —                   | Games Hub grid + admin-claim card  |
| Admin-claim   | bg-card     | admin-claim-border    | centered card, amber pulse glow    |
| Scary games   | bg-card     | scary-border          | per-card red glow when filter on    |

## Spacing & Rhythm

Section gaps `gap-6 md:gap-8`; admin-claim card `p-8 md:p-10` with generous breathing room; Scary category chips inline with existing category filters.

## Component Patterns

- Admin-claim card: rounded-lg, `shadow-admin-claim-lg`, `animate-admin-claim-pulse`, amber CTA button
- Scary filter chip: pill, `bg-scary/15`, `text-scary`, `shadow-scary-md` when active
- Scary game card: `shadow-scary-md`, `scary-flicker` on title, red accent border on hover

## Motion

- Entrance: admin-claim card fades + scales in (200ms); Scary chips slide in
- Hover: Scary cards intensify glow; admin-claim CTA brightens
- Decorative: `admin-claim-pulse` 2.4s breathing glow; `scary-flicker` 3s opacity flicker

## Constraints

- Do NOT redesign existing neon theme — additive tokens only
- Do NOT build multiple-admin UI, admin revocation, or art-gallery moderation tools
- Scary accent applies only to Scary-category games, not the whole hub

## Signature Detail

The admin-claim card's amber breathing glow signals a one-time, irreversible moment — distinct from every other neon color in the app so the user feels the weight of "first claim wins."

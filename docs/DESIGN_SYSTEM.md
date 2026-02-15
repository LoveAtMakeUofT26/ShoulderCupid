# Cupid Design System

## Brand Identity

**Tagline**: "Your AI Wingman. In Your Ear."

**Vibe**: Mythic Dating Sim
- Greek mythology aesthetic (Cupid as a god, marble, warmth)
- Visual novel character presentation
- Playful dating app energy
- Mobile-first PWA

---

## Color Palette

### Light Theme (Default)
```css
/* Primary */
--color-primary: #E8566C;        /* Cupid Pink */
--color-primary-dark: #D14459;   /* Hover/active */
--color-primary-light: #FFEAED;  /* Backgrounds */

/* Accent */
--color-accent: #C9A962;         /* Gold/bronze */
--color-accent-light: #F5EDD8;   /* Subtle gold bg */

/* Backgrounds */
--color-bg-primary: #FAF7F5;     /* Warm marble white */
--color-bg-card: #FFFFFF;        /* Cards */
--color-bg-elevated: #FFF9F5;    /* Elevated surfaces */

/* Text */
--color-text-primary: #2D2A32;   /* Main text */
--color-text-secondary: #6B6573; /* Muted text */
--color-text-inverse: #FFFFFF;   /* On dark bg */

/* Status */
--color-success: #4CAF50;
--color-warning: #FFC107;
--color-error: #E53935;
```

### Dark Theme (Toggle-able via `.dark` class)
```css
/* Backgrounds */
--color-bg: #0F0F11;              /* Deep dark */
--color-surface: #1A1A1F;         /* Cards */
--color-surface-elevated: #222228; /* Elevated surfaces */
--color-surface-hover: #2A2A32;   /* Hover state */

/* Text */
--color-text: #F5F0EC;            /* Warm off-white */
--color-text-secondary: #B0AAA4;
--color-text-tertiary: #8A8480;
--color-text-faint: #5A5550;

/* Borders */
--color-border: #2A2A32;
--color-border-strong: #3A3A44;

/* Primary — lighter pink for dark bg contrast */
--color-primary: #F07A8C;
--color-primary-hover: #E8566C;
--color-primary-surface: rgba(232, 86, 108, 0.15);
--color-primary-text: #F07A8C;

/* Accent */
--color-accent: #C9A962;
--color-accent-surface: rgba(201, 169, 98, 0.15);

/* Shadows — higher opacity for dark backgrounds */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-marble: 0 10px 40px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
```

### Gender-Adaptive Accents (Post-MVP)
```css
/* Masculine mode */
--color-primary: #5C6BC0;        /* Indigo */
--color-accent: #C9A962;

/* Feminine mode */
--color-primary: #E8566C;        /* Pink */
--color-accent: #C9A962;

/* Neutral mode */
--color-primary: #7E57C2;        /* Purple */
--color-accent: #C9A962;
```

---

## Typography

```css
/* Font Stack */
--font-display: 'Playfair Display', serif;  /* Headings - classical feel */
--font-body: 'Inter', system-ui, sans-serif; /* Body - clean, readable */

/* Scale (mobile-first) */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 2rem;      /* 32px */
--text-4xl: 2.5rem;    /* 40px */
```

---

## Spacing & Layout

```css
/* Base unit: 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */

/* Mobile viewport */
--max-width-mobile: 428px;
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
```

---

## Components

### Cards
```css
/* Base card */
border-radius: 16px;
background: var(--color-bg-card);
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
padding: var(--space-4);

/* Elevated card (coach cards) */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
```

### Buttons
```css
/* Primary button */
background: var(--color-primary);
color: white;
border-radius: 12px;
padding: 14px 24px;
font-weight: 600;
/* Touch target: min 44px height */

/* Secondary button */
background: transparent;
border: 2px solid var(--color-primary);
color: var(--color-primary);

/* Ghost button */
background: var(--color-primary-light);
color: var(--color-primary);
```

### Bottom Navigation
```css
/* Tab bar */
height: 64px;
padding-bottom: var(--safe-area-bottom);
background: var(--color-bg-card);
border-top: 1px solid rgba(0, 0, 0, 0.06);

/* Tab item */
min-width: 64px;
/* Active: primary color */
/* Inactive: secondary text */
```

### Floating Action Button
```css
/* Start Session FAB */
position: fixed;
bottom: calc(64px + var(--safe-area-bottom) + 16px);
right: 16px;
width: 56px;
height: 56px;
border-radius: 16px;
background: var(--color-primary);
box-shadow: 0 4px 12px rgba(232, 86, 108, 0.4);
```

---

## Coach Avatars

### Placeholder Style (MVP)
- Circular avatar, 80px diameter
- Gradient background based on coach personality
- Cupid wing icon or initials
- Subtle marble texture overlay

### Final Style (Post-MVP)
- Chibi/cute illustrated characters
- Consistent art style across all coaches
- Expressions that match personality
- AI-generated with style prompts

### Coach Color Mapping
AI-generated coaches receive dynamic `color_from` / `color_to` gradient attributes from the generation pipeline. Example seed coaches:
```
Smooth Operator: Rose gold gradient (#E8566C → #F5A3B1)
Wingman Chad:    Blue/purple gradient (#5C6BC0 → #7E57C2)
Gentle Guide:    Warm cream gradient (#C9A962 → #E8D5A9)
```
New coaches generated via Gemini receive unique color palettes based on personality traits.

---

## Navigation Structure

### Desktop Sidebar (>= 768px)
- Fixed left sidebar (260px width)
- Warm gradient background
- User profile section at top
- Navigation links with icons and active accent bar
- Theme toggle (light/dark/system) at bottom
- "Start Session" CTA button with glow
- Component: `SideNav.tsx`

### Mobile Bottom Tab Bar (< 768px)
```
[Dashboard] [Coaches] [Sessions] [Settings]
    🏠         💘         📝         ⚙️
```
- Component: `BottomNav.tsx`
- Responsive hook: `useIsDesktop()` at 768px breakpoint

### Floating Action Button (Mobile only)
- Shows on Dashboard and Sessions tabs
- "Start Session" primary action

---

## Motion & Animations

### Principles
- Playful but not distracting
- Fast (200-300ms) for micro-interactions
- Smooth easing (ease-out for enters, ease-in for exits)

### Animations to Include
- Page transitions: Slide left/right
- Cards: Subtle scale on press (0.98)
- FAB: Gentle pulse when idle
- Success states: Confetti or hearts
- Coach selection: Heart burst animation

---

## Iconography

### Style
- Rounded, friendly icons
- 24px default size
- 2px stroke weight
- Lucide React or Heroicons (rounded)

### Custom Icons
- Cupid wings (brand mark)
- Heart with arrow
- Speech bubble with heart
- AI sparkle

---

## Voice & Tone

### UI Copy
- Friendly and encouraging
- Light humor welcome
- Use "you" and "your coach"
- Avoid jargon

### Examples
```
Good: "Ready to charm? Your coach is standing by."
Bad:  "Initiate coaching session."

Good: "Nice choice! Smooth Operator has your back."
Bad:  "Coach selected successfully."

Good: "Oops! Something went wrong. Let's try again."
Bad:  "Error 500: Server error."
```

---

## Responsive Breakpoints

```css
/* Mobile-first */
/* Default: 0-428px (phone) */

@media (min-width: 428px) {
  /* Large phone / small tablet */
}

@media (min-width: 768px) {
  /* Tablet - show side nav */
}

@media (min-width: 1024px) {
  /* Desktop - max-width container */
}
```

---

## Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        cupid: {
          50: '#FFEAED',
          100: '#FFD5DA',
          200: '#FFABB5',
          300: '#F5A3B1',
          400: '#F07A8C',
          500: '#E8566C',
          600: '#D14459',
          700: '#B33347',
          800: '#8C2636',
          900: '#661A26',
        },
        gold: {
          50: '#F5EDD8',
          100: '#EDE0C0',
          200: '#E0CDA0',
          300: '#D4BA80',
          400: '#C9A962',
          500: '#B8944D',
          600: '#9A7A3D',
          700: '#7C602E',
          800: '#5E4720',
          900: '#402F12',
        },
        marble: {
          50: '#FAF7F5',
          100: '#F5F0EC',
          200: '#EDE5DE',
          300: '#E0D5CC',
          400: '#D0C2B5',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
}
```

---

## File Structure (Frontend)

```
apps/frontend/src/
├── components/
│   ├── ui/              # Base components (Button, Card, Spinner)
│   ├── layout/          # AppShell, BottomNav, SideNav
│   ├── coaches/         # SwipeCard, CoachDetailModal, VoicePreviewButton, DeleteCoachModal
│   ├── session/         # CameraViewport, TranscriptionStatus
│   └── onboarding/      # CoachSelectStep (swipe-integrated)
├── pages/
│   ├── LandingPage.tsx  # Public landing/login
│   ├── DashboardPage.tsx
│   ├── CoachesPage.tsx
│   ├── CoachDiscoveryPage.tsx  # Tinder-style swipe discovery
│   ├── SessionsPage.tsx
│   ├── SessionReportPage.tsx
│   ├── LiveSessionPage.tsx
│   ├── SettingsPage.tsx
│   └── PreflightPage.tsx
├── hooks/
│   ├── useThemeStore.ts    # Light/dark/system theme state
│   ├── useIsDesktop.ts     # Responsive breakpoint (768px)
│   ├── useSessionSocket.ts
│   └── usePreflightChecks.ts
├── services/
│   ├── coachService.ts     # Coach generation + roster API
│   ├── transcriptionService.ts
│   └── auth.ts
└── index.css               # CSS custom properties (light + dark tokens)
```

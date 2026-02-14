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

### Dark Theme (Toggle-able)
```css
/* Primary stays same */
--color-primary: #E8566C;
--color-primary-dark: #F06B7F;

/* Backgrounds */
--color-bg-primary: #1A1721;     /* Deep purple-black */
--color-bg-card: #252231;
--color-bg-elevated: #2D2A38;

/* Text */
--color-text-primary: #F5F3F7;
--color-text-secondary: #9B95A3;
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
```
Smooth Operator: Rose gold gradient (#E8566C → #F5A3B1)
Wingman Chad:    Blue/purple gradient (#5C6BC0 → #7E57C2)
Gentle Guide:    Warm cream gradient (#C9A962 → #E8D5A9)
```

---

## Navigation Structure

### Bottom Tab Bar
```
[Dashboard] [Coaches] [Sessions] [Settings]
    🏠         💘         📝         ⚙️
```

### Floating Action Button
- Shows on Dashboard and Sessions tabs
- "Start Session" primary action
- Pulses subtly to draw attention

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
│   ├── ui/              # Base components (Button, Card, Input)
│   ├── layout/          # AppShell, BottomNav, Header
│   ├── coach/           # CoachCard, CoachAvatar, CoachList
│   └── session/         # SessionCard, LiveSession
├── pages/
│   ├── HomePage.tsx     # Landing/login
│   ├── DashboardPage.tsx
│   ├── CoachesPage.tsx
│   ├── SessionsPage.tsx
│   ├── SettingsPage.tsx
│   └── LiveSessionPage.tsx
├── hooks/
├── services/
├── stores/
└── styles/
    └── globals.css      # CSS variables + base styles
```

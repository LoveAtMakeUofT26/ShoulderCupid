# Epic 8: Landing Page & Payments

**Goal**: Marketing landing page and Solana payment integration

**Labels**: `phase-4`, `frontend`, `payments`

---

## Tasks

### Task 8.1: Landing Page - Hero Section
- [ ] Create `LandingPage` component
- [ ] Hero section:
  - Catchy headline: "Your AI Wingman. In Your Ear."
  - Subheadline explaining the value
  - CTA: "Get Started" → login/signup
  - Hero image/illustration of glasses
- [ ] Responsive design (mobile-first)

**Acceptance Criteria**: Compelling hero that explains the product

---

### Task 8.2: Landing Page - Features Section
- [ ] How it works (3 steps):
  1. Wear the glasses
  2. Approach someone
  3. Get real-time coaching
- [ ] Key features:
  - Person detection
  - Emotion reading
  - Real-time advice
  - Post-session reports
- [ ] Visual icons/illustrations for each

**Acceptance Criteria**: Clear feature explanation

---

### Task 8.3: Landing Page - Coach Showcase
- [ ] Coach personality previews:
  - Avatar
  - Name
  - Tagline
  - Sample quote
- [ ] "Meet your coaches" section
- [ ] Carousel or grid layout

**Acceptance Criteria**: Coaches feel like characters users want to meet

---

### Task 8.4: Landing Page - Social Proof
- [ ] Testimonials section (placeholder for now)
- [ ] Stats section:
  - "X conversations coached"
  - "X% success rate improvement"
- [ ] Press/sponsor logos
- [ ] Hackathon badges (if applicable)

**Acceptance Criteria**: Trust-building social proof

---

### Task 8.5: Landing Page - Pricing Section
- [ ] Pricing tiers:
  - Free: X sessions/month
  - Pro: Unlimited + premium coaches
  - (Define actual tiers)
- [ ] Feature comparison table
- [ ] CTA for each tier
- [ ] "Powered by Solana" badge

**Acceptance Criteria**: Clear pricing options

---

### Task 8.6: Landing Page - Footer
- [ ] Navigation links
- [ ] Social media links
- [ ] Legal links (Privacy, Terms)
- [ ] Sponsor acknowledgments
- [ ] Copyright

**Acceptance Criteria**: Professional footer

---

### Task 8.7: Solana Wallet Integration
- [ ] Install `@solana/web3.js` and wallet adapter
- [ ] Create `useSolanaWallet` hook
- [ ] Add "Connect Wallet" button
- [ ] Support Phantom, Solflare wallets
- [ ] Display connected wallet address
- [ ] Store wallet address in user profile

**Acceptance Criteria**: Users can connect Solana wallet

---

### Task 8.8: Subscription Payment Flow
- [ ] Create `SubscriptionPage` component
- [ ] Display current plan
- [ ] Show upgrade options
- [ ] Implement Solana Pay:
  - Generate payment request
  - QR code for mobile wallets
  - Direct pay button for browser wallets
- [ ] Verify payment on-chain
- [ ] Update user subscription in database
- [ ] Show confirmation

**Acceptance Criteria**: Users can pay for subscription with Solana

---

### Task 8.9: Payment Verification Backend
- [ ] Create `services/solana.ts`
- [ ] Implement payment verification:
  - Check transaction signature
  - Verify amount + recipient
  - Confirm on-chain
- [ ] Implement `POST /api/subscribe`
- [ ] Webhook for payment confirmation (optional)
- [ ] Handle failed/pending payments

**Acceptance Criteria**: Payments are verified and subscriptions activated

---

### Task 8.10: Subscription Management
- [ ] Show subscription status in settings
- [ ] Display renewal date
- [ ] Payment history
- [ ] Cancel subscription option
- [ ] Downgrade flow (end of billing period)
- [ ] Re-subscribe flow

**Acceptance Criteria**: Users can manage their subscription

---

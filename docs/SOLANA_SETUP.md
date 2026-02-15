# Solana Payment Setup

## 1. Install Phantom Wallet

1. Go to [phantom.app](https://phantom.app/) and install the browser extension
2. Create a new wallet or import existing one
3. **Save your recovery phrase somewhere safe**
4. Copy your wallet's public key (click the address at top to copy)

## 2. Devnet Configuration (Development)

### Switch Phantom to Devnet

1. Open Phantom > Settings (gear icon) > Developer Settings
2. Toggle "Testnet Mode" ON
3. Select "Solana Devnet"

### Get Devnet SOL (for transaction fees)

```bash
# Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Airdrop 2 SOL to your wallet
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url https://api.devnet.solana.com
```

Or use the [Solana Faucet](https://faucet.solana.com/) — paste your address and request devnet SOL.

### Get Devnet USDC

For devnet testing, we use a test USDC token. You'll need to:

1. Create a test SPL token mint on devnet, OR
2. Use the devnet USDC address: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

To get test USDC tokens:
```bash
# Create an associated token account and mint test tokens
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --url devnet
spl-token mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU 100 --url devnet
```

Or use a devnet USDC faucet if available.

## 3. Environment Variables

### Backend (`apps/backend/.env`)

```env
# Solana Payment Config
SOLANA_RECIPIENT_WALLET=<your-phantom-wallet-public-key>
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Frontend (`apps/frontend/.env`)

```env
# Solana Config
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 4. USDC Mint Addresses

| Network | USDC Mint Address |
|---------|-------------------|
| Devnet | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Mainnet | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

## 5. Testing the Payment Flow

1. Start the backend and frontend in dev mode
2. Log in and discover some coaches (they'll have prices)
3. Use your first 3 sessions for free (no payment needed)
4. On session 4, the payment modal will appear
5. Connect your Phantom wallet (devnet mode)
6. Approve the USDC transfer in Phantom
7. Payment gets verified on-chain and session starts

## 6. Production Checklist

When going live:

- [ ] Switch `SOLANA_NETWORK` to `mainnet-beta` in both backend and frontend .env
- [ ] Use a production RPC provider (free tiers available):
  - [Helius](https://helius.dev/) — free tier: 500K requests/month
  - [QuickNode](https://quicknode.com/) — free tier available
  - [Alchemy](https://alchemy.com/) — free tier available
- [ ] Update `SOLANA_RPC_URL` and `VITE_SOLANA_RPC_URL` to your provider's URL
- [ ] The USDC mint address is handled automatically (mainnet-beta uses the real USDC)
- [ ] Create a dedicated recipient wallet (not your personal wallet)
- [ ] Store wallet keypair securely (the public key is all the backend needs)
- [ ] Test a real USDC payment with a small amount first

## How It Works

```
User clicks "Start Session"
    |
    v
Backend checks: sessions_this_month < 3?
    |
    YES --> Free session, no payment needed
    |
    NO --> Returns payment request with:
           - Solana Pay URL (recipient, amount, USDC mint, reference)
           - Amount based on coach pricing tier
    |
    v
Frontend shows payment modal
    --> User connects Phantom wallet
    --> Signs USDC transfer transaction
    |
    v
Backend polls Solana blockchain for transaction
    --> findReference() locates the tx by reference key
    --> validateTransfer() confirms amount + recipient
    --> Marks payment as confirmed in MongoDB
    |
    v
Session starts with paymentId linked
```

### Pricing Tiers (auto-assigned to AI-generated coaches)

| Tier | 5 min | 15 min | 30 min |
|------|-------|--------|--------|
| Budget | $0.50 | $1.50 | $3.00 |
| Standard | $1.00 | $3.00 | $5.00 |
| Premium | $2.00 | $5.00 | $8.00 |

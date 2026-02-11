# 🪙 Coin Toss Blitz

A live multiplayer coin toss tournament game for 10 players. Bet, flip, and compete to be the last player standing!

## Features

- **Real-time multiplayer**: 10 players compete simultaneously with WebSocket synchronization
- **Pot-based betting**: Unequal bets create dynamic pots - winner takes all, loser loses all
- **Bot opponents**: Game auto-fills with AI players if less than 10 humans join
- **Host controls**: Admin can start, pause, reset the game
- **Elimination mechanic**: Players at 0 chips are eliminated but can still influence outcomes (cruel!)
- **Tiebreaker system**: Chip ties broken by average lock-in speed
- **Mobile-first design**: Optimized for mobile browsers

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **Real-time**: Partykit (WebSocket server on edge)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Hosting**: Vercel (frontend) + Partykit (WebSocket)

## Setup

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd coin-toss-blitz
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.local.example .env.local
```

For local development, the default `.env.local` is already configured:
```
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

### Running Locally

You need to run both the Next.js app and the Partykit server:

**Terminal 1: Start Partykit server**
```bash
npx partykit dev
```

This starts the WebSocket server on `localhost:1999`.

**Terminal 2: Start Next.js app**
```bash
npm run dev
```

This starts the frontend on `http://localhost:3000`.

### Project Structure

```
coin-toss-blitz/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── game/[roomId]/page.tsx   # Main game page
│   └── globals.css              # Global styles (Tailwind)
├── components/                   # React components
│   ├── BettingPanel.tsx         # Betting interface
│   ├── CoinFlip.tsx             # Coin flip animation
│   ├── GamePhase.tsx            # Phase-based rendering
│   ├── HostControls.tsx         # Admin controls
│   └── Leaderboard.tsx          # Player rankings
├── lib/                          # Utilities and state
│   ├── types/game.ts            # TypeScript interfaces
│   ├── stores/gameStore.ts      # Zustand store
│   ├── hooks/useGameConnection.ts # WebSocket hook
│   └── utils/
│       ├── potCalculation.ts    # Pot-based scoring logic
│       └── tiebreaker.ts        # Tiebreaker calculations
├── party/                        # Partykit server
│   ├── server.ts                # Game server logic
│   └── botLogic.ts              # Bot AI behavior
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
└── partykit.json                 # Partykit config
```

## Game Rules

### Setup
- **10 players** per game (humans + bots)
- **100 chips** starting amount
- **10 rounds** total

### Betting Phase (30 seconds per round)
- **Active players** (>0 chips): Bet 10, 25, or 50 chips
- **All-in option**: Only available in round 10
- **Eliminated players** (0 chips): Bet 0, 10, or 25 chips
- Players can change bet freely until clicking "Lock In"
- Timeout assigns random bet (excludes all-in)

### Scoring (Pot-Based)
- **Pot** = Player 1 bet + Player 2 bet
- **Winner**: Gets pot ADDED (+pot)
- **Loser**: Gets pot SUBTRACTED (-pot)
- **Eliminated players CANNOT win back chips** - stay at 0 forever
- Example: P1 bets 10, P2 bets 25 → Pot = 35 → If P1 wins: P1 +35, P2 -35

### Elimination
- Players at 0 chips are "eliminated"
- Eliminated players can still bet and affect outcomes
- Eliminated winners: Opponent loses pot, eliminated stays at 0
- Eliminated losers: Opponent wins pot, eliminated stays at 0

### Final Standing
1. **Primary**: Chip count (descending)
2. **Tiebreaker**: Average lock-in time (faster wins)

## Deployment

### Deploy to Vercel + Partykit

1. **Deploy Partykit server**

```bash
npx partykit deploy
```

Copy the provided URL (e.g., `your-project.partykit.dev`).

2. **Update environment variable**

Add to `.env.local` and Vercel dashboard:
```
NEXT_PUBLIC_PARTYKIT_HOST=your-project.partykit.dev
```

3. **Deploy Next.js to Vercel**

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Next.js.

4. **Add environment variable to Vercel**

In Vercel dashboard → Settings → Environment Variables:
- Key: `NEXT_PUBLIC_PARTYKIT_HOST`
- Value: `your-project.partykit.dev`

### Cost

- **Free tier**: $0/month (Vercel + Partykit free tiers)
- **Scaling**: ~$20-50/month for 100+ concurrent players

## Development

### Key Files to Modify

- **Game logic**: `party/server.ts` - State machine, message handlers
- **Bot behavior**: `party/botLogic.ts` - AI betting strategy
- **Type definitions**: `lib/types/game.ts` - Interfaces
- **Scoring**: `lib/utils/potCalculation.ts` - Pot calculations
- **UI components**: `components/` - React components

### Testing Checklist

See plan file for comprehensive testing checklist with 32 test cases covering:
- Basic flow (host, bots, pairing)
- Betting mechanics (lock-in, timeout, all-in restriction)
- Pot-based scoring (unequal bets, eliminated players)
- Synchronization & display
- Host controls
- Tiebreaker logic
- Edge cases

## Future Enhancements

- Password-based host authentication
- Multiple rooms/lobbies
- Persistent leaderboard (Upstash Redis)
- Spectator mode for eliminated players
- Custom bet amounts
- Adjustable timer duration
- Chat functionality
- Sound effects & haptic feedback
- PWA for installability

## License

MIT License - Copyright 2026 Steven Albers
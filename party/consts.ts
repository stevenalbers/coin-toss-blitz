export const ROUND_TIME = 15000
export const COIN_FLIP_COUNTDOWN_SECONDS = 30

export const BET_OPTIONS = {
    low: [1, 5, 10, 15],
    high: [5, 10, 25, 50],
    eliminated: [0, 1]
}

/**
 * Animation timing constants (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
    // Number rollup animations
    numberRollup: {
        default: 1000,      // Default rollup duration
        pot: 1000,          // Pot calculation rollup
        chips: 1500,        // Chip count changes in leaderboard
        chipChange: 1500,   // Chip change display in results
    },

    // Phase-specific animations
    matchupReveal: {
        total: 3000,        // Total time before showing betting UI
        coinDelay: 200,     // Delay before coin side appears
        vsDelay: 500,       // Delay before VS appears
        opponentDelay: 800, // Delay before opponent appears
    },

    results: {
        total: 30000,           // Time before "Next round" message
        flipResultDelay: 200,  // Delay before flip result appears
        outcomeDelay: 400,     // Delay before win/loss appears
        chipChangeDelay: 600,  // Delay before chip change appears
        chipPulseDelay: 800,   // Delay before chip pulse animation
        chipPulseCount: 2,     // Number of times to pulse
    },

    potSummary: {
        staggerDelay: 200,  // Delay between each matchup (multiplied by index)
    },

    coinFlip: {
        duration: 2000,     // Coin flip animation duration
    },

    // Generic animation durations
    generic: {
        reducedMotion: 300, // Duration for reduced motion mode
        quick: 300,         // Quick transitions (fades, etc)
        medium: 500,        // Medium transitions
    },
};

/**
 * Spring animation presets for Framer Motion
 */
export const SPRING_CONFIGS = {
    gentle: {
        stiffness: 200,
        damping: 15,
    },
    default: {
        stiffness: 300,
        damping: 30,
    },
    snappy: {
        stiffness: 300,
        damping: 25,
    },
    countdown: {
        stiffness: 300,
        damping: 20,
    },
};
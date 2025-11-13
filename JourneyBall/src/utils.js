// Seeded random number generator (mulberry32)
// returns a zero-arg function that produces 0..1 pseudorandom values
function seededRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Session storage helpers
function saveState(key, state) {
    sessionStorage.setItem(key, JSON.stringify(state));
}

function loadState(key) {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}

function removeState(key) {
    sessionStorage.removeItem(key);
}

// Clamp utility
function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

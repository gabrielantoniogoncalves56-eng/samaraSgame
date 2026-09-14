export const roomUtils={normalizeCode(code){return String(code||'').trim().toUpperCase()},validCode(code){return /^[A-HJ-NP-Z2-9]{6}$/.test(code)}};

import fs from 'node:fs';
let s = fs.readFileSync('src/routes/public.js', 'utf8');
const G2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14b8a6"/><stop offset="0.55" stop-color="#0d9488"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="96" height="96" rx="22" fill="url(#g)"/><text x="48" y="64" font-family="Arial, sans-serif" font-weight="700" font-size="46" letter-spacing="-2" text-anchor="middle" fill="#ffffff">G2</text></svg>';
const re = /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">[\s\S]*?<\/svg>/;
if (re.test(s)) { fs.writeFileSync('src/routes/public.js', s.replace(re, G2)); console.log('OK: fallback = G2'); }
else console.log('SKIP: sudah diganti');

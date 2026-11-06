import fs from 'fs';
import path from 'path';

const hits = [];
const walk = d => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/^route\.(js|ts|jsx|tsx)$/.test(e.name)) hits.push(p);
    else if (/\.(js|ts)$/.test(e.name) && /[\\/]pages[\\/]api([\\/]|$)/.test(p)) hits.push(p);
  }
};
['src', 'app', 'pages'].forEach(walk);

const norm = p => {
  let s = p.replace(/\\/g, '/');
  s = s.replace(/^src\/app\//, '').replace(/^app\//, '');
  s = s.replace(/\/route\.(js|ts|jsx|tsx)$/, '');
  s = s.replace(/^src\/pages\//, '').replace(/^pages\//, '');
  s = s.replace(/\.(js|ts|jsx|tsx)$/, '');
  return '/' + s;
};
const routes = [...new Set(hits.map(norm))].sort();
console.log('== ROUTE API YANG ADA ==');
routes.forEach(r => console.log('  ', r));

const hasV1Charge = routes.includes('/api/v1/charge');
const hasCharge = routes.includes('/api/charge');
console.log('v1/charge:', hasV1Charge, '| charge:', hasCharge);

let v = {};
try { v = JSON.parse(fs.readFileSync('vercel.json', 'utf8')); } catch {}
v.rewrites = (v.rewrites || []).filter(r => !/api\/api/.test(String(r.source)) && r.source !== '/api/v1/:path*');
v.rewrites.unshift({ source: '/api/api/v1/:path*', destination: hasV1Charge ? '/api/v1/:path*' : '/api/:path*' });
v.rewrites.push({ source: '/api/api/:path*', destination: '/api/:path*' });
if (!hasV1Charge) v.rewrites.push({ source: '/api/v1/:path*', destination: '/api/:path*' });
fs.writeFileSync('vercel.json', JSON.stringify(v, null, 2));
console.log('== vercel.json (baru) ==');
console.log(fs.readFileSync('vercel.json', 'utf8'));
console.log('BASE URL buat situs deposit: https://g2cspay.vercel.app  (TANPA /api di belakang)');
console.log('dengan alias ini, base .../api juga tetap jalan — dobel /api/api otomatis dirapiin');

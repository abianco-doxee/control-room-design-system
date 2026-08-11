import { readFileSync } from 'node:fs';
import { signalHues, pickRouteHues, hueDistance, hexToOklch } from './route-accents.mjs';

const css = readFileSync('/Users/abianco/Workspace-personal/control-room-design-system/packages/tokens/dist/control-room.css','utf8');
function block(sel){ const i=css.indexOf(sel), j=css.indexOf('{',i), k=css.indexOf('}',j);
  const m={}; for(const mm of css.slice(j,k).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/g)) m[mm[1]]=mm[2].trim(); return m; }
const base=block(':root, [data-theme="dark"]');
const themes={dark:base, light:{...base,...block('[data-theme="light"]')}, extreme:{...base,...block('[data-theme="extreme"]')}};

const sig=signalHues(themes);
const {hues,separation}=pickRouteHues(sig,8);
const ROUTES=['attention','sessions','sprint','jobs','notes','catalogue','contacts','settings'];
console.log(`signal hues (${sig.length} samples, ${new Set(sig.map(h=>h.toFixed(0))).size} distinct)`);
console.log(`\nguaranteed separation: ${separation.toFixed(1)}°\n`);
console.log('route          hue    nearest signal');
hues.forEach((h,i)=>{
  const d=Math.min(...sig.map(s=>hueDistance(h,s)));
  console.log(`${ROUTES[i].padEnd(14)}${String(Math.round(h)).padStart(4)}°  ${d.toFixed(1).padStart(6)}°`);
});
// the assertion that would live in the app's test suite
const MIN=15;
if(separation<MIN){ console.error(`\nFAIL: separation ${separation.toFixed(1)}° < ${MIN}°`); process.exit(1); }
console.log(`\nOK: every route accent is >=${MIN}° from every signal hue and from every other route.`);

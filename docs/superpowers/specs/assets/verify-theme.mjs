import { readFileSync } from 'node:fs';
import { hexToOklch, hueDistance, pickRouteHues } from './route-accents.mjs';
const D='/Users/abianco/Workspace-personal/control-room-design-system/packages/tokens/dist/';
const structure = readFileSync(D+'structure.css','utf8');
const base = readFileSync(D+'themes/dark.css','utf8');
function toks(...srcs){ const m={};
  for(const s of srcs) for(const mm of s.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+)/g)) m[mm[1]]=mm[2].trim();
  return m; }
const dark  = toks(structure, base, readFileSync(D+'themes/control-room.css','utf8'));
const light = toks(structure, base, readFileSync(D+'themes/control-room-light.css','utf8'));

const lin=c=>{c/=255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;};
const L=h=>{h=h.trim().replace(/^#/,'');if(h.length===3)h=[...h].map(c=>c+c).join('');
  const[r,g,b]=[0,2,4].map(i=>lin(parseInt(h.slice(i,i+2),16)));return .2126*r+.7152*g+.0722*b;};
const cr=(a,b)=>{const x=L(a),y=L(b),hi=Math.max(x,y),lo=Math.min(x,y);return (hi+.05)/(lo+.05);};

const PAIR={'--sig-work':'--on-sig','--sig-wait':'--on-sig','--sig-done':'--on-sig',
            '--sig-err':'--on-err','--sig-idle':'--on-idle','--sig-accent':'--on-accent',
            '--sig-accent-2':'--on-accent-2','--stage':'--on-sig'};
let fail=0;
for(const [nm,m] of [['dark',dark],['light',light]]){
  console.log(`\n${nm}:`);
  console.log(`  ground=${m['--ground']}  panel=${m['--panel']}  ink=${m['--ink']}`);
  const inkC=cr(m['--ink'],m['--ground']);
  console.log(`  ${inkC>=4.5?'OK  ':'FAIL'} ink on ground        ${inkC.toFixed(2)}:1`);
  if(inkC<4.5) fail++;
  const mutedC=cr(m['--muted'],m['--ground']);
  console.log(`  ${mutedC>=4.5?'OK  ':'FAIL'} muted on ground      ${mutedC.toFixed(2)}:1`);
  if(mutedC<4.5) fail++;
  for(const [sig,on] of Object.entries(PAIR)){
    const sv=m[sig],ov=m[on];
    if(!sv?.startsWith('#')||!ov?.startsWith('#')) continue;
    const r=cr(sv,ov);
    if(r<4.5){ console.log(`  FAIL ${sig} on ${on}  ${sv}/${ov}  ${r.toFixed(2)}:1`); fail++; }
  }
  console.log(`  (all signal/fg pairings >=4.5:1 unless listed above)`);
}
// accent headroom across BOTH schemes
const SIG=['--sig-work','--sig-wait','--sig-done','--sig-err','--sig-accent','--sig-accent-2','--stage'];
const hues=[];
for(const m of [dark,light]) for(const s of SIG){ const v=m[s]; if(v?.startsWith('#')) hues.push(hexToOklch(v).h); }
const r=pickRouteHues(hues,8);
console.log(`\nroute accents (constrained across BOTH schemes): ${r.separation.toFixed(1)}° separation`);
console.log('  hues:', r.hues.map(h=>Math.round(h)).join(', '));
if(r.separation<15){ console.log('  FAIL: below the 15° floor'); fail++; }
console.log(fail? `\n${fail} FAILURE(S)` : '\nALL CONSTRAINTS PASS');
process.exit(fail?1:0);

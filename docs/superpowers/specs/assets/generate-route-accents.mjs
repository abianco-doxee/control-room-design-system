import { readFileSync } from 'node:fs';
import { hexToOklch, hueDistance } from './route-accents.mjs';
const D='/Users/abianco/Workspace-personal/control-room-design-system/packages/tokens/dist/';
const toks=f=>{const m={};for(const mm of readFileSync(D+f,'utf8').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/g))if(!(mm[1] in m))m[mm[1]]=mm[2].trim();return m;};
const st=toks('structure.css');
const schemes={dark:{...st,...toks('themes/control-room.css')},light:{...st,...toks('themes/control-room-light.css')}};
const SIG=['--sig-work','--sig-wait','--sig-done','--sig-err','--sig-accent','--sig-accent-2','--stage'];
const sig=Object.values(schemes).flatMap(t=>SIG.map(s=>t[s]).filter(v=>v?.startsWith('#')).map(v=>hexToOklch(v).h));

// OKLCH -> sRGB hex (gamut-clamped)
function oklchToHex(L,C,hDeg){
  const h=hDeg*Math.PI/180, a=C*Math.cos(h), b=C*Math.sin(h);
  const l_=L+0.3963377774*a+0.2158037573*b, m_=L-0.1055613458*a-0.0638541728*b, s_=L-0.0894841775*a-1.2914855480*b;
  const l=l_**3, m=m_**3, s=s_**3;
  let r= +4.0767416621*l -3.3077115913*m +0.2309699292*s;
  let g= -1.2684380046*l +2.6097574011*m -0.3413193965*s;
  let bl= -0.0041960863*l -0.7034186147*m +1.7076147010*s;
  const enc=v=>{v=v<=0.0031308?12.92*v:1.055*Math.pow(Math.max(v,0),1/2.4)-0.055;return Math.round(Math.min(1,Math.max(0,v))*255);};
  return '#'+[enc(r),enc(g),enc(bl)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const lin=c=>{c/=255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;};
const Lum=h=>{h=h.replace(/^#/,'');const[r,g,b]=[0,2,4].map(i=>lin(parseInt(h.slice(i,i+2),16)));return .2126*r+.7152*g+.0722*b;};
const cr=(a,b)=>{const x=Lum(a),y=Lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};

const TARGET={attention:49,sessions:102,sprint:193,jobs:241,notes:263,catalogue:286,contacts:309,settings:332};
const onSigD=schemes.dark['--on-sig'], onSigL=schemes.light['--on-sig'];
console.log('/* route accents — generated at OKLCH from the target hues */');
let allok=true;
for(const [r,hTarget] of Object.entries(TARGET)){
  // search L,C for: hue preserved, AA>=4.5 vs --on-sig in both schemes, chroma as high as possible
  let best=null;
  for(let L=0.62;L<=0.84;L+=0.005){
    for(let C=0.16;C>=0.05;C-=0.005){
      const hex=oklchToHex(L,C,hTarget);
      const got=hexToOklch(hex);
      if(hueDistance(got.h,hTarget)>1.5) continue;           // gamut clipping shifted the hue
      if(cr(hex,onSigD)<4.6||cr(hex,onSigL)<4.6) continue;   // small margin over 4.5
      const near=Math.min(...sig.map(s=>hueDistance(got.h,s)));
      if(near<15) continue;
      if(!best||C>best.C) best={hex,L,C,h:got.h,near,cd:cr(hex,onSigD)};
      break;
    }
  }
  if(!best){ console.log(`  /* ${r}: NO SOLUTION */`); allok=false; continue; }
  console.log(`  --acc-${(r+':').padEnd(11)} ${best.hex};   /* ${best.h.toFixed(0)}deg  L=${best.L.toFixed(2)} C=${best.C.toFixed(2)}  ${best.near.toFixed(1)}deg from nearest signal  AA ${best.cd.toFixed(2)}:1 */`);
}
console.log(allok?'\nALL GENERATED OK':'\nSOME FAILED');

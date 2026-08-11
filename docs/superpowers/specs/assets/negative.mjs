import { hueDistance, hexToOklch } from './route-accents.mjs';
// Would the CURRENT app palette pass the constraint? (the real regression question)
const APP={attention:'#ff3b6b',sessions:'#22d3ee',sprint:'#a855f7',jobs:'#fb923c',
           notes:'#5eead4',catalogue:'#38bdf8',settings:'#8a8aa6',contacts:'#a3e635'};
// DS dark signals
const SIG={'--sig-work':'#00d3fb','--sig-wait':'#f9ad00','--sig-done':'#00deaa',
           '--sig-err':'#f45058','--sig-accent':'#ff1a9d','--sig-accent-2':'#9ad335','--stage':'#49de78'};
const sh=Object.entries(SIG).map(([k,v])=>[k,hexToOklch(v).h]);
console.log('CURRENT app route accents vs DS signals:\n');
let worst=[Infinity,null];
for(const [r,hex] of Object.entries(APP)){
  const h=hexToOklch(hex).h;
  const [name,d]=sh.map(([k,s])=>[k,hueDistance(h,s)]).sort((a,b)=>a[1]-b[1])[0];
  const flag = d<15 ? 'COLLIDES' : 'ok      ';
  if(d<worst[0]) worst=[d,`${r} vs ${name}`];
  console.log(`  ${flag} ${r.padEnd(11)} ${hex}  ${String(Math.round(h)).padStart(4)}°  nearest ${name.padEnd(15)} ${d.toFixed(1)}°`);
}
console.log(`\nworst: ${worst[1]} at ${worst[0].toFixed(1)}°`);
console.log(worst[0]<15 ? '=> the CURRENT palette VIOLATES the constraint (so the check has teeth)'
                        : '=> current palette would pass');

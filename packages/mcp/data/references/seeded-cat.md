# Seeded Pixel-Cat

The cat is Control Room's identity+state sprite. It answers two questions at a
glance — **which** session, and **what** it is doing — with zero stored assets:

- **Fur color + markings = identity**, derived deterministically from the session
  id. The same id always draws the same cat.
- **Pose = state.** The silhouette changes per state so it survives at row size,
  where a face would mush.

It is a 16×16 matrix painted to `<canvas>`, crisp at any size, animated by a code
frame-rig (tier 1). No Rive, no Lottie, no designer required — and the state
machine is read directly from the app's session store.

## The contract

```
paint(canvas, seed, state, frame, px)
```

- `seed` — the session id (any string). Drives fur + markings via a hash.
- `state` — one of `working | waiting | idle | error | done`. Drives pose + eye.
- `frame` — `0` rest, `1` blink, `2` ear-flick, `3` tail-up. Driven by the shared
  ticker.
- `px` — rendered CSS size; the canvas backs it at `devicePixelRatio` for crisp
  pixels.

Determinism is the acceptance test: `catMatrix(seed, state, 0)` is a pure
function of its inputs. Given a seed and state, the sprite is reproducible and
testable (determinism, left/right symmetry, per-seed variety).

## Reference implementation

```js
// --- deterministic hashing (FNV-1a) + PRNG (mulberry32) ---
function hashSeed(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

// fur palette (identity) + state → eye color (state channel)
const FUR=["#22d3ee","#ff2e97","#5eead4","#fde047","#a855f7","#ff6b35","#ff3b6b","#c6ff00","#89b4fa"];
function stateHex(s){return {working:"#22d3ee",waiting:"#fde047",idle:"#8a8aa6",error:"#ff3b6b",done:"#c6ff00"}[s];}

function catMatrix(seed,state,frame){
  frame=frame||0; const rng=mulberry32(hashSeed(seed)); const G=16;
  const fur=FUR[Math.floor(rng()*FUR.length)];
  const stripe=rng()<0.55?FUR[Math.floor(rng()*FUR.length)]:null;
  const eye=stateHex(state);
  const m=Array.from({length:G},()=>Array(G).fill(null));
  const set=(x,y,c)=>{if(x>=0&&x<G&&y>=0&&y<G&&c)m[y][x]=c;};
  const fill=(x0,y0,w,h,c)=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)set(x,y,c);};
  const mir=(x,y,c)=>{set(x,y,c);set(G-1-x,y,c);};             // left/right symmetry
  const blink=(frame===1),earFlick=(frame===2),tailUp=(frame===3);

  if(state==="idle"){                                          // curled, low
    fill(3,9,10,5,fur);mir(3,8,fur);mir(4,8,fur);
    if(stripe){mir(5,10,stripe);mir(6,12,stripe);}
    set(5,11,"#000");set(6,11,"#000");set(9,11,"#000");set(10,11,"#000");
    fill(tailUp?11:12,tailUp?11:12,2,2,fur);
  } else if(state==="working"){                                // alert, upright, tail up
    mir(4,earFlick?0:1,fur);mir(4,2,fur);mir(5,2,fur);
    fill(4,3,8,5,fur);fill(5,8,6,5,fur);
    if(stripe){mir(6,4,stripe);mir(7,9,stripe);}
    if(!blink)mir(5,5,eye);else{set(5,5,"#000");set(10,5,"#000");}
    set(8,6,"#000");fill(11,tailUp?6:7,2,6,fur);
  } else if(state==="waiting"){                                // sitting, tail out
    mir(4,2,fur);mir(5,2,fur);fill(4,3,8,5,fur);fill(5,8,6,4,fur);
    if(stripe)mir(6,4,stripe);
    if(!blink)mir(5,5,eye);else{set(5,5,"#000");set(10,5,"#000");}
    set(8,6,"#000");fill(4,11,tailUp?7:8,2,fur);
  } else if(state==="error"){                                  // arched/spiky, alarmed
    mir(3,3,fur);mir(3,4,fur);
    for(let x=3;x<=12;x++){const h=Math.round(5-Math.abs(x-7.5));fill(x,10-h,1,h+1,fur);}
    fill(4,6,3,3,fur);set(4,7,eye);set(5,7,"#000");
    set(13,4,fur);set(14,5,fur);set(13,6,fur);set(14,7,fur);set(13,8,fur);
  } else {                                                     // done — relaxed, content
    mir(4,7,fur);mir(5,6,fur);fill(3,8,10,5,fur);
    if(stripe){mir(5,9,stripe);mir(4,11,stripe);}
    set(5,10,"#000");set(6,9,"#000");set(7,10,"#000");
    set(9,10,"#000");set(10,9,"#000");set(11,10,"#000");
    fill(12,10,2,2,fur);
  }
  return {m,G};
}

function paint(c,seed,state,frame,px){
  const {m,G}=catMatrix(seed,state,frame);
  const dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));
  const cell=Math.max(1,Math.round((px*dpr)/G)),back=cell*G;
  c.width=back;c.height=back;c.style.width=px+"px";c.style.height=px+"px";
  const ctx=c.getContext("2d");ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,back,back);
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){if(!m[y][x])continue;ctx.fillStyle=m[y][x];ctx.fillRect(x*cell,y*cell,cell,cell);}
}
```

## Frame rig (tier 1 animation)

Register animated cats and advance them from the one shared ~180ms ticker; skip
entirely under reduced motion.

```js
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const animated=[];
function mkCat(seed,state,px,animate){const c=document.createElement("canvas");
  paint(c,seed,state,0,px);if(animate&&!reduced)animated.push({canvas:c,seed,state,px});return c;}
let tick=0;
function rig(){ if(!reduced){ tick++; animated.forEach(function(a,i){
  let f=0;const p=(tick+i*7)%40; if(p===0)f=1; else if(p===20)f=2; else if(p===30)f=3;
  paint(a.canvas,a.seed,a.state,f,a.px); }); } setTimeout(rig,180); }
rig();
```

## Rules

- **MUST** derive fur/markings only from the seed and pose/eye only from state —
  never persist a per-session image.
- **MUST** animate only the hero cat (and other focal cats); list-row cats are
  static (`animate=false`) to keep rows calm (Law 7).
- **MUST** provide a text equivalent (`aria-label="<seed> — <state>"`) or
  `aria-hidden` the canvas when an adjacent label carries the same info
  (`references/accessibility.md`).
- **SHOULD** keep the eye color from `stateHex` in sync with the signal ramp;
  when the ramp changes, update the map.
- **NEVER** treat pose as the sole state indicator — pair it with a StatusDot or
  status text.

## Fidelity note

The reference sprites are intentionally rough — they prove pose-legibility at row
size, seeded identity, crisp rendering, and the living feel. Shipped sprites get
a polish pass; the *contract* (`paint(canvas, seed, state, frame, px)`, the five
states, determinism) is what is fixed.

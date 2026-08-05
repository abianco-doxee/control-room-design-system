/* Shared browser script for the gallery + component browser: theme switcher
   and the seeded canvas painters (sigil / chrome / ascii). Single source so
   the two pages never drift. Consumed by build-gallery.mjs + build-showcase.mjs. */
export const browserScript = `
  var root=document.documentElement;
  document.querySelectorAll(".switch button").forEach(function(b){
    b.addEventListener("click",function(){
      root.setAttribute("data-theme",b.dataset.set);
      document.querySelectorAll(".switch button").forEach(function(x){
        x.setAttribute("aria-pressed",String(x===b));
      });
      if(typeof paintAll==="function")paintAll();
    });
  });

  // Seeded pixel-sigils (cyber-sigilism) — same seed → same glyph.
  function hashSeed(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
  function mb32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
  function cvar(n,fb){try{var v=getComputedStyle(root).getPropertyValue(n).trim();return v||fb;}catch(e){return fb;}}
  function paintAll(){
  var SINK=[cvar('--sig-work','#00d3fb'),cvar('--sig-accent','#ff1a9d'),cvar('--sig-accent-2','#9ad335'),cvar('--sig-done','#00deaa'),cvar('--sig-wait','#f9ad00'),cvar('--sig-err','#f45058')];
  var SST={working:cvar('--sig-work','#00d3fb'),waiting:cvar('--sig-wait','#f9ad00'),idle:cvar('--sig-idle','#848496'),error:cvar('--sig-err','#f45058'),done:cvar('--sig-accent-2','#9ad335')};
  document.querySelectorAll(".crsig").forEach(function(cv){
    var seed=cv.dataset.seed,G=16,cell=cv.width/G,rng=mb32(hashSeed(seed));
    var ink=cv.dataset.state?SST[cv.dataset.state]:SINK[Math.floor(rng()*SINK.length)];
    var m=[];for(var y=0;y<G;y++){m.push(new Array(G).fill(0));}
    var cx=G>>1;function set(x,y){if(x>=0&&x<G&&y>=0&&y<G){m[y][x]=1;m[y][G-1-x]=1;}}
    for(var y2=2;y2<G-2;y2++){if(rng()>0.22)set(cx,y2);}
    var arms=3+Math.floor(rng()*3);
    for(var a=0;a<arms;a++){var x=cx,y=2+Math.floor(rng()*(G-6)),len=2+Math.floor(rng()*4);
      for(var i=0;i<len;i++){x+=rng()>0.5?1:0;y+=rng()>0.4?1:0;set(x,y);}set(x,y);if(rng()>0.5){set(x+1,y);set(x,y+1);}}
    for(var xc=0;xc<=cx;xc++){var low=-1;for(var yy=0;yy<G;yy++){if(m[yy][xc])low=yy;}
      if(low>=0&&rng()>0.45){var d=1+Math.floor(rng()*3);for(var k=1;k<=d;k++)set(xc,low+k);}}
    set(cx,2);if(rng()>0.4)set(cx-1,3);
    var ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,cv.width,cv.height);
    ctx.globalAlpha=0.12;ctx.fillStyle=ink;
    for(var gy=cell;gy<cv.height;gy+=cell*2){for(var gx=cell;gx<cv.width;gx+=cell*2){ctx.fillRect(gx,gy,1,1);}}
    ctx.globalAlpha=1;
    for(var ry=0;ry<G;ry++){for(var rx=0;rx<G;rx++){if(m[ry][rx]){ctx.fillStyle=ink;ctx.fillRect(rx*cell,ry*cell,cell,cell);}}}
  });

  // Seeded chrome strips — BLOCKY neo-brutalist cyberpunk, laid out on a strict
  // shared content band (cy0..cy1) with hard module dividers so everything aligns.
  document.querySelectorAll(".crchrome").forEach(function(cv){
    var W=cv.width,H=cv.height,rng=mb32(hashSeed(cv.dataset.seed));
    var SIG=[cvar('--sig-work','#00d3fb'),cvar('--sig-wait','#f9ad00'),cvar('--sig-done','#00deaa'),cvar('--sig-err','#f45058'),cvar('--sig-accent','#ff1a9d')];
    var ACC=cvar('--sig-work','#00d3fb'),AMB=cvar('--sig-wait','#f9ad00'),MAG=cvar('--sig-accent','#ff1a9d'),LO=cvar('--rail','#050509'),EDGE=cvar('--border','#000'),DIM='rgba(200,200,220,0.16)';
    var ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;
    var cy0=8,cy1=H-6,ch=cy1-cy0,mid=Math.round((cy0+cy1)/2);
    ctx.fillStyle=LO;ctx.fillRect(0,0,W,H);
    // hard frame + bold neon top edge + a dim baseline rail
    ctx.fillStyle=EDGE;ctx.fillRect(0,0,W,2);ctx.fillRect(0,H-2,W,2);
    ctx.fillStyle=ACC;ctx.fillRect(0,2,W,2);
    ctx.fillStyle=DIM;ctx.fillRect(6,cy1+1,W-12,1);
    // chunky corner brackets (all four)
    var bk=8;ctx.fillStyle=ACC;
    ctx.fillRect(4,4,bk,3);ctx.fillRect(4,4,3,bk);
    ctx.fillRect(W-4-bk,4,bk,3);ctx.fillRect(W-7,4,3,bk);
    ctx.fillRect(4,H-7,bk,3);ctx.fillRect(4,H-4-bk,3,bk);
    ctx.fillRect(W-4-bk,H-7,bk,3);ctx.fillRect(W-7,H-4-bk,3,bk);
    var x=12, RIGHT=W-30;   // reserve the far-right LED column
    function divider(){ if(x+8>RIGHT)return false; ctx.fillStyle=EDGE;ctx.fillRect(x,cy0,2,ch);x+=7;return true; }
    function room(w){ return x+w<=RIGHT; }
    // 1) stamped ID slab — filled accent block, inverted mono label
    ctx.font="bold 10px monospace";ctx.textBaseline="middle";
    var hex=("00"+Math.floor(rng()*256).toString(16).toUpperCase()).slice(-2),lbl="CR-"+hex;
    var idw=Math.round(ctx.measureText(lbl).width)+10;
    if(room(idw)){ctx.fillStyle=ACC;ctx.fillRect(x,cy0,idw,ch);ctx.fillStyle=LO;ctx.fillText(lbl,x+5,mid+1);x+=idw+6;divider();}
    // 2) blocky ruler — chunky ticks on the band (tall every 3rd)
    var rw=Math.min(54,RIGHT-x-40);
    if(rw>18){for(var t=0;t<rw;t+=6){var tall=(t/6)%3===0;ctx.fillStyle=tall?ACC:DIM;ctx.fillRect(x+t,cy0,2,tall?ch:Math.round(ch*0.55));}x+=rw+6;divider();}
    // 3) hazard block (full band)
    if(rng()>0.4&&room(30)){var hw=28;ctx.save();ctx.beginPath();ctx.rect(x,cy0,hw,ch);ctx.clip();
      ctx.fillStyle=AMB;ctx.fillRect(x,cy0,hw,ch);ctx.fillStyle=EDGE;
      for(var d=-ch;d<hw;d+=8){ctx.beginPath();ctx.moveTo(x+d,cy1);ctx.lineTo(x+d+ch,cy0);ctx.lineTo(x+d+ch+4,cy0);ctx.lineTo(x+d+4,cy1);ctx.closePath();ctx.fill();}
      ctx.restore();x+=hw+6;divider();}
    // 4) equalizer — wide bars, all baselined to cy1
    if(room(30)){var bars=Math.min(6,Math.floor((RIGHT-x-40)/7));
      for(var bi=0;bi<bars;bi++){var eh=4+Math.floor(rng()*ch);ctx.fillStyle=ACC;ctx.fillRect(x+bi*7,cy1-eh,5,eh);}
      x+=bars*7+6;divider();}
    // 5) segmented register — thin cells filling the full band
    if(room(30)){var cells=Math.min(7,Math.floor((RIGHT-x-30)/8)),filled=1+Math.floor(rng()*cells);
      for(var ci=0;ci<cells;ci++){ctx.fillStyle=EDGE;ctx.fillRect(x+ci*8,cy0,7,ch);ctx.fillStyle=ci<filled?(ci===filled-1?AMB:ACC):DIM;ctx.fillRect(x+ci*8+1,cy0+1,5,ch-2);}
      x+=cells*8+6;divider();}
    // 6) RGB-split glitch block (chromatic aberration)
    if(room(20)){ctx.globalAlpha=0.8;ctx.fillStyle=ACC;ctx.fillRect(x,cy0+1,16,ch-2);ctx.fillStyle=MAG;ctx.fillRect(x+2,cy0,16,ch-2);ctx.globalAlpha=1;
      ctx.fillStyle=EDGE;for(var gg=cy0+1;gg<cy1;gg+=3)ctx.fillRect(x,gg,18,1);x+=22;}
    // 7) LED column — far right, a 3-stack, one lit + glow
    var on=Math.floor(rng()*3),step=Math.max(6,Math.floor(ch/3));
    for(var li=0;li<3;li++){var lx=W-13,ly=cy0+li*step,col=SIG[(li+Math.floor(rng()*5))%SIG.length],lit=li===on;
      if(lit){var lg=ctx.createRadialGradient(lx+3,ly+3,0,lx+3,ly+3,8);lg.addColorStop(0,col);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=0.8;ctx.fillStyle=lg;ctx.fillRect(lx-5,ly-5,16,16);ctx.globalAlpha=1;}
      ctx.fillStyle=EDGE;ctx.fillRect(lx,ly,6,5);ctx.fillStyle=lit?col:DIM;ctx.fillRect(lx+1,ly+1,4,3);}
  });

  // Seeded ASCII/Unicode density field (dead-space decoration).
  var RAMPS={block:[" ","░","▒","▓","█"],ramp:[" ",".",":","-","=","+","*","#","%","@"],braille:[" ","⠁","⠃","⠇","⡇","⣇","⣧","⣿"]};
  var ASCIIINK=cvar('--muted','#8a86ad');
  document.querySelectorAll(".crascii").forEach(function(cv){
    var W=cv.width,H=cv.height,rng=mb32(hashSeed(cv.dataset.seed)),variant=cv.dataset.variant||"braille";
    var ramp=RAMPS[variant]||RAMPS.braille;
    var lobes=[];for(var i=0;i<3;i++){lobes.push({fx:0.4+rng()*1.6,fy:0.4+rng()*1.6,px:rng()*6.283,py:rng()*6.283});}
    function dens(u,v){var s=0;for(var j=0;j<lobes.length;j++){var l=lobes[j];s+=Math.sin(u*l.fx*6.283+l.px)*Math.cos(v*l.fy*6.283+l.py);}return (s/lobes.length+1)/2;}
    var ctx=cv.getContext("2d");ctx.clearRect(0,0,W,H);
    var cw=variant==="braille"?7:9,ch=12;ctx.font="12px 'JetBrains Mono',ui-monospace,monospace";ctx.textBaseline="top";ctx.fillStyle=ASCIIINK;
    var cols=Math.ceil(W/cw),rows=Math.ceil(H/ch);
    for(var r=0;r<rows;r++){for(var c=0;c<cols;c++){var d=dens(c/cols,r/rows)*(0.6+rng()*0.4);var gi=Math.min(ramp.length-1,Math.floor(d*ramp.length));var g=ramp[gi];if(g===" ")continue;ctx.globalAlpha=0.12+d*0.16;ctx.fillText(g,c*cw,r*ch);}}
    ctx.globalAlpha=1;
  });

  // Cursed text (Law 3, T3 decay): zalgo combining marks, MAX 2 per glyph. The clean
  // string owns aria-label; the corrupted glyphs are aria-hidden. Corruption density
  // follows --decoration-intensity. Runs once per element (seeded, deterministic).
  var CMARKS=[0x0300,0x0301,0x0302,0x0303,0x0304,0x0306,0x0308,0x030A,0x0323,0x0324,0x0330,0x0331];
  document.querySelectorAll(".cr-cursed").forEach(function(el){
    if(el.dataset.cursedDone)return; el.dataset.cursedDone="1";
    var clean=(el.dataset.text||el.textContent||"").trim(); if(!clean)return;
    // Announce the clean string as a single graphic; the zalgo layer is aria-hidden.
    if(!el.getAttribute("role"))el.setAttribute("role","img");
    el.setAttribute("aria-label",clean);
    var rng=mb32(hashSeed(el.dataset.seed||clean));
    var di=parseFloat(cvar('--decoration-intensity','1'))||1;
    var out="";
    for(var i=0;i<clean.length;i++){var chr=clean[i];out+=chr;
      if(chr===" ")continue;
      var n=Math.round(rng()*2*Math.min(1,di)); // 0..2 marks, capped per the law
      for(var k=0;k<n&&k<2;k++)out+=String.fromCharCode(CMARKS[Math.floor(rng()*CMARKS.length)]);
    }
    el.textContent="";
    var span=document.createElement("span"); span.setAttribute("aria-hidden","true"); span.textContent=out; el.appendChild(span);
  });
  }
  paintAll();

  // Random glitch driver — brief, occasional bursts on OPT-IN decorative elements
  // only (.cr-glitch-auto), one at a time. Never ambient-glitches the whole screen
  // (Law 3). Off under reduced-motion and the calm intensity profile.
  (function(){
    if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    function tick(){
      if(root.getAttribute("data-intensity")==="calm")return;
      var els=document.querySelectorAll(".cr-glitch-auto");
      if(!els.length)return;
      var el=els[Math.floor(Math.random()*els.length)];
      el.classList.add("cr-glitch--on");
      setTimeout(function(){el.classList.remove("cr-glitch--on");}, 220+Math.random()*260);
    }
    setInterval(tick, 2400+Math.random()*2600);
  })();
`;

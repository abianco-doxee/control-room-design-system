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

  // Seeded chrome strips — a DIGITAL / terminal / NERV-style HUD readout (not
  // physical hardware): grid, ruler ticks, corner brackets, a hazard block, an
  // equalizer, a hex readout, a reticle, and glowing indicator LEDs.
  document.querySelectorAll(".crchrome").forEach(function(cv){
    var W=cv.width,H=cv.height,rng=mb32(hashSeed(cv.dataset.seed));
    var SIG=[cvar('--sig-work','#00d3fb'),cvar('--sig-wait','#f9ad00'),cvar('--sig-done','#00deaa'),cvar('--sig-err','#f45058'),cvar('--sig-accent','#ff1a9d')];
    var ACC=cvar('--sig-work','#00d3fb'),AMB=cvar('--sig-wait','#f9ad00'),INK=cvar('--rail-ink','#c8c8de'),LO=cvar('--rail','#050509'),EDGE=cvar('--border','#000');
    var ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;
    var mid=Math.round(H/2);
    // base + faint terminal grid
    ctx.fillStyle=LO;ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=0.08;ctx.fillStyle=ACC;
    for(var gx=0;gx<W;gx+=14)ctx.fillRect(gx,0,1,H);
    ctx.fillRect(0,mid,W,1);
    ctx.globalAlpha=1;
    // frame: hard edges + a dim accent scan line
    ctx.fillStyle=EDGE;ctx.fillRect(0,0,W,1);ctx.fillRect(0,H-1,W,1);
    ctx.globalAlpha=0.45;ctx.fillStyle=ACC;ctx.fillRect(0,2,W,1);ctx.globalAlpha=1;
    // top ruler ticks (tall every 40px)
    ctx.fillStyle=ACC;
    for(var t=6;t<W-6;t+=8){var tall=(t%40<8);ctx.globalAlpha=tall?0.8:0.32;ctx.fillRect(t,3,1,tall?6:3);}
    ctx.globalAlpha=1;
    // corner brackets
    var bk=7;ctx.fillStyle=ACC;
    ctx.fillRect(3,3,bk,2);ctx.fillRect(3,3,2,bk);
    ctx.fillRect(W-3-bk,3,bk,2);ctx.fillRect(W-5,3,2,bk);
    ctx.fillRect(3,H-5,bk,2);ctx.fillRect(3,H-3-bk,2,bk);
    ctx.fillRect(W-3-bk,H-5,bk,2);ctx.fillRect(W-5,H-3-bk,2,bk);
    var cx=12;
    // hazard block (warning zone) — diagonal amber/black stripes
    if(rng()>0.35){var hw=40,hy=8,hh=H-16;
      ctx.save();ctx.beginPath();ctx.rect(cx,hy,hw,hh);ctx.clip();
      ctx.fillStyle=AMB;ctx.fillRect(cx,hy,hw,hh);ctx.fillStyle=EDGE;
      for(var d=-hh;d<hw;d+=9){ctx.beginPath();ctx.moveTo(cx+d,hy+hh);ctx.lineTo(cx+d+hh,hy);ctx.lineTo(cx+d+hh+4,hy);ctx.lineTo(cx+d+4,hy+hh);ctx.closePath();ctx.fill();}
      ctx.restore();ctx.strokeStyle=EDGE;ctx.lineWidth=1;ctx.strokeRect(cx+0.5,hy+0.5,hw,hh);cx+=hw+10;}
    // equalizer bars
    var bars=5+Math.floor(rng()*3);
    for(var bi=0;bi<bars;bi++){var bh=4+Math.floor(rng()*(H-16));ctx.globalAlpha=0.5+rng()*0.5;ctx.fillStyle=ACC;ctx.fillRect(cx+bi*5,H-8-bh,3,bh);}
    ctx.globalAlpha=1;cx+=bars*5+10;
    // hex readout (monospace)
    ctx.font="bold 9px monospace";ctx.textBaseline="middle";
    var hex=("0000"+Math.floor(rng()*65536).toString(16).toUpperCase()).slice(-4);
    ctx.globalAlpha=0.85;ctx.fillStyle=INK;ctx.fillText("0x"+hex,cx,mid-0.5);
    ctx.fillStyle=ACC;ctx.fillText("//SYS",cx,mid+8.5);ctx.globalAlpha=1;
    // reticle
    if(W>170){var rx=W-40,rr=6,rc=SIG[Math.floor(rng()*SIG.length)];ctx.strokeStyle=rc;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(rx,mid,rr,0,7);ctx.stroke();
      ctx.beginPath();ctx.moveTo(rx-rr-3,mid);ctx.lineTo(rx-rr+2,mid);ctx.moveTo(rx+rr-2,mid);ctx.lineTo(rx+rr+3,mid);ctx.moveTo(rx,mid-rr-3);ctx.lineTo(rx,mid-rr+2);ctx.moveTo(rx,mid+rr-2);ctx.lineTo(rx,mid+rr+3);ctx.stroke();
      ctx.fillStyle=rc;ctx.fillRect(rx-1,mid-1,2,2);}
    // indicator LEDs — a vertical stack at the far right, one lit + glowing
    var on=Math.floor(rng()*3);
    for(var li=0;li<3;li++){var lx=W-11,ly=Math.round(mid-8+li*8),col=SIG[(li*2+Math.floor(rng()*5))%SIG.length],lit=li===on;
      if(lit){var lg=ctx.createRadialGradient(lx+2,ly+2,0,lx+2,ly+2,7);lg.addColorStop(0,col);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=0.85;ctx.fillStyle=lg;ctx.fillRect(lx-5,ly-5,14,14);ctx.globalAlpha=1;}
      ctx.fillStyle=EDGE;ctx.fillRect(lx,ly,4,4);ctx.fillStyle=lit?col:'rgba(200,200,220,0.18)';ctx.fillRect(lx+0.5,ly+0.5,3,3);}
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
  }
  paintAll();
`;

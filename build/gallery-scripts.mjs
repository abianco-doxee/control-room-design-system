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

  // Seeded chrome strips — BLOCKY neo-brutalist cyberpunk (not delicate HUD
  // instrumentation): hard neon frame, chunky corner brackets, a stamped ID slab,
  // a hazard block, chunky bars, segmented register cells, an RGB-split glitch
  // block, and big blocky indicator LEDs.
  document.querySelectorAll(".crchrome").forEach(function(cv){
    var W=cv.width,H=cv.height,rng=mb32(hashSeed(cv.dataset.seed));
    var SIG=[cvar('--sig-work','#00d3fb'),cvar('--sig-wait','#f9ad00'),cvar('--sig-done','#00deaa'),cvar('--sig-err','#f45058'),cvar('--sig-accent','#ff1a9d')];
    var ACC=cvar('--sig-work','#00d3fb'),AMB=cvar('--sig-wait','#f9ad00'),MAG=cvar('--sig-accent','#ff1a9d'),LO=cvar('--rail','#050509'),EDGE=cvar('--border','#000');
    var ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;var mid=Math.round(H/2);
    ctx.fillStyle=LO;ctx.fillRect(0,0,W,H);
    // hard frame + a bold neon top edge
    ctx.fillStyle=EDGE;ctx.fillRect(0,0,W,2);ctx.fillRect(0,H-2,W,2);
    ctx.fillStyle=ACC;ctx.fillRect(0,2,W,2);
    // chunky corner brackets
    var bk=10;ctx.fillStyle=ACC;
    ctx.fillRect(4,4,bk,3);ctx.fillRect(4,4,3,bk);
    ctx.fillRect(W-4-bk,4,bk,3);ctx.fillRect(W-7,4,3,bk);
    ctx.fillRect(4,H-7,bk,3);ctx.fillRect(4,H-4-bk,3,bk);
    ctx.fillRect(W-4-bk,H-7,bk,3);ctx.fillRect(W-7,H-4-bk,3,bk);
    var cx=14,by=9,bh=H-18;
    // stamped ID slab — filled accent block, inverted mono label
    ctx.font="bold 10px monospace";ctx.textBaseline="middle";
    var hex=("00"+Math.floor(rng()*256).toString(16).toUpperCase()).slice(-2);
    var idw=Math.round(ctx.measureText("CR-"+hex).width)+10;
    ctx.fillStyle=ACC;ctx.fillRect(cx,by,idw,bh);
    ctx.fillStyle=LO;ctx.fillText("CR-"+hex,cx+5,mid+0.5);cx+=idw+8;
    // hazard block
    if(rng()>0.4&&cx<W-90){var hw=34;ctx.save();ctx.beginPath();ctx.rect(cx,by,hw,bh);ctx.clip();
      ctx.fillStyle=AMB;ctx.fillRect(cx,by,hw,bh);ctx.fillStyle=EDGE;
      for(var d=-bh;d<hw;d+=10){ctx.beginPath();ctx.moveTo(cx+d,by+bh);ctx.lineTo(cx+d+bh,by);ctx.lineTo(cx+d+bh+5,by);ctx.lineTo(cx+d+5,by+bh);ctx.closePath();ctx.fill();}
      ctx.restore();cx+=hw+8;}
    // chunky equalizer — wide bars
    var bars=4+Math.floor(rng()*3);
    for(var bi=0;bi<bars&&cx+bi*7<W-70;bi++){var eh=6+Math.floor(rng()*(bh-2));ctx.fillStyle=ACC;ctx.fillRect(cx+bi*7,by+bh-eh,5,eh);}
    cx+=bars*7+8;
    // segmented register cells
    if(cx<W-90){var cells=6,filled=1+Math.floor(rng()*cells);
      for(var ci=0;ci<cells;ci++){ctx.fillStyle=EDGE;ctx.fillRect(cx+ci*8,mid-4,7,8);ctx.fillStyle=ci<filled?(ci>=cells-1?AMB:ACC):'rgba(200,200,220,0.12)';ctx.fillRect(cx+ci*8+1,mid-3,5,6);}
      cx+=cells*8+10;}
    // RGB-split glitch block (chromatic aberration)
    if(cx<W-40){ctx.globalAlpha=0.8;ctx.fillStyle=ACC;ctx.fillRect(cx,mid-5,16,10);ctx.fillStyle=MAG;ctx.fillRect(cx+2,mid-4,16,10);ctx.globalAlpha=1;
      ctx.fillStyle=EDGE;for(var gg=0;gg<3;gg++)ctx.fillRect(cx,mid-4+gg*3,18,1);}
    // big blocky LEDs — far right, one lit + a glow
    var on=Math.floor(rng()*3);
    for(var li=0;li<3;li++){var lx=W-12,ly=mid-9+li*7,col=SIG[(li+Math.floor(rng()*5))%SIG.length],lit=li===on;
      if(lit){var lg=ctx.createRadialGradient(lx+3,ly+3,0,lx+3,ly+3,8);lg.addColorStop(0,col);lg.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=0.8;ctx.fillStyle=lg;ctx.fillRect(lx-5,ly-5,16,16);ctx.globalAlpha=1;}
      ctx.fillStyle=EDGE;ctx.fillRect(lx,ly,6,6);ctx.fillStyle=lit?col:'rgba(200,200,220,0.15)';ctx.fillRect(lx+1,ly+1,4,4);}
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

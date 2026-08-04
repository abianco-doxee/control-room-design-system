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

  // Seeded hardware chrome strips (deterministic variance).
  document.querySelectorAll(".crchrome").forEach(function(cv){
    var W=cv.width,H=cv.height,rng=mb32(hashSeed(cv.dataset.seed));
    var LED=[cvar('--sig-work','#00d3fb'),cvar('--sig-wait','#f9ad00'),cvar('--sig-accent-2','#9ad335'),cvar('--sig-err','#f45058'),cvar('--sig-accent','#ff1a9d')];
    var HI=cvar('--rail-ink','#3a3550'),MID=cvar('--panel-2','#2a2740'),LO=cvar('--rail','#17141f'),EDGE=cvar('--border','#000'),SCR=cvar('--muted','#4a4560');
    var ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;
    ctx.fillStyle=MID;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=HI;ctx.fillRect(0,0,W,2);
    ctx.fillStyle=LO;ctx.fillRect(0,H-Math.round(H*0.42),W,Math.round(H*0.42));
    ctx.fillStyle=EDGE;ctx.fillRect(0,0,W,1);ctx.fillRect(0,H-1,W,1);
    var sc=2+Math.floor(rng()*3);ctx.strokeStyle=SCR;ctx.lineWidth=1;
    for(var i=0;i<sc;i++){var x=Math.floor(rng()*W),len=6+Math.floor(rng()*16);ctx.globalAlpha=0.4+rng()*0.3;ctx.beginPath();ctx.moveTo(x,4+rng()*(H-10));ctx.lineTo(x+len,4+rng()*(H-10));ctx.stroke();}
    ctx.globalAlpha=1;
    function fastener(cx,cy,kind){var r=4;
      function disc(){ctx.fillStyle=EDGE;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();ctx.fillStyle=HI;ctx.beginPath();ctx.arc(cx,cy,r-1,0,7);ctx.fill();ctx.fillStyle=MID;ctx.beginPath();ctx.arc(cx+0.6,cy+0.6,r-1.6,0,7);ctx.fill();}
      if(kind===0){disc();}
      else if(kind===1){ctx.fillStyle=EDGE;ctx.beginPath();for(var a=0;a<6;a++){var ang=Math.PI/3*a,px=cx+Math.cos(ang)*r,py=cy+Math.sin(ang)*r;a?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.fillStyle=HI;ctx.beginPath();for(var b=0;b<6;b++){var an=Math.PI/3*b,qx=cx+Math.cos(an)*(r-1.4),qy=cy+Math.sin(an)*(r-1.4);b?ctx.lineTo(qx,qy):ctx.moveTo(qx,qy);}ctx.closePath();ctx.fill();}
      else if(kind===2){disc();ctx.fillStyle=EDGE;ctx.fillRect(cx-r+1,cy-0.5,(r-1)*2,1);}
      else{disc();ctx.fillStyle=EDGE;ctx.fillRect(cx-r+1,cy-0.5,(r-1)*2,1);ctx.fillRect(cx-0.5,cy-r+1,1,(r-1)*2);}}
    var n=Math.max(3,Math.round(W/(34+rng()*20))),pad=12;
    for(var k=0;k<n;k++){var cx=Math.round(pad+k*(W-pad*2)/(n-1));fastener(cx,Math.round(H/2),Math.floor(rng()*4));}
    var seams=Math.floor(rng()*3);
    for(var s=0;s<seams;s++){var sx=Math.round(pad+rng()*(W-pad*2));ctx.fillStyle=EDGE;ctx.fillRect(sx,2,1,H-4);ctx.fillStyle=HI;ctx.fillRect(sx+1,2,1,H-4);}
    var led=LED[Math.floor(rng()*LED.length)],lx=rng()>0.5?W-8:8;
    ctx.fillStyle=EDGE;ctx.fillRect(lx-3,H/2-3,6,6);ctx.fillStyle=led;ctx.fillRect(lx-2,H/2-2,4,4);ctx.fillStyle="#fff";ctx.globalAlpha=0.6;ctx.fillRect(lx-2,H/2-2,1,1);ctx.globalAlpha=1;
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

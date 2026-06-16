/* AXON Library — calm ambient network + page interactions (no dependencies) */
(() => {
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- calm 2D constellation ---- */
  const cv = document.getElementById('ambient');
  if (cv && !REDUCED){
    const ctx = cv.getContext('2d');
    let w, h, dpr, nodes = [], mx = 0, my = 0, tmx = 0, tmy = 0;
    const ACC = [91,140,255], ACC2 = [155,107,255];
    function resize(){
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      const count = Math.min(120, Math.round(innerWidth / 14));
      nodes = [];
      for (let i = 0; i < count; i++){
        nodes.push({ x: Math.random()*w, y: Math.random()*h,
          vx:(Math.random()-.5)*0.12*dpr, vy:(Math.random()-.5)*0.12*dpr,
          m: Math.random() });
      }
    }
    addEventListener('resize', resize); resize();
    addEventListener('mousemove', e => { tmx = (e.clientX/innerWidth-.5); tmy = (e.clientY/innerHeight-.5); });

    const D = 150 * dpr;
    function frame(){
      requestAnimationFrame(frame);
      mx += (tmx - mx)*0.04; my += (tmy - my)*0.04;
      ctx.clearRect(0,0,w,h);
      const px = mx*26*dpr, py = my*26*dpr;
      for (const n of nodes){
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w+20; if (n.x > w+20) n.x = -20;
        if (n.y < -20) n.y = h+20; if (n.y > h+20) n.y = -20;
      }
      const DD = 150*dpr, DD2 = DD*DD;
      for (let i=0;i<nodes.length;i++){
        const a = nodes[i], ax = a.x+px*a.m, ay = a.y+py*a.m;
        for (let j=i+1;j<nodes.length;j++){
          const b = nodes[j], bx = b.x+px*b.m, by = b.y+py*b.m;
          const dx = ax-bx, dy = ay-by, d2 = dx*dx+dy*dy;
          if (d2 > DD2) continue;
          const t = 1 - Math.sqrt(d2)/DD, mix = (a.m+b.m)/2;
          const r = ACC[0]+(ACC2[0]-ACC[0])*mix, g = ACC[1]+(ACC2[1]-ACC[1])*mix, bl = ACC[2]+(ACC2[2]-ACC[2])*mix;
          ctx.strokeStyle = 'rgba('+(r|0)+','+(g|0)+','+(bl|0)+','+(t*0.14)+')';
          ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
        }
        ctx.fillStyle = 'rgba('+(ACC[0]+(ACC2[0]-ACC[0])*a.m|0)+','+(ACC[1]+(ACC2[1]-ACC[1])*a.m|0)+','+(ACC[2]+(ACC2[2]-ACC[2])*a.m|0)+',0.5)';
        ctx.beginPath(); ctx.arc(ax, ay, 1.5*dpr, 0, 6.2832); ctx.fill();
      }
    }
    frame();
  }

  /* ---- reveal on scroll ---- */
  const rv = [...document.querySelectorAll('.rv')];
  if (rv.length){
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.15});
    rv.forEach(el => io.observe(el));
  }

  /* ---- reading progress ---- */
  const prog = document.querySelector('.read-progress');
  if (prog){
    const upd = () => { const max = document.documentElement.scrollHeight - innerHeight;
      prog.style.width = (max > 0 ? Math.min(1, scrollY/max)*100 : 0) + '%'; };
    addEventListener('scroll', upd, {passive:true}); upd();
  }

  /* ---- category filter (hub) ---- */
  const filters = [...document.querySelectorAll('.filter')];
  if (filters.length){
    const items = [...document.querySelectorAll('[data-cat]')];
    filters.forEach(f => f.addEventListener('click', () => {
      filters.forEach(x => x.classList.toggle('on', x === f));
      const cat = f.dataset.filter;
      items.forEach(it => { it.style.display = (cat === 'all' || it.dataset.cat === cat) ? '' : 'none'; });
    }));
  }
})();

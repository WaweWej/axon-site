/* AXON shared atmosphere — the same living network, cursor, binary buttons & smooth
   scroll as the main site, in a calm ambient mode for content pages. */
(() => {
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = innerWidth < 760 || matchMedia('(pointer:coarse)').matches;
  const root = document.documentElement;

  /* ============ WebGL network (calm ambient) ============ */
  const canvas = document.getElementById('axon-gl');
  if (canvas && window.THREE && !REDUCED){
    const renderer = new THREE.WebGLRenderer({canvas, antialias:!MOBILE, alpha:true, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE?1.5:2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x05070d, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070d, 0.013);
    const camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 400);
    camera.position.set(0,0,46);
    const world = new THREE.Group(); scene.add(world);

    // background light shifts by document type, using the main site's section palette
    const PAL = { Guide:[0x5b8cff,0x9b6bff], Skabelon:[0x22d3ee,0x4f8bff], Tjekliste:[0xa855f7,0x6b8cff],
                  Drejebog:[0xf59e0b,0x6aa0ff], Playbook:[0xf59e0b,0x6aa0ff], Sammenligning:[0xf4569c,0x7aa2ff],
                  Prompt:[0x2dd4bf,0x4cc9f0], Snydeark:[0xfacc15,0x7aa2ff], Ordbog:[0x94a3b8,0x6b8cff],
                  Beregner:[0x34d399,0x4cc9f0], Workshop:[0xa78bfa,0x6b8cff] };
    const pair = PAL[document.body.dataset.doctype] || [0x5b8cff,0x9b6bff];
    const cA = new THREE.Color(pair[0]), cB = new THREE.Color(pair[1]), cMix = new THREE.Color().copy(cA).lerp(cB,.5);
    if (document.body.dataset.doctype){
      document.documentElement.style.setProperty('--accent', '#'+cA.getHexString());
      document.documentElement.style.setProperty('--accent-2', '#'+cB.getHexString());
    }
    const N = MOBILE ? 150 : 260, TAU = Math.PI*2;
    const base = new Float32Array(N*3), cur = new Float32Array(N*3), hue = new Float32Array(N);
    for (let i=0;i<N;i++){
      const phi=Math.acos(1-2*(i+0.5)/N), th=Math.PI*(1+Math.sqrt(5))*i, rad=15.5+Math.sin(i*0.7)*1.4;
      base[i*3]=Math.sin(phi)*Math.cos(th)*rad; base[i*3+1]=Math.cos(phi)*rad*0.86; base[i*3+2]=Math.sin(phi)*Math.sin(th)*rad;
      hue[i]=Math.sin(i*1.7)*0.5+0.5;
    }
    cur.set(base);

    const edges=[];
    for (let i=0;i<N;i++){ let c=0; for (let j=i+1;j<N&&c<3;j++){
      const dx=base[i*3]-base[j*3],dy=base[i*3+1]-base[j*3+1],dz=base[i*3+2]-base[j*3+2];
      if (dx*dx+dy*dy+dz*dz<32){ edges.push(i,j); c++; } } }
    const E=edges.length/2;

    function disc(){ const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
      const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,255,255,1)');
      r.addColorStop(.25,'rgba(255,255,255,.8)'); r.addColorStop(.65,'rgba(190,205,255,.22)'); r.addColorStop(1,'rgba(190,205,255,0)');
      g.fillStyle=r; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); }
    const DISC=disc();

    const nGeo=new THREE.BufferGeometry(); nGeo.setAttribute('position',new THREE.BufferAttribute(cur,3));
    const nCol=new Float32Array(N*3); nGeo.setAttribute('color',new THREE.BufferAttribute(nCol,3));
    for (let i=0;i<N;i++){ const c=cA.clone().lerp(cB,hue[i]); nCol[i*3]=c.r;nCol[i*3+1]=c.g;nCol[i*3+2]=c.b; }
    world.add(new THREE.Points(nGeo,new THREE.PointsMaterial({size:1.4,map:DISC,vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true,toneMapped:false})));

    const lPos=new Float32Array(E*2*3), lGeo=new THREE.BufferGeometry();
    lGeo.setAttribute('position',new THREE.BufferAttribute(lPos,3));
    const lMat=new THREE.LineBasicMaterial({color:0x3f5ea8,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
    world.add(new THREE.LineSegments(lGeo,lMat));

    const P=Math.min(E,180), pPos=new Float32Array(P*3), pE=new Int32Array(P), pT=new Float32Array(P), pS=new Float32Array(P);
    for (let p=0;p<P;p++){ pE[p]=Math.floor(Math.random()*E); pT[p]=Math.random(); pS[p]=0.15+Math.random()*0.4; }
    const pGeo=new THREE.BufferGeometry(); pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
    world.add(new THREE.Points(pGeo,new THREE.PointsMaterial({size:0.9,map:DISC,color:0xcfe0ff,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true,toneMapped:false})));

    // cursor reach-lines
    const MAXCL=16, clPos=new Float32Array(MAXCL*2*3), clCol=new Float32Array(MAXCL*2*3);
    const clGeo=new THREE.BufferGeometry(); clGeo.setAttribute('position',new THREE.BufferAttribute(clPos,3)); clGeo.setAttribute('color',new THREE.BufferAttribute(clCol,3));
    world.add(new THREE.LineSegments(clGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false})));

    let composer=null,bloom=null;
    try{ composer=new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene,camera));
      bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.85,0.7,0.0); composer.addPass(bloom);
      composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader)); }catch(e){ composer=null; }

    const mouse={x:0,y:0,tx:0,ty:0}; let mpx=-9999,mpy=-9999;
    addEventListener('mousemove',e=>{ mouse.tx=(e.clientX/innerWidth-.5)*2; mouse.ty=(e.clientY/innerHeight-.5)*2; mpx=e.clientX; mpy=e.clientY; });
    addEventListener('mouseleave',()=>{ mpx=-9999; mpy=-9999; });

    const wC=new THREE.Vector3(), cL=new THREE.Vector3(), invW=new THREE.Matrix4(), tA=new THREE.Vector3(), tB=new THREE.Vector3();
    let t=0;
    function frame(){
      requestAnimationFrame(frame); t+=0.016;
      mouse.x+=(mouse.tx-mouse.x)*0.05; mouse.y+=(mouse.ty-mouse.y)*0.05;
      for (let i=0;i<N;i++){ const ix=i*3; const w=0.18;
        cur[ix]=base[ix]+Math.sin(t*0.5+i*0.3)*w; cur[ix+1]=base[ix+1]+Math.cos(t*0.45+i*0.2)*w; cur[ix+2]=base[ix+2]+Math.sin(t*0.4+i*0.25)*w; }
      world.rotation.y=t*0.025+mouse.x*0.3; world.rotation.x=mouse.y*0.16-0.04;
      world.updateMatrixWorld(true);

      let clN=0;
      if (mpx>-9000 && !MOBILE){
        wC.set((mpx/innerWidth)*2-1,-(mpy/innerHeight)*2+1,0.5).unproject(camera).sub(camera.position).normalize();
        wC.multiplyScalar(camera.position.length()).add(camera.position);
        invW.copy(world.matrixWorld).invert(); cL.copy(wC).applyMatrix4(invW);
        for (let i=0;i<N;i++){ const ix=i*3; const dx=cL.x-cur[ix],dy=cL.y-cur[ix+1],dz=cL.z-cur[ix+2],d2=dx*dx+dy*dy+dz*dz;
          if (d2>81) continue; const f=0.45*Math.exp(-d2/32.4); cur[ix]+=dx*f;cur[ix+1]+=dy*f;cur[ix+2]+=dz*f;
          if (clN<MAXCL){ const b=Math.max(0,1-Math.sqrt(d2)/9);
            clPos[clN*6]=cL.x;clPos[clN*6+1]=cL.y;clPos[clN*6+2]=cL.z; clPos[clN*6+3]=cur[ix];clPos[clN*6+4]=cur[ix+1];clPos[clN*6+5]=cur[ix+2];
            clCol[clN*6]=cMix.r*b;clCol[clN*6+1]=cMix.g*b;clCol[clN*6+2]=cMix.b*b; clCol[clN*6+3]=cMix.r*b*.18;clCol[clN*6+4]=cMix.g*b*.18;clCol[clN*6+5]=cMix.b*b*.18; clN++; } } }
      for (let j=clN;j<MAXCL;j++){ for(let q=0;q<6;q++) clCol[j*6+q]=0; }
      clGeo.attributes.position.needsUpdate=true; clGeo.attributes.color.needsUpdate=true;
      nGeo.attributes.position.needsUpdate=true;

      for (let e=0;e<E;e++){ const a=edges[e*2],b=edges[e*2+1];
        lPos[e*6]=cur[a*3];lPos[e*6+1]=cur[a*3+1];lPos[e*6+2]=cur[a*3+2]; lPos[e*6+3]=cur[b*3];lPos[e*6+4]=cur[b*3+1];lPos[e*6+5]=cur[b*3+2]; }
      lGeo.attributes.position.needsUpdate=true;
      for (let p=0;p<P;p++){ pT[p]+=pS[p]*0.016; if(pT[p]>1)pT[p]-=1; const e=pE[p],a=edges[e*2],b=edges[e*2+1];
        tA.set(cur[a*3],cur[a*3+1],cur[a*3+2]); tB.set(cur[b*3],cur[b*3+1],cur[b*3+2]); tA.lerp(tB,pT[p]); pPos[p*3]=tA.x;pPos[p*3+1]=tA.y;pPos[p*3+2]=tA.z; }
      pGeo.attributes.position.needsUpdate=true;

      camera.position.x+=(mouse.x*3-camera.position.x)*0.04; camera.position.y+=(-mouse.y*2.4-camera.position.y)*0.04; camera.lookAt(0,0,0);
      if (composer) composer.render(); else renderer.render(scene,camera);
    }
    frame();
    addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); if(composer)composer.setSize(innerWidth,innerHeight); if(bloom)bloom.setSize(innerWidth,innerHeight); });
  }

  /* ============ smooth scroll ============ */
  if (window.Lenis && !REDUCED){
    const lenis=new Lenis({lerp:0.09, wheelMultiplier:1.0});
    const raf=ti=>{ lenis.raf(ti); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    window.__lenis=lenis;
  }

  /* ============ custom cursor ============ */
  const fine=matchMedia('(pointer:fine)').matches;
  if (fine){
    root.classList.add('fine');
    const cur=document.getElementById('cursor');
    if (cur){ let cx=innerWidth/2,cy=innerHeight/2,tx=cx,ty=cy;
      addEventListener('mousemove',e=>{ tx=e.clientX; ty=e.clientY; });
      (function loop(){ cx+=(tx-cx)*0.2; cy+=(ty-cy)*0.2; cur.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)'; requestAnimationFrame(loop); })();
      document.querySelectorAll('a, button, .btn, .filter, .card, .featured').forEach(el=>{
        el.addEventListener('mouseenter',()=>cur.classList.add('hot')); el.addEventListener('mouseleave',()=>cur.classList.remove('hot')); });
    }
    document.querySelectorAll('.btn, .nav-cta').forEach(el=>{
      el.addEventListener('mousemove',e=>{ const r=el.getBoundingClientRect(); const mx=e.clientX-(r.left+r.width/2),my=e.clientY-(r.top+r.height/2);
        el.style.transform='translate('+(mx*0.25)+'px,'+(my*0.4-1)+'px)'; });
      el.addEventListener('mouseleave',()=>{ el.style.transform=''; }); });
  }

  /* ============ binary buttons ============ */
  const bit=()=>Math.random()<.5?'0':'1';
  const fillStr=n=>{ let s=''; for(let i=0;i<n;i++) s+=bit(); return s; };
  document.querySelectorAll('.btn, .nav-cta').forEach(btn=>{
    const orig=btn.textContent.trim();
    const label=document.createElement('span'); label.className='bin-label'; label.textContent=orig;
    const field=document.createElement('span'); field.className='bin-field';
    btn.textContent=''; btn.appendChild(field); btn.appendChild(label);
    field.textContent=fillStr(Math.max(70, Math.round(btn.offsetWidth*btn.offsetHeight/20)));
    setInterval(()=>{ const a=field.textContent.split(''); const f=Math.max(4,a.length*0.1); for(let k=0;k<f;k++) a[(Math.random()*a.length)|0]=bit(); field.textContent=a.join(''); },95);
    let dec=null;
    btn.addEventListener('mouseenter',()=>{ clearInterval(dec); const len=orig.length; let pr=0;
      dec=setInterval(()=>{ pr+=0.9; let o=''; for(let i=0;i<len;i++){ const ch=orig[i]; o+=(ch===' ')?' ':(i<pr?ch:bit()); } label.textContent=o; if(pr>=len){ clearInterval(dec); label.textContent=orig; } },26); });
    btn.addEventListener('mouseleave',()=>{ clearInterval(dec); label.textContent=orig; });
  });

  /* ============ reveals / reading progress / filters ============ */
  const rv=[...document.querySelectorAll('.rv')];
  if (rv.length){ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:.15}); rv.forEach(el=>io.observe(el)); }
  const prog=document.querySelector('.read-progress');
  if (prog){ const upd=()=>{ const max=document.documentElement.scrollHeight-innerHeight; prog.style.width=(max>0?Math.min(1,scrollY/max)*100:0)+'%'; }; addEventListener('scroll',upd,{passive:true}); upd(); }
  const filters=[...document.querySelectorAll('.filter')];
  if (filters.length){ const items=[...document.querySelectorAll('[data-cat]')];
    filters.forEach(f=>f.addEventListener('click',()=>{ filters.forEach(x=>x.classList.toggle('on',x===f)); const cat=f.dataset.filter;
      items.forEach(it=>{ it.style.display=(cat==='all'||it.dataset.cat===cat)?'':'none'; }); })); }

  /* ============ gated download modal (lead capture) ============ */
  const gm = document.getElementById('getmodal');
  if (gm){
    const titleEl=document.getElementById('gm-title'), kickEl=document.getElementById('gm-kicker'),
          errEl=document.getElementById('gm-error'), submit=document.getElementById('gm-submit'),
          direct=document.getElementById('gm-direct'), nameEl=document.getElementById('gm-name'), emailEl=document.getElementById('gm-email');
    let current=null;
    const WEB3FORMS_KEY=''; // paste a Web3Forms key to email the leads (https://web3forms.com)
    const openGet=d=>{ current=d;
      kickEl.textContent='Gratis '+((d.type||'ressource').toLowerCase());
      titleEl.textContent='Hent “'+(d.title||'downloaden')+'”';
      direct.href=d.file||'#';
      gm.classList.remove('sent'); gm.classList.add('open'); gm.setAttribute('aria-hidden','false');
      submit.style.pointerEvents=''; errEl.textContent='';
      if (window.__lenis) window.__lenis.stop(); document.body.style.overflow='hidden';
      setTimeout(()=>nameEl.focus(),60); };
    const closeGet=()=>{ gm.classList.remove('open'); gm.setAttribute('aria-hidden','true');
      if (window.__lenis) window.__lenis.start(); document.body.style.overflow=''; };
    const dl=f=>{ const a=document.createElement('a'); a.href=f; a.download=''; document.body.appendChild(a); a.click(); a.remove(); };
    async function submitGet(){
      const name=nameEl.value.trim(), email=emailEl.value.trim();
      if(!name){ errEl.textContent='Dit navn, tak.'; return; }
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ errEl.textContent='En gyldig mail, tak.'; return; }
      submit.style.pointerEvents='none';
      try{ if (WEB3FORMS_KEY){ const fd=new FormData(); fd.append('access_key',WEB3FORMS_KEY);
          fd.append('subject','Bibliotek download · '+(current.title||'')); fd.append('from_name','AXON Bibliotek'); fd.append('replyto',email);
          fd.append('Navn',name); fd.append('Mail',email); fd.append('Ressource',current.title||''); fd.append('Type',current.type||'');
          await fetch('https://api.web3forms.com/submit',{method:'POST',body:fd}); }
        else console.warn('[library] lead captured (no WEB3FORMS_KEY set):',{name,email,resource:current.title}); }
      catch(e){ console.warn('[library] send failed',e); }
      if (current.file) dl(current.file);
      gm.classList.add('sent');
    }
    document.querySelectorAll('[data-get]').forEach(b=>b.addEventListener('click',e=>{ e.preventDefault();
      openGet({title:b.dataset.title, type:b.dataset.type, file:b.dataset.file}); }));
    gm.querySelectorAll('[data-gmclose]').forEach(el=>el.addEventListener('click',closeGet));
    submit.addEventListener('click',submitGet);
    submit.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); submitGet(); }});
    emailEl.addEventListener('keydown',e=>{ if(e.key==='Enter') submitGet(); });
    addEventListener('keydown',e=>{ if(e.key==='Escape'&&gm.classList.contains('open')) closeGet(); });
    // donation prompt after download (MobilePay)
    const gmDonate=document.getElementById('gm-donate');
    const MOBILEPAY_LINK=''; // paste your MobilePay box link to go live
    if (gmDonate) gmDonate.addEventListener('click', ()=>{ if (MOBILEPAY_LINK){ window.open(MOBILEPAY_LINK,'_blank','noopener'); }
      else { const t=gmDonate.textContent; gmDonate.textContent='Tilføj MobilePay link i koden'; setTimeout(()=>gmDonate.textContent=t,2000); } });
  }

  /* ============ mobile menu ============ */
  const menuBtn = document.getElementById('menuBtn'), mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu){
    const openM = () => { menuBtn.classList.add('open'); mobileMenu.classList.add('open');
      menuBtn.setAttribute('aria-expanded','true'); mobileMenu.setAttribute('aria-hidden','false');
      if (window.__lenis) window.__lenis.stop(); document.body.style.overflow='hidden'; };
    const closeM = () => { menuBtn.classList.remove('open'); mobileMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded','false'); mobileMenu.setAttribute('aria-hidden','true');
      if (window.__lenis) window.__lenis.start(); document.body.style.overflow=''; };
    menuBtn.addEventListener('click', () => mobileMenu.classList.contains('open') ? closeM() : openM());
    mobileMenu.querySelectorAll('[data-mclose]').forEach(el => el.addEventListener('click', closeM));
    addEventListener('keydown', e => { if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeM(); });
  }

  /* ============ titles: per-letter colour-wheel hover + binary flicker ============ */
  (function titles(){
    function wrap(h){
      if (h.dataset.fx) return; h.dataset.fx='1';
      const tw=document.createTreeWalker(h, NodeFilter.SHOW_TEXT, { acceptNode:n=>(n.parentElement&&n.parentElement.closest('.grad,.ch'))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT });
      const texts=[]; let n; while(n=tw.nextNode()){ if(n.nodeValue) texts.push(n); }
      texts.forEach(tn=>{ const frag=document.createDocumentFragment();
        tn.nodeValue.split(/(\s+)/).forEach(tok=>{ if(tok==='') return;
          if(/^\s+$/.test(tok)){ frag.appendChild(document.createTextNode(tok)); return; }
          const wd=document.createElement('span'); wd.className='wd';
          for(const c of tok){ const s=document.createElement('span'); s.className='ch'; s.textContent=c; s.dataset.c=c; wd.appendChild(s); }
          frag.appendChild(wd); });
        tn.parentNode.replaceChild(frag, tn); });
    }
    const heads=[...document.querySelectorAll('h1, h2, h3')];
    heads.forEach(wrap);
    addEventListener('mousemove', e=>root.style.setProperty('--hue', (e.clientX/innerWidth*360)|0), {passive:true});
    if(!REDUCED) heads.forEach(h=>{
      const tick=()=>setTimeout(()=>{ flick(); tick(); }, 3200+Math.random()*4200);
      function flick(){ const chs=h.querySelectorAll('.ch'); if(!chs.length) return;
        const k=2+(Math.random()*3|0), picks=[]; for(let i=0;i<k;i++) picks.push(chs[(Math.random()*chs.length)|0]);
        let f=0; const iv=setInterval(()=>{ f++; if(f>4){ clearInterval(iv); picks.forEach(s=>s.textContent=s.dataset.c); return; }
          picks.forEach(s=> s.textContent=Math.random()<.5?'0':'1'); }, 85); }
      tick();
    });
  })();
})();

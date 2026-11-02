// Shared header and footer for every Dapperowl prototype page.
(function(){
  const LOGO = function(eye, word){ return '<svg class="logo" viewBox="18 14 274 108" role="img" aria-label="Dapperowl">'+
    '<path d="M50 18 A28 28 0 0 1 78 46 L78 88 Q78 94 72 94 L36 94 Q22 94 22 80 L22 46 A28 28 0 0 1 50 18 Z" fill="#1F9D55"/>'+
    '<path d="M-10 -5 L0 5 L10 -5" transform="translate(50 44)" fill="none" stroke="'+eye+'" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="M44 98 L57 98 L43 118 L30 118 Z M62 98 L75 98 L61 118 L48 118 Z" fill="#1F9D55"/>'+
    '<path d="M82 58 L286 58 Q206 106 108 100 L82 96 Z" fill="#1F9D55"/>'+
    '<path d="M156 56 L128 108 M202 56 L178 102 M246 56 L228 90" stroke="'+eye+'" stroke-width="4"/>'+
    (word?'<text x="92" y="46.4" font-family="Outfit, sans-serif" font-weight="700" font-size="24" letter-spacing="2" fill="#1F9D55">DAPPEROWL</text>':'')+
    '</svg>'; };
  window.DAPPER_LOGO = LOGO;
  const here = (location.pathname.split('/').pop() || 'index.html');
  const cls = f => here===f ? ' class="here"' : '';
  // page-specific button left of Sign in (30 Oct): Join gets "Start your profile", Find gets "Create a firm account" (not once a firm is signed in)
  const cta = ()=>{
    if(here==='join.html') return '<a class="topcta" href="create-profile.html">Start your profile</a>';
    let firm=false; try{ firm=sessionStorage.getItem('dapper-firm')==='1'; }catch(e){}
    if(here==='find.html' && !firm) return '<a class="topcta tang" href="firm-signup.html">Create a firm account</a>';
    return '';
  };
  const head = document.getElementById('site-head');
  if(head){
    head.className='top gut';
    head.innerHTML = '<nav aria-label="Main left"><a href="join.html"'+cls('join.html')+'>Join as an expert</a><a href="find.html"'+cls('find.html')+'>Find an expert</a></nav>'+
      '<a href="index.html" aria-label="Dapperowl home">'+LOGO('#FBEFC6','#1F9D55')+'</a>'+
      '<nav class="r" aria-label="Main right">'+cta()+'<a href="signin.html"'+cls('signin.html')+'>Sign in</a></nav>';
  }
  const foot = document.getElementById('site-foot');
  if(foot){
    foot.className='foot gut';
    foot.innerHTML = '<div class="inner">'+
      '<div>'+LOGO('#14254F','#F5F0E6').replace('class="logo"','class="mark"')+
      '<p>Dapperowl is a community interest company. We never touch the money: 100% of every donation goes straight to the expert\'s chosen charity.</p>'+
      '<p>Questions? <span style="color:#fff;font-weight:700">hello@dapperowl.co.uk</span></p></div>'+
      '<div><h4>Pages</h4><ul><li><a href="find.html">Find an expert</a></li><li><a href="join.html">Join as an expert</a></li><li><a href="signin.html">Sign in</a></li></ul></div>'+
      '<div><h4>Small print</h4><ul><li><a href="legal.html#terms">Terms</a></li><li><a href="legal.html#privacy">Privacy</a></li><li><a href="legal.html#conduct">Code of conduct</a></li><li><a href="legal.html#cookies">Cookies</a></li><li><a href="emails.html">Email designs</a></li></ul></div>'+
      '<div class="base"><span>\u00a9 2026 Dapperowl CIC</span></div></div>';
  }
})();

// Donation tracker, original website style. mount(el, stages) plays it; html(labels, stage) draws a still version for dashboards.
(function(){
  const TICK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const HOLD=4400, FADE=500;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const T={
    EXPERT:[
      ['Pledged','The firm pledges a donation to the charity of your choice.'],
      ['You send it','After the meeting, you press Send to release the pledged donation to your charity.'],
      ['Firm paid','The firm donates directly on the charity\'s website and uploads its receipt.'],
      ['Charity received','The charity confirms your donation and thanks you directly.']],
    FIRM:[
      ['Pledged','You pledge a donation to the expert\'s chosen charity when you send your request.'],
      ['Expert sent it','After the meeting, the expert presses Send to release your donation to their charity.'],
      ['You paid','You donate directly on the charity\'s website and upload your receipt.'],
      ['Charity received','The charity confirms the donation and thanks the expert directly.']],
    html(labels,stage){
      return '<div class="ot static"><ol class="ot-stops">'+labels.map((l,i)=>'<li class="ot-stop'+(i<stage?' on':'')+'"><span class="ot-btn"><span class="ot-dot">'+TICK+'</span>'+l+'<span style="position:absolute;left:-9999px">'+(i<stage?' (done)':' (not yet)')+'</span></span></li>').join('')+'</ol></div>';
    },
    mount(el,stages){
      el.className='ot';
      el.innerHTML='<ol class="ot-stops">'+stages.map((s,i)=>'<li class="ot-stop"><button type="button" class="ot-btn" data-i="'+i+'" aria-label="Show stage '+(i+1)+': '+s[0]+'"><span class="ot-dot">'+TICK+'</span>'+s[0]+'</button></li>').join('')+'</ol><p class="ot-status" aria-live="polite"></p><p class="ot-hint">Tap any stage to replay from there.</p>';
      const lis=[...el.querySelectorAll('.ot-stop')], st=el.querySelector('.ot-status');
      const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
      let token=0;
      function show(i){ lis.forEach((l,k)=>{l.classList.toggle('on',k<=i);l.classList.toggle('cur',k===i);}); st.textContent=stages[i][1]; }
      async function run(from){
        const my=++token;
        st.classList.add('out'); await wait(from===0&&!st.textContent?0:FADE/2); if(my!==token) return;
        for(let i=from;i<stages.length;i++){
          show(i); st.classList.remove('out');
          await wait(HOLD); if(my!==token) return;
          st.classList.add('out'); await wait(FADE); if(my!==token) return;
        }
        await wait(300); if(my!==token) return;
        lis.forEach(l=>l.classList.remove('on','cur')); st.textContent='';
        await wait(800); if(my!==token) return;
        run(0);
      }
      el.querySelectorAll('.ot-btn').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(reduce){show(i);st.classList.remove('out');} else run(i); });
      if(reduce){ show(stages.length-1); return {stop(){}}; }
      run(0);
      return {stop(){token++;}};
    }
  };
  window.DapperTracker=T;
})();

// Carry the homepage style to every other page: coloured header band with wavy edge, label headings, gentle reveals.
(function(){
  const page=(location.pathname.split('/').pop()||'index.html');
  if(page==='index.html'||page==='') return;
  const C={
    'find.html':['#2251FF','#F5F0E6','#F5F0E6'],
    'join.html':['#2251FF','#F5F0E6','#F5F0E6'],
    'signin.html':['#14254F','#F5F0E6','#F5F0E6'],
    'request.html':['#2251FF','#F5F0E6','#F5F0E6'],
    'create-profile.html':['#F6C344','#14254F','#F5F0E6'],
    'firm-signup.html':['#FF7A1A','#14254F','#F5F0E6'],
    'expert-dashboard.html':['#14254F','#F5F0E6','#F6C344'],
    'firm-dashboard.html':['#7A1F2B','#F5F0E6','#F6C344'],
    'legal.html':['#14254F','#F5F0E6','#F5F0E6'],
    'emails.html':['#2251FF','#F5F0E6','#F5F0E6']
  }[page]||['#2251FF','#F5F0E6','#F5F0E6'];
  const wave=bg=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','pwave');s.setAttribute('viewBox','0 0 1440 56');s.setAttribute('preserveAspectRatio','none');s.setAttribute('aria-hidden','true');s.style.background=bg;s.innerHTML='<path d="M0 22 C260 54 520 4 780 24 S1240 50 1440 14 L1440 56 L0 56 Z" fill="#F5F0E6"/>';return s;};
  const label=h=>{ if(!h||h.querySelector('span.l')) return; const sp=document.createElement('span'); sp.className='l'; while(h.firstChild) sp.appendChild(h.firstChild); h.appendChild(sp); };
  const main=document.querySelector('main');
  const hero=document.querySelector('section.hero');
  if(hero){ // join page already has a coloured hero
    const h=hero.querySelector('h1'); if(h){h.classList.add('lbl'); label(h);} hero.style.setProperty('--lab',C[2]);
    hero.after(wave(getComputedStyle(hero).backgroundColor));
  } else if(main){
    const h1=main.querySelector('h1');
    if(h1){
      let blk=h1; while(blk.parentElement && blk.parentElement!==main) blk=blk.parentElement;
      const band=document.createElement('section'); band.className='phead gut';
      band.style.setProperty('--pb',C[0]); band.style.setProperty('--pt',C[1]); band.style.setProperty('--lab',C[2]);
      const inner=document.createElement('div'); inner.className='inner'; band.appendChild(inner);
      const small = blk!==h1 && blk.textContent.length<600 && !blk.querySelector('form,input,textarea,[role=tablist]');
      if(small){ inner.appendChild(blk); }
      else {
        const next=h1.nextElementSibling;
        inner.appendChild(h1);
        if(next && next.matches('p.lead,p.intro')) inner.appendChild(next);
      }
      h1.classList.add('lbl'); h1.classList.remove('page'); label(h1);
      main.before(band); band.after(wave(C[0]));
    }
  }
  document.querySelectorAll('h2.sec').forEach(label);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce && 'IntersectionObserver' in window && main){
    document.documentElement.classList.add('js');
    const els=[...main.children].filter(e=>!e.matches('script,[hidden]'));
    els.forEach(e=>e.classList.add('rv'));
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.08});
    els.forEach(e=>io.observe(e));
    setTimeout(()=>els.forEach(e=>e.classList.add('in')),4000);
  }
})();

// Small confirmations for actions that would hand off to another service (calendar, LinkedIn, downloads).
(function(){
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-done]'); if(!b) return;
    if(b.tagName==='A') e.preventDefault();
    if(b.dataset.orig===undefined) b.dataset.orig=b.innerHTML;
    b.innerHTML='\u2713 '+b.dataset.done; b.classList.add('isdone');
    clearTimeout(b._t); b._t=setTimeout(()=>{b.innerHTML=b.dataset.orig;b.classList.remove('isdone');},3200);
  });
})();

// Owl dividers (30 Oct): fills each empty .owl-div with a navy line broken by the emerald owl (body and feet).
(function(){
  const OWL='<svg viewBox="20 16 60 104" aria-hidden="true"><path d="M50 18 A28 28 0 0 1 78 46 L78 88 Q78 94 72 94 L36 94 Q22 94 22 80 L22 46 A28 28 0 0 1 50 18 Z" fill="#1F9D55"/>'+
    '<path d="M-10 -5 L0 5 L10 -5" transform="translate(50 44)" fill="none" stroke="#F4B183" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="M44 98 L57 98 L43 118 L30 118 Z M62 98 L75 98 L61 118 L48 118 Z" fill="#1F9D55"/></svg>';
  document.querySelectorAll('.owl-div').forEach(d=>{ d.setAttribute('aria-hidden','true'); d.innerHTML='<span>'+OWL+'</span>'; });
})();

// Click-to-enlarge pop-up (30 Oct) for any [data-enlarge] element, like the homepage certificate.
// data-enlarge="scroll" shows a tall copy that scrolls; otherwise the copy is scaled to ~90% of the screen.
(function(){
  const els=[...document.querySelectorAll('[data-enlarge]')]; if(!els.length) return;
  const dlg=document.createElement('dialog'); if(!dlg.showModal) return;
  dlg.className='enldlg'; dlg.setAttribute('aria-label','Enlarged view');
  dlg.innerHTML='<div class="enldlg-in"><button type="button" class="enldlg-x" aria-label="Close"><span aria-hidden="true">×</span></button><div class="enldlg-box"></div></div>';
  document.body.appendChild(dlg);
  const box=dlg.querySelector('.enldlg-box'), x=dlg.querySelector('.enldlg-x'), root=document.documentElement;
  const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  let from=null;
  const fit=()=>{
    const c=box.firstElementChild; if(!c) return;
    box.style.width=''; box.style.height=''; c.style.transform='none';
    if(from.dataset.enlarge==='scroll'){ c.style.width='min(760px,88vw)'; c.style.height='auto'; c.style.maxHeight='86svh'; return; }
    c.style.width=(from.dataset.w||from.offsetWidth)+'px'; c.style.height='auto';
    const w=c.offsetWidth, h=c.offsetHeight, k=Math.min(innerHeight*0.88/h, innerWidth*0.9/w, +from.dataset.max||Infinity);
    c.style.transformOrigin='top left'; c.style.transform='scale('+k+')';
    box.style.width=(w*k)+'px'; box.style.height=(h*k)+'px';
  };
  const open=el=>{
    from=el; box.innerHTML='';
    const c=el.cloneNode(true);
    ['data-enlarge','data-seq','role','aria-haspopup','aria-label','id','style'].forEach(a=>c.removeAttribute(a));
    c.classList.remove('on'); c.classList.add('enl-copy');
    if(el.dataset.enlarge==='scroll') c.setAttribute('tabindex','0'); else c.removeAttribute('tabindex');
    box.appendChild(c);
    dlg.setAttribute('aria-label',(el.getAttribute('aria-label')||'Enlarged view').replace(/^Enlarge:?\s*/i,'')+', enlarged');
    root.style.overflow='hidden'; root.style.scrollSnapType='none';
    dlg.classList.add('fading'); dlg.showModal(); fit();
    requestAnimationFrame(()=>dlg.classList.remove('fading')); x.focus();
  };
  const close=()=>{
    if(!dlg.open) return;
    const done=()=>{ dlg.close(); dlg.classList.remove('fading'); root.style.overflow=''; root.style.scrollSnapType=''; if(from) from.focus(); };
    if(reduce()) return done();
    dlg.classList.add('fading'); setTimeout(done,200);
  };
  els.forEach(el=>{
    el.addEventListener('click',()=>open(el));
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'||(e.key===' '&&el.getAttribute('role')==='button')){ e.preventDefault(); open(el); } });
  });
  x.addEventListener('click',close);
  dlg.addEventListener('cancel',e=>{ e.preventDefault(); close(); });
  dlg.addEventListener('click',e=>{ if(e.target===dlg) close(); });
  addEventListener('resize',()=>{ if(dlg.open) fit(); });
})();

// How it works (30 Oct): both column dividers are as long as the tallest step text in the row.
(function(){
  const rows=[...document.querySelectorAll('.hiw-cols')]; if(!rows.length) return;
  const set=()=>rows.forEach(row=>{ const h=Math.max(...[...row.querySelectorAll('.hiw-text')].map(p=>p.offsetHeight)); row.style.setProperty('--hiw-h',h+'px'); });
  set(); addEventListener('resize',set); addEventListener('load',set);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(set);
  if('ResizeObserver' in window){ const ro=new ResizeObserver(set); rows.forEach(r=>r.querySelectorAll('.hiw-text').forEach(p=>ro.observe(p))); }
})();

// Firm trust (30 Oct): sign-in state for the prototype, plus badges and the signed pledge text.
(function(){
  const K='dapper-firm';
  const TICK='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#14254F"/><path d="M5.8 10.3l2.8 2.8 5.6-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const STAR='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#fff"/><path d="M10 4.6l1.6 3.4 3.7.4-2.8 2.5.8 3.7L10 12.7l-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="#1F9D55"/></svg>';
  window.DapperFirm={
    signedIn(){ try{ return sessionStorage.getItem(K)==='1'; }catch(e){ return false; } },
    signIn(){ try{ sessionStorage.setItem(K,'1'); }catch(e){} },
    signOut(){ try{ sessionStorage.removeItem(K); }catch(e){} },
    // every verified firm gets the first badge; "Reliable donor" after 3 out of 3 donations on time (no numbers shown)
    badges(reliable){ return '<span class="fbadges"><span class="fbadge">'+TICK+'Verified organisation</span>'+(reliable?'<span class="fbadge rel">'+STAR+'Reliable donor</span>':'')+'</span>'; },
    pledgeText(p){ return 'I, '+p.name+', '+p.title+', pledge on behalf of '+p.company+' to donate £'+Number(p.amount).toLocaleString('en-GB')+' to '+p.charity+' within 48 hours of the expert pressing Send.'; },
    signedBlock(p){ return '<div class="signed"><span class="eyebrow">Signed pledge</span><q>'+this.pledgeText(p)+'</q><span class="by">Signed by '+p.name+', '+p.title+' <span>· '+p.at+'</span></span></div>'; }
  };
  // signing out from a firm page clears the prototype's signed-in state
  document.addEventListener('click',e=>{ const a=e.target.closest&&e.target.closest('a'); if(a&&/sign out/i.test(a.textContent)) window.DapperFirm.signOut(); });
})();

// Shared header and footer for every Nestorly prototype page.
(function(){
  // Nestorly envelope-owl wordmark (2 Nov): navy on light backgrounds, cream on navy and dark ones
  const LOGO = function(tone){ return '<img class="logo" src="images/nestorly-logo-'+(tone==='cream'?'cream':'navy')+'.svg" alt="Nestorly">'; };
  window.DAPPER_LOGO = LOGO;
  // the same navy logo inlined, for downloaded certificate SVG files (x, y, height in the file's units)
  let svgText='';
  fetch('images/nestorly-logo-navy.svg').then(r=>r.text()).then(t=>{ svgText=t.replace(/<metadata>[\s\S]*?<\/metadata>/,'').replace(/<svg[^>]*>/,''); }).catch(()=>{});
  window.NESTORLY_LOGO_SVG = function(cx,y,h){ const w=Math.round(h*681/628);
    return svgText ? '<svg x="'+(cx-w/2)+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="267 203 681 628" role="img" aria-label="Nestorly">'+svgText
      : '<text x="'+cx+'" y="'+(y+h*.7)+'" text-anchor="middle" font-family="Outfit,Arial" font-weight="700" font-size="40" fill="#14254F" letter-spacing="4">NESTORLY</text>'; };
  const here = (location.pathname.split('/').pop() || 'index.html');
  const cls = f => here===f ? ' class="here"' : '';
  const DS = window.DS, me = DS ? DS.me() : null;
  // pages that need an account (2 Nov): signed out → Sign in; the other role → their own dashboard
  const NEED={'expert-dashboard.html':'expert','firm-dashboard.html':'firm','request.html':'firm'};
  if(DS && NEED[here]){
    if(!me){ location.replace('signin.html?next='+encodeURIComponent(here+location.search+location.hash)); return; }
    if(me.role!==NEED[here]){ location.replace(DS.home(me)); return; }
  }
  // page-specific button left of Sign in (30 Oct): Join gets "Start your profile", Find gets "Create a firm account"; signed-in visitors never see them
  const cta = ()=>{
    if(here==='join.html') return '<a class="topcta" href="create-profile.html">Start your profile</a>';
    if(here==='find.html') return '<a class="topcta tang" href="firm-signup.html">Create a firm account</a>';
    return '';
  };
  const esc = t => String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const BELL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0-6 6v4.2L4.3 16.5h15.4L18 13.2V9a6 6 0 0 0-6-6z" fill="#14254F"/><path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" fill="none" stroke="#14254F" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const head = document.getElementById('site-head');
  if(head && !me){
    head.className='top gut';
    head.innerHTML = '<nav aria-label="Main left"><a href="join.html"'+cls('join.html')+'>Join as an expert</a><a href="find.html"'+cls('find.html')+'>Find an expert</a></nav>'+
      '<a href="index.html" aria-label="Nestorly home">'+LOGO('navy')+'</a>'+
      '<nav class="r" aria-label="Main right">'+cta()+'<a href="signin.html"'+cls('signin.html')+'>Sign in</a></nav>';
  } else if(head){
    // signed in (2 Nov): role-aware links, the bell and the account menu
    const ex = me.role==='expert', dash = DS.home(me);
    const left = ex
      ? '<a href="expert-dashboard.html"'+(here===dash&&location.hash!=='#questions'?' class="here"':'')+'>Dashboard</a><a href="expert-dashboard.html#questions"'+(here===dash&&location.hash==='#questions'?' class="here"':'')+'>Open questions</a>'
      : '<a href="find.html"'+cls('find.html')+'>Find an expert</a><a href="firm-dashboard.html"'+cls('firm-dashboard.html')+'>Dashboard</a>';
    const items = ex
      ? [['Dashboard',dash],['Donations & impact',dash+'#donations'],['Profile & settings',dash+'#profile']]
      : [['Dashboard',dash],['Donations & receipts',dash+'#donations'],['Organisation & settings',dash+'#account']];
    const org = ex ? 'Expert' : ((DS.firm(me.ref)||{}).name||'Firm');
    const initials = me.name.split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
    head.className='top gut tb-in';
    head.innerHTML = '<nav aria-label="Main left">'+left+'</nav>'+
      '<a href="'+dash+'" aria-label="Nestorly, your dashboard">'+LOGO('navy')+'</a>'+
      '<nav class="r" aria-label="Your account">'+
        '<div class="tb-pop"><button type="button" class="tb-bell" id="tb-bell" aria-expanded="false" aria-controls="tb-alerts">'+BELL+'<span class="tb-count" id="tb-count" hidden></span><span class="sr">Alerts</span></button>'+
          '<div class="tb-menu tb-alerts" id="tb-alerts" hidden><div class="tb-mh"><b>Alerts</b><button type="button" id="tb-readall">Mark all read</button></div><ul id="tb-alist"></ul></div></div>'+
        '<div class="tb-pop"><button type="button" class="tb-acct" id="tb-acct" aria-expanded="false" aria-controls="tb-amenu"><span class="tb-av" aria-hidden="true">'+esc(initials)+'</span><span class="tb-nm">'+esc(me.name.split(' ')[0])+'</span><svg class="tb-caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" fill="none" stroke="#14254F" stroke-width="2"/></svg></button>'+
          '<div class="tb-menu" id="tb-amenu" hidden><div class="tb-who"><b>'+esc(me.name)+'</b><span>'+esc(org)+'</span><span>'+esc(me.email)+'</span></div><ul>'+
          items.map(([l,h])=>'<li><a href="'+h+'">'+esc(l)+'</a></li>').join('')+'<li><button type="button" data-signout>Sign out</button></li></ul></div></div>'+
      '</nav>';
    const pops=[['tb-bell','tb-alerts'],['tb-acct','tb-amenu']];
    const close=(except)=>pops.forEach(([b,m])=>{ if(b===except) return; document.getElementById(m).hidden=true; document.getElementById(b).setAttribute('aria-expanded','false'); });
    pops.forEach(([b,m])=>{ const btn=document.getElementById(b), menu=document.getElementById(m);
      btn.addEventListener('click',e=>{ e.stopPropagation(); const open=menu.hidden; close(b); document.documentElement.style.setProperty('--tbm-top',Math.round(btn.getBoundingClientRect().bottom+10)+'px'); menu.hidden=!open; btn.setAttribute('aria-expanded',String(open)); if(open&&b==='tb-bell') drawAlerts(); }); });
    document.addEventListener('click',e=>{ if(!e.target.closest('.tb-pop')) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const o=pops.find(([b,m])=>!document.getElementById(m).hidden); if(o){ close(); document.getElementById(o[0]).focus(); } } });
    // a hash link to the page you're on (e.g. Donations & impact from the dashboard) closes the menu
    head.querySelectorAll('.tb-menu a').forEach(a=>a.addEventListener('click',()=>close()));
    const ago=t=>{ const m=Math.round((Date.now()-new Date(t))/60000); return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'; };
    function drawAlerts(){
      const list=DS.myAlerts(), n=list.filter(a=>!a.read).length, c=document.getElementById('tb-count');
      c.hidden=!n; c.textContent=n>9?'9+':n; document.getElementById('tb-bell').setAttribute('aria-label','Alerts'+(n?', '+n+' unread':''));
      document.getElementById('tb-alist').innerHTML=list.length?list.slice(0,8).map(a=>'<li class="'+(a.read?'':'unread')+'"><a href="'+esc(a.link)+'" data-a="'+a.id+'">'+esc(a.text)+'<span>'+ago(a.at)+'</span></a></li>').join(''):'<li class="none">Nothing new yet.</li>';
      document.querySelectorAll('#tb-alist a').forEach(x=>x.addEventListener('click',()=>{ DS.update(s=>{ const al=s.alerts.find(y=>y.id===x.dataset.a); if(al) al.read=true; }); close(); }));
    }
    window.DapperAlerts={draw:drawAlerts};
    addEventListener('dapper-change',drawAlerts);
    document.getElementById('tb-readall').onclick=()=>{ DS.update(s=>s.alerts.forEach(a=>{ if(a.to===me.id) a.read=true; })); drawAlerts(); };
    drawAlerts();
  }
  // sign out from anywhere (the account menu, or any "Sign out" link or button): back to the homepage, signed out
  document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('a,button'); if(!t) return;
    if(t.hasAttribute('data-signout')||/^\s*sign out\s*$/i.test(t.textContent)){ e.preventDefault(); if(DS) DS.signOut(); location.href='index.html'; } });
  const foot = document.getElementById('site-foot');
  if(foot){
    foot.className='foot gut';
    foot.innerHTML = '<div class="inner">'+
      '<div>'+LOGO('cream').replace('class="logo"','class="mark"')+
      '<p>Nestorly is a community interest company. We never touch the money: 100% of every donation goes straight to the expert\'s chosen charity.</p>'+
      '<p>Questions? <span style="color:#fff;font-weight:700">hello@nestorly.co.uk</span></p></div>'+
      '<div><h4>Pages</h4><ul><li><a href="find.html">Find an expert</a></li><li><a href="join.html">Join as an expert</a></li><li><a href="signin.html">Sign in</a></li></ul></div>'+
      '<div><h4>Small print</h4><ul><li><a href="legal.html#terms">Terms</a></li><li><a href="legal.html#privacy">Privacy</a></li><li><a href="legal.html#conduct">Code of conduct</a></li><li><a href="legal.html#cookies">Cookies</a></li><li><a href="emails.html">Emails</a></li><li><button type="button" class="foot-reset" id="foot-reset">Reset prototype</button></li></ul></div>'+
      '<div class="base"><span>\u00a9 2026 Nestorly CIC</span></div></div>'+
      '<dialog class="enldlg" id="reset-dlg" aria-labelledby="reset-h"><div class="gatecard"><h2 id="reset-h">Reset the prototype?</h2><p>This clears everything created in this browser (profiles, firm accounts, requests, messages) and puts the sample data back. You\'ll be signed out.</p><div class="acts"><button type="button" class="btn" id="reset-yes">Reset</button><button type="button" class="btn ghost" id="reset-no">Cancel</button></div></div></dialog>';
    const dlg=document.getElementById('reset-dlg');
    document.getElementById('foot-reset').onclick=()=>{ if(dlg.showModal) dlg.showModal(); else if(confirm('Reset the prototype?')) doReset(); };
    document.getElementById('reset-no').onclick=()=>dlg.close();
    dlg.addEventListener('click',e=>{ if(e.target===dlg) dlg.close(); });
    const doReset=()=>{ if(window.DS) DS.reset(); location.href='index.html'; };
    document.getElementById('reset-yes').onclick=doReset;
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

// Owl dividers (30 Oct; logo 2 Nov): fills each empty .owl-div with a navy line broken by the small Nestorly logo.
(function(){
  const OWL='<img src="images/nestorly-logo-navy.svg" alt="">';
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
    // backed by the shared store (2 Nov): signed in as a firm account
    signedIn(){ const u=window.DS&&DS.me(); return !!(u&&u.role==='firm'); },
    signIn(userId){ if(window.DS&&userId) DS.signIn(userId); },
    signOut(){ if(window.DS) DS.signOut(); },
    // every verified firm gets the first badge; "Reliable donor" after 3 out of 3 donations on time (no numbers shown)
    badges(reliable){ return '<span class="fbadges"><span class="fbadge">'+TICK+'Verified organisation</span>'+(reliable?'<span class="fbadge rel">'+STAR+'Reliable donor</span>':'')+'</span>'; },
    pledgeText(p){ return 'I, '+p.name+', '+p.title+', pledge on behalf of '+p.company+' to donate £'+Number(p.amount).toLocaleString('en-GB')+' to '+p.charity+' within 48 hours of the expert pressing Send.'; },
    signedBlock(p){ return '<div class="signed"><span class="eyebrow">Signed pledge</span><q>'+this.pledgeText(p)+'</q><span class="by">Signed by '+p.name+', '+p.title+' <span>· '+p.at+'</span></span></div>'; }
  };
})();

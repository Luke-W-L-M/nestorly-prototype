// Firm dashboard (2 Nov): everything reads and writes the shared store (store.js).
// Views: To do · Requests (and each request's detail) · Meetings · My open questions · Saved experts · Donations & receipts · Organisation & settings.
(function(){
const $=id=>document.getElementById(id);
const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const gbp=n=>'£'+Number(n).toLocaleString('en-GB');
const me=DS.me(); if(!me||me.role!=='firm') return; // site.js has already sent anyone else away
const S=()=>DS.get();
const FM=()=>DS.firm(me.ref);
const mine=()=>S().requests.filter(r=>r.firmId===me.ref);
const R=id=>S().requests.find(r=>r.id===id);
const X=id=>DS.expert(id)||{n:'An expert',cur:'',ch:'',id};
const xFirst=x=>x.n.replace(/^(The Hon\.|Dr|Mr|Mrs|Ms|Prof\.?)\s+/,'').split(' ')[0];
const IND=['Finance & Investment','Energy & Natural Resources','Shipping, Transport & Logistics','Food, Agriculture & Fisheries','Health & Life Sciences','Technology & Telecoms','Manufacturing & Construction','Property & Infrastructure','Consumer, Retail & Hospitality','Media, Entertainment & Games','Environment & Sustainability','Government, Policy & Defence','Law & Professional Services','Education, Charities & Social Impact'];
const STATE={sent:['Waiting for reply','wait'],suggested:['New time suggested','go'],booked:['Accepted · booked','ok'],declined:['Declined','no'],done:['Done','ok']};
const HOUR=3600000;
const isUpcoming=r=>r.state==='booked'&&r.meeting&&new Date(r.meeting.at).getTime()>Date.now()-HOUR;
const isPast=r=>r.meeting&&!isUpcoming(r)&&(r.state==='done'||r.state==='booked');
const unread=r=>(r.messages||[]).filter(m=>m.from==='expert'&&!m.read).length;
const replied=r=>['suggested','booked','declined'].includes(r.state)&&!r.firmSeen;
const myQs=()=>S().questions.filter(q=>q.firmId===me.ref);
const newHands=q=>q.hands.filter(h=>!h.seen).length;
const TRK=['Pledged','Expert sent it','You paid','Charity received'];
const TABS=[['todo','To do'],['requests','Requests'],['meetings','Meetings'],['questions','My open questions'],['saved','Saved experts'],['donations','Donations & receipts'],['account','Organisation & settings']];
const PERSON='<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="22" r="13" fill="#141414"/><path d="M8 58c0-14 10-22 22-22s22 8 22 22z" fill="#141414"/></svg>';
let flash='', rfilter='waiting', qForm=false;

const h=new Date().getHours();
$('hi').textContent=(h<12?'Good morning, ':h<18?'Good afternoon, ':'Good evening, ')+me.name.split(' ')[0];
$('orgname').textContent=FM().name;

function route(){ const m=/^#request-(.+)$/.exec(location.hash); if(m) return {tab:'requests',id:m[1]}; const k=location.hash.slice(1); return {tab:TABS.some(t=>t[0]===k)?k:'todo'}; }
function go(hash){ if(location.hash===hash) draw(); else location.hash=hash; }
addEventListener('hashchange',()=>{ flash=''; draw(); const p=$('panel'); if(p.getBoundingClientRect().top<0) p.scrollIntoView({block:'start'}); });

function tabs(cur){
  const rs=mine();
  const n={todo:todoCount(),requests:rs.filter(replied).length,questions:myQs().reduce((t,q)=>t+newHands(q),0),donations:rs.filter(r=>r.state==='done'&&r.donation.stage===2).length};
  $('tabs').innerHTML=TABS.map(([k,l])=>'<button role="tab" id="tab-'+k+'" aria-selected="'+(k===cur)+'" data-k="'+k+'">'+l+(n[k]?' <span class="badge">'+n[k]+'</span>':'')+'</button>').join('');
  $('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{ flash=''; go('#'+b.dataset.k); });
}
function todoCount(){ const rs=mine(); return rs.filter(replied).length+rs.filter(unread).length+rs.filter(r=>r.state==='done'&&r.donation.stage===2).length+myQs().reduce((t,q)=>t+newHands(q),0); }
function draw(){
  const rt=route(); tabs(rt.tab);
  let html=flash?'<p class="ok-msg" role="status">'+flash+'</p>':'';
  html+=rt.id?detail(rt.id):({todo,requests,meetings,questions,saved,donations,account})[rt.tab]();
  $('panel').innerHTML=html; wire();
  if(window.DapperAlerts) DapperAlerts.draw();
}
const row=(title,sub,btn)=>'<div class="trow"><div><b>'+title+'</b><span>'+sub+'</span></div>'+btn+'</div>';
const card=(title,n,cls)=>'<div class="tcard'+(cls?' '+cls:'')+'"><h3>'+title+(n?' <span class="badge">'+n+'</span>':'')+'</h3>';
const none=t=>'<p class="hint" style="margin:0">'+t+'</p>';

/* ---------- To do ---------- */
function todo(){
  const rs=mine(), rep=rs.filter(replied), msgs=rs.filter(unread), up=rs.filter(isUpcoming).sort((a,b)=>new Date(a.meeting.at)-new Date(b.meeting.at)),
        pay=rs.filter(r=>r.state==='done'&&r.donation.stage===2), hands=myQs().filter(q=>newHands(q));
  let o='<h2 class="sec2">To do</h2><div class="todo">';
  o+=card('Expert replies',rep.length)+(rep.length?rep.map(r=>row(esc(X(r.expertId).n),esc(STATE[r.state][0])+' · '+esc(r.topic),'<a class="btn sm" href="#request-'+r.id+'">'+(r.state==='suggested'?'Answer':'See reply')+'</a>')).join(''):none('No new replies.'))+'</div>';
  o+=card('Unread messages',msgs.length)+(msgs.length?msgs.map(r=>row(esc(X(r.expertId).n),unread(r)+' new · '+esc(r.topic),'<a class="btn ghost sm" href="#request-'+r.id+'">Read</a>')).join(''):none('No unread messages.'))+'</div>';
  o+=card('Upcoming meetings',up.length)+(up.length?up.map(r=>row(esc(DS.when(r.meeting.at)),esc(X(r.expertId).n)+' · '+esc(r.topic),'<span class="acts"><a class="btn sm" href="call.html?r='+r.id+'">Join call</a><a class="btn ghost sm" href="#request-'+r.id+'">Details</a></span>')).join(''):none('Nothing booked.'))+'</div>';
  o+=card('Donations to make',pay.length)+(pay.length?pay.map(r=>row(gbp(r.amount)+' to '+esc(r.pledge.charity),esc(X(r.expertId).n)+' pressed Send on '+esc(DS.day(r.donation.sent)),'<a class="btn sm" href="#donations">Donate</a>')).join(''):none('Nothing to pay right now.'))+'</div>';
  o+=card('Hands raised on your questions',hands.reduce((t,q)=>t+newHands(q),0),'wide')+(hands.length?hands.map(q=>row(esc(q.title),newHands(q)+' new expert'+(newHands(q)>1?'s':''),'<a class="btn ghost sm" href="#questions">See who</a>')).join(''):none('No new hands raised. <a class="link" href="#questions">Post an open question</a> to let experts come to you.'))+'</div>';
  return o+'</div>';
}

/* ---------- Requests ---------- */
function requests(){
  const rs=mine().sort((a,b)=>new Date(b.created)-new Date(a.created));
  const G={waiting:rs.filter(r=>r.state==='sent'),answer:rs.filter(r=>r.state==='suggested'),accepted:rs.filter(r=>r.state==='booked'||r.state==='done'),declined:rs.filter(r=>r.state==='declined')};
  let o='<h2 class="sec2">Requests</h2><div class="seg" role="group" aria-label="Show">'+[['waiting','Waiting'],['answer','Needs your answer'],['accepted','Accepted'],['declined','Declined']].map(([k,l])=>'<button type="button" data-f="'+k+'" aria-pressed="'+(rfilter===k)+'">'+l+' ('+G[k].length+')</button>').join('')+'</div>';
  const list=G[rfilter];
  if(!list.length) o+='<p class="empty">'+({waiting:'Nothing waiting. <a class="link" href="find.html">Find an expert</a> to send a request.',answer:'Nothing needs your answer.',accepted:'No accepted requests yet.',declined:'No declined requests.'})[rfilter]+'</p>';
  list.forEach(r=>{ const x=X(r.expertId), st=STATE[r.state];
    o+='<div class="item"><div class="item-h"><div><b>'+esc(x.n)+'</b><span class="meta">'+esc(r.topic)+' · sent '+esc(DS.day(r.created))+'</span></div><span class="pill '+st[1]+'">'+st[0]+'</span></div>'+
      '<dl class="dl"><dt>Pledged</dt><dd>'+gbp(r.amount)+' to '+esc(r.pledge.charity)+'</dd>'+(r.meeting?'<dt>Meeting</dt><dd>'+esc(DS.when(r.meeting.at))+'</dd>':'')+'</dl>'+
      '<div class="acts"><a class="btn sm" href="#request-'+r.id+'">Open</a>'+(unread(r)?'<span class="pill wait">'+unread(r)+' new message'+(unread(r)>1?'s':'')+'</span>':'')+'</div></div>'; });
  return o;
}
function detail(id){
  const r=R(id); if(!r||r.firmId!==me.ref) return '<button class="back" data-back>← All requests</button><p class="empty">We couldn\'t find that request.</p>';
  if(unread(r)||replied(r)) DS.update(s=>{ const x=s.requests.find(y=>y.id===id); x.firmSeen=true; x.messages.forEach(m=>{ if(m.from==='expert') m.read=true; }); });
  const x=X(r.expertId), st=STATE[r.state], booked=r.state==='booked'||r.state==='done';
  let o='<button class="back" data-back>← All requests</button>'+
    '<div class="item-h"><div><span class="eyebrow">Your request to '+esc(x.n)+'</span><h2 class="sec2" style="margin-top:4px">'+esc(r.topic)+'</h2></div><span class="pill '+st[1]+'">'+st[0]+'</span></div>'+
    '<div class="xcard"><span class="av">'+PERSON+'</span><div><b>'+esc(x.n)+'</b><span>'+esc(x.cur)+' · supports '+esc(x.ch)+'</span>'+(booked?'<br><span>Contact: <a class="link" href="mailto:'+esc(x.cemail||x.email)+'">'+esc(x.cemail||x.email)+'</a>'+(x.phone?' · '+esc(x.phone):'')+'</span>':'<br><span>Contact details are shared once they accept.</span>')+'</div><div class="acts"><a class="btn ghost sm" href="find.html#expert-'+esc(x.id)+'">Open profile</a></div></div>';
  if(r.state==='sent') o+='<div class="panel2"><h3>Waiting for '+esc(xFirst(x))+'</h3><p style="margin:0">You suggested: '+r.times.map(t=>'<b>'+esc(DS.when(t))+'</b>').join(', ')+'. We\'ll let you know as soon as they reply.</p></div>';
  if(r.state==='suggested'&&r.suggestedBy==='firm') o+='<div class="panel2"><h3>Waiting for '+esc(xFirst(x))+'</h3><p style="margin:0">You suggested <b>'+esc(DS.when(r.suggested))+'</b>. We\'ll book it as soon as they agree.</p>'+counter(r)+'</div>';
  else if(r.state==='suggested') o+='<div class="panel2 acc"><h3>'+esc(xFirst(x))+' suggested a new time</h3><p style="margin:0"><b>'+esc(DS.when(r.suggested))+'</b> instead of your times.</p><div class="acts"><button class="btn" data-agree="'+r.id+'">Accept this time</button></div>'+counter(r)+'</div>';
  if(r.state==='declined') o+='<div class="panel2"><h3>'+esc(xFirst(x))+' can\'t help this time</h3>'+(r.declined&&r.declined.note?'<p style="margin:0">"'+esc(r.declined.note)+'"</p>':'')+'<div class="acts"><a class="btn sm" href="find.html">Find a similar expert</a></div></div>';
  if(r.state==='booked') o+='<div class="panel2 acc"><h3>Meeting booked</h3><dl class="dl"><dt>When</dt><dd>'+esc(DS.when(r.meeting.at))+' · '+esc(r.length)+'</dd><dt>How</dt><dd>'+esc(r.fmt)+'</dd></dl>'+attend(r)+'<div class="acts"><a class="btn sm" href="call.html?r='+r.id+'">Join video call</a><button class="btn ghost sm" data-ics="'+r.id+'">Add to calendar</button></div><p class="hint" style="margin:0">The call opens 10 minutes before the start. In the prototype you can join at any time.</p></div>';
  if(r.state==='done') o+='<div class="panel2"><h3>Donation</h3>'+DapperTracker.html(TRK,r.donation.stage)+'<p style="margin:0">'+donNote(r)+'</p>'+(r.donation.stage===2?'<div class="acts"><a class="btn" href="#donations">Go to Donations &amp; receipts</a></div>':'')+'</div>';
  o+='<div class="goal"><span class="eyebrow">What you hope to get out of it</span><p>'+esc(r.goal)+'</p></div>'+
    (r.questions.length?'<div class="rsec"><span class="lab">Your questions</span><ol>'+r.questions.map(q=>'<li>'+esc(q)+'</li>').join('')+'</ol></div>':'')+
    DapperFirm.signedBlock({name:r.pledge.name,title:r.pledge.title,company:r.pledge.company,amount:r.pledge.amount,charity:r.pledge.charity,at:DS.when(r.pledge.at)});
  o+='<div class="panel2"><h3>Messages</h3><p class="hint" style="margin:0">Only you and '+esc(x.n)+' can see these.</p><div class="thread">'+
    ((r.messages||[]).length?r.messages.map(m=>'<div class="msg'+(m.from==='firm'?' me':'')+'"><small>'+(m.from==='firm'?'You':esc(x.n))+' · '+esc(DS.when(m.at))+'</small>'+esc(m.text)+'</div>').join(''):none('No messages yet.'))+
    '</div><form class="msgform" data-msg="'+r.id+'"><label class="sr" for="mt">Message to '+esc(x.n)+'</label><textarea id="mt" placeholder="Write a message to '+esc(xFirst(x))+'"></textarea><button class="btn sm" type="submit">Send message</button></form></div>';
  return o;
}
function counter(r){ return '<details class="counter"><summary>Suggest '+(r.suggestedBy==='firm'?'a different':'another')+' time</summary><div class="row"><div class="f"><label for="cd">Date</label><input type="date" id="cd"></div><div class="f"><label for="ct">Time</label><input type="time" id="ct" value="10:00"></div></div><button class="btn sm" data-counter="'+r.id+'">Send this time</button></details>'; }
function attend(r){ const j=(r.meeting&&r.meeting.join)||{}; if(!j.expert&&!j.firm) return '';
  return '<p style="margin:0;font-size:17px"><b>Attendance:</b> '+(j.firm?'you joined at '+esc(DS.when(j.firm)):'you haven\'t joined')+' · '+(j.expert?esc(X(r.expertId).n)+' joined at '+esc(DS.when(j.expert)):esc(X(r.expertId).n)+' hasn\'t joined')+'</p>'; }
function donNote(r){ const x=X(r.expertId), d=r.donation, ch=esc(r.pledge.charity);
  return ['', 'Waiting for '+esc(xFirst(x))+' to press Send after the meeting.',
    esc(xFirst(x))+' pressed Send on '+esc(DS.day(d.sent))+'. Please donate '+gbp(r.amount)+' on '+ch+'\'s page within 48 hours, then upload the receipt.',
    'You paid on '+esc(DS.day(d.paid))+'. Waiting for '+ch+' to confirm.',
    ch+' confirmed on '+esc(DS.day(d.received))+'. Thank you.'][d.stage]; }

/* ---------- Meetings ---------- */
function meetings(){
  const rs=mine(), up=rs.filter(isUpcoming).sort((a,b)=>new Date(a.meeting.at)-new Date(b.meeting.at)), past=rs.filter(isPast).sort((a,b)=>new Date(b.meeting.at)-new Date(a.meeting.at));
  const line=(r,isUp)=>'<div class="item"><div class="item-h"><div><b>'+esc(DS.when(r.meeting.at))+'</b><span class="meta">'+esc(X(r.expertId).n)+' · '+esc(r.topic)+'</span></div><span class="pill '+(isUp||r.state==='done'?'ok':'wait')+'">'+(isUp?'Upcoming':(r.state==='done'?'Done':'Waiting for the expert'))+'</span></div>'+
    '<div class="acts"><a class="btn sm" href="#request-'+r.id+'">Open request</a>'+(isUp?'<a class="btn sm" href="call.html?r='+r.id+'">Join video call</a><button class="btn ghost sm" data-ics="'+r.id+'">Add to calendar</button>':'')+'</div></div>';
  return '<h2 class="sec2">Meetings</h2><h3 class="lab" style="margin:0">Upcoming</h3>'+(up.length?up.map(r=>line(r,true)).join(''):'<p class="empty">Nothing booked yet.</p>')+
    '<h3 class="lab" style="margin:8px 0 0">Past</h3>'+(past.length?past.map(r=>line(r,false)).join(''):'<p class="empty">No past meetings yet.</p>');
}

/* ---------- My open questions ---------- */
function questions(){
  const qs=myQs().sort((a,b)=>new Date(b.created)-new Date(a.created));
  let o='<h2 class="sec2">My open questions</h2><p style="margin:0">Post a question and experts in that field can raise their hand. Open their profile and send a request to the one you\'d like to meet.</p>';
  o+=qForm?'<form class="qform" id="qform" novalidate><div class="f"><label for="qt">Your question</label><input type="text" id="qt" maxlength="120" placeholder="e.g. What should we check before buying a fishing quota?"></div>'+
    '<div class="f"><label for="qf">Field</label><select id="qf">'+IND.map(t=>'<option>'+esc(t)+'</option>').join('')+'</select></div>'+
    '<div class="f"><label for="qd">A short description</label><textarea id="qd" maxlength="500" placeholder="What you\'re deciding, and what would help"></textarea></div>'+
    '<div class="f"><label for="qp">Pledge range <span class="opt">(optional)</span></label><input type="text" id="qp" placeholder="e.g. £250–£400"><small>A guide for experts. You set the exact amount when you send a request.</small></div>'+
    '<p class="hint" id="qerr" role="alert" style="margin:0;color:#A3202F;font-weight:700" hidden></p><div class="acts"><button class="btn" type="submit">Post question</button><button class="btn ghost sm" type="button" data-qcancel>Cancel</button></div></form>'
    :'<div class="acts"><button class="btn" data-qnew>Post an open question</button></div>';
  if(!qs.length) o+='<p class="empty">You haven\'t posted any questions yet.</p>';
  qs.forEach(q=>{
    o+='<div class="q"><div class="item-h"><div><h3>'+esc(q.title)+'</h3><span class="meta">'+esc(q.field)+' · posted '+esc(DS.day(q.created))+(q.pledge?' · pledge '+esc(q.pledge):'')+'</span></div><span class="pill '+(q.status==='open'?'ok':'no')+'">'+(q.status==='open'?'Open':'Closed')+'</span></div><p>'+esc(q.desc)+'</p>'+
      '<span class="lab">'+q.hands.length+' hand'+(q.hands.length===1?'':'s')+' raised</span>'+
      (q.hands.length?q.hands.map(hd=>{ const x=X(hd.expertId); return '<div class="hand"><div><b style="font-family:var(--ui);font-size:18px">'+esc(x.n)+(hd.seen?'':' <span class="pill go">New</span>')+'</b><br><span class="meta">'+esc(x.cur)+' · supports '+esc(x.ch)+'</span><div class="note2">'+esc(hd.note)+'</div></div><div class="acts"><a class="btn ghost sm" href="find.html#expert-'+esc(x.id)+'">Open profile</a><a class="btn sm" href="request.html?expert='+esc(x.id)+'&q='+esc(q.id)+'">Send a request</a></div></div>'; }).join(''):none('No hands yet. Experts in '+esc(q.field)+' see it on their dashboard.'))+
      '<div class="acts"><button class="btn ghost sm" data-qclose="'+q.id+'">'+(q.status==='open'?'Close this question':'Reopen')+'</button></div></div>'; });
  // seeing the list marks new hands as seen (after this draw)
  setTimeout(()=>DS.update(s=>s.questions.forEach(q=>{ if(q.firmId===me.ref) q.hands.forEach(hd=>hd.seen=true); })),0);
  return o;
}

/* ---------- Saved experts ---------- */
function saved(){
  const ids=S().saved[me.ref]||[], xs=ids.map(id=>DS.expert(id)).filter(Boolean);
  let o='<h2 class="sec2">Saved experts</h2>';
  if(!xs.length) return o+'<p class="empty">Nothing saved yet. Use the Save button on any profile in <a class="link" href="find.html">Find an expert</a>.</p>';
  xs.forEach(x=>{ o+='<div class="xcard"><span class="av">'+PERSON+'</span><div><b>'+esc(x.n)+'</b><span>'+esc(x.cur)+' · '+esc(x.loc)+'</span><br><span>'+esc(x.ind.join(' · '))+' · supports '+esc(x.ch)+(x.status==='paused'?' · <b>profile paused</b>':'')+'</span></div><div class="acts"><a class="btn ghost sm" href="find.html#expert-'+esc(x.id)+'">Open profile</a>'+(x.status==='paused'?'':'<a class="btn sm" href="request.html?expert='+esc(x.id)+'">Send a request</a>')+'<button class="btn ghost sm" data-unsave="'+esc(x.id)+'">Remove</button></div></div>'; });
  return o;
}

/* ---------- Donations & receipts ---------- */
function donations(){
  const rs=mine().filter(r=>r.state==='done').sort((a,b)=>new Date(b.meeting.at)-new Date(a.meeting.at)), paid=rs.filter(r=>r.donation.stage>=3);
  let o='<h2 class="sec2">Donations &amp; receipts</h2><p style="margin:0">After each conversation the expert presses Send. You then donate straight to their charity, on the charity\'s own page, and upload the receipt. Dapperowl never touches the money.</p>';
  if(!rs.length) o+='<p class="empty">No donations yet. They appear here after your first conversation.</p>';
  rs.forEach(r=>{ const x=X(r.expertId);
    o+='<div class="item"><div class="item-h"><div><b>'+gbp(r.amount)+' to '+esc(r.pledge.charity)+'</b><span class="meta">'+esc(x.n)+' · '+esc(r.topic)+' · '+esc(DS.day(r.meeting.at))+'</span></div><span class="pill '+(r.donation.stage===4?'ok':r.donation.stage===2?'no':'wait')+'">'+['','Waiting for Send','To pay','Waiting for charity','Received'][r.donation.stage]+'</span></div>'+
      DapperTracker.html(TRK,r.donation.stage)+'<p style="margin:0;font-size:18px">'+donNote(r)+'</p>'+
      '<dl class="dl"><dt>Reference</dt><dd><span class="ref" style="font-size:18px;padding:4px 10px">DPO-'+esc(r.id.toUpperCase())+'</span></dd></dl>'+(r.donation.stage===2?payBox(r):'')+'</div>'; });
  const certs=rs.filter(r=>r.donation.stage===4);
  o+='<h3 class="lab" style="margin:8px 0 0">Your certificates of impact</h3>'+(certs.length?'<p class="hint" style="margin:0">Optional. Share them only if you\'d like to.</p><div class="certs">'+certs.map(r=>'<div>'+fcert(r)+'<div class="acts" style="margin-top:14px"><a class="btn sm" target="_blank" rel="noopener" href="https://www.linkedin.com/feed/?shareActive=true&text='+encodeURIComponent(postText(r))+'">Share on LinkedIn ↗</a><button class="btn ghost sm" data-fdl="'+r.id+'">Download</button></div></div>').join('')+'</div>':'<p class="empty">A certificate appears here when a charity confirms one of your donations.</p>');
  o+='<h3 class="lab" style="margin:8px 0 0">Receipts</h3>';
  o+=paid.length?'<div class="tw"><table><thead><tr><th>Date paid</th><th>Charity</th><th>Expert</th><th>Topic</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>'+
    paid.map(r=>'<tr><td>'+esc(DS.day(r.donation.paid))+'</td><td>'+esc(r.pledge.charity)+'</td><td>'+esc(X(r.expertId).n)+'</td><td>'+esc(r.topic)+'</td><td class="num">'+gbp(r.amount)+'</td><td>'+(r.donation.stage===4?'Received':'Waiting for charity')+'</td><td>'+esc(r.donation.receipt||'receipt.pdf')+'</td></tr>').join('')+
    '</tbody></table></div><div class="acts"><button class="btn sm" data-csv>Export receipts (CSV)</button></div>':'<p class="empty">No receipts yet.</p>';
  return o;
}

function payBox(r){ return '<div class="paybox"><p style="margin:0"><b>1.</b> Donate '+gbp(r.amount)+' on '+esc(r.pledge.charity)+'\'s own page. Use reference <b>DPO-'+esc(r.id.toUpperCase())+'</b>.</p>'+
  '<div class="acts"><a class="btn" href="charity.html?r='+r.id+'" target="_blank" rel="noopener">Donate to '+esc(r.pledge.charity)+' ↗</a></div>'+
  '<p style="margin:0"><b>2.</b> Upload the receipt the charity sends you.</p><div class="upload"><label for="rf-'+r.id+'" class="lab" style="font-size:17px">Receipt (PDF or image)</label><input type="file" id="rf-'+r.id+'" accept=".pdf,image/*"><button type="button" class="link sample" data-sample="'+r.id+'">Prototype only: use a sample receipt</button><span class="hint" id="rn-'+r.id+'"></span></div>'+
  '<div class="acts"><button class="btn" data-receipt="'+r.id+'">Submit receipt</button><button class="btn ghost sm" data-flag="'+r.id+'">Flag a problem</button></div><p class="hint" id="re-'+r.id+'" role="alert" style="margin:0;color:#A3202F;font-weight:700" hidden></p></div>'; }
const expertLabel=r=>{ const x=X(r.expertId); return x.nameOnFirmCerts?x.n:'an industry expert'; };
const postText=r=>'Thank you to '+r.pledge.charity+' for the work you do, and to '+expertLabel(r)+' for sharing their knowledge with us. Our conversation on '+r.topic+' became a '+gbp(r.amount)+' donation, through Dapperowl.';
function fcert(r){ return '<div class="ccert"><div class="cq"><div class="cert c1"><div class="frame"></div><div class="in">'+DAPPER_LOGO('#fff','#14254F')+'<span class="k">Certificate of impact</span><span class="chn">'+esc(r.pledge.charity)+'</span><span class="rule"></span><span class="amt">'+gbp(r.amount)+'</span><span class="to">from <b>'+esc(FM().name)+'</b>, given in return for a conversation on <b>'+esc(r.topic)+'</b> with <b>'+esc(expertLabel(r))+'</b></span></div><span class="date">'+esc(new Date(r.donation.received).toLocaleDateString('en-GB',{month:'long',year:'numeric'}))+'</span></div></div></div>'; }
function fcertSVG(r){ const x=t=>esc(t), lines=('from '+FM().name+', given in return for a conversation on '+r.topic+' with '+expertLabel(r)).match(/.{1,46}(\s|$)/g)||[];
  return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#fff"/><rect x="36" y="36" width="728" height="928" fill="none" stroke="#14254F" stroke-width="4"/><rect x="54" y="54" width="692" height="892" fill="none" stroke="#14254F" stroke-width="2"/>'+
    '<text x="400" y="200" text-anchor="middle" font-family="Outfit,Arial" font-weight="700" font-size="40" fill="#1F9D55" letter-spacing="4">DAPPEROWL</text><text x="400" y="260" text-anchor="middle" font-family="Outfit,Arial" font-size="24" fill="#2251FF" letter-spacing="8">CERTIFICATE OF IMPACT</text>'+
    '<text x="400" y="400" text-anchor="middle" font-family="DM Serif Display,Georgia" font-size="54" fill="#14254F">'+x(r.pledge.charity)+'</text><rect x="340" y="440" width="120" height="3" fill="#14254F"/>'+
    '<text x="400" y="580" text-anchor="middle" font-family="DM Serif Display,Georgia" font-size="110" fill="#18743a">'+x(gbp(r.amount))+'</text>'+
    lines.map((l,i)=>'<text x="400" y="'+(670+i*38)+'" text-anchor="middle" font-family="Source Sans 3,Arial" font-size="26" fill="#14254F">'+x(l.trim())+'</text>').join('')+
    '<text x="690" y="110" text-anchor="end" font-family="Outfit,Arial" font-size="20" fill="#4A5675">'+x(new Date(r.donation.received).toLocaleDateString('en-GB',{month:'long',year:'numeric'}))+'</text></svg>'; }

/* ---------- Organisation & settings ---------- */
function account(){
  const f=FM(), v=x=>esc(x==null?'':x);
  return '<h2 class="sec2">Organisation &amp; settings</h2><div>'+DapperFirm.badges(f.reliable)+'</div>'+
    '<form class="oform" id="oform" novalidate><fieldset><legend>Organisation details</legend>'+
    '<div class="f"><label for="o-n">Organisation name</label><input type="text" id="o-n" value="'+v(f.name)+'"></div>'+
    '<div class="f"><label for="o-s">Website</label><input type="text" id="o-s" value="'+v(f.site)+'" readonly><small>Verified against your team\'s email addresses. Contact us to change it.</small></div>'+
    '<div class="row"><div class="f"><label for="o-t">Type</label><select id="o-t">'+['Investor','Company','Event organiser','NGO or charity','Public body','Other'].map(o=>'<option'+(o===f.type?' selected':'')+'>'+o+'</option>').join('')+'</select></div>'+
    '<div class="f"><label for="o-z">Size</label><select id="o-z">'+['1–10','11–50','51–250','251–1,000','1,000+'].map(o=>'<option'+(o===f.size?' selected':'')+'>'+o+'</option>').join('')+'</select></div></div>'+
    '<div class="acts"><button class="btn" type="submit">Save details</button></div></fieldset></form>'+
    '<div class="oform"><fieldset><legend>Team members</legend><ul class="team">'+f.team.map(t=>'<li><span><b>'+esc(t.name)+'</b>, '+esc(t.title)+'</span><span class="hint">'+esc(t.email)+(t.invited?' · invite sent':'')+'</span></li>').join('')+'</ul>'+
    '<form id="tform" class="teamform" novalidate><div class="f"><label for="t-n">Name</label><input type="text" id="t-n"></div><div class="f"><label for="t-t">Job title</label><input type="text" id="t-t"></div><div class="f"><label for="t-e">Work email</label><input type="email" id="t-e" placeholder="name@'+v(f.site)+'"></div><button class="btn sm" type="submit">Invite</button></form>'+
    '<p class="hint" id="terr" role="alert" style="margin:0;color:#A3202F;font-weight:700" hidden></p></fieldset>'+
    '<fieldset><legend>Certificates</legend><button type="button" class="tgl" role="switch" id="named" aria-checked="'+(!!f.namedOnCerts)+'"><i aria-hidden="true"></i>Name '+esc(f.name)+' on experts\' certificates of impact</button><p class="hint" style="margin:0">Off: certificates say "an organisation". On: experts\' LinkedIn certificates can name you.</p></fieldset>'+
    '<div class="acts"><button class="btn ghost sm" type="button" data-signout>Sign out</button></div></div>';
}

/* ---------- actions ---------- */
function wire(){
  const P=$('panel'), on=(sel,fn)=>P.querySelectorAll(sel).forEach(el=>el.addEventListener('click',e=>fn(el,e)));
  on('[data-back]',()=>go('#requests'));
  on('.seg button',b=>{ rfilter=b.dataset.f; draw(); });
  on('[data-agree]',b=>{ const r=R(b.dataset.agree);
    DS.update(s=>{ const x=s.requests.find(y=>y.id===r.id); x.state='booked'; x.meeting={at:x.suggested,join:{}}; });
    DS.alertExpert(r.expertId,'reply',FM().name+' accepted your time for "'+r.topic+'": '+DS.when(r.suggested),'expert-dashboard.html#request-'+r.id);
    flash='Booked for '+esc(DS.when(r.suggested))+'. We\'ve shared contact details on both sides.'; draw(); });
  const cdi=$('cd'); if(cdi&&!cdi.value) cdi.value=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  on('[data-counter]',b=>{ const r=R(b.dataset.counter), d=$('cd').value; if(!d){ $('cd').focus(); return; } const when=new Date(d+'T'+($('ct').value||'10:00')).toISOString();
    DS.update(s=>{ const x=s.requests.find(y=>y.id===r.id); x.state='suggested'; x.suggested=when; x.suggestedBy='firm'; });
    DS.alertExpert(r.expertId,'reply',FM().name+' suggested a new time for "'+r.topic+'": '+DS.when(when),'expert-dashboard.html#request-'+r.id);
    flash='Sent. We\'ll book it as soon as '+esc(xFirst(X(r.expertId)))+' agrees.'; draw(); });
  const picked={};
  P.querySelectorAll('.paybox input[type=file]').forEach(inp=>inp.onchange=()=>{ const id=inp.id.slice(3); picked[id]=inp.files[0]?inp.files[0].name:''; $('rn-'+id).textContent=picked[id]?'Selected: '+picked[id]:''; });
  on('[data-sample]',b=>{ const id=b.dataset.sample; picked[id]=FM().name.replace(/\W+/g,'-')+'-receipt-DPO-'+id.toUpperCase()+'.pdf'; $('rn-'+id).textContent='Selected: '+picked[id]; });
  on('[data-receipt]',b=>{ const id=b.dataset.receipt, r=R(id);
    if(!picked[id]){ $('re-'+id).textContent='Please choose the receipt file, or use the sample receipt.'; $('re-'+id).hidden=false; return; }
    DS.update(s=>{ const d=s.requests.find(y=>y.id===id).donation; d.stage=3; d.paid=new Date().toISOString(); d.receipt=picked[id]; d.confirmAt=Date.now()+5000; });
    DS.alertExpert(r.expertId,'donation',FM().name+' donated '+gbp(r.amount)+' to '+r.pledge.charity+' and uploaded the receipt','expert-dashboard.html#donations');
    flash='Thank you. Receipt uploaded. We\'ve asked '+esc(r.pledge.charity)+' to confirm (in the prototype this takes about 5 seconds).'; draw(); });
  on('[data-flag]',b=>{ const r=R(b.dataset.flag);
    DS.update(s=>s.requests.find(y=>y.id===r.id).messages.push({from:'firm',text:'We\'ve flagged a problem with this donation and our team will be in touch.',at:new Date().toISOString(),read:false}));
    DS.alertExpert(r.expertId,'donation',FM().name+' flagged a problem with the donation for "'+r.topic+'"','expert-dashboard.html#request-'+r.id);
    flash='Flagged. We\'ve let '+esc(X(r.expertId).n)+' know, and Dapperowl will be in touch within one working day.'; draw(); });
  on('[data-fdl]',b=>{ const r=R(b.dataset.fdl); DS.download(fcertSVG(r),'image/svg+xml','dapperowl-certificate-'+r.id+'.svg'); });
  on('[data-ics]',b=>{ const r=R(b.dataset.ics); DS.ics({uid:r.id,start:r.meeting.at,mins:/half a day/i.test(r.length)?240:60,title:'Dapperowl: '+r.topic+' with '+X(r.expertId).n,desc:'Your Dapperowl meeting. Join from your dashboard: firm-dashboard.html#request-'+r.id}); });
  P.querySelectorAll('form[data-msg]').forEach(fm=>fm.addEventListener('submit',e=>{ e.preventDefault(); const t=fm.querySelector('textarea').value.trim(); if(!t) return; const r=R(fm.dataset.msg);
    DS.update(s=>s.requests.find(x=>x.id===r.id).messages.push({from:'firm',text:t,at:new Date().toISOString(),read:false}));
    DS.alertExpert(r.expertId,'message',me.name+' ('+FM().name+') sent you a message about "'+r.topic+'"','expert-dashboard.html#request-'+r.id);
    draw(); const ta=$('mt'); if(ta) ta.focus(); }));
  // questions
  on('[data-qnew]',()=>{ qForm=true; draw(); $('qt').focus(); });
  on('[data-qcancel]',()=>{ qForm=false; draw(); });
  const qf=$('qform'); if(qf) qf.addEventListener('submit',e=>{ e.preventDefault(); const t=$('qt').value.trim(), d=$('qd').value.trim(), fld=$('qf').value;
    if(!t||!d){ $('qerr').textContent='Please add your question and a short description.'; $('qerr').hidden=false; return; }
    DS.update(s=>{ s.questions.push({id:'q'+(++s.seq),firmId:me.ref,title:t,field:fld,desc:d,pledge:$('qp').value.trim(),created:new Date().toISOString(),status:'open',hands:[]}); });
    S().experts.filter(x=>x.status!=='paused'&&x.ind.includes(fld)).forEach(x=>DS.alertExpert(x.id,'question','New open question in '+fld+': "'+t+'"','expert-dashboard.html#questions'));
    qForm=false; flash='Posted. Experts in '+esc(fld)+' can now raise their hand.'; draw(); });
  on('[data-qclose]',b=>{ DS.update(s=>{ const q=s.questions.find(x=>x.id===b.dataset.qclose); q.status=q.status==='open'?'closed':'open'; }); draw(); });
  // saved
  on('[data-unsave]',b=>{ DS.update(s=>{ s.saved[me.ref]=(s.saved[me.ref]||[]).filter(id=>id!==b.dataset.unsave); }); draw(); });
  // receipts CSV
  on('[data-csv]',()=>{ const q=v=>'"'+String(v).replace(/"/g,'""')+'"';
    const rows=[['Date paid','Charity','Expert','Topic','Amount (GBP)','Status','Reference','Receipt file']].concat(mine().filter(r=>r.state==='done'&&r.donation.stage>=3).map(r=>[DS.day(r.donation.paid),r.pledge.charity,X(r.expertId).n,r.topic,r.amount,r.donation.stage===4?'Received':'Waiting for charity','DPO-'+r.id.toUpperCase(),r.donation.receipt||'']));
    DS.download(rows.map(r=>r.map(q).join(',')).join('\r\n'),'text/csv','dapperowl-receipts.csv'); });
  // organisation
  const of=$('oform'); if(of) of.addEventListener('submit',e=>{ e.preventDefault(); const n=$('o-n').value.trim(); if(!n) return;
    DS.update(s=>{ const f=s.firms.find(x=>x.id===me.ref); f.name=n; f.type=$('o-t').value; f.size=$('o-z').value; });
    $('orgname').textContent=n; flash='Saved.'; draw(); });
  const tf=$('tform'); if(tf) tf.addEventListener('submit',e=>{ e.preventDefault(); const n=$('t-n').value.trim(), t=$('t-t').value.trim(), em=$('t-e').value.trim().toLowerCase(), dom=em.split('@')[1]||'', site=FM().site;
    const err=!n||!em?'Please add a name and work email.':(!(dom===site||dom.endsWith('.'+site))?'Team members need an email on '+site+'.':(DS.userByEmail(em)?'That email already has an account.':''));
    if(err){ $('terr').textContent=err; $('terr').hidden=false; return; }
    DS.update(s=>{ s.firms.find(x=>x.id===me.ref).team.push({name:n,title:t,email:em,invited:true}); s.users.push({id:'u-'+me.ref+'-'+(++s.seq),role:'firm',email:em,name:n,title:t,ref:me.ref}); });
    flash='Invite sent to '+esc(em)+'. They can sign in with that email straight away.'; draw(); });
  const nm=$('named'); if(nm) nm.onclick=()=>{ DS.update(s=>{ const f=s.firms.find(x=>x.id===me.ref); f.namedOnCerts=!f.namedOnCerts; }); draw(); };
}
draw();
addEventListener('dapper-change',()=>{ const a=document.activeElement; if(a&&/^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName)) return; draw(); });
})();

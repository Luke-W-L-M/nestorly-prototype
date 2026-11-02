// Expert dashboard (2 Nov): everything reads and writes the shared store (store.js).
// Views: To do · Requests (and each request's detail) · Meetings · Open questions · Donations & impact · Profile & settings.
(function(){
const $=id=>document.getElementById(id);
const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const gbp=n=>'£'+Number(n).toLocaleString('en-GB');
const me=DS.me(); if(!me||me.role!=='expert') return; // site.js has already sent anyone else away
const S=()=>DS.get();
const EX=()=>DS.expert(me.ref);
const mine=()=>S().requests.filter(r=>r.expertId===me.ref);
const R=id=>S().requests.find(r=>r.id===id);
const F=id=>DS.firm(id)||{name:'A firm',type:'',size:'',site:'',team:[{name:'',title:'',email:''}]};
const first=me.name.replace(/^(The Hon\.|Dr|Mr|Mrs|Ms|Prof\.?)\s+/,'').split(' ')[0];
const IND=['Finance & Investment','Energy & Natural Resources','Shipping, Transport & Logistics','Food, Agriculture & Fisheries','Health & Life Sciences','Technology & Telecoms','Manufacturing & Construction','Property & Infrastructure','Consumer, Retail & Hospitality','Media, Entertainment & Games','Environment & Sustainability','Government, Policy & Defence','Law & Professional Services','Education, Charities & Social Impact'];
const FMTS=['Phone or video call','Written advice','Site visit','Talk or presentation','Mentoring'];
const AVAIL=['Up to 2 hours a month','Up to 5 hours a month','Up to 10 hours a month','More than 10 hours a month'];
const STATE={sent:['New','go'],suggested:['New time suggested','wait'],booked:['Accepted · booked','ok'],declined:['Declined','no'],done:['Done','ok']};
const HOUR=3600000;
const isUpcoming=r=>r.state==='booked'&&r.meeting&&new Date(r.meeting.at).getTime()>Date.now()-HOUR;
const isPast=r=>r.meeting&&!isUpcoming(r)&&(r.state==='done'||r.state==='booked');
const unread=r=>(r.messages||[]).filter(m=>m.from==='firm'&&!m.read).length;
const matching=()=>{ const ex=EX(); return S().questions.filter(q=>q.status==='open'&&ex.ind.includes(q.field)); };
const myHand=q=>q.hands.find(h=>h.expertId===me.ref);
const DECL=['I won\'t share inside information.','I won\'t share confidential information belonging to a current or former employer or client.','I don\'t work for or advise this organisation, or I\'ve told the firm that I do.','Taking part doesn\'t break any agreement I\'m bound by.','If I work in the public sector, I\'m allowed to take part.','I can decline any question, and I\'ll stop if the conversation moves into these areas.'];
const TRK=['Pledged','You send it','Firm paid','Charity received'];
const TABS=[['todo','To do'],['requests','Requests'],['meetings','Meetings'],['questions','Open questions'],['donations','Donations & impact'],['profile','Profile & settings']];
let flash='', rfilter='new', mode=null, qOpen=null, qAll=false;

const h=new Date().getHours();
$('hi').textContent=(h<12?'Good morning, ':h<18?'Good afternoon, ':'Good evening, ')+first;
$('asfirms').href='find.html?preview='+encodeURIComponent(me.ref);

function route(){ const m=/^#(request)-(.+)$/.exec(location.hash); if(m) return {tab:'requests',id:m[2]}; const k=location.hash.slice(1); return {tab:TABS.some(t=>t[0]===k)?k:'todo'}; }
function go(hash){ if(location.hash===hash) draw(); else location.hash=hash; }
addEventListener('hashchange',()=>{ mode=null; flash=''; draw(); const p=$('panel'); if(p.getBoundingClientRect().top<0) p.scrollIntoView({block:'start'}); });

function tabs(cur){
  const rs=mine();
  const n={todo:todoCount(),requests:rs.filter(r=>r.state==='sent').length,questions:matching().filter(q=>!myHand(q)).length,donations:rs.filter(r=>r.state==='done'&&r.donation.stage===1).length};
  $('tabs').innerHTML=TABS.map(([k,l])=>'<button role="tab" id="tab-'+k+'" aria-selected="'+(k===cur)+'" data-k="'+k+'">'+l+(n[k]?' <span class="badge">'+n[k]+'</span>':'')+'</button>').join('');
  $('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{ flash=''; go('#'+b.dataset.k); });
}
function todoCount(){ const rs=mine(); return rs.filter(r=>r.state==='sent').length+rs.filter(unread).length+rs.filter(r=>r.state==='done'&&r.donation.stage===1).length; }

function draw(){
  const rt=route(); tabs(rt.tab);
  let html=flash?'<p class="ok-msg" role="status">'+flash+'</p>':'';
  if(rt.id) html+=detail(rt.id);
  else html+=({todo,requests,meetings,questions,donations,profile})[rt.tab]();
  $('panel').innerHTML=html; wire(rt);
  if(window.DapperAlerts) DapperAlerts.draw();
}

/* ---------- To do ---------- */
function row(title,sub,btn){ return '<div class="trow"><div><b>'+title+'</b><span>'+sub+'</span></div>'+btn+'</div>'; }
function todo(){
  const rs=mine(), ex=EX(), sh=ex.shared||{};
  const newR=rs.filter(r=>r.state==='sent'), msgs=rs.filter(unread), up=rs.filter(isUpcoming).sort((a,b)=>new Date(a.meeting.at)-new Date(b.meeting.at)),
        send=rs.filter(r=>r.state==='done'&&r.donation.stage===1), qs=matching().filter(q=>!myHand(q));
  const card=(title,list,cls)=>'<div class="tcard'+(cls?' '+cls:'')+'"><h3>'+title+(list.length?' <span class="badge">'+list.length+'</span>':'')+'</h3>';
  let o='<h2 class="sec2">To do</h2>';
  if(!newR.length&&!msgs.length&&!up.length&&!send.length&&!qs.length&&sh.linkedin&&sh.charity) o+='<p class="allclear">You\'re all caught up. We\'ll let you know when a firm asks for your knowledge.</p>';
  o+='<div class="todo">';
  o+=card('New requests to answer',newR)+(newR.length?newR.map(r=>row(esc(F(r.firmId).name),esc(r.topic)+' · '+gbp(r.amount),'<a class="btn sm" href="#request-'+r.id+'">Answer</a>')).join(''):'<p class="hint" style="margin:0">None right now.</p>')+'</div>';
  o+=card('Unread messages',msgs)+(msgs.length?msgs.map(r=>row(esc(F(r.firmId).name),unread(r)+' new · '+esc(r.topic),'<a class="btn ghost sm" href="#request-'+r.id+'">Read</a>')).join(''):'<p class="hint" style="margin:0">No unread messages.</p>')+'</div>';
  o+=card('Upcoming meetings',up)+(up.length?up.map(r=>row(esc(DS.when(r.meeting.at)),esc(F(r.firmId).name)+' · '+esc(r.topic),'<span class="acts"><a class="btn sm" href="call.html?r='+r.id+'">Join call</a><a class="btn ghost sm" href="#request-'+r.id+'">Details</a></span>')).join(''):'<p class="hint" style="margin:0">Nothing booked.</p>')+'</div>';
  o+=card('Donations waiting for you to press Send',send)+(send.length?send.map(r=>row(gbp(r.amount)+' to '+esc(r.pledge.charity),esc(F(r.firmId).name)+' · '+esc(r.topic),'<button class="btn green sm" data-send="'+r.id+'">Send</button>')).join(''):'<p class="hint" style="margin:0">Nothing to send.</p>')+'</div>';
  o+=card('Open questions in your field',qs,'wide')+(qs.length?qs.map(q=>row(esc(q.title),esc(F(q.firmId).name)+' · '+esc(q.field),'<a class="btn ghost sm" href="#questions">See question</a>')).join(''):'<p class="hint" style="margin:0">No new questions in your industries.</p>')+'</div>';
  if(!(sh.linkedin&&sh.charity)){
    o+='<div class="tcard wide found"><h3>Get found faster</h3><p style="margin:0">Two quick things that help firms find you.</p>'+
      row((sh.linkedin?'✓ ':'')+'Tell your network on LinkedIn','A ready-made post about your profile and charity',sh.linkedin?'<span class="pill ok">Done</span>':'<button class="btn sm" data-share="linkedin">Copy post</button>')+
      row((sh.charity?'✓ ':'')+'Ask your charity to spread the word','A ready-made note to '+esc(ex.ch),sh.charity?'<span class="pill ok">Done</span>':'<button class="btn sm" data-share="charity">Copy note</button>')+'</div>';
  }
  return o+'</div>';
}
function shareText(kind){ const ex=EX(); const what=(ex.spec&&ex.spec.length?ex.spec.slice(0,2).join(' or '):(ex.ind[0]||'my field')).toLowerCase();
  return kind==='linkedin'?"I've joined Dapperowl. If your organisation needs "+what+", ask me, and the donation goes to "+ex.ch+".":
    'Hello '+ex.ch+' team,\n\nI\'ve joined Dapperowl, where organisations ask experts for their knowledge and, instead of paying the expert, donate to the expert\'s chosen charity. I\'ve chosen you, so every conversation I have becomes a donation to your work.\n\nIf you\'d like to share this with your supporters, firms can find me by searching "'+ex.n+'" on Dapperowl.\n\nWith best wishes,\n'+ex.n; }

/* ---------- Requests ---------- */
function requests(){
  const rs=mine().sort((a,b)=>new Date(b.created)-new Date(a.created));
  const groups={new:rs.filter(r=>r.state==='sent'||r.state==='suggested'),accepted:rs.filter(r=>r.state==='booked'||r.state==='done'),declined:rs.filter(r=>r.state==='declined')};
  let o='<h2 class="sec2">Requests</h2><div class="seg" role="group" aria-label="Show">'+[['new','New'],['accepted','Accepted'],['declined','Declined']].map(([k,l])=>'<button type="button" data-f="'+k+'" aria-pressed="'+(rfilter===k)+'">'+l+' ('+groups[k].length+')</button>').join('')+'</div>';
  const list=groups[rfilter];
  if(!list.length) o+='<p class="empty">'+({new:'No new requests. We\'ll let you know when a firm asks for your knowledge.',accepted:'Nothing accepted yet.',declined:'You haven\'t declined any requests.'})[rfilter]+'</p>';
  list.forEach(r=>{ const f=F(r.firmId), st=STATE[r.state];
    o+='<div class="item"><div class="item-h"><div><b>'+esc(f.name)+'</b><span class="meta">'+esc(r.topic)+' · received '+esc(DS.day(r.created))+'</span></div><span class="pill '+st[1]+'">'+st[0]+'</span></div>'+
      '<dl class="dl"><dt>Format</dt><dd>'+esc(r.fmt)+' · '+esc(r.length)+'</dd><dt>Donation</dt><dd>'+gbp(r.amount)+' to '+esc(r.pledge.charity)+'</dd>'+(r.meeting?'<dt>Meeting</dt><dd>'+esc(DS.when(r.meeting.at))+'</dd>':'')+'</dl>'+
      '<div class="acts"><a class="btn sm" href="#request-'+r.id+'">'+(r.state==='sent'?'Open and answer':'Open')+'</a>'+(unread(r)?'<span class="pill wait">'+unread(r)+' new message'+(unread(r)>1?'s':'')+'</span>':'')+'</div></div>';
  });
  return o;
}

function detail(id){
  const r=R(id); if(!r||r.expertId!==me.ref) return '<button class="back" data-back>← All requests</button><p class="empty">We couldn\'t find that request.</p>';
  // opening the request marks the firm's messages as read
  if(unread(r)) DS.update(s=>s.requests.find(x=>x.id===id).messages.forEach(m=>{ if(m.from==='firm') m.read=true; }));
  const f=F(r.firmId), st=STATE[r.state], booked=r.state==='booked'||r.state==='done';
  let o='<button class="back" data-back>← All requests</button>'+
    '<div class="item-h"><div><span class="eyebrow">'+esc(f.name)+'</span><h2 class="sec2" style="margin-top:4px">'+esc(r.topic)+'</h2></div><span class="pill '+st[1]+'">'+st[0]+'</span></div>';
  const body='<dl class="dl"><dt>Format</dt><dd>'+esc(r.fmt)+' · '+esc(r.length)+'</dd><dt>Received</dt><dd>'+esc(DS.when(r.created))+'</dd></dl>'+
    '<div class="goal"><span class="eyebrow">What they hope to get out of it</span><p>'+esc(r.goal)+'</p></div>'+
    '<div class="rsec"><span class="lab">Their questions</span><ol>'+r.questions.map(q=>'<li>'+esc(q)+'</li>').join('')+'</ol></div>'+
    '<div class="firmbox"><div class="firmbox-h"><span class="lab">About the firm</span>'+DapperFirm.badges(f.reliable)+'</div>'+
    '<dl class="dl"><dt>Organisation</dt><dd>'+esc(f.name)+'</dd><dt>Website</dt><dd><a class="link" href="https://'+esc(f.site)+'" target="_blank" rel="noopener">'+esc(f.site)+' ↗</a> (matches their email)</dd><dt>Type</dt><dd>'+esc(f.type)+'</dd><dt>Size</dt><dd>'+esc(f.size)+' people</dd><dt>Attending</dt><dd>'+esc(r.attendees||f.team[0].name)+'</dd>'+
    (booked?'<dt>Contact</dt><dd>'+esc(f.team[0].name)+' · <a class="link" href="mailto:'+esc(f.team[0].email)+'">'+esc(f.team[0].email)+'</a> · 020 7946 0102</dd>':'<dt>Contact</dt><dd class="hint">Shared once you accept.</dd>')+'</dl>'+
    DapperFirm.signedBlock({name:r.pledge.name,title:r.pledge.title,company:r.pledge.company,amount:r.pledge.amount,charity:r.pledge.charity,at:DS.when(r.pledge.at)})+
    '<p class="hint" style="margin:0">Check the firm\'s details before you accept: you choose who you meet.</p></div>'+
    '<div class="rsec"><span class="lab">Background and preparation</span><dl class="dl"><dt>What they know</dt><dd>'+esc(r.known||'Nothing added')+'</dd><dt>To read</dt><dd>'+esc(r.docs||'Nothing')+'</dd><dt>Confidential</dt><dd>'+(r.conf?'Yes':'No')+'</dd></dl></div>';
  o+=r.conf&&r.state==='sent'&&!r.confOk?'<p class="note" style="margin:0">This request is marked <b>confidential</b>. Agree to keep it private to read the details.</p><button class="btn sm" data-confok="'+r.id+'">I agree to keep this request confidential</button>':'<div class="rq">'+body+'</div>';

  // what you can do now
  if(r.state==='sent'){
    if(mode&&mode.id===r.id&&mode.kind==='acc') o+=acceptPanel(r,f);
    else if(mode&&mode.id===r.id&&mode.kind==='dec') o+=declinePanel(r,f);
    else o+='<div class="acts"><button class="btn sm" data-acc="'+r.id+'">Accept…</button><button class="btn ghost sm" data-dec="'+r.id+'">Decline…</button></div>';
  }
  if(r.state==='suggested'&&r.suggestedBy==='firm') o+='<div class="panel2 acc"><h3>'+esc(f.name)+' suggested a new time</h3><p style="margin:0"><b>'+esc(DS.when(r.suggested))+'</b></p><div class="acts"><button class="btn" data-takesug="'+r.id+'">Accept this time</button></div>'+counter(r)+'</div>';
  else if(r.state==='suggested') o+='<div class="panel2"><h3>Waiting for '+esc(f.name)+'</h3><p style="margin:0">You suggested <b>'+esc(DS.when(r.suggested))+'</b>. We\'ll book the meeting as soon as they agree.</p>'+counter(r)+'</div>';
  if(r.state==='declined') o+='<div class="panel2 dec"><h3>Declined</h3><dl class="dl"><dt>Reason</dt><dd>'+esc(r.declined.reason)+' (private)</dd><dt>Your message</dt><dd>'+esc(r.declined.note||'None')+'</dd></dl></div>';
  if(r.state==='booked') o+='<div class="panel2 acc"><h3>Meeting booked</h3><dl class="dl"><dt>When</dt><dd>'+esc(DS.when(r.meeting.at))+' · '+esc(r.length)+'</dd><dt>How</dt><dd>'+esc(r.fmt)+'</dd></dl>'+attend(r)+'<div class="acts"><a class="btn sm" href="call.html?r='+r.id+'">Join video call</a><button class="btn ghost sm" data-ics="'+r.id+'">Add to calendar</button>'+(canFinish(r)?'<button class="btn green sm" data-markdone="'+r.id+'">Mark as done</button>':'')+'</div><p class="hint" style="margin:0">The call opens 10 minutes before the start. In the prototype you can join at any time.</p></div>';
  if(r.state==='done') o+='<div class="panel2"><h3>Donation</h3>'+DapperTracker.html(TRK,r.donation.stage)+'<p style="margin:0">'+donNote(r)+'</p>'+(r.donation.stage===1?'<div class="acts"><button class="btn green" data-send="'+r.id+'">Send to '+esc(r.pledge.charity)+'</button></div>':'')+'</div>';

  // private message thread
  o+='<div class="panel2"><h3>Messages</h3><p class="hint" style="margin:0">Only you and '+esc(f.name)+' can see these.</p><div class="thread">'+
    ((r.messages||[]).length?r.messages.map(m=>'<div class="msg'+(m.from==='expert'?' me':'')+'"><small>'+(m.from==='expert'?'You':esc(f.team[0].name||f.name))+' · '+esc(DS.when(m.at))+'</small>'+esc(m.text)+'</div>').join(''):'<p class="hint" style="margin:0">No messages yet.</p>')+
    '</div><form class="msgform" data-msg="'+r.id+'"><label class="sr" for="mt">Message to '+esc(f.name)+'</label><textarea id="mt" placeholder="Write a message to '+esc(f.name)+'"></textarea><button class="btn sm" type="submit">Send message</button></form></div>';
  return o;
}
function acceptPanel(r,f){
  return '<div class="panel2 acc"><h3>Accept this request</h3>'+
    '<div class="f"><span class="lab">1. Pick a time</span><div class="times">'+r.times.map((t,i)=>'<label class="radio"><input type="radio" name="tm" value="'+esc(t)+'" '+(i===0?'checked':'')+'>'+esc(DS.when(t))+'</label>').join('')+'<label class="radio"><input type="radio" name="tm" value="other" data-other>Suggest a different time</label></div>'+
    '<div class="row other" hidden><div class="f"><label for="od">Date</label><input type="date" id="od"></div><div class="f"><label for="ot">Time</label><input type="time" id="ot" value="10:00"></div></div></div>'+
    '<div class="f"><span class="lab">2. Tick your declarations and check the firm</span><div class="decl">'+DECL.map(t=>'<label class="tick"><input type="checkbox" class="dc">'+t+'</label>').join('')+
    '<label class="tick chk"><input type="checkbox" class="dc">I\'ve checked this organisation.</label></div></div>'+
    '<div class="f"><label for="an">3. A note to '+esc(f.name)+' <span class="opt">(optional)</span></label><textarea id="an" style="min-height:90px"></textarea></div>'+
    '<div class="note"><p><b>What happens next</b></p><p>We send you both a calendar invite and a video link, and share your contact details with '+esc(f.name)+'. After the meeting, you press Send and they donate '+gbp(r.amount)+' to '+esc(r.pledge.charity)+'.</p></div>'+
    '<div class="acts"><button class="btn" data-conf="'+r.id+'" disabled>Confirm and accept</button><button class="btn ghost sm" data-cancel>Cancel</button></div><p class="hint" style="margin:0" id="conf-h">Tick all six declarations, and confirm you\'ve checked this organisation, to accept.</p></div>';
}
function declinePanel(r,f){
  return '<div class="panel2 dec"><h3>Decline this request</h3>'+
    '<div class="f"><span class="lab">Reason <span class="opt">(private)</span></span><div class="times">'+['Not my area of expertise','I don\'t have time right now','Conflict of interest','Other'].map((t,i)=>'<label class="radio"><input type="radio" name="dr" value="'+t+'" '+(i===1?'checked':'')+'>'+t+'</label>').join('')+'</div></div>'+
    '<div class="f"><label for="dm">A message to '+esc(f.name)+' <span class="opt">(optional)</span></label><textarea id="dm" style="min-height:90px">Thank you for asking. I can\'t help this time, but I\'d be glad to be asked again.</textarea></div>'+
    '<label class="tick"><input type="checkbox" checked>Suggest other experts in this field to them</label>'+
    '<label class="tick"><input type="checkbox" checked>I\'m happy to be asked again later</label>'+
    '<div class="acts"><button class="btn" data-dsend="'+r.id+'">Send decline</button><button class="btn ghost sm" data-cancel>Cancel</button></div></div>';
}
function counter(r){ return '<details class="counter"><summary>'+(r.suggestedBy==='firm'?'Suggest another time':'Suggest a different time instead')+'</summary><div class="row"><div class="f"><label for="cd">Date</label><input type="date" id="cd"></div><div class="f"><label for="ct">Time</label><input type="time" id="ct" value="10:00"></div></div><button class="btn sm" data-counter="'+r.id+'">Send this time</button></details>'; }
const canFinish=r=>r.state==='booked'&&r.meeting&&((r.meeting.left&&r.meeting.left.expert)||new Date(r.meeting.at).getTime()<Date.now()-HOUR);
function attend(r){ const j=(r.meeting&&r.meeting.join)||{}; if(!j.expert&&!j.firm) return '';
  return '<p style="margin:0;font-size:17px"><b>Attendance:</b> '+(j.expert?'you joined at '+esc(DS.when(j.expert)):'you haven\'t joined')+' · '+(j.firm?esc(F(r.firmId).name)+' joined at '+esc(DS.when(j.firm)):esc(F(r.firmId).name)+' hasn\'t joined')+'</p>'; }
function donNote(r){ const f=F(r.firmId), d=r.donation, ch=esc(r.pledge.charity);
  return ['', 'The meeting is done. Press Send to ask '+esc(f.name)+' to donate '+gbp(r.amount)+' to '+ch+'.',
    'Sent on '+esc(DS.day(d.sent))+'. '+esc(f.name)+' has 48 hours to donate on the charity\'s page and upload the receipt.',
    esc(f.name)+' donated on '+esc(DS.day(d.paid))+' and uploaded the receipt. Waiting for '+ch+' to confirm.',
    ch+' confirmed on '+esc(DS.day(d.received))+' and thanks you. Your certificate is ready.'][d.stage]; }

/* ---------- Meetings ---------- */
function meetings(){
  const rs=mine(), up=rs.filter(isUpcoming).sort((a,b)=>new Date(a.meeting.at)-new Date(b.meeting.at)), past=rs.filter(isPast).sort((a,b)=>new Date(b.meeting.at)-new Date(a.meeting.at));
  const line=(r,isUp)=>'<div class="item"><div class="item-h"><div><b>'+esc(DS.when(r.meeting.at))+'</b><span class="meta">'+esc(F(r.firmId).name)+' · '+esc(r.topic)+'</span></div><span class="pill '+(isUp?'ok':(r.state==='done'?'ok':'wait'))+'">'+(isUp?'Upcoming':(r.state==='done'?'Done':'Not marked done'))+'</span></div>'+
    '<div class="acts"><a class="btn sm" href="#request-'+r.id+'">Open request</a>'+(isUp?'<a class="btn sm" href="call.html?r='+r.id+'">Join video call</a><button class="btn ghost sm" data-ics="'+r.id+'">Add to calendar</button>':'')+(canFinish(r)?'<button class="btn green sm" data-markdone="'+r.id+'">Mark as done</button>':'')+'</div></div>';
  return '<h2 class="sec2">Meetings</h2><h3 class="lab" style="margin:0">Upcoming</h3>'+(up.length?up.map(r=>line(r,true)).join(''):'<p class="empty">Nothing booked yet.</p>')+
    '<h3 class="lab" style="margin:8px 0 0">Past</h3>'+(past.length?past.map(r=>line(r,false)).join(''):'<p class="empty">No past meetings yet.</p>');
}

/* ---------- Open questions ---------- */
function questions(){
  const ex=EX(), list=qAll?S().questions.filter(q=>q.status==='open'):matching();
  let o='<h2 class="sec2">Open questions</h2><p style="margin:0">Firms post questions they need help with. If you can help, raise your hand with a two-line note; the firm can then open your profile and send you a request.</p>'+
    '<label class="tick" style="align-self:flex-start;font-size:17px;padding:10px 14px"><input type="checkbox" id="qall" '+(qAll?'checked':'')+'>Show questions in other fields too</label>';
  if(!list.length) o+='<p class="empty">No open questions in '+esc(ex.ind.join(' or '))+' right now.</p>';
  list.forEach(q=>{ const f=F(q.firmId), hand=myHand(q);
    o+='<div class="q"><div class="item-h"><div><h3>'+esc(q.title)+'</h3><span class="meta">'+esc(f.name)+' · '+esc(q.field)+' · posted '+esc(DS.day(q.created))+'</span></div>'+(hand?'<span class="pill ok">Hand raised</span>':'')+'</div>'+
      DapperFirm.badges(f.reliable)+'<p>'+esc(q.desc)+'</p><p class="meta">'+(q.pledge?'Pledge: '+esc(q.pledge)+' to the expert\'s charity · ':'')+q.hands.length+' expert'+(q.hands.length===1?' has':'s have')+' raised a hand</p>';
    if(hand) o+='<div class="handnote"><b>Your note:</b>\n'+esc(hand.note)+'</div>';
    else if(qOpen===q.id) o+='<form class="f" data-hand="'+q.id+'"><label for="hn">Why you can help <span class="opt">(two lines)</span></label><textarea id="hn" rows="2" maxlength="240" required placeholder="e.g. I ran the port for 15 years.\nHappy to talk through what to check."></textarea><div class="acts"><button class="btn sm" type="submit">Raise my hand</button><button class="btn ghost sm" type="button" data-qcancel>Cancel</button></div></form>';
    else o+='<div class="acts"><button class="btn sm" data-qopen="'+q.id+'">I can help</button></div>';
    o+='</div>';
  });
  return o;
}

/* ---------- Donations & impact ---------- */
function donations(){
  const ex=EX(), rs=mine().filter(r=>r.state==='done').sort((a,b)=>new Date(b.meeting.at)-new Date(a.meeting.at)), got=rs.filter(r=>r.donation.stage===4);
  const total=got.reduce((t,r)=>t+Number(r.amount),0);
  let o='<h2 class="sec2">Donations &amp; impact</h2>'+
    '<div class="total"><span class="big">'+gbp(total)+'</span><div><b style="font-family:var(--ui);font-size:20px">raised for your charities</b><br><span class="hint">from '+got.length+' completed conversation'+(got.length===1?'':'s')+'</span><br><span class="private">Only you can see this</span></div></div>'+
    '<button type="button" class="tgl" role="switch" id="showtotal" aria-checked="'+(!!ex.showTotal)+'"><i aria-hidden="true"></i>Show my total on my profile</button><p class="hint" style="margin:-10px 0 0">Optional. Off by default; only you see your total unless you turn this on.</p>'+
    '<h3 class="lab" style="margin:8px 0 0">Each conversation</h3>';
  if(!rs.length) o+='<p class="empty">Once you\'ve had a conversation and marked it done, its donation appears here.</p>';
  rs.forEach(r=>{ const d=r.donation;
    o+='<div class="item"><div class="item-h"><div><b>'+esc(F(r.firmId).name)+'</b><span class="meta">'+esc(r.topic)+' · '+esc(DS.day(r.meeting.at))+'</span></div><span class="pill '+(d.stage===4?'ok':'wait')+'">'+gbp(r.amount)+' to '+esc(r.pledge.charity)+'</span></div>'+
      DapperTracker.html(TRK,d.stage)+'<p style="margin:0;font-size:18px">'+donNote(r)+'</p>'+
      '<div class="acts">'+(d.stage===1?'<button class="btn green" data-send="'+r.id+'">Send to '+esc(r.pledge.charity)+'</button>':'')+(d.stage>=3?'<button class="btn ghost sm" data-rcpt="'+r.id+'">View receipt</button>':'')+'</div></div>';
  });
  o+='<h3 class="lab" style="margin:8px 0 0">Your certificates of impact</h3>';
  o+=got.length?'<div class="certs">'+got.map(r=>'<div>'+cert(ex,r)+'<div class="acts" style="margin-top:14px"><a class="btn sm" target="_blank" rel="noopener" href="https://www.linkedin.com/feed/?shareActive=true&text='+encodeURIComponent('Proud that my conversation with '+(F(r.firmId).namedOnCerts?F(r.firmId).name:'an organisation')+' became a '+gbp(r.amount)+' donation to '+r.pledge.charity+', through Dapperowl.')+'">Share on LinkedIn ↗</a><button class="btn ghost sm" data-dl="'+r.id+'">Download</button></div></div>').join('')+'</div>':'<p class="empty">Your first certificate appears when a charity confirms a donation.</p>';
  return o;
}
function cert(ex,r){
  return '<div class="ccert"><div class="cq"><div class="c1"><div class="frame"></div><div class="in">'+DAPPER_LOGO('#fff','#14254F')+'<span class="k">Certificate of impact</span><div class="photo"><svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="22" r="13" fill="#141414"/><path d="M6 60c0-15 11-23 24-23s24 8 24 23z" fill="#141414"/></svg></div><span class="nm">'+esc(ex.n)+'</span><span class="rule"></span><span class="amt">'+gbp(r.amount)+'</span><span class="to">donated to<b>'+esc(r.pledge.charity)+'</b></span></div><span class="date">'+esc(new Date(r.donation.received).toLocaleDateString('en-GB',{month:'long',year:'numeric'}))+'</span></div></div></div>';
}
function certSVG(ex,r){ const x=t=>esc(t);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#fff"/><rect x="36" y="36" width="728" height="928" fill="none" stroke="#14254F" stroke-width="4"/><rect x="54" y="54" width="692" height="892" fill="none" stroke="#14254F" stroke-width="2"/>'+
    '<text x="400" y="200" text-anchor="middle" font-family="Outfit,Arial" font-weight="700" font-size="40" fill="#1F9D55" letter-spacing="4">DAPPEROWL</text>'+
    '<text x="400" y="260" text-anchor="middle" font-family="Outfit,Arial" font-size="24" fill="#2251FF" letter-spacing="8">CERTIFICATE OF IMPACT</text>'+
    '<circle cx="400" cy="390" r="90" fill="#E9E4D8" stroke="#14254F" stroke-width="5"/>'+
    '<text x="400" y="560" text-anchor="middle" font-family="DM Serif Display,Georgia" font-size="44" fill="#14254F">'+x(ex.n)+'</text>'+
    '<rect x="340" y="590" width="120" height="3" fill="#14254F"/>'+
    '<text x="400" y="720" text-anchor="middle" font-family="DM Serif Display,Georgia" font-size="110" fill="#18743a">'+x(gbp(r.amount))+'</text>'+
    '<text x="400" y="790" text-anchor="middle" font-family="Source Sans 3,Arial" font-size="26" fill="#14254F">donated to</text>'+
    '<text x="400" y="830" text-anchor="middle" font-family="Outfit,Arial" font-weight="700" font-size="30" fill="#14254F">'+x(r.pledge.charity)+'</text>'+
    '<text x="690" y="110" text-anchor="end" font-family="Outfit,Arial" font-size="20" fill="#4A5675">'+x(new Date(r.donation.received).toLocaleDateString('en-GB',{month:'long',year:'numeric'}))+'</text></svg>'; }

/* ---------- Profile & settings ---------- */
function profile(){
  const ex=EX(), live=ex.status!=='paused', nt=ex.notify||{};
  const v=x=>esc(x==null?'':x);
  return '<h2 class="sec2">Profile &amp; settings</h2>'+
    '<div class="statusbar"><div><b style="font-family:var(--ui);font-size:19px">Your profile is '+(live?'live':'paused')+'</b><br><span class="hint">'+(live?'Firms can find you and send requests.':'Firms can\'t find you or send new requests. Requests you\'ve accepted carry on.')+'</span></div>'+
    '<div class="acts"><a class="btn ghost sm" href="find.html?preview='+encodeURIComponent(ex.id)+'">See it as firms do</a><button class="btn sm" data-pause>'+(live?'Pause my profile':'Make my profile live again')+'</button></div></div>'+
    '<form class="pform" id="pform" novalidate>'+
    '<fieldset><legend>About you</legend><div class="f"><label for="p-n">Full name</label><input type="text" id="p-n" value="'+v(ex.n)+'"></div>'+
    '<div class="f"><label for="p-cur">Headline</label><input type="text" id="p-cur" value="'+v(ex.cur)+'"></div>'+
    '<div class="row"><div class="f"><label for="p-loc">Based in</label><input type="text" id="p-loc" value="'+v(ex.loc)+'"></div><div class="f"><label for="p-yrs">Years of experience</label><input type="number" id="p-yrs" min="0" value="'+v(ex.yrs)+'"></div></div>'+
    '<div class="f"><label for="p-li">LinkedIn link <span class="opt">(optional)</span></label><input type="text" id="p-li" value="'+v(ex.linkedin)+'"></div></fieldset>'+
    '<fieldset><legend>Your expertise</legend><div class="f"><span class="lab">Industries <span class="opt">(up to 2)</span></span><div class="chips" id="p-ind">'+IND.map((t,i)=>'<label class="chip"><input type="checkbox" value="'+v(t)+'" '+(ex.ind.includes(t)?'checked':'')+'>'+v(t)+'</label>').join('')+'</div></div>'+
    '<div class="f"><label for="p-spec">Specialities</label><input type="text" id="p-spec" value="'+v((ex.spec||[]).join(', '))+'"><small>Separate with commas.</small></div>'+
    '<div class="f"><label for="p-about">About you</label><textarea id="p-about">'+v(ex.about)+'</textarea></div></fieldset>'+
    '<fieldset><legend>Your career</legend><div id="p-jobs">'+(ex.jobs||[]).map(j=>'<div class="jobrow"><input type="text" aria-label="Role and organisation" value="'+v(j[0])+'"><input type="text" aria-label="Dates" value="'+v(j[1])+'"><textarea aria-label="What you did">'+v(j[2])+'</textarea></div>').join('')+'</div>'+
    '<button type="button" class="btn ghost sm" id="p-addjob" style="align-self:flex-start">+ Add a role</button>'+
    '<div class="row"><div class="f"><label for="p-edu">Education</label><input type="text" id="p-edu" value="'+v(ex.edu)+'"></div><div class="f"><label for="p-lang">Languages</label><input type="text" id="p-lang" value="'+v(ex.lang)+'"></div></div></fieldset>'+
    '<fieldset><legend>Your charity</legend><div class="f"><label for="p-ch">Charity</label><input type="text" id="p-ch" value="'+v(ex.ch)+'"><small>Change it at any time. Requests already pledged keep the charity they were signed for.</small></div>'+
    '<div class="f"><label for="p-chd">What it does</label><input type="text" id="p-chd" value="'+v(ex.chd)+'"></div>'+
    '<div class="f"><label for="p-why">Why it\'s personal to you <span class="opt">(optional)</span></label><textarea id="p-why" style="min-height:80px">'+v(ex.why)+'</textarea></div>'+
    '<div class="row"><div class="f"><label for="p-don">Suggested donation</label><input type="text" id="p-don" value="'+v(ex.don)+'"><small>For example £250–£400, £300 or Open.</small></div><div class="f"><label for="p-donk">Shown as</label><select id="p-donk">'+['per hour for calls','suggested per hour','the firm decides'].map(o=>'<option'+(o===ex.donk?' selected':'')+'>'+o+'</option>').join('')+'</select></div></div></fieldset>'+
    '<fieldset><legend>Contact and availability</legend><div class="row"><div class="f"><label for="p-em">Email for requests</label><input type="email" id="p-em" value="'+v(ex.cemail||ex.email)+'"></div><div class="f"><label for="p-ph">Phone <span class="opt">(optional, never shown)</span></label><input type="tel" id="p-ph" value="'+v(ex.phone)+'"></div></div>'+
    '<div class="f"><span class="lab">How you\'re happy to help</span><div class="chips" id="p-fmts">'+FMTS.map(t=>'<label class="chip"><input type="checkbox" value="'+v(t)+'" '+((ex.fmts||[]).includes(t)?'checked':'')+'>'+v(t)+'</label>').join('')+'</div></div>'+
    '<div class="f"><label for="p-av">How much time could you give?</label><select id="p-av">'+AVAIL.map(o=>'<option'+(o===ex.avail?' selected':'')+'>'+o+'</option>').join('')+'</select></div></fieldset>'+
    '<fieldset><legend>Certificates</legend><label class="tick" style="font-size:18px;padding:10px 14px"><input type="checkbox" id="p-named" '+(ex.nameOnFirmCerts?'checked':'')+'>Let firms name me on their certificates of impact</label><p class="hint" style="margin:0">Off: firms\' certificates say "an industry expert".</p></fieldset>'+
    '<fieldset><legend>Notifications</legend><p class="hint" style="margin:0">We always show these in the bell. Choose which ones we also email you.</p>'+
    [['requests','New requests and replies'],['messages','New messages'],['questions','Open questions in my industries']].map(([k,l])=>'<label class="tick" style="font-size:18px;padding:10px 14px"><input type="checkbox" data-nt="'+k+'" '+(nt[k]!==false?'checked':'')+'>'+l+'</label>').join('')+'</fieldset>'+
    '<div class="acts"><button class="btn" type="submit">Save changes</button><button class="btn ghost sm" type="button" data-signout>Sign out</button></div></form>';
}

/* ---------- actions ---------- */
function wire(rt){
  const P=$('panel'), on=(sel,fn)=>P.querySelectorAll(sel).forEach(el=>el.addEventListener('click',e=>fn(el,e)));
  const cdi=$('cd'); if(cdi&&!cdi.value) cdi.value=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  on('[data-back]',()=>{ flash=''; go('#requests'); });
  on('.seg button',b=>{ rfilter=b.dataset.f; draw(); });
  on('[data-acc]',b=>{ mode={id:b.dataset.acc,kind:'acc'}; flash=''; draw(); });
  on('[data-dec]',b=>{ mode={id:b.dataset.dec,kind:'dec'}; flash=''; draw(); });
  on('[data-cancel]',()=>{ mode=null; draw(); });
  on('[data-confok]',b=>{ DS.update(s=>{ s.requests.find(x=>x.id===b.dataset.confok).confOk=true; }); draw(); });
  const acc=P.querySelector('.panel2.acc [data-conf]');
  if(acc){ const pn=acc.closest('.panel2'), dcs=[...pn.querySelectorAll('.dc')];
    dcs.forEach(c=>c.onchange=()=>{ acc.disabled=!dcs.every(x=>x.checked); $('conf-h').hidden=!acc.disabled; });
    pn.querySelectorAll('input[name=tm]').forEach(rd=>rd.onchange=()=>{ pn.querySelector('.other').hidden=!pn.querySelector('[data-other]').checked; });
    const d=new Date(Date.now()+7*86400000); $('od').value=d.toISOString().slice(0,10);
    acc.onclick=()=>{ const id=acc.dataset.conf, r=R(id), f=F(r.firmId), t=pn.querySelector('input[name=tm]:checked'), other=t.value==='other', note=$('an').value.trim();
      const when=other?new Date($('od').value+'T'+($('ot').value||'10:00')).toISOString():t.value;
      DS.update(s=>{ const x=s.requests.find(y=>y.id===id);
        if(other){ x.state='suggested'; x.suggested=when; x.suggestedBy='expert'; } else { x.state='booked'; x.meeting={at:when,join:{}}; }
        x.accepted=new Date().toISOString();
        if(note) x.messages.push({from:'expert',text:note,at:new Date().toISOString(),read:false}); });
      DS.alertFirm(r.firmId,other?'reply':'reply',other?first+' suggested a new time for "'+r.topic+'": '+DS.when(when):first+' accepted "'+r.topic+'" for '+DS.when(when),'firm-dashboard.html#request-'+id);
      mode=null; flash=other?'Sent. We\'ll book the meeting as soon as '+esc(f.name)+' agrees to '+esc(DS.when(when))+'.':'Accepted. The meeting is booked for '+esc(DS.when(when))+', and we\'ve shared your contact details with '+esc(f.name)+'.';
      draw(); P.scrollIntoView({block:'start'}); };
  }
  on('[data-dsend]',b=>{ const id=b.dataset.dsend, r=R(id), reason=P.querySelector('input[name=dr]:checked').value, note=$('dm').value.trim();
    DS.update(s=>{ const x=s.requests.find(y=>y.id===id); x.state='declined'; x.declined={reason,note}; });
    DS.alertFirm(r.firmId,'reply',first+' can\'t help with "'+r.topic+'" this time','firm-dashboard.html#request-'+id);
    mode=null; flash='Declined. We\'ve sent '+esc(F(r.firmId).name)+' a polite note'+(note?' with your message':'')+' and some similar experts.'; draw(); });
  on('[data-takesug]',b=>{ const r=R(b.dataset.takesug);
    DS.update(s=>{ const x=s.requests.find(y=>y.id===r.id); x.state='booked'; x.meeting={at:x.suggested,join:{}}; });
    DS.alertFirm(r.firmId,'reply',first+' accepted your time for "'+r.topic+'": '+DS.when(r.suggested),'firm-dashboard.html#request-'+r.id);
    flash='Booked for '+esc(DS.when(r.suggested))+'. We\'ve shared your contact details with '+esc(F(r.firmId).name)+'.'; draw(); });
  on('[data-counter]',b=>{ const r=R(b.dataset.counter), d=$('cd').value; if(!d){ $('cd').focus(); return; } const when=new Date(d+'T'+($('ct').value||'10:00')).toISOString();
    DS.update(s=>{ const x=s.requests.find(y=>y.id===r.id); x.state='suggested'; x.suggested=when; x.suggestedBy='expert'; x.firmSeen=false; });
    DS.alertFirm(r.firmId,'reply',first+' suggested a new time for "'+r.topic+'": '+DS.when(when),'firm-dashboard.html#request-'+r.id);
    flash='Sent. We\'ll book it as soon as '+esc(F(r.firmId).name)+' agrees.'; draw(); });
  on('[data-ics]',b=>{ const r=R(b.dataset.ics); DS.ics({uid:r.id,start:r.meeting.at,mins:/half a day/i.test(r.length)?240:60,title:'Dapperowl: '+r.topic+' with '+F(r.firmId).name,desc:'Your Dapperowl meeting. Join from your dashboard: expert-dashboard.html#request-'+r.id}); });
  on('[data-markdone]',b=>{ const r=R(b.dataset.markdone);
    DS.update(s=>{ const x=s.requests.find(y=>y.id===r.id); x.state='done'; x.donation=x.donation||{stage:1}; });
    DS.alertFirm(r.firmId,'meeting',first+' marked "'+r.topic+'" as done','firm-dashboard.html#request-'+r.id);
    flash='Marked as done. Press Send when you\'re ready to release the donation.'; draw(); });
  on('[data-send]',b=>{ const r=R(b.dataset.send);
    DS.update(s=>{ const x=s.requests.find(y=>y.id===r.id); x.donation.stage=2; x.donation.sent=new Date().toISOString(); });
    DS.alertFirm(r.firmId,'donation',first+' pressed Send: please donate '+gbp(r.amount)+' to '+r.pledge.charity+' within 48 hours','firm-dashboard.html#donations');
    flash='Sent. We\'ve asked '+esc(F(r.firmId).name)+' to donate '+gbp(r.amount)+' to '+esc(r.pledge.charity)+' within 48 hours.'; draw(); });
  P.querySelectorAll('form[data-msg]').forEach(fm=>fm.addEventListener('submit',e=>{ e.preventDefault(); const t=fm.querySelector('textarea').value.trim(); if(!t) return; const r=R(fm.dataset.msg);
    DS.update(s=>s.requests.find(x=>x.id===r.id).messages.push({from:'expert',text:t,at:new Date().toISOString(),read:false}));
    DS.alertFirm(r.firmId,'message',first+' sent you a message about "'+r.topic+'"','firm-dashboard.html#request-'+r.id);
    draw(); const ta=$('mt'); if(ta) ta.focus(); }));
  // To do: sharing
  on('[data-share]',b=>{ const k=b.dataset.share, t=shareText(k);
    const done=()=>{ DS.update(s=>{ const ex=s.experts.find(x=>x.id===me.ref); ex.shared=ex.shared||{}; ex.shared[k]=true; }); flash=k==='linkedin'?'Copied. Paste it into a new LinkedIn post.':'Copied. Paste it into an email to '+esc(EX().ch)+'.'; draw(); };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done,done); else done();
    if(k==='linkedin') window.open('https://www.linkedin.com/feed/?shareActive=true&text='+encodeURIComponent(t),'_blank','noopener'); });
  // questions
  const qa=$('qall'); if(qa) qa.onchange=()=>{ qAll=qa.checked; draw(); };
  on('[data-qopen]',b=>{ qOpen=b.dataset.qopen; draw(); const t=$('hn'); if(t) t.focus(); });
  on('[data-qcancel]',()=>{ qOpen=null; draw(); });
  P.querySelectorAll('form[data-hand]').forEach(fm=>fm.addEventListener('submit',e=>{ e.preventDefault(); const note=$('hn').value.trim(); if(!note){ $('hn').focus(); return; }
    const q=S().questions.find(x=>x.id===fm.dataset.hand);
    DS.update(s=>s.questions.find(x=>x.id===q.id).hands.push({expertId:me.ref,note,at:new Date().toISOString()}));
    DS.alertFirm(q.firmId,'hand',me.name+' raised a hand on "'+q.title+'"','firm-dashboard.html#questions');
    qOpen=null; flash='Hand raised. '+esc(F(q.firmId).name)+' can now open your profile and send you a request.'; draw(); }));
  // donations
  const sw=$('showtotal'); if(sw) sw.onclick=()=>{ DS.update(s=>{ const ex=s.experts.find(x=>x.id===me.ref); ex.showTotal=!ex.showTotal; }); draw(); };
  on('[data-rcpt]',b=>{ const r=R(b.dataset.rcpt), f=F(r.firmId), d=$('rcpt');
    $('rcpt-in').innerHTML='<h2 id="rcpt-h">Donation receipt</h2><dl class="dl" style="text-align:left"><dt>Charity</dt><dd>'+esc(r.pledge.charity)+'</dd><dt>Amount</dt><dd>'+gbp(r.amount)+'</dd><dt>From</dt><dd>'+esc(f.name)+'</dd><dt>Paid</dt><dd>'+esc(DS.day(r.donation.paid))+'</dd><dt>File</dt><dd>'+esc(r.donation.receipt||'receipt.pdf')+'</dd></dl><div class="acts"><button class="btn sm" id="rcpt-x">Close</button></div>';
    $('rcpt-x').onclick=()=>d.close(); if(d.showModal) d.showModal(); });
  on('[data-dl]',b=>{ const r=R(b.dataset.dl); DS.download(certSVG(EX(),r),'image/svg+xml','dapperowl-certificate-'+r.id+'.svg'); });
  // profile
  on('[data-pause]',()=>{ DS.update(s=>{ const ex=s.experts.find(x=>x.id===me.ref); ex.status=ex.status==='paused'?'live':'paused'; }); flash=EX().status==='paused'?'Your profile is paused. Firms won\'t find you until you make it live again.':'Your profile is live again.'; draw(); });
  const pf=$('pform');
  if(pf){
    const lim=()=>{ const bx=[...pf.querySelectorAll('#p-ind input')], n=bx.filter(c=>c.checked).length; bx.forEach(c=>{ c.disabled=!c.checked&&n>=2; c.parentElement.classList.toggle('off',c.disabled); }); };
    pf.querySelectorAll('#p-ind input').forEach(c=>c.onchange=lim); lim();
    $('p-addjob').onclick=()=>{ const d=document.createElement('div'); d.className='jobrow'; d.innerHTML='<input type="text" aria-label="Role and organisation" placeholder="Job title, organisation"><input type="text" aria-label="Dates" placeholder="Start year – end year"><textarea aria-label="What you did" placeholder="What you did there"></textarea>'; $('p-jobs').appendChild(d); d.querySelector('input').focus(); };
    pf.addEventListener('submit',e=>{ e.preventDefault(); const val=id=>$(id).value.trim();
      const ind=[...pf.querySelectorAll('#p-ind input:checked')].map(c=>c.value);
      if(!val('p-n')||!val('p-ch')||!ind.length){ flash=''; alertBox('Please fill in your name and charity, and pick at least one industry.'); return; }
      DS.update(s=>{ const ex=s.experts.find(x=>x.id===me.ref);
        Object.assign(ex,{n:val('p-n'),cur:val('p-cur'),top:ex.top===ex.cur?val('p-cur'):ex.top,loc:val('p-loc'),yrs:+val('p-yrs')||0,linkedin:val('p-li'),ind,spec:val('p-spec').split(',').map(x=>x.trim()).filter(Boolean),about:val('p-about'),
          jobs:[...pf.querySelectorAll('.jobrow')].map(j=>[j.children[0].value.trim(),j.children[1].value.trim(),j.children[2].value.trim()]).filter(j=>j[0]),
          edu:val('p-edu'),lang:val('p-lang'),ch:val('p-ch'),chd:val('p-chd'),why:val('p-why'),don:val('p-don')||'Open',donk:$('p-donk').value,cemail:val('p-em'),phone:val('p-ph'),
          fmts:[...pf.querySelectorAll('#p-fmts input:checked')].map(c=>c.value),avail:$('p-av').value,
          nameOnFirmCerts:$('p-named').checked,notify:Object.fromEntries([...pf.querySelectorAll('[data-nt]')].map(c=>[c.dataset.nt,c.checked]))});
        const u=s.users.find(x=>x.id===me.id); if(u) u.name=ex.n.replace(/^The Hon\. /,''); });
      flash='Saved. Firms see your changes straight away.'; draw(); $('panel').scrollIntoView({block:'start'}); });
  }
}
function alertBox(t){ const p=$('panel'); let el=p.querySelector('.ok-msg.err'); if(!el){ el=document.createElement('p'); el.className='ok-msg err'; el.style.background='#F6D9DC'; el.setAttribute('role','alert'); p.prepend(el); } el.textContent=t; p.scrollIntoView({block:'start'}); }
draw();
addEventListener('dapper-change',()=>{ const a=document.activeElement; if(a&&/^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName)) return; draw(); });
})();

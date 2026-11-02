// Dapperowl prototype data store (2 Nov). One shared store in localStorage, seeded on first load.
// Prototype only: the live site keeps this in Supabase. Every read and write is wrapped, so the pages still work when storage is blocked.
(function(){
const KEY='dapper-store-v1';
const D=86400000, H=3600000;
const EX=[
 {n:'The Hon. Inglebert Montgomery-Smythe',top:'Founder, Broom Bay Seaweed',cur:'Founder, Broom Bay Seaweed',loc:'Ullapool, Scotland',yrs:27,ind:['Food, Agriculture & Fisheries','Environment & Sustainability'],spec:['Seaweed farming','Marine licensing','Aquaculture','Coastal communities'],
  about:"I spent ten years as a site manager at Summer Isles Salmon, where I learned how marine licensing, water quality and coastal communities really work. Before that, five years as a deckhand and then mate on fisheries survey vessels taught me to read the sea and the weather. In 2012 I founded Broom Bay Seaweed, growing sugar kelp and dulse on longlines in Loch Broom; it now supplies food, cosmetics and fertiliser makers across the UK.",
  jobs:[['Founder, Broom Bay Seaweed','2012 – now · 14 years','Sugar kelp and dulse on longlines in Loch Broom; supplies food, cosmetics and fertiliser makers.'],['Site manager, Summer Isles Salmon','2002 – 2012 · 10 years','Daily operations, marine licensing, water quality, community relations.'],['Deckhand, then mate, fisheries survey vessels','1997 – 2002 · 5 years','Survey work at sea.']],
  edu:'BSc Marine Biology, University of Aberdeen',lang:'English, Scottish Gaelic',ch:'Loch Broom Lifeboat Fund',chd:'Funds the volunteer lifeboat crew serving Loch Broom and the Summer Isles.',why:"The crew came out for our boat in a winter gale in 2004. I've supported them ever since.",don:'£250–£400',donk:'per hour for calls'},
 {n:'Alejandro Ruiz Cárdenas',top:'Former CMO, Petrosur Energía · 24 years',cur:'Senior Strategy Officer, Golfo Infraestructura',loc:'Villahermosa, Mexico',yrs:31,ind:['Energy & Natural Resources','Property & Infrastructure'],spec:['Oil plant infrastructure','Southern Mexico','Energy marketing','Government relations'],
  about:"For 24 years I led marketing at Petrosur Energía, selling refinery capacity and building the relationships that keep big plants running in southern Mexico. I now advise Golfo Infraestructura on where to build next, which means knowing the land, the permits and the people in Tabasco and Campeche.",
  jobs:[['Senior Strategy Officer, Golfo Infraestructura','2019 – now · 7 years','Site selection and strategy for energy infrastructure in the Gulf of Mexico.'],['Chief Marketing Officer, Petrosur Energía','1995 – 2019 · 24 years','Marketing for refinery and storage capacity; partner and government relations.']],
  edu:'MBA, IPADE Business School',lang:'Spanish, English',ch:'Bridges to Literacy',chd:'Runs reading clubs for children in under-served communities.',why:'',don:'£500',donk:'suggested per hour'},
 {n:'Aino Väisänen',top:'Head of Forestry, Lappi Woodlands · 18 years',cur:'Independent woodland adviser',loc:'Rovaniemi, Finland',yrs:26,ind:['Environment & Sustainability'],spec:['Northern forestry','Woodland carbon','Sustainable harvesting'],
  about:"I ran forestry at Lappi Woodlands for 18 years, managing slow-growing northern forests where every harvest decision lasts a century. I now advise landowners and investors on woodland carbon and how to harvest without harming the forest.",
  jobs:[['Independent woodland adviser','2020 – now · 6 years','Advice on woodland carbon and sustainable harvesting.'],['Head of Forestry, Lappi Woodlands','2002 – 2020 · 18 years','Managed 40,000 hectares of northern forest.']],
  edu:'MSc Forest Sciences, University of Helsinki',lang:'Finnish, English, Swedish',ch:'Northern Woodland Trust',chd:'Plants and protects native woodland across northern Europe.',why:'',don:'Open',donk:'the firm decides'},
 {n:'Isla Morrow',top:'Founder, Kelpwell',cur:'Founder and CEO, Kelpwell',loc:'Oban, Scotland',yrs:15,ind:['Food, Agriculture & Fisheries','Consumer, Retail & Hospitality'],spec:['Fermented seaweed drinks','Drinks start-ups','Retail listings'],
  about:"I founded Kelpwell in 2016 to make fermented seaweed drinks, and took it from a kitchen in Oban to shelves in three national supermarkets. I know what it takes to launch a new drink and win retail buyers.",
  jobs:[['Founder and CEO, Kelpwell','2016 – now · 10 years','Fermented seaweed drinks sold in UK supermarkets.'],['Brand manager, Highland Springs Co.','2011 – 2016 · 5 years','Launched two soft drink lines.']],
  edu:'BA Marketing, University of Stirling',lang:'English',ch:'Oban Food Bank',chd:'Provides emergency food parcels across Argyll.',why:'',don:'£150–£200',donk:'per hour for calls'},
 {n:'Priya Raman',top:'Former COO, Northbridge Shipping · 22 years',cur:'Non-executive director, Tidewater Ports',loc:'London, England',yrs:30,ind:['Shipping, Transport & Logistics','Finance & Investment'],spec:['Ship sale and purchase','Fleet operations','Port investment'],
  about:"I spent 22 years at Northbridge Shipping, ending as chief operating officer of a 60-vessel fleet. I've bought, sold and run ships through three market cycles, and now sit on the board of Tidewater Ports.",
  jobs:[['Non-executive director, Tidewater Ports','2021 – now · 5 years','Board oversight of UK port investments.'],['Chief Operating Officer, Northbridge Shipping','1999 – 2021 · 22 years','Fleet operations, vessel sale and purchase.']],
  edu:'BSc Economics, London School of Economics',lang:'English, Tamil',ch:'Seafarers Support Network',chd:'Helps merchant seafarers and their families in hardship.',why:'',don:'£500',donk:'suggested per hour'},
 {n:'Tom Achterberg',top:'Former Director of Clinical Operations, Westvale Health · 16 years',cur:'Hospital operations consultant',loc:'Leeds, England',yrs:28,ind:['Health & Life Sciences'],spec:['Hospital operations','Waiting lists','Clinical staffing'],
  about:"I ran clinical operations at Westvale Health for 16 years, responsible for theatres, wards and waiting lists across four hospitals. I now help hospitals cut waiting times without burning out their staff.",
  jobs:[['Hospital operations consultant','2021 – now · 5 years','Waiting-list and staffing projects.'],['Director of Clinical Operations, Westvale Health','2005 – 2021 · 16 years','Theatres, wards and waiting lists across four hospitals.']],
  edu:'MSc Healthcare Management, University of Leeds',lang:'English, Dutch',ch:'Yorkshire Carers Trust',chd:'Supports unpaid carers across Yorkshire.',why:'',don:'£250–£400',donk:'per hour for calls'}
];
const EMAILS=['inglebert@example.co.uk','alejandro.ruiz@example.mx','aino.vaisanen@example.fi','isla@kelpwell.example.com','priya.raman@example.co.uk','tom.achterberg@example.co.uk'];
const FMTS=['Phone or video call','Written advice','Site visit','Talk or presentation','Mentoring'];
function seed(){
  const now=Date.now(), at=ms=>new Date(now+ms).toISOString();
  // meeting slots on the hour: slot(2,11) is 11:00 the day after tomorrow
  const t0=new Date(); t0.setHours(0,0,0,0); const slot=(d,hr)=>new Date(t0.getTime()+d*D+hr*H).toISOString();
  const experts=EX.map((e,i)=>Object.assign({},e,{id:'e'+(i+1),email:EMAILS[i],status:'live',fmts:FMTS.slice(0,3),avail:'Up to 5 hours a month',showTotal:false,notify:{requests:true,messages:true,questions:true},created:at(-(200-i*10)*D)}));
  const firms=[
    {id:'f1',name:'Harbourline Capital',type:'Investor',size:'51–250',site:'harbourline.example.com',reliable:true,namedOnCerts:true,team:[{name:'James Okafor',title:'Partner',email:'james.okafor@harbourline.example.com'},{name:'Mei Tanaka',title:'Analyst',email:'mei.tanaka@harbourline.example.com'}]},
    {id:'f2',name:'Northgate Foods',type:'Company',size:'251–1,000',site:'northgatefoods.example.com',reliable:false,namedOnCerts:false,team:[{name:'Sarah Lindqvist',title:'Head of Strategy',email:'sarah.lindqvist@northgatefoods.example.com'}]},
    {id:'f3',name:'Fenwick Events',type:'Event organiser',size:'11–50',site:'fenwickevents.example.com',reliable:false,namedOnCerts:false,team:[{name:'Tom Reyes',title:'Programme Director',email:'tom.reyes@fenwickevents.example.com'}]}
  ];
  const users=experts.map(e=>({id:'u-'+e.id,role:'expert',email:e.email,name:e.n.replace(/^The Hon\. /,''),ref:e.id}))
    .concat(firms.map(f=>({id:'u-'+f.id,role:'firm',email:f.team[0].email,name:f.team[0].name,title:f.team[0].title,ref:f.id})));
  const pledge=(f,amt,ch,ago)=>({name:f.team[0].name,title:f.team[0].title,company:f.name,amount:amt,charity:ch,at:at(-ago)});
  const msg=(from,text,ago,read)=>({from,text,at:at(-ago),read:read!==false});
  const LB='Loch Broom Lifeboat Fund';
  const req=(o)=>Object.assign({fmt:'Video call',length:'1 hour',times:[],conf:false,messages:[],meeting:null,donation:{stage:1},declined:null,attendees:'',known:'',docs:''},o);
  const requests=[
    // new: waiting for the expert
    req({id:'r1',firmId:'f2',expertId:'e1',state:'sent',created:at(-5*H),topic:'Adding seaweed to our ready-meals range',goal:'We are deciding whether to launch a seaweed line in 2027 and need to know if UK supply can keep up.',questions:['Which seaweeds are reliable enough to build a product on?','What does a realistic supply contract look like?','What would you watch out for in year one?'],times:[slot(3,10),slot(4,14),slot(6,9)],amount:300,pledge:pledge(firms[1],300,LB,5*H),attendees:'Sarah Lindqvist and our product lead',messages:[msg('firm','Thanks for considering this. Happy to share our shortlist of suppliers beforehand.',5*H,false)]}),
    // suggested another time: waiting for the firm
    req({id:'r2',firmId:'f3',expertId:'e1',state:'suggested',created:at(-2*D),topic:'Talk at the Coastal Food Summit',fmt:'Talk or presentation',length:'Half a day',goal:'A 30-minute talk for 200 food buyers on farming seaweed in Scotland.',questions:['What makes Scottish seaweed different?','Where is the market going?'],times:[slot(20,10)],suggested:slot(21,14),amount:800,pledge:pledge(firms[2],800,LB,2*D),messages:[msg('expert','The 21st works better for me; the boat is out on the 20th.',1*D)]}),
    // accepted, meeting booked
    req({id:'r3',firmId:'f1',expertId:'e1',state:'booked',created:at(-4*D),topic:'Seaweed farming as an investment',goal:'We are looking at a minority stake in a Scottish seaweed farm and want a practitioner\'s view of the risks.',questions:['How variable are yields year to year?','What licences can block expansion?','Who are the serious buyers?'],times:[slot(2,11)],amount:400,pledge:pledge(firms[0],400,LB,4*D),meeting:{at:slot(2,11),join:{}},messages:[msg('firm','Looking forward to it. I\'ll send our short memo the day before.',3*D),msg('expert','Thanks, James. Talk on Thursday.',3*D-2*H)]}),
    // declined
    req({id:'r4',firmId:'f3',expertId:'e2',state:'declined',created:at(-9*D),topic:'Panel on Gulf energy projects',fmt:'Talk or presentation',goal:'A panel seat at our energy forum.',questions:['Where will new plants be built?'],amount:500,pledge:pledge(firms[2],500,'Bridges to Literacy',9*D),declined:{reason:'No time right now',note:'Thank you for thinking of me. I\'m travelling that month.'}}),
    // done: waiting for the expert to press Send
    req({id:'r5',firmId:'f1',expertId:'e1',state:'done',created:at(-12*D),topic:'Marine licensing for a new site',goal:'Understand the licensing timeline for a second farm.',questions:['How long do licences take?','What do regulators look at first?'],amount:350,pledge:pledge(firms[0],350,LB,12*D),meeting:{at:slot(-2,10),join:{expert:at(-2*D-3*60000),firm:at(-2*D-1*60000)}},messages:[msg('firm','Thank you, that was exactly what we needed.',2*D-H)]}),
    // sent to charity: waiting for the firm to donate
    req({id:'r6',firmId:'f2',expertId:'e1',state:'done',created:at(-20*D),topic:'Sourcing dulse at scale',goal:'Find out whether dulse can be sourced year-round.',questions:['Is dulse seasonal?','Who else grows it?'],amount:250,pledge:pledge(firms[1],250,LB,20*D),meeting:{at:slot(-8,10),join:{expert:at(-8*D-2*60000),firm:at(-8*D)}},donation:{stage:2,sent:at(-7*D)}}),
    // completed donations, with certificates
    req({id:'r7',firmId:'f1',expertId:'e1',state:'done',created:at(-60*D),topic:'Coastal community relations',goal:'Learn how to win local support for a new farm.',questions:['Who do we talk to first?'],amount:500,pledge:pledge(firms[0],500,LB,60*D),meeting:{at:slot(-50,10),join:{expert:at(-50*D),firm:at(-50*D)}},donation:{stage:4,sent:at(-49*D),paid:at(-48*D),received:at(-47*D),receipt:'Harbourline-receipt.pdf'}}),
    req({id:'r8',firmId:'f2',expertId:'e1',state:'done',created:at(-40*D),topic:'Kelp for cosmetics',goal:'Judge whether kelp extract is worth a pilot.',questions:['What grade of kelp do cosmetics makers need?'],amount:300,pledge:pledge(firms[1],300,LB,40*D),meeting:{at:slot(-30,10),join:{expert:at(-30*D),firm:at(-30*D)}},donation:{stage:4,sent:at(-29*D),paid:at(-27*D),received:at(-26*D),receipt:'Northgate-receipt.pdf'}}),
    // other experts, so every dashboard has something
    req({id:'r9',firmId:'f1',expertId:'e5',state:'sent',created:at(-1*D),topic:'Second-hand bulk carrier prices',goal:'Decide whether to buy two vessels this year.',questions:['Where are prices heading?','What should we inspect first?'],times:[slot(5,10)],amount:500,pledge:pledge(firms[0],500,'Seafarers Support Network',1*D)})
  ];
  const questions=[
    {id:'q1',firmId:'f2',title:'Which seaweeds suit UK ready meals?',field:'Food, Agriculture & Fisheries',desc:'We want to add seaweed to three ready meals. Which species hold up in cooking and freezing, and who can supply them?',pledge:'£200–£400',created:at(-3*D),status:'open',hands:[{expertId:'e4',note:'I make fermented seaweed drinks and know the UK suppliers.\nHappy to compare species with you.',at:at(-2*D)}]},
    {id:'q2',firmId:'f1',title:'Port investment outlook for the North Sea',field:'Shipping, Transport & Logistics',desc:'We are weighing a stake in a UK east-coast port. We would like a view on traffic, wind-farm work and competition.',pledge:'£400–£600',created:at(-6*D),status:'open',hands:[]},
    {id:'q3',firmId:'f3',title:'Speaker on cutting hospital waiting lists',field:'Health & Life Sciences',desc:'A 20-minute talk at our health leaders conference in March, with questions afterwards.',pledge:'£500',created:at(-1*D),status:'open',hands:[]},
    {id:'q4',firmId:'f1',title:'Woodland carbon credits: what should we check?',field:'Environment & Sustainability',desc:'We are being offered woodland carbon credits in Scotland and Finland. What makes a project trustworthy?',pledge:'£250–£400',created:at(-4*D),status:'open',hands:[{expertId:'e3',note:'I ran 40,000 hectares of northern forest.\nI can walk you through what to check.',at:at(-3*D)}]}
  ];
  const alerts=[
    {id:'a1',to:'u-e1',kind:'request',text:'New request from Northgate Foods: Adding seaweed to our ready-meals range',link:'expert-dashboard.html#requests',at:at(-5*H),read:false},
    {id:'a2',to:'u-e1',kind:'message',text:'Sarah Lindqvist sent you a message',link:'expert-dashboard.html#requests',at:at(-5*H),read:false},
    {id:'a3',to:'u-e1',kind:'meeting',text:'Reminder: Harbourline Capital, Thursday',link:'expert-dashboard.html#meetings',at:at(-1*D),read:true},
    {id:'a4',to:'u-f1',kind:'reply',text:'Inglebert marked "Marine licensing for a new site" as done',link:'firm-dashboard.html#donations',at:at(-2*D),read:false},
    {id:'a5',to:'u-f2',kind:'hand',text:'Isla Morrow raised her hand on "Which seaweeds suit UK ready meals?"',link:'firm-dashboard.html#questions',at:at(-2*D),read:false},
    {id:'a6',to:'u-f2',kind:'donation',text:'Inglebert sent your £250 donation to Loch Broom Lifeboat Fund',link:'firm-dashboard.html#donations',at:at(-7*D),read:true}
  ];
  return {v:1,seq:100,session:null,experts,firms,users,requests,questions,saved:{f1:['e1','e5']},alerts,emails:[]};
}
let mem=null;
function load(){
  if(mem) return mem;
  try{ const raw=localStorage.getItem(KEY); if(raw) mem=JSON.parse(raw); }catch(e){}
  if(!mem||mem.v!==1){ mem=seed(); save(); }
  return mem;
}
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(mem)); }catch(e){} }
// another tab changed the store: pick it up
addEventListener('storage',e=>{ if(e.key===KEY){ try{ mem=e.newValue?JSON.parse(e.newValue):null; }catch(er){ mem=null; } } });
const DS={
  get:load, save,
  update(fn){ const s=load(); const r=fn(s); save(); return r; },
  reset(){ mem=seed(); save();
    try{ ['dapper-profile-step'].forEach(k=>localStorage.removeItem(k)); ['dapper-firm','dapper-expert','dapper-lastreq','dapper-signup-expert'].forEach(k=>sessionStorage.removeItem(k)); }catch(e){} },
  id(p){ return DS.update(s=>p+(++s.seq)); },
  me(){ const s=load(); return s.session?s.users.find(u=>u.id===s.session)||null:null; },
  signIn(userId){ DS.update(s=>{ s.session=userId; }); },
  signOut(){ DS.update(s=>{ s.session=null; }); },
  userByEmail(email){ const e=String(email||'').trim().toLowerCase(); return load().users.find(u=>u.email.toLowerCase()===e)||null; },
  expert(id){ return load().experts.find(x=>x.id===id)||null; },
  firm(id){ return load().firms.find(x=>x.id===id)||null; },
  home(u){ u=u||DS.me(); return !u?'index.html':(u.role==='expert'?'expert-dashboard.html':'firm-dashboard.html'); },
  // a new firm account from the sign-up flow (or the existing one, if that email already has an account)
  addFirm(o){ const known=DS.userByEmail(o.email); if(known) return known;
    return DS.update(s=>{ const fid='f'+(++s.seq);
      s.firms.push({id:fid,name:o.org,type:o.type,size:o.size,site:o.site,reliable:false,namedOnCerts:false,team:[{name:o.name,title:o.title,email:o.email}],created:new Date().toISOString()});
      const u={id:'u-'+fid,role:'firm',email:o.email,name:o.name,title:o.title,ref:fid}; s.users.push(u); return u; }); },
  // alerts for the bell (the email previews are added in stage 5)
  alert(to,kind,text,link){ DS.update(s=>{ s.alerts.unshift({id:'a'+(++s.seq),to,kind,text,link,at:new Date().toISOString(),read:false}); }); },
  // alert every user on a firm account, or the expert
  alertFirm(firmId,kind,text,link){ load().users.filter(u=>u.role==='firm'&&u.ref===firmId).forEach(u=>DS.alert(u.id,kind,text,link)); },
  alertExpert(expertId,kind,text,link){ load().users.filter(u=>u.role==='expert'&&u.ref===expertId).forEach(u=>DS.alert(u.id,kind,text,link)); },
  // dates, e.g. "Thu 5 Nov, 11:00" and "5 Nov 2026"
  when(iso){ const d=new Date(iso); return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+', '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); },
  day(iso){ return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); },
  // "Add to calendar": a .ics file for the meeting
  ics(o){ const f=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const end=new Date(new Date(o.start).getTime()+(o.mins||60)*60000);
    const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Dapperowl//Prototype//EN','BEGIN:VEVENT','UID:'+o.uid+'@dapperowl.co.uk','DTSTAMP:'+f(Date.now()),'DTSTART:'+f(o.start),'DTEND:'+f(end),'SUMMARY:'+o.title.replace(/[,;]/g,'\\$&'),'DESCRIPTION:'+(o.desc||'').replace(/\n/g,'\\n').replace(/[,;]/g,'\\$&'),'END:VEVENT','END:VCALENDAR'].join('\r\n');
    DS.download(txt,'text/calendar','dapperowl-meeting.ics'); },
  download(text,type,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); },
  myAlerts(){ const u=DS.me(); return u?load().alerts.filter(a=>a.to===u.id):[]; }
};
window.DS=DS;
})();

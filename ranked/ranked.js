/* Classroom Ranked integration using the existing student name and Firestore data. */
(function(){'use strict';
const C=RankedCore,$=id=>document.getElementById(id),art=r=>'assets/ranks/rank_'+r+'.png';
let persistence=null,db=null,user=null,profile=C.initial(),vocab=null,session=null,prepared=false,busy=false,mode='normal',normalVocab=null,loadPromise=null,lastLoaded=0,accountEpoch=0,profileVerified=false,profileCheckedAt=0;
const emit=(id,text)=>{const e=$(id);if(e)e.textContent=text;};
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){localStorage.setItem(k,JSON.stringify(v));}};
const identity=()=>user?.uid||'guest';
const studentName=()=>new URLSearchParams(location.search).get('user')||localStorage.getItem('vocab_user')||localStorage.getItem('air_strike_player_nickname')||'';
function localProgress(){return storage.get('ranked.local.'+identity(),{totalGames:0,highFlights:0,completed:[]});}
function status(message){emit('rkStatus',message);}
function escapeError(e){if(['internal','unavailable','deadline-exceeded'].includes(e?.code))return 'Ranked is temporarily unavailable. You can still play Normal mode. Please try again later.';return e?.message||String(e);}
async function call(name,data={},actor=user){if(!persistence||!actor)throw Error('Enter your existing student name first.');return persistence.call(name,{...data,studentName:actor.studentName});}
function image(rank){const img=document.createElement('img');img.src=art(rank.id);img.alt=rank.name;return img;}
function cache(value){return new Promise((resolve,reject)=>{const r=indexedDB.open('SkyDominatorsRankedCache',1);r.onupgradeneeded=()=>r.result.createObjectStore('cache');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('cache',value?'readwrite':'readonly'),store=tx.objectStore('cache'),q=value?store.put(value,'vocabulary'):store.get('vocabulary');let result;q.onsuccess=()=>result=q.result;tx.oncomplete=()=>{db.close();resolve(value||result);};tx.onerror=()=>{db.close();reject(tx.error);};};});}
async function loadVocabulary(force=false){
 if(loadPromise)return loadPromise;if(vocab&&!force&&Date.now()-lastLoaded<300000)return vocab;
 const pending=(async()=>{if(!db||!user)throw Error('Enter your existing student name to load Ranked vocabulary.');
  // One server read per fresh Ranked visit/explicit refresh. A match and preview share this snapshot.
  const epoch=accountEpoch;
  const cached=await cache().catch(()=>null); // Read the IndexedDB snapshot without using it to bypass availability checks.
  const raw=await call('rankedVocabulary');
  if(epoch!==accountEpoch)throw Error('Student changed while loading vocabulary.');
  const source=cached?.revision===raw.revision?cached:raw;const valid=C.validateVocabulary(source);vocab={...raw,entries:valid.entries};lastLoaded=Date.now();
  await cache(vocab).catch(()=>{});renderVocabulary();return vocab;
 })();loadPromise=pending;try{return await pending;}finally{if(loadPromise===pending)loadPromise=null;}
}
function renderVocabulary(){const host=$('rkWords');if(!host)return;host.replaceChildren();const term=C.norm($('rkSearch').value);
 for(const v of (vocab?.entries||[]).filter(v=>C.norm(v.word+' '+v.meaning).includes(term))){const row=document.createElement('div');row.className='rk-entry';const word=document.createElement('strong');word.textContent=v.word;const meaning=document.createElement('div');meaning.textContent=v.meaning||'Meaning not supplied';row.append(word,meaning);host.appendChild(row);}
 emit('rkRevision',vocab?'Revision '+vocab.revision+' · '+vocab.entries.length+' words · '+new Date(vocab.updatedAt).toLocaleString():'No vocabulary loaded');
}
function medal(){
 // Keep pre-feature earned medals; never infer >=12K history from the old >10K counter.
 const legacy=user?{milestone:profile.legacyMedalMilestone||0}:storage.get('ranked.legacyMedal',null);const count=Math.max(profile.highFlights||0,localProgress().highFlights||0),milestone=Math.floor(count/10)*10;
 const highest=Math.max(legacy?.milestone||0,milestone);if(highest<10)return null;
 const old=FlightRewardsManager.getActiveMedal(Math.min(highest,30));return {...old,id:'flight_'+highest,name:highest+' qualifying flights',desc:'Highest earned milestone: '+highest+' flights',milestone:highest};
}
function render(){
 const current=C.RANKS[profile.rankIndex]||C.IRON,next=C.RANKS[profile.rankIndex+1];
 const center=$('badgeImgCenter');if(center){const earned=FlightRewardsManager.getAchievements().top1;center.src='assets/leaderboard/top1.png';center.alt=earned?'Sky Legend':'Sky Legend locked';center.classList.toggle('sky-legend-locked-glitch',!earned);}
 const right=$('mainMenuSecondaryBadges');if(right){right.replaceChildren();const icon=image(current);icon.id='mainMenuRankImg';const label=document.createElement('span');label.id='mainMenuRankName';label.textContent=current.name;right.append(icon,label);right.setAttribute('aria-label',current.name+' competitive rank'+(profileVerified?'':' — cloud profile not yet loaded'));}

 const left=$('mainMenuMedals');if(left)renderMenuAwardCollection(left,medal()?[medal()]:[],'medal');
 emit('rkIdentity',(profile.displayName||studentName()||user?.displayName||'Student identity not established')+(user?'':' · enter your existing name'));
 emit('rkIdentityNotice',user?'Using your existing student name. Matching names share one classroom profile.':'Enter your existing name using the pilot-name control or open LexicalSpace.');
 const emblem=$('rkCurrent');if(emblem){emblem.replaceChildren(image(current));const copy=document.createElement('div');const title=document.createElement('h2');title.textContent=current.name;const progress=document.createElement('p');progress.textContent=next?`${profile.progress||0}/${next.matches} qualifying matches — ${next.score.toLocaleString()} points required for ${next.name}. ${Math.max(0,next.matches-(profile.progress||0))} remaining.`:'Diamond — highest rank achieved.';copy.append(title,progress);emblem.append(copy);}
 const ranks=$('rkRanks');if(ranks){ranks.replaceChildren();for(const [i,r] of C.ALL_RANKS.entries()){const box=document.createElement('div');box.className='rk-rank'+(i-1>profile.rankIndex?' locked':'');box.append(image(r));const label=document.createElement('div');label.textContent=r.name+(i-1<=profile.rankIndex?' ✓':'');const req=document.createElement('small');req.textContent=i?`${r.matches} × ${r.score.toLocaleString()}`:'Starting rank';box.append(label,req);ranks.append(box);}}
 emit('rkMedals',`${Math.max(profile.highFlights||0,localProgress().highFlights||0)} completed flights at 12,000+ points. One medal every 10 qualifying flights across both modes. Highest earned milestone: ${medal()?.milestone||0}. Legacy earned medals are preserved.`);
 if($('rkAuth'))$('rkAuth').hidden=!!user;
 if(typeof updateHangarModalUI==='function')updateHangarModalUI();
}
let profileRequest=null;
async function refreshProfile(force=false){
 if(!force&&profileVerified&&Date.now()-profileCheckedAt<60000)return;
 const actor=user,who=actor?.uid,epoch=accountEpoch;if(!who)return;
 if(profileRequest?.who===who&&profileRequest.epoch===epoch)return profileRequest.promise;
 const request={who,epoch};
 request.promise=(async()=>{const data=await call('rankedProfile',{},actor);
 if(user?.uid!==who||epoch!==accountEpoch)return;
 profile={...C.initial(),...data};profileVerified=true;profileCheckedAt=Date.now();storage.set('ranked.profile.'+who,profile);render();
 if(profile.rankIndex>=0){const claim=await call('rankedClaimPromotion',{rank:C.RANKS[profile.rankIndex].id},actor);if(claim.show&&user?.uid===who&&epoch===accountEpoch)showPromotion(claim.promotion);}
 })();profileRequest=request;
 try{return await request.promise;}finally{if(profileRequest===request)profileRequest=null;}
}
async function open(){ $('rkScreen').hidden=false;render();status(user?'Loading cloud profile…':'');if(user){try{await refreshProfile();await loadVocabulary();await flush();status('Cloud profile loaded.');}catch(e){status(escapeError(e));}}else status('Enter your existing student name using the pilot-name control. No registration is required.');}
async function start(){if(busy||isAlternativeSkinInspected())return;busy=true;status('Preparing Ranked match…');try{
 if(!user)throw Error('Enter your existing student name before starting Ranked.');const who=user.uid,epoch=accountEpoch;await flush();await refreshProfile();await loadVocabulary();
 if(user?.uid!==who||epoch!==accountEpoch)throw Error('Student changed. Start again.');
 if(!isAircraftEarned(Number(localStorage.getItem('air_strike_selected_aircraft')||0)))throw Error('This aircraft is available for Normal testing only. Select an earned aircraft for Ranked.');
 const matchId='ranked_'+crypto.randomUUID();const s=await call('rankedStart',{matchId,revision:vocab.revision,aircraftIndex: isAircraftUnlocked(Number(localStorage.getItem('air_strike_selected_aircraft')||0))?Number(localStorage.getItem('air_strike_selected_aircraft')||0):0});
 if(user?.uid!==who||epoch!==accountEpoch)throw Error('Student changed. Start again.');
 if(isAlternativeSkinInspected())throw Error('Select the default skin before starting Ranked.');
 session={...s,uid:who};mode='ranked';normalVocab=normalVocab||vocabService.vocabularyList.slice();
 vocabService.vocabularyList=structuredClone(vocab.entries);vocabService.resetExhaustionDeck();prepared=true;
 $('rkScreen').hidden=true;resetGame();status('');
 }catch(e){status(escapeError(e));$('rkScreen').hidden=false;}finally{busy=false;}}
function toNormal(){mode='normal';session=null;if(normalVocab){vocabService.vocabularyList=normalVocab;normalVocab=null;vocabService.resetExhaustionDeck();}}
const flushing=new Map();
async function flush(){
 const actor=user,who=actor?.uid,epoch=accountEpoch;if(!who)return;
 if(flushing.has(who))return flushing.get(who);
 const k='ranked.outbox.'+who;
 const pending=(async()=>{for(const match of storage.get(k,[])){
  if(user?.uid!==who||epoch!==accountEpoch)return;
  try{const result=await call('rankedComplete',match,actor);
   storage.set(k,storage.get(k,[]).filter(x=>x.matchId!==match.matchId));
   if(user?.uid!==who||epoch!==accountEpoch)return;
   profile={...C.initial(),...result.state};profileVerified=true;profileCheckedAt=Date.now();storage.set('ranked.profile.'+who,profile);render();
   if(result.promotion){const rank=C.RANKS[result.promotion.to].id;const claim=await call('rankedClaimPromotion',{rank},actor);if(claim.show&&user?.uid===who&&epoch===accountEpoch)showPromotion(claim.promotion);}
  }catch(e){if(user?.uid===who&&epoch===accountEpoch)status('Result saved on this device; sync pending: '+escapeError(e));break;}
 }})();
 flushing.set(who,pending);try{await pending;}finally{if(flushing.get(who)===pending)flushing.delete(who);}
}
function recordCompletion(match){
 if(testingSortie)return;
 const owner=mode==='ranked'?session?.uid:matchOwner;const bucket=owner||'guest';const progress=storage.get('ranked.local.'+bucket,{totalGames:0,highFlights:0,completed:[]});
 if(progress.completed.includes(match.matchId))return;progress.completed.push(match.matchId);progress.totalGames++;if(match.score>=12000)progress.highFlights++;storage.set('ranked.local.'+bucket,progress);
 if(owner){const k='ranked.outbox.'+owner;const queue=storage.get(k,[]);if(!queue.some(x=>x.matchId===match.matchId))queue.push({...match,mode,completed:true,displayName:leaderboardService.getPlayerNickname()});storage.set(k,queue);if(user?.uid===owner)void flush();}
 render();
}
let ownCursor=null;
async function ownHistory(more){status('Loading flight history…');try{const epoch=accountEpoch,data=await call('rankedHistory',{before:more?ownCursor:null});if(epoch!==accountEpoch)return;ownCursor=data.before;$('rkOwnHistoryPanel').hidden=false;$('rkOwnHistoryMore').hidden=!ownCursor;const host=$('rkOwnHistoryRows');if(!more)host.replaceChildren();for(const m of data.matches){const row=document.createElement('p');row.textContent=`${new Date(m.completedAt).toLocaleString()} · ${m.mode} · ${AIRCRAFT_CONFIGS[m.aircraftIndex]?.name||'Aircraft'} · ${m.score} points · ${m.rankBefore||'—'} → ${m.rankAfter||'—'}`;host.append(row);}if(!host.children.length)host.textContent='No completed flights recorded.';status('History loaded.');}catch(e){status('History unavailable: '+escapeError(e));}}
function showPromotion(p){const from=C.RANKS[p.from]||C.IRON,to=C.RANKS[p.to],host=$('rkPromotion'),stage=$('rkEmblems');stage.getAnimations().forEach(a=>a.cancel());stage.classList.remove('rk-reveal');stage.replaceChildren(image(from),image(to));host.hidden=false;emit('rkPromotionText','Promoted to '+to.name+'!');
 const imgs=stage.querySelectorAll('img'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduce){imgs[0].style.opacity=0;imgs[1].style.opacity=1;return;}
 // Exactly 720 degrees with the old emblem, then a crossfade during the third full turn.
 stage.animate([{transform:'rotate(0deg)'},{transform:'rotate(720deg)',offset:2/3},{transform:'rotate(1080deg)'}],{duration:2400,easing:'linear',fill:'forwards'}).onfinish=()=>stage.classList.add('rk-reveal');
 imgs[0].animate([{opacity:1},{opacity:1,offset:2/3},{opacity:0}],{duration:2400,fill:'forwards'});imgs[1].animate([{opacity:0},{opacity:0,offset:2/3},{opacity:1}],{duration:2400,fill:'forwards'});
}
let matchOwner=null;
const api={get mode(){return mode;},get signedIn(){return !!user;},medal,render,recordCompletion,formationSize:()=>C.formationSize(),start,toNormal,
 unlocked(key){return !!user && profileVerified && (profile.aircraftUnlocks||[]).includes(key);},
 requirement(key){return C.AIRCRAFT_UNLOCKS[key]||null;},
 beforeReset(){if(mode==='ranked'&&!prepared){void start();return false;}prepared=false;matchOwner=user?.uid||null;return true;},afterReset(){if(mode==='ranked'&&session)currentSortieId=session.matchId;},
 pool(){return mode==='ranked'?vocabService.vocabularyList:BUILTIN_IELTS_VOCABULARY;}};
window.Ranked=api;

function mount(){
 const button=document.createElement('button');button.id='rankedButton';button.setAttribute('aria-label','Ranked Game — Rank Season 1');
 const artwork=document.createElement('img');artwork.src='assets/ui/ranked_game_season_1.png';artwork.alt='RANK SEASON 1';artwork.width=2172;artwork.height=724;
 artwork.onerror=()=>{artwork.hidden=true;button.textContent='RANKED GAME — RANK SEASON 1';};
 button.append(artwork);$('startBtn').before(button);button.onclick=open;
 const screen=document.createElement('section');screen.id='rkScreen';screen.className='rk-screen';screen.hidden=true;
 screen.innerHTML=`<div class="rk-panel"><div class="rk-actions"><button id="rkClose">← Main Menu</button></div><h1>Ranked Game</h1><p id="rkIdentity"></p><div id="rkCurrent" class="rk-current"></div><p>Start at Iron. Earn each promotion in order. A high score counts toward only the next rank; ranks cannot be skipped.</p><div id="rkRanks" class="rk-ranks"></div><p id="rkMedals"></p><div id="rkAuth"><h2>Existing Student Name</h2><p id="rkIdentityNotice"></p><a class="rk-link" href="https://vuongtranvt1331-design.github.io/Lexical_Space/">Open LexicalSpace</a><p>There is no separate Ranked registration.</p></div><div class="rk-actions"><button id="rkStart">Start Ranked Match</button><button id="rkReview">Review Ranked Vocabulary</button><button id="rkRefresh">Refresh Vocabulary</button><button id="rkRetry">Sync Pending Results</button><button id="rkOwnHistory">My Flight History</button></div><p id="rkStatus" class="rk-status" role="status"></p><section id="rkOwnHistoryPanel" hidden><h2>My Completed Flights</h2><div id="rkOwnHistoryRows"></div><button id="rkOwnHistoryMore" hidden>Older Flights</button></section><section id="rkVocabulary" hidden><h2>Ranked Vocabulary</h2><p id="rkRevision"></p><label>Search words or meanings<input id="rkSearch" type="search"></label><div id="rkWords"></div></section></div>`;
 document.body.appendChild(screen);
 const promotion=document.createElement('div');promotion.id='rkPromotion';promotion.className='rk-promotion';promotion.hidden=true;promotion.innerHTML='<div><div id="rkEmblems" class="rk-emblems"></div><h2 id="rkPromotionText"></h2><button id="rkPromotionClose">Continue</button></div>';document.body.appendChild(promotion);
 $('rkClose').onclick=()=>{$('rkScreen').hidden=true;};$('rkPromotionClose').onclick=()=>{$('rkPromotion').hidden=true;};
 $('rkOwnHistory').onclick=()=>ownHistory(false);$('rkOwnHistoryMore').onclick=()=>ownHistory(true);
 $('rkStart').onclick=start;$('rkReview').onclick=async()=>{try{await loadVocabulary();$('rkVocabulary').hidden=false;renderVocabulary();}catch(e){status(escapeError(e));}};
 $('rkRefresh').onclick=async()=>{try{await loadVocabulary(true);status('Vocabulary refreshed.');}catch(e){status(escapeError(e));}};
 $('rkSearch').oninput=renderVocabulary;$('rkRetry').onclick=async()=>{await flush();try{await refreshProfile(true);}catch(e){status(escapeError(e));}};

 $('startBtn').addEventListener('click',toNormal,true);

}

mount();
if(!storage.get('ranked.legacyMedal',null)){const count=FlightRewardsManager.getCompletedFlights();storage.set('ranked.legacyMedal',{milestone:count>=30?30:count>=20?20:count>=10?10:0});}
render();
try{
 if(typeof firebase!=='undefined'&&firebase.firestore&&leaderboardService.db&&window.RankedFirestore){
 db=leaderboardService.db;persistence=RankedFirestore.create(db,{documentId:firebase.firestore.FieldPath.documentId()});
 async function applyIdentity(){
 const name=studentName().trim(),effective=name?{uid:'name:'+C.norm(name),displayName:name,studentName:name}:null;
 const changed=user?.uid!==effective?.uid;accountEpoch++;const epoch=accountEpoch;
 if(changed){if(mode==='ranked'&&(gameState==='PLAYING'||gameState==='PAUSED'))returnToSkyMainMenu();session=null;toNormal();profile=C.initial();profileVerified=false;profileCheckedAt=0;profileRequest=null;loadPromise=null;vocab=null;lastLoaded=0;ownCursor=null;$('rkOwnHistoryRows').replaceChildren();$('rkOwnHistoryPanel').hidden=true;$('rkPromotion').hidden=true;}
 user=effective;if(user&&changed)profile={...C.initial(),...storage.get('ranked.profile.'+user.uid,C.initial())};
 try{render();if(user){await refreshProfile();if(epoch===accountEpoch)await flush();}}catch(e){if(epoch===accountEpoch)status('Cloud unavailable; cached progress retained: '+escapeError(e));}
 }
 const syncName=()=>{const name=studentName().trim();if((name||null)!==(user?.studentName||null))void applyIdentity();};
 window.addEventListener('student-name-changed',syncName);window.addEventListener('storage',syncName);
 void applyIdentity();
 }else status('Ranked could not connect to Firestore. Check your internet connection and reload.');
}catch(e){status(escapeError(e));}
window.addEventListener('online',async()=>{await flush();try{await refreshProfile(true);}catch(e){status(escapeError(e));}});
})();

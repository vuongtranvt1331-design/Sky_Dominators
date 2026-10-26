/* Classroom Ranked persistence. Reuses the existing schema and rank rules. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.RankedCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.RankedFirestore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
const identities=new Map();
function error(code,message){return Object.assign(new Error(message),{code});}
async function uidForName(value){
 const name=C.norm(value);if(!name||name.length>80)throw error('invalid-argument','Enter your existing student name (1–80 characters).');
 if(!identities.has(name))identities.set(name,(async()=>{
  if(!globalThis.crypto?.subtle)throw error('unavailable','Open the game over HTTPS or on your local computer.');
  const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(name));
  return 'name_'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 })());
 return identities.get(name);
}
function stateFrom(data){
 const state={...C.initial(),...data};
 if(data?.rank&&C.ALL_RANKS.some(r=>r.id===data.rank))state.rankIndex=C.RANKS.findIndex(r=>r.id===data.rank);
 if(!Number.isInteger(state.rankIndex)||state.rankIndex < -1||state.rankIndex>=C.RANKS.length)state.rankIndex=-1;
 state.rank=(C.RANKS[state.rankIndex]||C.IRON).id;
 return state;
}
function matchId(value){if(typeof value!=='string'||!/^[-_a-zA-Z0-9]{12,100}$/.test(value))throw error('invalid-argument','Invalid match ID');return value;}
function create(db,options={}){
 const now=options.now||(()=>Date.now()),docId=options.documentId||'__name__';
 function allowed(state){return [0,2,3,...C.earnedAircraft(state).map(key=>C.AIRCRAFT_KEYS.indexOf(key))];}
 async function call(method,input={}){
  const uid=await uidForName(input.studentName),displayName=String(input.studentName).trim().slice(0,60);
  const profileRef=db.doc('rankedPlayers/'+uid);
  if(method==='rankedProfile')return db.runTransaction(async tx=>{
   const snap=await tx.get(profileRef),saved=snap.data(),state=stateFrom(saved);
   const changes={rank:state.rank,rankIndex:state.rankIndex,uid,studentId:state.studentId||uid,displayName:state.displayName||displayName,aircraftUnlocks:C.earnedAircraft(state)};
   if(!snap.exists)tx.set(profileRef,{...state,...changes});
   else if(Object.entries(changes).some(([key,value])=>JSON.stringify(saved[key])!==JSON.stringify(value)))tx.set(profileRef,changes,{merge:true});
   return {...state,...changes};
  });
  if(method==='rankedVocabulary'){
   const snap=await db.doc('rankedConfig/vocabulary').get({source:'server'});
   if(!snap.exists)throw error('not-found','No Ranked vocabulary has been published. Ask your teacher to publish a word set.');
   return snap.data();
  }
  if(method==='rankedStart'){
   const id=matchId(input.matchId),ref=db.doc('rankedSessions/'+id);
   return db.runTransaction(async tx=>{
    const [existing,vocab,profile]=await Promise.all([tx.get(ref),tx.get(db.doc('rankedConfig/vocabulary')),tx.get(profileRef)]);
    if(existing.exists){const s=existing.data();if(s.uid!==uid)throw error('permission-denied','This session belongs to another player.');if(s.completedAt)throw error('failed-precondition','This match is already completed.');return s;}
    if(!vocab.exists||vocab.data().revision!==input.revision)throw error('failed-precondition','Vocabulary changed or unavailable. Press Refresh Vocabulary and start again.');
    C.validateVocabulary(vocab.data());
    const allowedAircraft=allowed(stateFrom(profile.data()));
    if(!Number.isInteger(input.aircraftIndex)||!allowedAircraft.includes(input.aircraftIndex))throw error('permission-denied','Select an aircraft you have earned for Ranked.');
    const session={uid,matchId:id,allowedAircraft,mode:'ranked',revision:input.revision,startedAt:now(),completedAt:null};
    tx.set(ref,session);return session;
   });
  }
  if(method==='rankedComplete'){
   const id=matchId(input.matchId),mode=input.mode,score=input.score,targets=input.targetsCleared,aircraft=input.aircraftIndex;
   if(!['normal','ranked'].includes(mode)||!Number.isInteger(score)||score<0||score>999999||!Number.isInteger(targets)||targets<0||!Number.isInteger(aircraft)||aircraft<0||aircraft>8)throw error('invalid-argument','Invalid match result');
   if(input.completed===false||input.abandoned===true)throw error('invalid-argument','Only completed flights can be recorded.');
   const record=profileRef.collection('matches').doc(id),sessionRef=db.doc('rankedSessions/'+id);
   return db.runTransaction(async tx=>{
    const [existing,profile,session]=await Promise.all([tx.get(record),tx.get(profileRef),mode==='ranked'?tx.get(sessionRef):Promise.resolve(null)]);
    if(existing.exists)return {duplicate:true,match:existing.data(),state:stateFrom(profile.data()),promotion:null};
    const at=now(),previous=stateFrom(profile.data());
    if(mode==='ranked'){
     if(!session.exists||session.data().uid!==uid||session.data().completedAt)throw error('permission-denied','No unfinished Ranked session exists for this player.');
     const elapsed=at-session.data().startedAt,maxRows=2+Math.floor(Math.max(0,elapsed)/4000);
     // A ram may clear a row without awarding points; count and score need not be equal.
     if(!session.data().allowedAircraft.includes(aircraft)||elapsed<0||elapsed>24*3600000||score>Math.min(999999,targets*500)||(score!==999999&&score%500!==0)||targets>maxRows)throw error('invalid-argument','Result is inconsistent with match duration or scoring rules.');
    }
    if(!allowed(previous).includes(aircraft))throw error('permission-denied','Testing aircraft cannot submit permanent rewards.');
    const result=C.applyMatch(previous,{matchId:id,score,mode},at);
    const next={...result.state,uid,studentId:previous.studentId||uid,displayName:previous.displayName||displayName,aircraftUnlocks:C.earnedAircraft(result.state)};
    const match={app:'sky-dominators',season:1,outcome:'completed',matchId:id,uid,displayName:next.displayName,mode,score,targetsCleared:targets,aircraftIndex:aircraft,completedAt:at,qualified:result.qualified,rankBefore:previous.rank,rankAfter:next.rank,revision:session?.data()?.revision||null,validation:mode==='ranked'?'classroom-client-session':'legacy-client-score'};
    const promotionRef=profileRef.collection('promotions').doc(next.rank),rankAward=profileRef.collection('achievements').doc('rank_'+next.rank),flightAward=profileRef.collection('achievements').doc('flight_'+next.medalMilestone);
    const [oldPromotion,oldRankAward,oldFlightAward]=await Promise.all([
     result.promotion?tx.get(promotionRef):Promise.resolve(null),
     result.promotion?tx.get(rankAward):Promise.resolve(null),
     next.medalMilestone>previous.medalMilestone?tx.get(flightAward):Promise.resolve(null)
    ]);
    tx.set(record,match);tx.set(profileRef,next,{merge:true});
    if(mode==='ranked')tx.update(sessionRef,{completedAt:at});
    if(result.promotion){
     if(!oldPromotion.exists)tx.set(promotionRef,{...result.promotion,rank:next.rank,shownAt:null});
     if(!oldRankAward.exists)tx.set(rankAward,{app:'sky-dominators',uid,displayName:next.displayName,id:'rank_'+next.rank,type:'rank',rank:next.rank,at,matchId:id});
    }
    if(next.medalMilestone>previous.medalMilestone&&!oldFlightAward.exists)tx.set(flightAward,{app:'sky-dominators',uid,displayName:next.displayName,id:'flight_'+next.medalMilestone,type:'flight',milestone:next.medalMilestone,at,matchId:id});
    return {state:next,match,promotion:result.promotion};
   });
  }
  if(method==='rankedClaimPromotion'){
   if(!C.RANKS.some(r=>r.id===input.rank))throw error('invalid-argument','Unknown rank');
   const ref=profileRef.collection('promotions').doc(input.rank);
   return db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists||snap.data().shownAt)return {show:false};tx.update(ref,{shownAt:now()});return {show:true,promotion:snap.data()};});
  }
  if(method==='rankedHistory'){
   let query=profileRef.collection('matches').orderBy('completedAt','desc').orderBy(docId,'desc');
   if(input.before){if(!Number.isFinite(input.before.at)||typeof input.before.id!=='string')throw error('invalid-argument','Invalid history cursor');query=query.startAfter(input.before.at,input.before.id);}
   const result=await query.limit(50).get({source:'server'}),last=result.docs.at(-1);
   return {matches:result.docs.map(d=>d.data()),before:result.size===50?{at:last.data().completedAt,id:last.id}:null};
  }
  throw error('invalid-argument','Unsupported Ranked operation');
 }
 return {call};
}
return {create,uidForName,stateFrom};
});

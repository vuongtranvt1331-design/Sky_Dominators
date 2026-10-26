(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RankedCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RANKS=Object.freeze([
 {id:'bronze',name:'Bronze',matches:3,score:10000}, {id:'silver',name:'Silver',matches:3,score:20000},
 {id:'gold',name:'Gold',matches:3,score:25000}, {id:'platinum',name:'Platinum',matches:2,score:30000},
 {id:'emerald',name:'Emerald',matches:2,score:35000}, {id:'diamond',name:'Diamond',matches:1,score:45000}
]);
const AIRCRAFT_UNLOCKS=Object.freeze({titan:'silver',phantom_prototype:'gold',viper:'platinum',reaper:'platinum',nightbat:'emerald',chronos:'diamond'});
const AIRCRAFT_KEYS=Object.freeze(['fighter_1','titan','phantom','corsair','phantom_prototype','viper','reaper','nightbat','chronos']);
function earnedAircraft(state){const index=state.rankIndex??RANKS.findIndex(r=>r.id===state.rank);return Array.from(new Set([...(state.aircraftUnlocks||[]),...Object.keys(AIRCRAFT_UNLOCKS).filter(key=>index>=RANKS.findIndex(r=>r.id===AIRCRAFT_UNLOCKS[key]))]));}
const IRON=Object.freeze({id:'iron',name:'Iron',matches:0,score:0});
const ALL_RANKS=Object.freeze([IRON,...RANKS]);
const norm=s=>String(s||'').normalize('NFKC').trim().toLowerCase();
function initial(){return {rank:'iron',rankIndex:-1,progress:0,qualifyingMatchIds:[],totalGames:0,rankedGames:0,bestRankedScore:0,highestScore:0,highestRank:'iron',highestRankIndex:-1,season1:{totalGames:0,rankedGames:0,highestScore:0},highFlights:0,medalMilestone:0,lastMatchAt:null,lastPromotionAt:null};}
// Called only after checking the authoritative match document for idempotency in a transaction.
function applyMatch(previous,match,now){
 if(!match||!Number.isInteger(match.score)||match.score<0||match.score>999999||!['normal','ranked'].includes(match.mode))throw Error('Invalid completed match');
 const s={...initial(),...previous};
 if(previous?.rank && ALL_RANKS.some(r=>r.id===previous.rank))s.rankIndex=RANKS.findIndex(r=>r.id===previous.rank);
 s.rank=(RANKS[s.rankIndex]||IRON).id;
 if(!Number.isInteger(s.rankIndex)||s.rankIndex < -1||s.rankIndex>5)throw Error('Invalid saved rank');
 s.highestRankIndex=Math.max(s.highestRankIndex??-1,s.rankIndex);
 s.totalGames++;s.highestScore=Math.max(s.highestScore||s.bestRankedScore||0,match.score);s.lastMatchAt=now;
 s.season1={totalGames:0,rankedGames:0,highestScore:0,...s.season1};s.season1.totalGames++;s.season1.rankedGames+=match.mode==='ranked'?1:0;s.season1.highestScore=Math.max(s.season1.highestScore,match.score);s.highFlights+=match.score>=12000?1:0;s.medalMilestone=Math.floor(s.highFlights/10)*10;
 let promotion=null,qualified=false;
 if(match.mode==='ranked'){
  s.rankedGames++;s.bestRankedScore=Math.max(s.bestRankedScore,match.score);
  const next=RANKS[s.rankIndex+1];
  if(next&&match.score>=next.score){qualified=true;s.qualifyingMatchIds=[...(s.qualifyingMatchIds||[]),match.matchId];s.progress++;if(s.progress>=next.matches){const old=s.rankIndex;s.rankIndex++;s.rank=RANKS[s.rankIndex].id;s.progress=0;s.lastPromotionAt=now;promotion={from:old,to:s.rankIndex,at:now,matchId:match.matchId,qualifyingMatchIds:s.qualifyingMatchIds};s.qualifyingMatchIds=[];}}
 }
 s.highestRankIndex=Math.max(s.highestRankIndex,s.rankIndex);s.highestRank=(RANKS[s.highestRankIndex]||IRON).id;
 return {state:s,promotion,qualified};
}
function formationSize(value=Math.random()){if(value<0||value>=1)throw Error('Random value outside [0,1)');return value<.30?2:value<.80?3:value<.95?4:5;}
function nextInterval(ms){return Math.max(4000,Math.round(ms)-100);}
function wordId(word){let h=2166136261;for(const c of norm(word)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return 'word_'+(h>>>0).toString(36);}
function validateVocabulary(raw){
 const input=Array.isArray(raw)?raw:raw?.entries;if(!Array.isArray(input)||input.length<5)throw Error('Provide at least five complete vocabulary entries.');
 const words=new Set(),ids=new Set();
 const entries=input.map((v,i)=>{
  if(!v||typeof v!=='object')throw Error('Invalid entry '+(i+1));
  const word=String(v.word||v.term||'').trim(),meaning=String(v.meaning||v.vietnamese||'').trim(),topic=String(v.topic||'Ranked').trim();
  const synonyms=Array.from(new Set((Array.isArray(v.synonyms)?v.synonyms:String(v.synonyms||'').split('|')).map(x=>String(x).trim()).filter(x=>x&&norm(x)!==norm(word))));
  const id=String(v.id||wordId(word));
  if(!word||word.length>120||meaning.length>500||topic.length>100||!synonyms.length||synonyms.length>12||synonyms.some(x=>x.length>120)||!/^[-a-zA-Z0-9_]{1,100}$/.test(id))throw Error('Invalid word, ID, meaning or synonyms at entry '+(i+1));
  if(words.has(norm(word))||ids.has(id))throw Error('Duplicate term or word ID: '+word);words.add(norm(word));ids.add(id);
  return {id,word,meaning,topic,synonyms};
 });
 // Every target must support the largest formation without an unrelated fallback list.
 for(const entry of entries){const forbidden=new Set([entry.word,...entry.synonyms].map(norm)),choices=new Set();
  for(const other of entries){if(forbidden.has(norm(other.word))||other.synonyms.some(x=>forbidden.has(norm(x))))continue;
   other.synonyms.forEach(x=>{if(!forbidden.has(norm(x)))choices.add(norm(x));});}
  if(choices.size<4)throw Error('Not enough distinct distractors for: '+entry.word);
 }
 const bytes=new TextEncoder().encode(JSON.stringify({schemaVersion:1,revision:999999999,updatedAt:Date.now(),entries})).length;
 // Reserve ample room for Firestore field/encoding overhead under its 1 MiB document ceiling.
 if(bytes>750000)throw Error('Vocabulary exceeds the safe 750 KB single-document limit. Reduce the collection; it was not truncated.');
 return {entries,bytes};
}
function parseImport(text){
 text=String(text||'').replace(/^\uFEFF/,'').trim();if(!text)throw Error('Import is empty; current vocabulary is unchanged.');
 if(text[0]==='['||text[0]==='{')return validateVocabulary(JSON.parse(text)).entries;
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<=text.length;i++){const c=text[i]||'\n';if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n')){row.push(cell.trim());cell='';if(c==='\n'){if(row.some(Boolean))rows.push(row);row=[];}}else if(c!=='\r')cell+=c;}
 if(quoted)throw Error('Unclosed CSV quote');const headers=rows.shift()?.map(norm)||[];
 if(!headers.includes('word')||!headers.includes('synonyms'))throw Error('CSV needs word,meaning,synonyms headers; separate synonyms with |.');
 return validateVocabulary(rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]||''])))).entries;
}
function shuffled(entries,random=Math.random){const deck=entries.slice();for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
return {AIRCRAFT_UNLOCKS,AIRCRAFT_KEYS,earnedAircraft,RANKS,IRON,ALL_RANKS,initial,applyMatch,formationSize,nextInterval,validateVocabulary,parseImport,shuffled,norm};
});

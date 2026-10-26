/* Dedicated teacher UI. LexicalSpace's original default app and handlers remain untouched. */
(function () {
'use strict';
const el = id => document.getElementById(id), C = window.RankedCore;
const panel = el('sd-ranked-panel');
const aircraft = ['Fighter 1','Titan','Phantom','CrossHair','Phantom Prototype','Viper','Reaper','NightBat','Chronos'];
let cloud, initialized = false, epoch = 0;
let students = [], studentCursor = null, selected = new Set(), studentRequest = 0;
let detailUid = null, detailRequest = 0, history = [], historyCursor = null, awardCursor = null;
let overviewAt = 0, studentsAt = 0, overviewPending = null;
let draft = [], draftRevision = null, editId = null, draftDirty = false, draftLoaded = false;
const fmt = n => Number(n || 0).toLocaleString('vi-VN');
const when = v => v ? new Date(v).toLocaleString('vi-VN') : 'Chưa ghi nhận';
const rank = id => C.ALL_RANKS.find(r => r.id === id) || C.IRON;
const currentRank = s => rank(s.rank || (C.RANKS[s.rankIndex] || C.IRON).id);
const highestRank = s => rank(s.highestRank || s.rank || (C.RANKS[s.rankIndex] || C.IRON).id);
const text = (id, value) => { el(id).textContent = value; };
function message(id, value, error = false) { text(id, value); el(id).classList.toggle('error', error); }
function errorText(e) {
 if (['functions/unauthenticated','functions/permission-denied','permission-denied'].includes(e.code)) return 'Backend Ranked chưa được cập nhật sang bản dashboard không đăng nhập. Triển khai lại Firebase Functions trong gói mới.';
 if (['functions/unavailable','functions/internal','functions/deadline-exceeded'].includes(e.code)) return 'Ranked chưa kết nối được. Kiểm tra triển khai Firebase hoặc thử lại sau.';
 return e.message || String(e);
}
function paragraph(host, value) { const p = document.createElement('p'); p.textContent = value; host.append(p); }
panel.innerHTML =
 '<header class="top"><div class="brand"><div class="logo">S</div><div><h1>Sky Dominators</h1><div class="muted">Ranked · Season 1 · Theo dõi học sinh và lịch sử thi đấu</div></div></div><button id="sd-refresh" class="btn">↻ Tải lại Ranked</button></header>' +
 '<p id="sd-status" class="sd-state" role="status" aria-live="polite"></p>' +
 '<div id="sd-content">' +
 '<section aria-label="Tổng quan Ranked"><div id="sd-stats" class="sd-stats"></div><div class="panel"><div class="head"><h2>Phân bố hạng</h2><span id="sd-overview-time" class="muted"></span></div><div id="sd-ranks" class="sd-rank-grid"></div><p id="sd-overview-status" class="sd-state" role="status"></p></div><div class="sd-grid"><section class="panel"><h2 class="sd-panel-title">Trận gần đây</h2><div id="sd-recent-matches" class="sd-list"></div></section><section class="panel"><h2 class="sd-panel-title">Thành tích gần đây</h2><div id="sd-recent-awards" class="sd-list"></div></section></div></section>' +
 '<section class="panel"><div class="head"><h2>Hồ sơ Ranked</h2><button id="sd-export" class="btn">Xuất CSV đã chọn / đang lọc</button></div><div class="sd-filters"><label class="sd-search">Tìm trong hồ sơ đã tải<input id="sd-search" type="search" placeholder="Tên học sinh hoặc ID"></label><label>Sắp xếp toàn bộ hồ sơ<select id="sd-sort"><option value="rankIndex">Hạng hiện tại</option><option value="bestRankedScore">Điểm Ranked cao nhất</option><option value="totalGames">Tổng chuyến bay</option><option value="rankedGames">Số trận Ranked</option><option value="lastMatchAt">Hoạt động gần nhất</option></select></label></div><p id="sd-students-status" class="sd-state" role="status"></p><div class="tablewrap"><table><thead><tr><th>Chọn</th><th>Học sinh</th><th>Hạng / cao nhất</th><th>Chuyến bay</th><th>Ranked</th><th>Điểm cao nhất</th><th>Hoạt động cuối</th></tr></thead><tbody id="sd-students"></tbody></table></div><button id="sd-students-more" class="btn" hidden style="margin-top:12px">Tải thêm hồ sơ</button><p class="foot">Tìm kiếm và xuất CSV áp dụng cho các hồ sơ đã tải. Thống kê ở trên tổng hợp toàn bộ hồ sơ Ranked, không đọc từng trận để tính tổng.</p></section>' +
 '<section id="sd-detail" class="panel" hidden><div class="head"><h2 id="sd-detail-name">Chi tiết học sinh</h2><button id="sd-detail-refresh" class="btn">Tải lại hồ sơ</button></div><p id="sd-detail-status" class="sd-state" role="status"></p><dl id="sd-profile" class="sd-profile"></dl><h3>Thành tích đã đạt</h3><div id="sd-awards" class="sd-list"></div><button id="sd-awards-more" class="btn" hidden>Thành tích cũ hơn</button><h3>Lịch sử chuyến bay</h3><div class="sd-filters"><label>Từ ngày<input id="sd-from" type="date"></label><label>Đến ngày<input id="sd-to" type="date"></label><label>Chế độ<select id="sd-mode"><option value="">Tất cả</option><option value="ranked">Ranked</option><option value="normal">Thường</option></select></label><label>Máy bay<select id="sd-aircraft"><option value="">Tất cả</option></select></label><label>Kết quả<select id="sd-outcome"><option value="">Tất cả</option><option value="completed">Hoàn tất</option><option value="legacy">Dữ liệu cũ chưa ghi</option></select></label></div><div class="tablewrap"><table><thead><tr><th>Thời gian</th><th>Chế độ</th><th>Máy bay</th><th>Điểm</th><th>Kết quả</th><th>Hạng trước → sau</th><th>Mục tiêu</th></tr></thead><tbody id="sd-history"></tbody></table></div><button id="sd-history-more" class="btn" hidden style="margin-top:12px">Trận cũ hơn</button><p class="foot">Bộ lọc áp dụng trên lịch sử đã tải. Game sinh tồn không có thống kê thắng/thua, hòa hoặc rating.</p></section>' +
 '<section class="panel"><details id="sd-vocabulary"><summary>Bộ từ vựng Ranked dùng chung</summary><p class="muted">Bộ từ của Sky Dominators, tách biệt với Bulk Fetch từ vựng cá nhân ở tab LexicalSpace.</p><p id="sd-vocab-status" class="sd-state" role="status">Mở mục này để tải bộ từ đã xuất bản.</p><p id="sd-revision" class="muted"></p><div class="actions"><button id="sd-vocab-reload" class="btn">Tải lại bộ đã xuất bản</button><button id="sd-publish" class="btn primary" disabled>Xuất bản bản nháp</button></div><label class="field">Tìm từ trong bản nháp<input id="sd-word-search" type="search"></label><div id="sd-draft" class="sd-draft"></div><div class="sd-editor"><label>Từ tiếng Anh<input id="sd-word" maxlength="120"></label><label>Nghĩa<input id="sd-meaning" maxlength="500"></label><label>Từ đồng nghĩa, phân cách bằng |<input id="sd-synonyms" maxlength="1500"></label></div><div class="actions" style="margin:12px 0"><button id="sd-save-word" class="btn">Thêm / cập nhật từ</button><button id="sd-clear-word" class="btn">Xóa nội dung ô nhập</button><button id="sd-remove-words" class="btn">Bỏ các từ đã chọn khỏi nháp</button></div><label class="field">Nhập JSON hoặc CSV (word,meaning,synonyms)<input id="sd-import-file" type="file" accept=".json,.csv,application/json,text/csv"></label><textarea id="sd-import-text" class="sd-import" rows="5" placeholder="Dán JSON hoặc CSV tại đây"></textarea><button id="sd-import" class="btn" style="margin-top:10px">Kiểm tra và gộp vào bản nháp</button><p class="foot">Thay đổi chỉ có hiệu lực cho học sinh sau khi xuất bản. Không tự ghi sang dữ liệu LexicalSpace.</p></details></section></div>';
aircraft.forEach((name, i) => { const option=document.createElement('option'); option.value=i; option.textContent=name; el('sd-aircraft').append(option); });
function selectTab(which, focus=false) {
 const ranked=which==='ranked';el('lexicalDashboard').hidden=ranked;panel.hidden=!ranked;
 for(const key of ['lexical','ranked']){const active=key===which,tab=el('sd-tab-'+key);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();}
 if(ranked){initialize();if(initialized)void loadDashboard(false);}
 const url=new URL(location.href);url.searchParams.set('tab',which);historyReplace(url);
}
function historyReplace(url){ window.history.replaceState(null,'',url); }
for(const key of ['lexical','ranked']){
 el('sd-tab-'+key).onclick=()=>selectTab(key);
 el('sd-tab-'+key).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();selectTab(e.key==='Home'?'lexical':e.key==='End'?'ranked':key==='lexical'?'ranked':'lexical',true);}};
}
async function call(name, data={}) {
 if(!cloud)throw Error('Firebase chưa sẵn sàng. Tải lại trang khi có mạng.');
 return (await cloud.httpsCallable(name)(data)).data;
}
async function buttonAction(id, fn, target='sd-status'){
 const button=el(id);if(button.disabled)return;button.disabled=true;const ticket=epoch;
 try{await fn();}catch(e){if(ticket===epoch)message(target,errorText(e),true);}finally{button.disabled=false;}
}
function initialize() {
 if(initialized)return;
 try{
  if(!window.firebase?.functions||!C)throw Error('Không tải được Firebase hoặc mô-đun Ranked. Tải lại trang khi có mạng.');
  const config={apiKey:'AIzaSyCABIvQLieIMoY7JaDeUmAA3Iiv4n_Vryc',authDomain:'skydominators.firebaseapp.com',projectId:'skydominators',storageBucket:'skydominators.firebasestorage.app',messagingSenderId:'994077342177',appId:'1:994077342177:web:50a886260c676c406dfaa0'};
  const app=firebase.apps.find(a=>a.name==='skydominators')||firebase.initializeApp(config,'skydominators');
  cloud=firebase.functions(app,'us-central1');initialized=true;epoch++;
  message('sd-status','');
 }catch(e){message('sd-status',errorText(e),true);}
}
el('sd-refresh').onclick=()=>buttonAction('sd-refresh',()=>loadDashboard(true));
async function loadDashboard(force){initialize();if(!initialized)return;await Promise.all([loadOverview(force),loadStudents(false,force)]);}
async function loadOverview(force=false){
 if(overviewPending)return overviewPending;if(!force&&Date.now()-overviewAt<60000)return;const ticket=epoch;
 message('sd-overview-status','Đang tải tổng quan…');
 const pending=(async()=>{try{
  const data=await call('rankedTeacherOverview');if(ticket!==epoch||!initialized)return;overviewAt=Date.now();
  el('sd-stats').replaceChildren();for(const [label,value]of [['Hồ sơ Ranked',data.students],['Hoạt động trong 7 ngày',data.recentStudents],['Chuyến bay hoàn tất',data.flights],['Trận Ranked',data.rankedMatches]]){const card=document.createElement('div');card.className='sd-stat';const title=document.createElement('span'),number=document.createElement('strong');title.textContent=label;number.textContent=fmt(value);card.append(title,number);el('sd-stats').append(card);}
  el('sd-ranks').replaceChildren();for(const r of C.ALL_RANKS){const card=document.createElement('div');card.className='sd-rank-card';const img=document.createElement('img');img.src='assets/ranks/rank_'+r.id+'.png';img.alt=r.name;const label=document.createElement('span'),number=document.createElement('strong');label.textContent=r.name;number.textContent=fmt(data.rankDistribution?.[r.id]);card.append(img,label,number);el('sd-ranks').append(card);}
  for(const [id,rows]of [['sd-recent-matches',data.matches],['sd-recent-awards',data.achievements]]){const host=el(id);host.replaceChildren();for(const r of rows||[])paragraph(host,when(r.completedAt||r.at)+' · '+(r.displayName||r.uid)+' · '+(r.type?awardText(r):(r.mode==='ranked'?'Ranked':'Thường')+' · '+fmt(r.score)+' điểm'));if(!host.children.length)paragraph(host,'Chưa có hoạt động được ghi nhận.');}
  text('sd-overview-time','Cập nhật '+when(data.asOf));message('sd-overview-status','');
 }catch(e){if(ticket===epoch)message('sd-overview-status','Chưa tải được tổng quan; giữ dữ liệu đã tải. '+errorText(e),true);}
 finally{if(overviewPending===pending)overviewPending=null;}})();overviewPending=pending;return pending;
}
function visibleStudents(){const q=C.norm(el('sd-search').value);return students.filter(s=>C.norm((s.displayName||'')+' '+s.uid+' '+(s.studentId||'')).includes(q));}
function drawStudents(){
 const host=el('sd-students');host.replaceChildren();
 for(const s of visibleStudents()){const tr=document.createElement('tr'),choice=document.createElement('td'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.className='sd-check';checkbox.checked=selected.has(s.uid);checkbox.setAttribute('aria-label','Chọn '+(s.displayName||s.uid));checkbox.onchange=()=>checkbox.checked?selected.add(s.uid):selected.delete(s.uid);choice.append(checkbox);tr.append(choice);
  const name=document.createElement('td'),button=document.createElement('button');button.className='sd-name-button';button.textContent=s.displayName||s.uid;button.onclick=()=>loadDetail(s.uid,false);const id=document.createElement('div');id.className='sd-identity';id.textContent=s.studentId||s.uid;name.append(button,id);tr.append(name);
  for(const value of [currentRank(s).name+' / '+highestRank(s).name,fmt(s.totalGames),fmt(s.rankedGames),fmt(s.highestScore??s.bestRankedScore),when(s.lastMatchAt)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}host.append(tr);
 }
 if(!host.children.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.textContent='Không có hồ sơ phù hợp trong dữ liệu đã tải.';tr.append(td);host.append(tr);}
}
async function loadStudents(more=false,force=false){
 if(!initialized)return;if(!more&&!force&&Date.now()-studentsAt<60000)return;const ticket=epoch,request=++studentRequest,sort=el('sd-sort').value;message('sd-students-status','Đang tải hồ sơ…');
 try{const data=await call('rankedTeacherStudents',{sort,cursor:more?studentCursor:null});if(ticket!==epoch||request!==studentRequest||!initialized)return;
  students=more?[...students,...data.students]:data.students;studentCursor=data.cursor;studentsAt=Date.now();el('sd-students-more').hidden=!studentCursor;drawStudents();message('sd-students-status','Đã tải '+fmt(students.length)+' hồ sơ.');
 }catch(e){if(ticket===epoch&&request===studentRequest)message('sd-students-status','Chưa tải được hồ sơ; giữ dữ liệu đã tải. '+errorText(e),true);}
}
el('sd-search').oninput=drawStudents;el('sd-sort').onchange=()=>loadStudents(false,true);
el('sd-students-more').onclick=()=>buttonAction('sd-students-more',()=>loadStudents(true,true),'sd-students-status');
function awardText(a){return a.type==='rank'?'Đã đạt hạng '+rank(a.rank).name:'Huy chương '+fmt(a.milestone)+' chuyến bay đủ điểm';}
function addAward(a){paragraph(el('sd-awards'),awardText(a)+' · '+when(a.at));}
function profileField(label,value){const item=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;item.append(dt,dd);el('sd-profile').append(item);}
async function loadDetail(uid,more=false){
 if(!initialized)return;const ticket=epoch,request=++detailRequest;detailUid=uid;el('sd-detail').hidden=false;message('sd-detail-status','Đang tải hồ sơ và lịch sử…');
 if(!more){history=[];historyCursor=null;awardCursor=null;el('sd-history-more').hidden=true;el('sd-awards-more').hidden=true;el('sd-profile').replaceChildren();el('sd-awards').replaceChildren();el('sd-history').replaceChildren();text('sd-detail-name','Chi tiết học sinh');}
 try{const data=await call('rankedTeacherDetail',{uid,before:more?historyCursor:null});if(ticket!==epoch||request!==detailRequest||detailUid!==uid||!initialized)return;
  history=more?[...history,...data.matches]:data.matches;historyCursor=data.before;el('sd-history-more').hidden=!historyCursor;
  if(!data.profile){message('sd-detail-status','Chưa có hồ sơ cho học sinh này.');return;}
  const s=data.profile;text('sd-detail-name',s.displayName||uid);el('sd-profile').replaceChildren();
  for(const [label,value]of [['Định danh',s.studentId||uid],['Hạng hiện tại',currentRank(s).name],['Hạng cao nhất',highestRank(s).name],['Tổng chuyến bay',fmt(s.totalGames)],['Trận Ranked',fmt(s.rankedGames)],['Điểm cao nhất',fmt(s.highestScore??s.bestRankedScore)],['Hoạt động cuối',when(s.lastMatchAt)],['Season 1 — Ranked',fmt(s.season1?.rankedGames)],['Season 1 — điểm cao nhất',fmt(s.season1?.highestScore)]])profileField(label,value);
  if(!more){awardCursor=data.awardsBefore;el('sd-awards-more').hidden=!awardCursor;el('sd-awards').replaceChildren();const awards=new Map((data.achievements||[]).map(a=>[a.id,a]));for(const p of data.promotions||[])if(!awards.has('rank_'+p.rank))awards.set('rank_'+p.rank,{type:'rank',rank:p.rank,at:p.at});awards.forEach(addAward);
   paragraph(el('sd-awards'),'Legendary Badge: '+(s.hasHeldTop1===true?'Đã đạt':s.hasHeldTop1===false?'Chưa đạt':'Chưa liên kết lịch sử cũ.'));if(s.legacyMedalMilestone)paragraph(el('sd-awards'),'Mốc huy chương cũ đã xác nhận: '+s.legacyMedalMilestone);if(!awards.size)paragraph(el('sd-awards'),'Chưa có sự kiện thành tích được lưu.');
  }drawHistory();message('sd-detail-status','Đã tải '+history.length+' trận. Thành tích lịch sử được giữ độc lập với hạng hiện tại.');
 }catch(e){if(ticket===epoch&&request===detailRequest)message('sd-detail-status',errorText(e),true);}
}
function drawHistory(){
 const from=el('sd-from').value,to=el('sd-to').value,start=from?new Date(from+'T00:00:00').getTime():-Infinity,end=to?new Date(to+'T23:59:59.999').getTime():Infinity,mode=el('sd-mode').value,plane=el('sd-aircraft').value,outcome=el('sd-outcome').value;
 const rows=history.filter(m=>m.completedAt>=start&&m.completedAt<=end&&(!mode||m.mode===mode)&&(!plane||String(m.aircraftIndex)===plane)&&(!outcome||(m.outcome||'legacy')===outcome));
 const host=el('sd-history');host.replaceChildren();for(const m of rows){const tr=document.createElement('tr');for(const value of [when(m.completedAt),m.mode==='ranked'?'Ranked':'Thường',aircraft[m.aircraftIndex]||'Chưa ghi nhận',fmt(m.score),m.outcome==='completed'?'Hoàn tất':'Dữ liệu cũ chưa ghi',(m.rankBefore?rank(m.rankBefore).name:'—')+' → '+(m.rankAfter?rank(m.rankAfter).name:'—'),fmt(m.targetsCleared)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}host.append(tr);}
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.textContent='Không có trận phù hợp trong lịch sử đã tải.';tr.append(td);host.append(tr);}
}
for(const id of ['sd-from','sd-to','sd-mode','sd-aircraft','sd-outcome'])el(id).onchange=drawHistory;
el('sd-detail-refresh').onclick=()=>buttonAction('sd-detail-refresh',()=>loadDetail(detailUid,false),'sd-detail-status');
el('sd-history-more').onclick=()=>buttonAction('sd-history-more',()=>loadDetail(detailUid,true),'sd-detail-status');
el('sd-awards-more').onclick=()=>buttonAction('sd-awards-more',async()=>{const uid=detailUid,ticket=epoch;const data=await call('rankedTeacherAchievements',{uid,before:awardCursor});if(ticket!==epoch||uid!==detailUid)return;awardCursor=data.before;el('sd-awards-more').hidden=!awardCursor;(data.achievements||[]).forEach(addAward);},'sd-detail-status');
el('sd-export').onclick=()=>{if(!initialized)return;const rows=visibleStudents().filter(s=>!selected.size||selected.has(s.uid));const safe=v=>'"'+String(v??'').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';const data=[['Học sinh','ID','Hạng','Hạng cao nhất','Chuyến bay','Trận Ranked','Điểm cao nhất','Hoạt động cuối'],...rows.map(s=>[s.displayName,s.studentId||s.uid,currentRank(s).name,highestRank(s).name,s.totalGames,s.rankedGames,s.highestScore??s.bestRankedScore,when(s.lastMatchAt)])].map(row=>row.map(safe).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+data],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='sky-dominators-students.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function markDraft(){draftDirty=true;drawDraft();message('sd-vocab-status','Bản nháp đã thay đổi; chưa xuất bản cho học sinh.');}
function clearEditor(){editId=null;for(const id of ['sd-word','sd-meaning','sd-synonyms'])el(id).value='';}
function drawDraft(){
 text('sd-revision','Bản đã xuất bản: '+(draftRevision??'chưa tải')+' · '+draft.length+' từ trong nháp'+(draftDirty?' · chưa lưu':''));
 const host=el('sd-draft'),query=C.norm(el('sd-word-search').value);host.replaceChildren();
 for(const word of draft.filter(v=>C.norm(v.word+' '+v.meaning).includes(query))){const row=document.createElement('div');row.className='sd-word';const check=document.createElement('input');check.type='checkbox';check.className='sd-check';check.dataset.wordId=word.id;check.setAttribute('aria-label','Chọn từ '+word.word);const button=document.createElement('button');button.textContent=word.word+' — '+word.meaning;button.onclick=()=>{editId=word.id;el('sd-word').value=word.word;el('sd-meaning').value=word.meaning;el('sd-synonyms').value=word.synonyms.join(' | ');};row.append(check,button);host.append(row);}
 if(!host.children.length)paragraph(host,'Chưa có từ phù hợp trong bản nháp.');
 el('sd-publish').disabled=!initialized||!draftLoaded;
}
async function loadDraft(force=false){
 if(!initialized||(!force&&draftLoaded))return;if(force&&draftDirty&&!confirm('Bỏ thay đổi chưa xuất bản và tải lại bộ từ Ranked?'))return;
 const ticket=epoch;message('sd-vocab-status','Đang tải bộ từ Ranked…');
 try{const data=await call('rankedTeacherVocabulary');if(ticket!==epoch||!initialized)return;
  draft=structuredClone(data.entries);draftRevision=data.revision;draftLoaded=true;draftDirty=false;clearEditor();drawDraft();message('sd-vocab-status',data.revision>0?'Đã tải bộ từ Ranked.':'Chưa có bộ từ Ranked; thêm hoặc nhập dữ liệu để xuất bản.');
 }catch(e){if(ticket===epoch)message('sd-vocab-status','Không tải được bộ từ; giữ nguyên bản nháp. '+errorText(e),true);}
}
el('sd-vocabulary').ontoggle=()=>{if(el('sd-vocabulary').open)void loadDraft();};
el('sd-vocab-reload').onclick=()=>buttonAction('sd-vocab-reload',()=>loadDraft(true),'sd-vocab-status');
el('sd-word-search').oninput=drawDraft;el('sd-clear-word').onclick=clearEditor;
el('sd-save-word').onclick=()=>{try{if(!initialized||!draftLoaded)throw Error('Tải bộ từ đã xuất bản trước khi chỉnh sửa.');const word=el('sd-word').value.trim(),meaning=el('sd-meaning').value.trim(),synonyms=[...new Set(el('sd-synonyms').value.split('|').map(v=>v.trim()).filter(Boolean))];if(!word||word.length>120||!synonyms.length||synonyms.length>12||synonyms.some(v=>v.length>120||C.norm(v)===C.norm(word)))throw Error('Nhập từ và ít nhất một từ đồng nghĩa khác, tối đa 12 từ đồng nghĩa.');if(draft.some(v=>C.norm(v.word)===C.norm(word)&&v.id!==editId))throw Error('Từ này đã có trong bản nháp.');const entry={id:editId||'word_'+crypto.randomUUID(),word,meaning,synonyms,topic:'Ranked'};draft=editId?draft.map(v=>v.id===editId?entry:v):[...draft,entry];clearEditor();markDraft();}catch(e){message('sd-vocab-status',errorText(e),true);}};
el('sd-remove-words').onclick=()=>{if(!initialized||!draftLoaded)return;const ids=[...el('sd-draft').querySelectorAll('input:checked')].map(i=>i.dataset.wordId);if(ids.length&&confirm('Bỏ '+ids.length+' từ khỏi bản nháp Ranked?')){draft=draft.filter(v=>!ids.includes(v.id));if(ids.includes(editId))clearEditor();markDraft();}};
el('sd-import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>1000000)throw Error('Tệp nhập vượt 1 MB.');el('sd-import-text').value=await file.text();}catch(error){message('sd-vocab-status',errorText(error),true);}};
el('sd-import').onclick=()=>{try{if(!initialized||!draftLoaded)throw Error('Tải bộ từ đã xuất bản trước khi nhập.');const incoming=C.parseImport(el('sd-import-text').value),merged=new Map(draft.map(v=>[C.norm(v.word),v]));for(const word of incoming){const old=merged.get(C.norm(word.word));merged.set(C.norm(word.word),{...word,id:old?.id||word.id});}const valid=C.validateVocabulary([...merged.values()]);draft=valid.entries;markDraft();}catch(e){message('sd-vocab-status','Nội dung nhập bị từ chối; bản nháp được giữ nguyên. '+errorText(e),true);}};
el('sd-publish').onclick=()=>buttonAction('sd-publish',async()=>{
 if(!initialized||!draftLoaded)throw Error('Bộ từ chưa sẵn sàng.');const valid=C.validateVocabulary(draft);if(!confirm('Xuất bản '+valid.entries.length+' từ Ranked cho tất cả học sinh?'))return;
 const ticket=epoch,result=await call('rankedPublishVocabulary',{entries:valid.entries,expectedRevision:draftRevision});if(ticket!==epoch||!initialized)return;
 draft=structuredClone(result.entries);draftRevision=result.revision;draftDirty=false;drawDraft();message('sd-vocab-status','Đã xuất bản phiên bản '+result.revision+'. Học sinh nhận bộ mới khi tải lại Ranked.');
},'sd-vocab-status');
selectTab(new URLSearchParams(location.search).get('tab')==='ranked'?'ranked':'lexical');
})();

/* Round 36: modular carrier, one shared HP pool, and no independent timers. */
(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.SkyFortress=api;})(globalThis,function(){
'use strict';
const MODEL={
  "art": {
    "hull": {
      "file": "assets/bosses/sky_fortress/sky_fortress_hull.png",
      "size": [
        256,
        256
      ],
      "anchor": [
        128,
        128
      ],
      "bounds": [
        44,
        8,
        212,
        248
      ]
    },
    "rotor_1": {
      "file": "assets/bosses/sky_fortress/sky_fortress_rotor_1.png",
      "size": [
        64,
        64
      ],
      "anchor": [
        32,
        35
      ],
      "bounds": [
        5,
        7,
        59,
        57
      ]
    },
    "rotor_2": {
      "file": "assets/bosses/sky_fortress/sky_fortress_rotor_2.png",
      "size": [
        64,
        64
      ],
      "anchor": [
        32,
        35
      ],
      "bounds": [
        5,
        7,
        59,
        57
      ]
    },
    "rotor_3": {
      "file": "assets/bosses/sky_fortress/sky_fortress_rotor_3.png",
      "size": [
        64,
        64
      ],
      "anchor": [
        32,
        35
      ],
      "bounds": [
        5,
        7,
        59,
        57
      ]
    },
    "rotor_4": {
      "file": "assets/bosses/sky_fortress/sky_fortress_rotor_4.png",
      "size": [
        64,
        64
      ],
      "anchor": [
        32,
        35
      ],
      "bounds": [
        5,
        7,
        59,
        57
      ]
    },
    "turret": {
      "file": "assets/bosses/sky_fortress/sky_fortress_turret.png",
      "size": [
        40,
        48
      ],
      "anchor": [
        20,
        32
      ],
      "bounds": [
        5,
        2,
        35,
        46
      ]
    },
    "turret_destroyed": {
      "file": "assets/bosses/sky_fortress/sky_fortress_turret_destroyed.png",
      "size": [
        40,
        48
      ],
      "anchor": [
        20,
        32
      ],
      "bounds": [
        5,
        2,
        35,
        46
      ]
    },
    "weakpoint": {
      "file": "assets/bosses/sky_fortress/sky_fortress_weakpoint.png",
      "size": [
        40,
        40
      ],
      "anchor": [
        20,
        20
      ],
      "bounds": [
        2,
        3,
        38,
        37
      ]
    },
    "weakpoint_damaged": {
      "file": "assets/bosses/sky_fortress/sky_fortress_weakpoint_damaged.png",
      "size": [
        40,
        40
      ],
      "anchor": [
        20,
        20
      ],
      "bounds": [
        2,
        3,
        38,
        37
      ]
    },
    "launch_bay": {
      "file": "assets/bosses/sky_fortress/sky_fortress_launch_bay.png",
      "size": [
        48,
        56
      ],
      "anchor": [
        24,
        28
      ],
      "bounds": [
        4,
        2,
        44,
        54
      ]
    },
    "drone": {
      "file": "assets/bosses/sky_fortress/sky_fortress_drone.png",
      "size": [
        32,
        40
      ],
      "anchor": [
        16,
        20
      ],
      "bounds": [
        2,
        3,
        30,
        37
      ]
    },
    "drone_damaged": {
      "file": "assets/bosses/sky_fortress/sky_fortress_drone_damaged.png",
      "size": [
        32,
        40
      ],
      "anchor": [
        16,
        20
      ],
      "bounds": [
        2,
        3,
        30,
        37
      ]
    },
    "missile": {
      "file": "assets/bosses/sky_fortress/sky_fortress_missile.png",
      "size": [
        12,
        32
      ],
      "anchor": [
        6,
        16
      ],
      "bounds": [
        3,
        2,
        9,
        29
      ]
    },
    "rotor_destroyed": {
      "file": "assets/bosses/sky_fortress/sky_fortress_rotor_destroyed.png",
      "size": [
        64,
        64
      ],
      "anchor": [
        32,
        35
      ],
      "bounds": [
        5,
        7,
        59,
        57
      ]
    },
    "engine_effect": {
      "file": "assets/bosses/sky_fortress/sky_fortress_engine_effect.png",
      "size": [
        24,
        40
      ],
      "anchor": [
        12,
        2
      ],
      "bounds": [
        4,
        2,
        20,
        37
      ]
    },
    "explosion": {
      "file": "assets/bosses/sky_fortress/sky_fortress_explosion.png",
      "size": [
        64,
        64
      ],
      "anchor": [
        32,
        32
      ],
      "bounds": [
        3,
        3,
        61,
        61
      ]
    }
  },
  "instances": [
    {
      "id": "rotor_1",
      "file": "sky_fortress_rotor_1.png",
      "top_left": [
        27,
        35
      ],
      "attachment": [
        59,
        70
      ],
      "replacement": "sky_fortress_rotor_destroyed.png"
    },
    {
      "id": "rotor_2",
      "file": "sky_fortress_rotor_2.png",
      "top_left": [
        164,
        35
      ],
      "attachment": [
        196,
        70
      ],
      "replacement": "sky_fortress_rotor_destroyed.png"
    },
    {
      "id": "rotor_3",
      "file": "sky_fortress_rotor_3.png",
      "top_left": [
        21,
        145
      ],
      "attachment": [
        53,
        180
      ],
      "replacement": "sky_fortress_rotor_destroyed.png"
    },
    {
      "id": "rotor_4",
      "file": "sky_fortress_rotor_4.png",
      "top_left": [
        171,
        145
      ],
      "attachment": [
        203,
        180
      ],
      "replacement": "sky_fortress_rotor_destroyed.png"
    },
    {
      "id": "turret_1",
      "file": "sky_fortress_turret.png",
      "top_left": [
        76,
        94
      ],
      "attachment": [
        96,
        126
      ],
      "replacement": "sky_fortress_turret_destroyed.png"
    },
    {
      "id": "turret_2",
      "file": "sky_fortress_turret.png",
      "top_left": [
        140,
        94
      ],
      "attachment": [
        160,
        126
      ],
      "replacement": "sky_fortress_turret_destroyed.png"
    },
    {
      "id": "weakpoint",
      "file": "sky_fortress_weakpoint.png",
      "top_left": [
        108,
        134
      ],
      "attachment": [
        128,
        154
      ],
      "replacement": "sky_fortress_weakpoint_damaged.png"
    },
    {
      "id": "launch_bay",
      "file": "sky_fortress_launch_bay.png",
      "top_left": [
        104,
        179
      ],
      "attachment": [
        128,
        207
      ]
    }
  ]
}
;
const CONFIG=Object.freeze({intro:2000,laneWarning:1250,laneGap:450,lanePeriod:5200,droneDeployGap:450,droneDeployTime:650,droneShotGap:1200,droneTurnRate:.38,droneSpeed:175,componentHits:3,turretPeriod:2400,coreFailureEnd:650,collapseStart:2900,detonationStart:4400,defeatEnd:6300,victoryHold:800});
const PHASE=Object.freeze({LANES:'lanes',DRONES:'drones',ROTORS:'rotors',TURRETS:'turrets',CORE:'core',FAILURE:'core_failure',CHAIN:'chain_explosions',COLLAPSE:'collapse',DETONATION:'detonation',FINISHED:'finished'});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=t=>1-Math.pow(1-clamp(t,0,1),3);
const assetKey=file=>file.replace('sky_fortress_','').replace('.png','');
class Encounter{
 constructor(d,segmentBox){
  this.d=d;this.segmentBox=segmentBox;this.b=d.boss;this.phaseAge=0;this.age=0;this.defeatAge=0;this.fx=[];this.seenProjectiles=new Set();this.transitions=[];this.volley=0;this.droneCursor=0;this.droneClock=0;this.turretClock=0;this.laneClock=CONFIG.lanePeriod-650;this.finalAttack=null;this.defeatEvents=0;
  this.components=MODEL.instances.filter(x=>/^(rotor|turret)_/.test(x.id)).map(i=>({...i,artKey:assetKey(i.file),kind:i.id.startsWith('rotor')?'rotor':'turret',hp:CONFIG.componentHits,active:true,angle:0,hitFlash:0,ownerBoss:this.b}));
  this.core={id:'core',kind:'core',artKey:'weakpoint',attachment:MODEL.instances.find(i=>i.id==='weakpoint').attachment,hp:100,active:false,angle:0,hitFlash:0,ownerBoss:this.b};
  this.b.carrierPhase=PHASE.LANES;this.b.remainingDrones=5;this.b.defeatComplete=false;this.drones=[];this.updateGeometry();
  // Positions derive from the actual deck and modular attachment layout.
  const points=[[128,52],[128,98],[164,119],[128,210],...this.components.map(c=>c.attachment),this.core.attachment,[112,183],[143,75],[128,135]];
  this.explosionPlan=points.map((p,i)=>({at:650+i*245,point:p,size:44+(i%3)*18}));
 }
 get state(){return this.b.carrierPhase;}
 get remainingDrones(){return this.drones.filter(x=>x.hp>0).length;}
 setPhase(next){
  if(this.state===next)return;this.b.carrierPhase=next;this.phaseAge=0;this.transitions.push(next);this.clearAttacks();
  if(next===PHASE.DRONES){this.droneClock=0;this.droneCursor=0;this.drones=Array.from({length:5},(_,i)=>({id:'drone_'+i,kind:'drone',artKey:'drone',index:i,hp:3,active:false,deployed:false,angle:Math.PI,hitFlash:0,spawnAt:i*CONFIG.droneDeployGap,ownerBoss:this.b}));this.b.remainingDrones=5;}
  if(next===PHASE.CORE){this.core.active=true;this.core.hp=this.b.hp;this.fx.push({kind:'activation',age:0,life:900,point:this.core.attachment,size:80});}
 }
 clearAttacks(){this.d.shots=[];this.d.warnings=[];this.d.burst=[];}
 updateGeometry(){
  const {w,h,player}=this.d.h.context(),b=this.b,layout=this.d.h.layout?.()||{},pixel=layout.unitsPerPixel||1;
  this.hudFont=Math.max(12,9*pixel);this.phaseFont=Math.max(11,8*pixel);
  this.hudY=Math.max(140,(layout.hudBottom||126)+this.hudFont+4*pixel);
  this.phaseY=this.hudY+Math.max(33,20+this.phaseFont);const deckTop=this.phaseY+8*pixel;
  const available=(layout.controlsTop||h-100)-deckTop-12*pixel;
  this.baseScale=Math.max(.3,Math.min(1.25,(w-48)/256,h*.34/256,available/330));let shrink=1;
  if(this.d.phase==='defeat'){
   if(this.defeatAge>=CONFIG.detonationStart)shrink=.04+.80*(1-ease((this.defeatAge-CONFIG.detonationStart)/1500));
   else if(this.defeatAge>=CONFIG.collapseStart)shrink=1-.16*ease((this.defeatAge-CONFIG.collapseStart)/(CONFIG.detonationStart-CONFIG.collapseStart));
  }
  this.scale=this.baseScale*shrink;
  const restY=deckTop+128*this.baseScale;
  b.x=this.d.phase==='defeat'?this.defeatX+Math.sin(this.defeatAge*.067)*3:w/2+Math.sin(this.age/2300)*Math.min(18,w*.035);
  b.y=this.d.phase==='intro'?restY-(restY+128*this.scale)*(1-ease(this.d.elapsed/CONFIG.intro)):restY;
  b.artKey='hull';b.angle=0;b.scale=this.scale;this.setBox(b);
  for(const c of this.components){Object.assign(c,this.world(c.attachment));c.scale=this.scale;if(c.active){if(c.kind==='rotor')c.angle=this.age/85*(c.id==='rotor_2'||c.id==='rotor_4'?-1:1);else c.angle=Math.atan2(player.y-c.y,player.x-c.x)+Math.PI/2;}this.setBox(c);}
  this.core.artKey=b.hp<45?'weakpoint_damaged':'weakpoint';Object.assign(this.core,this.world(this.core.attachment));this.core.scale=this.scale;this.core.hp=b.hp;this.setBox(this.core);
 }
 world(point){return{x:this.b.x+(point[0]-128)*this.scale,y:this.b.y+(point[1]-128)*this.scale};}
 setBox(t){const a=MODEL.art[t.artKey],q=a.bounds,s=t.scale,c=Math.cos(t.angle),n=Math.sin(t.angle),dx=((q[0]+q[2])/2-a.anchor[0])*s,dy=((q[1]+q[3])/2-a.anchor[1])*s,w=(q[2]-q[0])*s,h=(q[3]-q[1])*s;t.width=w;t.height=h;t.fortressVisualBox={x:t.x+dx*c-dy*n,y:t.y+dx*n+dy*c,w:Math.abs(c)*w+Math.abs(n)*h,h:Math.abs(n)*w+Math.abs(c)*h};}
 targets(){
  if(this.d.phase!=='fight')return[];
  if(this.state===PHASE.LANES)return[this.b];
  if(this.state===PHASE.DRONES)return this.drones.filter(x=>x.active&&x.hp>0);
  if(this.state===PHASE.ROTORS)return this.components.filter(c=>c.kind==='rotor'&&c.active);
  if(this.state===PHASE.TURRETS)return this.components.filter(c=>c.kind==='turret'&&c.active);
  if(this.state===PHASE.CORE)return this.core.active?[this.core]:[];
  return[];
 }
 intersects(p,t){
  const a=MODEL.art[t.artKey],q=a.bounds,s=t.scale,c=Math.cos(t.angle),n=Math.sin(t.angle);
  const local=(x,y)=>({x:((x-t.x)*c+(y-t.y)*n)/s,y:(-(x-t.x)*n+(y-t.y)*c)/s});
  const from=local(p.prevX??p.x,p.prevY??p.y),to=local(p.x,p.y);
  return this.segmentBox(from.x,from.y,to.x,to.y,(q[0]+q[2])/2-a.anchor[0],(q[1]+q[3])/2-a.anchor[1],(q[2]-q[0])/2,(q[3]-q[1])/2);
 }
 hit(a){
  const p=a?.projectile,t=a?.target;if(this.d.phase!=='fight'||!a?.collision||!p?.active||!p.attackId||this.seenProjectiles.has(p.attackId)||!this.targets().includes(t)||!this.d.h.validAttack(a)||!this.intersects(p,t))return false;
  const base=a.kind==='bomber'?20:a.kind==='phantom'?30:a.damage;if(!Number.isFinite(base)||base<=0)return false;
  const shared=t===this.b||t===this.core;
  // Existing Phantom once-per-activation damage applies to the shared boss pool.
  // Drone/component armor instead counts distinct valid projectiles, exactly one hit each.
  if(shared&&this.d.seen.has(a.token)){p.active=false;this.seenProjectiles.add(p.attackId);return false;}
  this.seenProjectiles.add(p.attackId);p.active=false;t.hitFlash=90;this.d.h.impact?.(t,a);
  if(shared){
   this.d.seen.add(a.token);const damage=base*(this.d.h.damageMultiplier?.(this.b,a)??1),floor=t===this.core?0:300;
   if(!Number.isFinite(damage)||damage<=0)return false;
   this.b.hp=Math.max(floor,this.b.hp-damage);this.core.hp=this.b.hp;
   if(t===this.b&&this.b.hp===300){this.setPhase(PHASE.DRONES);this.updateDrones(0);}
   if(t===this.core&&this.b.hp===0)this.beginDefeat(a);
  }else{
   t.hp=Math.max(0,t.hp-1);if(t.kind==='drone'&&t.hp>0){t.artKey=t.hp<3?'drone_damaged':'drone';this.setBox(t);}
   if(t.hp===0){t.active=false;t.destroyed=true;t.destroyedAngle=t.angle;this.d.shots=this.d.shots.filter(s=>s.sourceId!==t.id);this.d.burst=this.d.burst.filter(s=>s.sourceId!==t.id);this.d.h.localExplosion?.(t,a);
    if(t.kind==='drone'){this.b.hp=Math.max(100,this.b.hp-40);this.b.remainingDrones=this.remainingDrones;if(this.remainingDrones===0&&this.b.hp===100)this.setPhase(PHASE.ROTORS);}
    else if(t.kind==='rotor'&&!this.components.some(c=>c.kind==='rotor'&&c.active))this.setPhase(PHASE.TURRETS);
    else if(t.kind==='turret'&&!this.components.some(c=>c.kind==='turret'&&c.active))this.setPhase(PHASE.CORE);
   }
  }
  return true;
 }
 processPlayerShots(){
  for(const p of this.d.h.context().bullets){if(!p.active)continue;const targets=this.targets();if(!targets.length)return;
   const possible=targets.filter(t=>this.intersects(p,t));if(!possible.length)continue;
   possible.sort((a,b)=>Math.hypot(a.x-(p.prevX??p.x),a.y-(p.prevY??p.y))-Math.hypot(b.x-(p.prevX??p.x),b.y-(p.prevY??p.y)));
   const kind=p.bomberSpecial?'bomber':p.isSpecial?'phantom':'normal',token=kind==='phantom'?'phantom:'+p.skillGeneration:p.attackId;
   this.hit({kind,token,damage:p.damage,collision:true,projectile:p,skinId:p.skinId,target:possible[0]});
   if(this.d.phase!=='fight')return;
  }
 }
 queueLaneVolley(){const {w}=this.d.h.context();for(let i=0;i<3;i++)this.d.warnings.push({lane:i,targetX:w*[.2,.5,.8][i],age:-i*CONFIG.laneGap,duration:CONFIG.laneWarning});this.volley++;}
 launchMissile(x,y,angle,guided,sourceId){this.d.shots.push({kind:'missile',x,y,px:x,py:y,angle,speed:guided?CONFIG.droneSpeed:205,vx:Math.cos(angle)*(guided?CONFIG.droneSpeed:205),vy:Math.sin(angle)*(guided?CONFIG.droneSpeed:205),guided,sourceId,age:0});this.d.h.launch?.();}
 updateDrones(dt){
  const {w,h}=this.d.h.context(),origin=this.world(MODEL.instances.find(i=>i.id==='launch_bay').attachment);
  for(const drone of this.drones){if(drone.hp<=0)continue;const t=(this.phaseAge-drone.spawnAt)/CONFIG.droneDeployTime;if(t<0)continue;drone.active=true;drone.deployed=t>=1;const endX=w*(drone.index+1)/6,endY=Math.min(h-100,this.b.y+256*this.baseScale*.61);drone.x=origin.x+(endX-origin.x)*ease(t);drone.y=origin.y+(endY-origin.y)*ease(t);if(drone.deployed)drone.x+=Math.sin((this.age+drone.index*300)/700)*7;drone.scale=this.baseScale;drone.angle=Math.PI;this.setBox(drone);}
  this.droneClock+=dt;
  while(this.droneClock>=CONFIG.droneShotGap){this.droneClock-=CONFIG.droneShotGap;for(let n=0;n<5;n++){const index=(this.droneCursor+n)%5,drone=this.drones[index];if(!drone.active||!drone.deployed)continue;const {player}=this.d.h.context();this.launchMissile(drone.x,drone.y+drone.height*.45,Math.atan2(player.y-drone.y,player.x-drone.x),true,drone.id);this.droneCursor=(index+1)%5;break;}}
 }
 updateWeapons(dt){
  const {player,h}=this.d.h.context();
  for(let i=0;i<this.d.warnings.length;){const warning=this.d.warnings[i];warning.age+=dt;if(warning.age>=warning.duration){const q=this.world(MODEL.instances.find(x=>x.id==='launch_bay').attachment);this.launchMissile(q.x,q.y,Math.atan2(h+40-q.y,warning.targetX-q.x),false,'carrier');this.d.warnings.splice(i,1);}else i++;}
  if(this.state===PHASE.LANES){this.laneClock+=dt;if(this.laneClock>=CONFIG.lanePeriod){this.laneClock-=CONFIG.lanePeriod;this.queueLaneVolley();}}
  if(this.state===PHASE.ROTORS||this.state===PHASE.TURRETS){this.turretClock+=dt;if(this.turretClock>=CONFIG.turretPeriod){this.turretClock-=CONFIG.turretPeriod;this.components.filter(c=>c.kind==='turret'&&c.active).forEach((c,i)=>this.d.burst.push({sourceId:c.id,delay:i*220}));}}
  for(let i=0;i<this.d.burst.length;){const shot=this.d.burst[i];shot.delay-=dt;if(shot.delay<=0){const gun=this.components.find(c=>c.id===shot.sourceId&&c.active);if(gun){const angle=Math.atan2(player.y-gun.y,player.x-gun.x),x=gun.x+Math.cos(angle)*gun.height*.55,y=gun.y+Math.sin(angle)*gun.height*.55;for(const spread of[-.17,0,.17])this.d.shots.push({kind:'bullet',x,y,px:x,py:y,vx:Math.cos(angle+spread)*180,vy:Math.sin(angle+spread)*180,angle:angle+spread,age:0,sourceId:gun.id});this.d.h.gun?.();}this.d.burst.splice(i,1);}else i++;}
 }
 updateEnemyShots(dt){
  const {w,h,player}=this.d.h.context();for(let i=this.d.shots.length-1;i>=0;i--){const p=this.d.shots[i];p.px=p.x;p.py=p.y;
   if(p.guided){const desired=Math.atan2(player.y-p.y,player.x-p.x),delta=Math.atan2(Math.sin(desired-p.angle),Math.cos(desired-p.angle)),turn=CONFIG.droneTurnRate*dt/1000;p.angle+=clamp(delta,-turn,turn);p.vx=Math.cos(p.angle)*p.speed;p.vy=Math.sin(p.angle)*p.speed;}
   p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.age+=dt;
   if(this.segmentBox(p.px,p.py,p.x,p.y,player.x,player.y,player.hitboxWidth*.39,player.hitboxHeight*.325)){this.d.shots.splice(i,1);this.d.h.playerHit?.(p);if(this.d.fortress!==this||this.d.phase!=='fight')return;}
   else if(p.age>9000||p.x<-60||p.x>w+60||p.y<-80||p.y>h+80)this.d.shots.splice(i,1);
  }
 }
 beginDefeat(attack){
  if(this.d.phase==='defeat'||this.b.defeatComplete)return;this.finalAttack=attack;this.d.phase='defeat';this.defeatAge=0;this.defeatX=this.b.x;this.b.active=false;this.core.active=false;this.b.carrierPhase=PHASE.FAILURE;this.clearAttacks();for(const drone of this.drones)drone.active=false;
 }
 updateDefeat(dt){
  this.defeatAge+=dt;this.updateGeometry();
  while(this.defeatEvents<this.explosionPlan.length&&this.explosionPlan[this.defeatEvents].at<=this.defeatAge){const e=this.explosionPlan[this.defeatEvents++];this.fx.push({kind:'burst',age:this.defeatAge-e.at,life:800,point:e.point,size:e.size});this.d.h.cinematicExplosion?.(this.world(e.point),false);}
  if(this.defeatAge>=CONFIG.detonationStart){if(!this.finalBurst){this.finalBurst=true;this.d.h.cinematicExplosion?.({x:this.b.x,y:this.b.y},true);}this.b.carrierPhase=PHASE.DETONATION;}
  else if(this.defeatAge>=CONFIG.collapseStart)this.b.carrierPhase=PHASE.COLLAPSE;
  else if(this.defeatAge>=CONFIG.coreFailureEnd)this.b.carrierPhase=PHASE.CHAIN;
  if(this.defeatAge>=CONFIG.defeatEnd&&!this.b.defeatComplete){
   this.b.defeatComplete=true;this.b.carrierPhase=PHASE.FINISHED;this.clearAttacks();this.fx=[];this.drones=[];this.d.phase='victory';this.d.elapsed=0;
   if(!this.d.completed.has(3)){this.d.completed.add(3);this.d.h.victory?.(this.b,this.d.runId+':boss:3',this.finalAttack);}
  }
 }
 step(dt){
  this.age+=dt;this.d.elapsed+=dt;this.b.age=this.age;this.phaseAge+=dt;this.b.hitFlash=Math.max(0,(this.b.hitFlash||0)-dt);
  for(const t of [...this.components,...this.drones,this.core])t.hitFlash=Math.max(0,t.hitFlash-dt);
  for(const f of this.fx)f.age+=dt;this.fx=this.fx.filter(f=>f.age<f.life);
  if(this.d.phase==='intro'){this.updateGeometry();if(this.d.elapsed>=CONFIG.intro){this.d.phase='fight';this.d.elapsed=0;this.phaseAge=0;}return;}
  if(this.d.phase==='defeat'){this.updateDefeat(dt);return;}
  if(this.d.phase==='victory'){if(this.d.elapsed>=CONFIG.victoryHold){this.clearAttacks();this.components=[];this.drones=[];this.fx=[];this.d.phase='regular';this.d.boss=null;this.d.fortress=null;this.d.h.resume?.();}return;}
  this.updateGeometry();if(this.state===PHASE.DRONES)this.updateDrones(dt);this.updateWeapons(dt);this.processPlayerShots();if(this.d.phase==='fight')this.updateEnemyShots(dt);
 }
 update(dt){let left=Math.max(0,Number.isFinite(dt)?dt:0);if(!left){this.step(0);return;}while(left>0&&this.d.fortress===this){const slice=Math.min(left,25);this.step(slice);left-=slice;}}
 drawPart(ctx,art,target,key=target.artKey,alpha=1){const a=MODEL.art[key];ctx.save();ctx.translate(target.x,target.y);ctx.rotate(target.angle);ctx.scale(target.scale,target.scale);ctx.globalAlpha*=alpha;if(target.hitFlash)ctx.globalAlpha*=.6;art(ctx,a.file,a.size[0]/2-a.anchor[0],a.size[1]/2-a.anchor[1],a.size[0],a.size[1]);ctx.restore();}
 drawGlow(ctx,target,color){const q=target.fortressVisualBox;ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=.65+.3*Math.sin(this.age/130);ctx.lineWidth=2;ctx.strokeRect(q.x-q.w/2-3,q.y-q.h/2-3,q.w+6,q.h+6);ctx.restore();}
 draw(ctx,art){
  const b=this.b,{w,h}=this.d.h.context();ctx.save();ctx.imageSmoothingEnabled=false;
  for(const warning of this.d.warnings){if(warning.age<0)continue;const q=this.world(MODEL.instances.find(i=>i.id==='launch_bay').attachment);ctx.save();ctx.strokeStyle='#fb4545';ctx.globalAlpha=.12+.18*Math.abs(Math.sin(warning.age/100));ctx.lineWidth=w*.07;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(warning.targetX,h);ctx.stroke();ctx.globalAlpha=.8;ctx.lineWidth=2;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(warning.targetX,h);ctx.stroke();ctx.restore();}
  const visible=this.d.phase!=='victory'&&this.defeatAge<CONFIG.detonationStart+1500;
  if(visible){const alpha=this.d.phase==='defeat'&&this.defeatAge>=CONFIG.detonationStart?1-ease((this.defeatAge-CONFIG.detonationStart)/1500):1;
   this.drawPart(ctx,art,b,'hull',alpha);
   for(const c of this.components){if(c.kind==='rotor'&&c.active){const q={...c,x:c.x,y:c.y+9*this.scale,angle:0,artKey:'engine_effect',scale:this.scale*(.72+.1*Math.sin(this.age/75))};this.drawPart(ctx,art,q,'engine_effect',alpha*.75);}this.drawPart(ctx,art,c,c.active?c.artKey:c.kind+'_destroyed',alpha);}
   const bay=MODEL.instances.find(i=>i.id==='launch_bay'),q={...this.world(bay.attachment),artKey:'launch_bay',scale:this.scale,angle:0};this.drawPart(ctx,art,q,'launch_bay',alpha);
   this.drawPart(ctx,art,this.core,b.hp<45?'weakpoint_damaged':'weakpoint',alpha*(this.core.active?1:.4));
   if(this.core.active||this.d.phase==='defeat'){const box=this.core.fortressVisualBox;ctx.save();ctx.strokeStyle='#b8ffde';ctx.lineWidth=3;ctx.globalAlpha=this.d.phase==='defeat'?(Math.floor(this.defeatAge/65)%2?.95:.1):.55+.4*Math.sin(this.age/100);ctx.strokeRect(box.x-box.w*.6,box.y-box.h*.6,box.w*1.2,box.h*1.2);ctx.restore();}
   for(const t of this.targets())if(t!==b&&t.kind!=='drone')this.drawGlow(ctx,t,t.kind==='core'?'#8bffcb':'#ffc763');
  }
  for(const drone of this.drones)if(drone.active)this.drawPart(ctx,art,drone,drone.hp<3?'drone_damaged':'drone');
  for(const f of this.fx){const q=this.world(f.point),t=f.age/f.life;ctx.save();ctx.globalAlpha=(1-t)*(f.kind==='activation'?.65:1);if(f.kind==='activation'){ctx.strokeStyle='#a7ffdc';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,f.size*this.scale*(.3+t),0,Math.PI*2);ctx.stroke();}else art(ctx,MODEL.art.explosion.file,q.x,q.y,f.size*this.scale*(.55+1.05*ease(t)),f.size*this.scale*(.55+1.05*ease(t)));ctx.restore();}
  for(const p of this.d.shots){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+Math.PI/2);art(ctx,p.kind==='missile'?MODEL.art.missile.file:'assets/bosses/boss2/projectiles/boss01_gun_projectile.png',0,0,p.kind==='missile'?12:9,p.kind==='missile'?32:20);ctx.restore();}
  if(this.d.phase==='defeat'&&this.defeatAge>=CONFIG.detonationStart){const t=(this.defeatAge-CONFIG.detonationStart)/1800,size=256*this.baseScale*(.65+1.15*ease(t));ctx.save();ctx.globalAlpha=clamp(1-t,0,1);art(ctx,MODEL.art.explosion.file,b.x,b.y,size,size);ctx.strokeStyle='#fff0bf';ctx.lineWidth=8*(1-t);ctx.beginPath();ctx.arc(b.x,b.y,size*.47,0,Math.PI*2);ctx.stroke();if(t<.16){ctx.globalAlpha=(1-t/.16)*.45;ctx.fillStyle='#fff2cd';ctx.fillRect(0,0,w,h);}ctx.restore();}
  const width=Math.min(w-36,300),x=(w-width)/2;ctx.fillStyle='#0f172a';ctx.fillRect(x,this.hudY+6,width,13);ctx.fillStyle='#f59e0b';ctx.fillRect(x+2,this.hudY+8,(width-4)*b.hp/500,9);ctx.fillStyle='#fff';ctx.font='bold '+this.hudFont+'px monospace';ctx.textAlign='center';ctx.fillText('SKY FORTRESS  '+b.hp+' / 500',w/2,this.hudY);
  const labels={lanes:'DODGE THE DANGER LANES',drones:'DRONES REMAINING: '+b.remainingDrones,rotors:'DESTROY THE FOUR ROTORS',turrets:'DESTROY THE TWO TURRETS',core:'CENTRAL CORE EXPOSED',core_failure:'CORE FAILURE',chain_explosions:'CARRIER COLLAPSING',collapse:'CARRIER COLLAPSING',detonation:'SKY DETONATION',finished:'ROUND 36 CLEARED  +10,000'};ctx.font='bold '+this.phaseFont+'px monospace';ctx.fillText(labels[this.state]||'',w/2,this.phaseY);
  if(this.d.phase==='intro'){ctx.fillStyle='#fbbf24';ctx.font='bold 20px monospace';ctx.fillText('ROUND 36',w/2,h*.64);ctx.font='bold 15px monospace';ctx.fillText('SKY FORTRESS APPROACHING',w/2,h*.68);}ctx.restore();
 }
}
return{Encounter,CONFIG,PHASE,MODEL,assets:Object.values(MODEL.art).map(x=>x.file)};
});

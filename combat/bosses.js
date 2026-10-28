/* Boss scheduling and combat are driven by the existing game update, never timers. */
(function(r,f){const api=f(typeof module==='object'&&module.exports?require('./sky-fortress'):r.SkyFortress);if(typeof module==='object'&&module.exports)module.exports=api;else r.SkyBosses=api;})(globalThis,function(Fortress){
'use strict';
const STAGES=Object.freeze([{id:1,round:12,hp:80,reward:5000},{id:2,round:24,hp:160,reward:10000},{id:3,round:36,hp:500,reward:10000}]);
function segmentBox(x0,y0,x1,y1,cx,cy,hw,hh){let lo=0,hi=1;for(const [p,d,min,max] of [[x0,x1-x0,cx-hw,cx+hw],[y0,y1-y0,cy-hh,cy+hh]]){if(Math.abs(d)<1e-9){if(p<min||p>max)return false;}else{let a=(min-p)/d,b=(max-p)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;}}return true;}
class Director{
 constructor(hooks){this.h=hooks;this.reset('initial');}
 reset(runId,completed=[]){this.fortress=null;this.runId=runId;this.completed=new Set(completed);this.phase='regular';this.boss=null;this.elapsed=0;this.shots=[];this.warnings=[];this.burst=[];this.seen=new Set();this.attackClock=0;this.serial=0;}
 get blocksRegular(){return this.phase!=='regular';}
 get canShoot(){return this.phase==='regular'||this.phase==='fight';}
 targets(){return this.fortress?this.fortress.targets():this.phase==='fight'&&this.boss?.hp>0?[this.boss]:[];}
 priorityTarget(){const {player}=this.h.context();return this.targets().slice().sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;}
 rowCompleted(count){if(this.blocksRegular)return false;const cfg=STAGES.find(x=>count>=x.round&&!this.completed.has(x.id));if(!cfg)return false;this.phase='intro';this.elapsed=0;const {w}=this.h.context();this.boss={...cfg,maxHp:cfg.hp,active:true,x:w/2,y:265,age:0,hitFlash:0};this.seen.clear();this.shots=[];this.warnings=[];this.burst=[];this.h.suspend?.(cfg);if(cfg.id===3)this.fortress=new Fortress.Encounter(this,segmentBox);return true;}
 hit(attack){if(this.fortress)return this.fortress.hit(attack);const b=this.boss;if(this.phase!=='fight'||!b||b.hp<=0||!attack?.collision||!attack.token||this.seen.has(attack.token)||!this.h.validAttack(attack))return false;
  const baseDamage=attack.kind==='bomber'?20:attack.kind==='phantom'?30:attack.damage;
  const damage=baseDamage*(this.h.damageMultiplier?.(b,attack)??1);
  if(!Number.isFinite(damage)||damage<=0)return false;this.seen.add(attack.token);b.hp=Math.max(0,b.hp-damage);b.hitFlash=90;this.h.impact?.(b,attack);
  if(b.hp===0){b.active=false;this.phase='victory';this.elapsed=0;this.shots=[];this.warnings=[];this.burst=[];if(!this.completed.has(b.id)){this.completed.add(b.id);this.h.victory?.(b,this.runId+':boss:'+b.id,attack);} }return true;
 }
 warn(){const b=this.boss,{player}=this.h.context();this.warnings.push({x:b.x,y:b.y+18,targetX:player.x,targetY:player.y,age:0,duration:b.id===1?1100:1250});}
 launch(w){this.boss.launchFlash=160;const angle=Math.atan2(w.targetY-w.y,w.targetX-w.x);this.shots.push({kind:'missile',x:w.x,y:w.y,px:w.x,py:w.y,vx:Math.cos(angle)*205,vy:Math.sin(angle)*205,angle,age:0});this.h.launch?.(w);}
 turretBurst(){const b=this.boss,{player}=this.h.context();for(let side=0;side<2;side++){const x=b.x+(side?48:-48),y=b.y+12,angle=Math.atan2(player.y-y,player.x-x);this.burst.push({delay:side*220,x,y,angle});}}
 update(dt){if(this.fortress){this.fortress.update(dt);return;}if(this.phase==='regular')return;const b=this.boss;if(!b)return;this.elapsed+=dt;b.age+=dt;b.hitFlash=Math.max(0,b.hitFlash-dt);b.launchFlash=Math.max(0,(b.launchFlash||0)-dt);
  if(this.phase==='intro'){if(this.elapsed>=1200){this.phase='fight';this.elapsed=0;this.missileTimer=500;this.gunTimer=600;this.gunPause=0;}return;}
  if(this.phase==='victory'){if(this.elapsed>=1600){this.phase='regular';this.boss=null;this.h.resume?.();}return;}
  const {w,h,player,bullets}=this.h.context();b.x=w/2+Math.sin(b.age/1700)*(b.id===1?46:65);
  this.missileTimer+=dt;this.gunTimer+=dt;this.gunPause=Math.max(0,this.gunPause-dt);
  if(this.missileTimer>=(b.id===1?3100:5100)){this.missileTimer=0;this.burst=[];this.warn();}
  for(let i=this.warnings.length-1;i>=0;i--){const q=this.warnings[i];q.age+=dt;if(q.age>=q.duration){this.launch(q);this.warnings.splice(i,1);this.gunPause=900;}}
  if(b.id===2&&!this.warnings.length&&!this.gunPause&&this.gunTimer>=2400){this.gunTimer=0;this.turretBurst();}
  for(let i=this.burst.length-1;i>=0;i--){const q=this.burst[i];q.delay-=dt;if(q.delay<=0){for(const spread of [-.17,0,.17]){const angle=q.angle+spread;this.shots.push({kind:'bullet',x:q.x,y:q.y,px:q.x,py:q.y,vx:Math.cos(angle)*180,vy:Math.sin(angle)*180,angle,age:0});}this.h.gun?.(q);this.burst.splice(i,1);}}
  for(const p of bullets){if(!p.active)continue;const hw=b.id===1?47:78,hh=b.id===1?85:76;
   if(segmentBox(p.prevX??p.x,p.prevY??p.y,p.x,p.y,b.x,b.y,hw,hh)){
    const kind=p.bomberSpecial?'bomber':p.isSpecial?'phantom':'normal';const token=kind==='phantom'?'phantom:'+p.skillGeneration:p.attackId;
    this.hit({kind,token,damage:p.damage,collision:true,projectile:p,skinId:p.skinId});p.active=false;if(this.phase!=='fight')return;
   }
  }
  for(let i=this.shots.length-1;i>=0;i--){const p=this.shots[i];p.px=p.x;p.py=p.y;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.age+=dt;
   if(segmentBox(p.px,p.py,p.x,p.y,player.x,player.y,player.hitboxWidth*.39,player.hitboxHeight*.325)){this.shots.splice(i,1);this.h.playerHit?.(p);if(this.phase!=='fight')return;}
   else if(p.age>9000||p.x<-60||p.x>w+60||p.y<-80||p.y>h+80)this.shots.splice(i,1);
  }
 }
 abort(){this.fortress=null;this.phase='regular';this.boss=null;this.shots=[];this.warnings=[];this.burst=[];}
 draw(ctx,art){if(this.fortress){this.fortress.draw(ctx,art);return;}const b=this.boss;if(!b)return;const {player,w}=this.h.context();ctx.save();ctx.imageSmoothingEnabled=false;
  for(const q of this.warnings){ctx.strokeStyle='rgba(255,64,64,'+(.35+.6*q.age/q.duration)+')';ctx.lineWidth=1+2*q.age/q.duration;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.targetX,q.targetY);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(q.targetX,q.targetY,15+4*Math.sin(q.age/70),0,Math.PI*2);ctx.stroke();}
  if(this.phase!=='victory'){ctx.save();ctx.translate(b.x,b.y);if(this.phase==='intro')ctx.translate(0,-230*(1-Math.min(1,this.elapsed/1200)));if(b.hitFlash)ctx.globalAlpha=.6;
   if(b.id===1){art(ctx,'assets/bosses/boss1/body.png',0,0,110,196);art(ctx,'assets/bosses/boss1/launcher.png',0,-35,36,36);for(const x of [-46,46])for(const y of [-10,40]){ctx.save();ctx.translate(x,y);ctx.rotate(b.age/75);art(ctx,'assets/bosses/boss1/rotor.png',0,0,76,76);ctx.restore();}}
   else{const base='assets/bosses/boss2/';art(ctx,base+'body/boss01_body.png',0,0,158.4,176);art(ctx,base+'missile_launcher/boss01_missile_launcher.png',0,-41,28.6,30.8);
    for(const side of [-1,1]){const x=side*49.5,y=0;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(player.y-(b.y+y),player.x-(b.x+x))-Math.PI/2);art(ctx,base+'turrets/'+(side<0?'left/boss01_turret_left.png':'right/boss01_turret_right.png'),0,4.4,19.8,26.4);ctx.restore();}
    let rotor=1;for(const y of [-36.3,36.3])for(const x of [-69.3,69.3]){const n=Math.floor(b.age/50)%4+1;art(ctx,base+'rotors/rotor_'+rotor+'/boss01_rotor_'+rotor+'_frame_0'+n+'.png',x,y,44,44);rotor++;}
   }if(b.launchFlash)art(ctx,'assets/bosses/boss2/effects/boss01_muzzle_flash.png',0,28,22,34);ctx.restore();
  }
  for(const p of this.shots){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle-Math.PI/2);art(ctx,p.kind==='missile'?'assets/bosses/boss1/missile.png':'assets/bosses/boss2/projectiles/boss01_gun_projectile.png',0,0,p.kind==='missile'?13:9,p.kind==='missile'?42:20);ctx.restore();}
  const width=Math.min(w-36,300),x=(w-width)/2;ctx.fillStyle='#0f172a';ctx.fillRect(x,146,width,13);ctx.fillStyle=b.id===1?'#f97316':'#ef4444';ctx.fillRect(x+2,148,(width-4)*b.hp/b.maxHp,9);ctx.fillStyle='#fff';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('BOSS '+b.id+'  '+b.hp+' / '+b.maxHp,w/2,140);
  if(this.phase==='victory'){ctx.fillStyle='#fbbf24';ctx.font='bold 21px monospace';ctx.fillText('BOSS '+b.id+' DEFEATED',w/2,150);ctx.fillText('+'+b.reward.toLocaleString()+' POINTS',w/2,180);}ctx.restore();
 }
}
return {Director,STAGES,segmentBox};
});

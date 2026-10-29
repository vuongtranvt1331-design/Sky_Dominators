/* Tactical Military Drone Swarm. dt is milliseconds, velocities are pixels/second.
 * ES6 classes use the same browser/CommonJS wrapper as the other boss modules.
 * The existing Director owns update, draw, damage hooks, shots and progression.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SkyDroneSwarm = api;
})(globalThis, function () {
    'use strict';
    const BASE = 'assets/bosses/military_drone_swarm/';
    const CONFIG = Object.freeze({
        maxHp: 500, enragedHp: 250, introMs: 1200, vortexMs: 5000,
        morphMs: 300, lineWarningMs: 600, lineRecoveryMs: 1000, lineBursts: 5,
        vortexIntervalMs: 400, vortexCount: 12, vortexSpeed: 145,
        wallSpeed: 370, wallSpacing: 16, snipePeriodMs: 1000,
        snipeWarningMs: 500, snipeSpeed: 620, debrisHpStep: 10,
        debrisOffsetY: 180, debrisInitialSpeed: 40, debrisGravity: 500,
        frameMs: 100, victoryMs: 1600
    });
    const frames = name => Array.from({length: 4}, (_, i) => BASE + name + '/' + name + '_0' + (i + 1) + '.png');
    const ART = Object.freeze({vortex: frames('vortex'), line: frames('line'), enraged: frames('enraged'),
        drone: BASE + 'projectiles/drone.png', broken: BASE + 'projectiles/broken_drone.png', laser: BASE + 'projectiles/laser.png'});
    const assets = Object.freeze([...ART.vortex, ...ART.line, ...ART.enraged, ART.drone, ART.broken, ART.laser]);
    const EPS = 1e-7;

    // Custom drone projectile: a frozen aim vector, never retargeted after launch.
    // Homing is deliberately disabled for the telegraphed attacks so dodging works.
    class HomingDrone {
        constructor({x, y, vx = 0, vy = 0, kind = 'vortex', radius = 6, gravity = 0}) {
            Object.assign(this, {x, y, vx, vy, kind, radius, gravity, active: true, age: 0, px: x, py: y});
        }
        update(dt, viewport) {
            if (!this.active) return;
            const seconds = dt / 1000;
            this.px = this.x; this.py = this.y;
            this.x += this.vx * seconds;
            this.y += this.vy * seconds + .5 * this.gravity * seconds * seconds;
            this.vy += this.gravity * seconds;
            this.age += dt;
            if (this.age > 10000 || this.x < -80 || this.x > viewport.w + 80 || this.y < -100 || this.y > viewport.h + 100) this.active = false;
        }
        draw(ctx, art) {
            ctx.save(); ctx.translate(this.x, this.y);
            if (this.kind !== 'debris') ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
            art(ctx, this.kind === 'debris' ? ART.broken : ART.drone, 0, 0, this.kind === 'debris' ? 40 : 28, this.kind === 'debris' ? 40 : 28);
            ctx.restore();
        }
    }
    class BrokenDrone extends HomingDrone {
        constructor(x, y) {
            super({x, y, vy: CONFIG.debrisInitialSpeed, kind: 'debris', radius: 8, gravity: CONFIG.debrisGravity});
        }
    }

    class TacticalDroneSwarm {
        constructor(director, segmentBox) {
            this.d = director; this.b = director.boss; this.segmentBox = segmentBox;
            this.age = 0; this.stateAge = 0; this.state = 'intro'; this.phase = 1;
            this.vortexClock = 0; this.vortexAngle = 0; this.snipeClock = 0;
            this.lineCycle = 0; this.lineTurn = 0; this.mixed = false;
            this.safeLanes = []; this.wallColumns = []; this.snipe = null;
            this.finished = false; this.events = []; this.parts = [];
            this.b.maxHp = CONFIG.maxHp; this.b.hp = CONFIG.maxHp;
            this.setState('intro'); this.updatePose();
        }
        record(type, detail = {}) {
            const event = {type, at: this.age, ...detail};
            this.events.push(event);
            if (this.events.length > 256) this.events.shift();
            this.d.h.swarmEvent?.(event);
        }
        setState(state) {
            this.state = state; this.stateAge = 0; this.b.swarmState = state;
            this.record('state', {state});
            if (state === 'vortex') this.vortexClock = 0;
            if (state === 'expand') {
                this.lineCycle++; this.lineTurn = 0; this.mixed = this.lineCycle % 2 === 0;
                // Remove residual ring shots before the first wall warning.
                this.d.shots = this.d.shots.filter(p => p.kind !== 'vortex');
                this.vortexClock = 0;
            }
            if (state === 'line_warning') this.prepareWall();
        }
        duration() {
            return {intro: CONFIG.introMs, vortex: CONFIG.vortexMs, expand: CONFIG.morphMs,
                line_warning: CONFIG.lineWarningMs, line_recovery: CONFIG.lineRecoveryMs,
                contract: CONFIG.morphMs, victory: CONFIG.victoryMs}[this.state] ?? Infinity;
        }
        isLine() { return this.state === 'line_warning' || this.state === 'line_recovery'; }
        vortexEnabled() { return this.state === 'vortex' || this.state === 'enraged' || (this.mixed && this.isLine()); }
        updatePose() {
            const {w} = this.d.h.context();
            this.b.x = w / 2;
            this.b.y = this.state === 'intro' ? 300 - 420 * (1 - Math.min(1, this.stateAge / CONFIG.introMs)) : 300;
            this.b.width = this.isLine() ? w - 24 : 256; this.b.height = this.isLine() ? 128 : 256;
            this.b.fortressVisualBox = {x: this.b.x, y: this.b.y, w: this.b.width, h: this.b.height};
            let boxes;
            if (this.isLine()) {
                const width = w - 24;
                boxes = [[.02, .238], [.379, .614], [.766, .98]].map(([lo, hi]) => ({
                    x: 12 + width * (lo + hi) / 2, y: this.b.y, w: width * (hi - lo), h: 100
                }));
            } else if (this.phase === 2) boxes = [{x: this.b.x, y: this.b.y, w: 224, h: 224}];
            else boxes = [
                {x: this.b.x, y: this.b.y - 76, w: 176, h: 72},
                {x: this.b.x, y: this.b.y + 76, w: 176, h: 72},
                {x: this.b.x - 76, y: this.b.y, w: 72, h: 96},
                {x: this.b.x + 76, y: this.b.y, w: 72, h: 96}
            ];
            // Stable target objects support existing lock-on skins and bomber skills.
            boxes.forEach((box, i) => {
                if (!this.parts[i]) {
                    const owner = this;
                    this.parts[i] = {kind: 'core', ownerBoss: this.b, id: 'swarm-part-' + i,
                        get hp() { return owner.b.hp; }, get active() { return !owner.finished && owner.b.active && owner.d.phase === 'fight'; }};
                }
                Object.assign(this.parts[i], box, {width: box.w, height: box.h, fortressVisualBox: box});
            });
            this.partCount = boxes.length;
        }
        targets() { return this.d.phase === 'fight' && this.b.hp > 0 && !this.finished ? this.parts.slice(0, this.partCount) : []; }
        hit(attack) {
            if (this.finished || this.d.phase !== 'fight' || this.b.hp <= 0 || !attack?.collision ||
                !attack.token || this.d.seen.has(attack.token) || !this.d.h.validAttack(attack) ||
                (attack.target && attack.target !== this.b && attack.target.ownerBoss !== this.b)) return false;
            const base = attack.kind === 'bomber' ? 20 : attack.kind === 'phantom' ? 30 : attack.damage;
            const damage = base * (this.d.h.damageMultiplier?.(this.b, attack) ?? 1);
            if (!Number.isFinite(damage) || damage <= 0) return false;
            const before = this.b.hp;
            this.d.seen.add(attack.token); this.b.hp = Math.max(0, before - damage); this.b.hitFlash = 90;
            this.d.h.impact?.(attack.target || this.b, attack);
            if (this.b.hp <= CONFIG.enragedHp && this.phase === 1) this.enterEnraged();
            // Count thresholds in the actual HP lost below 250, not hits or hp % 10.
            // A hit crossing 250 carries its excess damage into the new phase.
            const oldSteps = Math.floor((CONFIG.enragedHp - Math.min(CONFIG.enragedHp, before)) / CONFIG.debrisHpStep);
            const newSteps = Math.floor((CONFIG.enragedHp - this.b.hp) / CONFIG.debrisHpStep);
            if (this.phase === 2) for (let n = oldSteps + 1; n <= newSteps; n++) this.dropDebris(n);
            if (this.b.hp === 0) this.beginDefeat(attack);
            return true;
        }
        enterEnraged() {
            this.phase = 2; this.mixed = false; this.safeLanes = []; this.wallColumns = []; this.snipe = null;
            this.d.shots = []; this.vortexClock = 0; this.snipeClock = 0;
            this.setState('enraged'); this.updatePose(); this.record('enraged');
        }
        dropDebris(threshold) {
            const {player} = this.d.h.context();
            const shot = new BrokenDrone(player.x, player.y - CONFIG.debrisOffsetY);
            this.d.shots.push(shot);
            this.record('debris', {thresholdHp: CONFIG.enragedHp - threshold * CONFIG.debrisHpStep, x: shot.x, y: shot.y});
        }
        prepareWall() {
            const {w, player} = this.d.h.context();
            const maxBox = this.d.h.maxPlayerBox?.()?.width || player.hitboxWidth || player.width || 60;
            const safeWidth = Math.max(w * .32, maxBox + 32);
            const two = this.lineTurn % 2 === 0 && safeWidth * 2 + 64 <= w;
            const centers = two ? [w * .25, w * .75] : [w * .5];
            this.safeLanes = centers.map(x => ({left: x - safeWidth / 2, right: x + safeWidth / 2}));
            this.wallColumns = [];
            const count = Math.ceil(w / CONFIG.wallSpacing), spacing = w / count;
            for (let i = 0; i < count; i++) {
                const x = (i + .5) * spacing;
                if (!this.safeLanes.some(lane => x + 7 >= lane.left && x - 7 <= lane.right)) this.wallColumns.push(x);
            }
            this.record('wall_warning', {turn: this.lineTurn + 1, lanes: this.safeLanes.map(l => ({...l})), columns: [...this.wallColumns]});
        }
        fireWall() {
            for (const x of this.wallColumns) this.d.shots.push(new HomingDrone({x, y: this.b.y + 58, vy: CONFIG.wallSpeed, kind: 'wall', radius: 7}));
            this.lineTurn++; this.record('wall_fire', {turn: this.lineTurn, count: this.wallColumns.length});
            this.d.h.gun?.({x: this.b.x, y: this.b.y}); this.setState('line_recovery');
        }
        fireVortex() {
            for (let i = 0; i < CONFIG.vortexCount; i++) {
                const angle = this.vortexAngle + i * Math.PI * 2 / CONFIG.vortexCount;
                const dx = Math.cos(angle), dy = Math.sin(angle);
                this.d.shots.push(new HomingDrone({x: this.b.x + dx * 114, y: this.b.y + dy * 114,
                    vx: dx * CONFIG.vortexSpeed, vy: dy * CONFIG.vortexSpeed}));
            }
            this.vortexAngle = (this.vortexAngle + Math.PI / 18) % (Math.PI * 2);
            this.record('vortex_fire', {mixed: this.mixed && this.isLine()});
        }
        lockSnipe() {
            const {player} = this.d.h.context();
            this.snipe = {x: this.b.x, y: this.b.y + 112, targetX: player.x, targetY: player.y};
            this.record('snipe_lock', {...this.snipe});
        }
        fireSnipe() {
            const aim = this.snipe;
            if (!aim) return;
            const angle = Math.atan2(aim.targetY - aim.y, aim.targetX - aim.x);
            this.d.shots.push(new HomingDrone({x: aim.x, y: aim.y, vx: Math.cos(angle) * CONFIG.snipeSpeed, vy: Math.sin(angle) * CONFIG.snipeSpeed, kind: 'snipe'}));
            this.record('snipe_fire', {...aim}); this.d.h.launch?.(aim); this.snipe = null;
        }
        processPlayerShots() {
            for (const p of this.d.h.context().bullets || []) {
                if (!p.active) continue;
                const target = this.targets().find(t => this.segmentBox(p.prevX ?? p.x, p.prevY ?? p.y, p.x, p.y, t.x, t.y, t.w / 2, t.h / 2));
                if (!target) continue;
                const kind = p.bomberSpecial ? 'bomber' : p.isSpecial ? 'phantom' : 'normal';
                const token = kind === 'phantom' ? 'phantom:' + p.skillGeneration : p.attackId;
                this.hit({kind, token, damage: p.damage, target, collision: true, projectile: p, skinId: p.skinId});
                p.active = false;
                if (this.d.phase !== 'fight' || this.finished) return;
            }
        }
        advanceShots(dt) {
            const context = this.d.h.context(), {player} = context;
            for (const p of this.d.shots) {
                p.update(dt, context);
                if (!p.active) continue;
                const hw = (player.hitboxWidth || player.width) / 2 + p.radius;
                const hh = (player.hitboxHeight || player.height) / 2 + p.radius;
                if (this.segmentBox(p.px, p.py, p.x, p.y, player.x, player.y, hw, hh)) {
                    p.active = false; this.d.h.playerHit?.(p);
                    if (this.finished || this.d.swarm !== this) return;
                }
            }
            this.d.shots = this.d.shots.filter(p => p.active);
        }
        nextState() {
            if (this.state === 'intro') { this.d.phase = 'fight'; this.setState('vortex'); }
            else if (this.state === 'vortex') this.setState('expand');
            else if (this.state === 'expand') this.setState('line_warning');
            else if (this.state === 'line_warning') this.fireWall();
            else if (this.state === 'line_recovery') this.setState(this.lineTurn < CONFIG.lineBursts ? 'line_warning' : 'contract');
            else if (this.state === 'contract') this.setState('vortex');
            else if (this.state === 'victory') this.finish();
        }
        update(dt) {
            let left = Number.isFinite(dt) ? Math.max(0, dt) : 0;
            if (!left || this.finished) return;
            this.updatePose();
            if (this.d.phase === 'fight') this.processPlayerShots();
            // Split at exact event boundaries, retaining overshoot, with short physics steps.
            // No setTimeout, setInterval or second requestAnimationFrame loop.
            while (left > EPS && !this.finished && this.d.swarm === this) {
                const vortex = this.vortexEnabled();
                let step = Math.min(left, 16, this.duration() - this.stateAge);
                if (vortex) step = Math.min(step, CONFIG.vortexIntervalMs - this.vortexClock);
                if (this.state === 'enraged') step = Math.min(step,
                    (this.snipe ? CONFIG.snipePeriodMs : CONFIG.snipePeriodMs - CONFIG.snipeWarningMs) - this.snipeClock);
                this.advanceShots(step);
                if (this.finished || this.d.swarm !== this) break;
                this.age += step; this.b.age = this.age; this.stateAge += step; this.d.elapsed += step; left -= step;
                this.b.hitFlash = Math.max(0, this.b.hitFlash - step);
                if (vortex) this.vortexClock += step;
                if (this.state === 'enraged') this.snipeClock += step;
                this.updatePose();
                if (vortex && this.vortexClock >= CONFIG.vortexIntervalMs - EPS) {
                    this.vortexClock -= CONFIG.vortexIntervalMs; this.fireVortex();
                }
                if (this.state === 'enraged') {
                    if (!this.snipe && this.snipeClock >= CONFIG.snipePeriodMs - CONFIG.snipeWarningMs - EPS) this.lockSnipe();
                    if (this.snipeClock >= CONFIG.snipePeriodMs - EPS) { this.fireSnipe(); this.snipeClock -= CONFIG.snipePeriodMs; }
                }
                if (this.stateAge >= this.duration() - EPS) { this.nextState(); this.updatePose(); }
            }
        }
        beginDefeat(attack) {
            this.b.active = false; this.d.phase = 'victory'; this.d.elapsed = 0;
            this.d.shots = []; this.safeLanes = []; this.wallColumns = []; this.snipe = null;
            this.setState('victory');
            if (!this.d.completed.has(this.b.id)) {
                this.d.completed.add(this.b.id);
                this.d.h.victory?.(this.b, this.d.runId + ':boss:' + this.b.id, attack);
            }
        }
        finish() {
            if (this.finished) return;
            this.abort(); this.d.phase = 'regular'; this.d.boss = null; this.d.swarm = null;
            this.d.h.resume?.();
        }
        abort() {
            this.finished = true; this.d.shots = []; this.d.warnings = []; this.d.burst = [];
            this.safeLanes = []; this.wallColumns = []; this.snipe = null; this.parts = [];
        }
        drawLaser(ctx, art, fromX, fromY, toX, toY) {
            const length = Math.hypot(toX - fromX, toY - fromY);
            ctx.save(); ctx.translate(fromX, fromY); ctx.rotate(Math.atan2(toY - fromY, toX - fromX) - Math.PI / 2);
            // The shared art helper preserves image aspect ratio. Stretch the canvas
            // transform instead, so the 26px line spans the whole telegraph path.
            ctx.scale(1.5, length / 26);
            art(ctx, ART.laser, 0, 13, 32, 32); ctx.restore();
        }
        draw(ctx, art) {
            if (this.finished) return;
            const {w, h} = this.d.h.context(), frame = Math.floor(this.age / CONFIG.frameMs) % 4;
            ctx.save(); ctx.imageSmoothingEnabled = false;
            if (this.state === 'line_warning') {
                ctx.fillStyle = 'rgba(190,40,24,.10)';
                for (const x of this.wallColumns) { ctx.fillRect(x - 8, this.b.y + 58, 16, h); this.drawLaser(ctx, art, x, this.b.y + 58, x, h); }
                ctx.strokeStyle = '#cbd5a4'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
                for (const lane of this.safeLanes) ctx.strokeRect(lane.left, this.b.y + 70, lane.right - lane.left, h - this.b.y - 80);
                ctx.setLineDash([]);
            }
            if (this.snipe) this.drawLaser(ctx, art, this.snipe.x, this.snipe.y, this.snipe.targetX, this.snipe.targetY);
            let lineMix = this.isLine() ? 1 : 0;
            if (this.state === 'expand') lineMix = this.stateAge / CONFIG.morphMs;
            if (this.state === 'contract') lineMix = 1 - this.stateAge / CONFIG.morphMs;
            const alpha = this.state === 'victory' ? 1 - this.stateAge / CONFIG.victoryMs : this.b.hitFlash > 0 ? .65 : 1;
            if (lineMix < 1) { ctx.globalAlpha = alpha * (1 - lineMix); art(ctx, (this.phase === 2 ? ART.enraged : ART.vortex)[frame], this.b.x, this.b.y, 256, 256); }
            if (lineMix > 0) { ctx.globalAlpha = alpha * lineMix; art(ctx, ART.line[frame], this.b.x, this.b.y, 256 + (w - 24 - 256) * lineMix, 128); }
            ctx.globalAlpha = 1;
            for (const shot of this.d.shots) shot.draw(ctx, art);
            const width = Math.min(w - 36, 340), x = (w - width) / 2;
            ctx.fillStyle = '#111315'; ctx.fillRect(x, 146, width, 13);
            ctx.fillStyle = this.phase === 2 ? '#db422b' : '#c28033'; ctx.fillRect(x + 2, 148, (width - 4) * this.b.hp / CONFIG.maxHp, 9);
            ctx.fillStyle = '#f4edd8'; ctx.textAlign = 'center'; ctx.font = 'bold 13px monospace';
            ctx.fillText('DRONE SWARM  ' + this.b.hp + ' / 500', w / 2, 140);
            ctx.font = '11px monospace';
            const label = this.state === 'victory' ? 'SWARM DESTROYED' : this.phase === 2 ? 'OVERHEATING — DODGE LASERS AND FALLING DEBRIS' : this.isLine() ? 'BLOCKADE ' + Math.min(5, this.lineTurn + (this.state === 'line_warning' ? 1 : 0)) + '/5 — FIND THE GAPS' : 'TACTICAL VORTEX';
            ctx.fillText(label, w / 2, 176); ctx.restore();
        }
    }
    return {TacticalDroneSwarm, HomingDrone, BrokenDrone, CONFIG, ART, assets};
});

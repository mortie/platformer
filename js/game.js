/*
 * Interfaces
 *     Entity
 *         number x, y: X and Y coordinate
 *         number w, h: width and height
 *         number vx, vy: X and Y velocity
 *         function update(): Update, called each tick
 *         function draw(ctx): Draw, called each tick
 *
 *     PhysicsEntity extends Entity
 *         number rvx, rvy: X and Y velocity relative to platform
 *         Entity currentGround: Current ground entity, or null.
 *         function updateRV(): Called by entPhysics, update rvx and rvy
 *
 *     InteractiveEntity extends Entity
 *         function ontouch(ent): Called when touched by ent
 */

var plats = [];
var terrain = [];
var mobs = [];
var player = [];
var interactive = [];
var entities = [ plats, terrain, mobs, player, interactive ];

var camx;
var camy;

var gravity = 0.5;
var groundFriction = 0.3;
var airFriction = 0.03;

var keymap = {

	// arrow
	37: "left",
	38: "up",
	39: "right",
	40: "down",

	// wasd (qwerty)
	65: "left",
	87: "up",
	68: "right",
	83: "down",

	// wasd (dvorak)
	65: "left",
	188: "up",
	69: "right",
	79: "down",

	// space to jump
	32: "up",
};

// Information about how to spawn the various entities
var spawnables = {
	platform: {
		func: Platform,
		args: [
			"x", "y", "w", "h",
			o => o.path && Path(o.type, o.frames, o.path),
		],
		arr: plats,
	},

	wall: {
		func: Wall,
		args: [
			"x", "y", "w", "h"
		],
		arr: terrain,
	},

	victory: {
		func: Victory,
		args: [
			"x", "y",
			o => o.path && Path(o.type, o.frames, o.path),
			"physics"
		],
		arr: interactive,
	},

	player: {
		func: Player,
		args: [ "x", "y" ],
		arr: player,
	},
};

// React to keyboard input
var keys = {};
window.onkeydown = key =>
	keys[keymap[key.keyCode]] = true;
window.onkeyup = key =>
	keys[keymap[key.keyCode]] = false;

// Create canvas path around entity
function outline(self, ctx) {
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(self.w, 0);
	ctx.lineTo(self.w, self.h);
	ctx.lineTo(0, self.h);
	ctx.closePath();
}

// Does two entities collide?
function entsCollide(ent1, ent2) {
	return (
		ent1.x + ent1.w >= ent2.x && ent1.x <= ent2.x + ent2.w &&
		ent1.y + ent1.h >= ent2.y && ent1.y <= ent2.y + ent2.h);
}

// What side does ent1 collide with ent2 on?
// left: 0, top: 1: right: 2: bottom: 3
function entsCollideSide(ent1, ent2, dt) {
	if (ent1.y + (ent1.h / 2) <= ent2.y + (ent1.vy + ent2.vy) * dt) {
		return 1;
	} else if (ent1.y >= ent2.y + ent2.h + (ent1.vy + ent2.vy) * dt) {
		return 3;
	} else if (ent1.x + ent1.w < ent2.x + (ent2.w / 2)) {
		return 0;
	} else {
		return 2;
	}
}

function nextGameTick(func) {
	return window.requestAnimationFrame(func);
	//return setTimeout(() => func(new Date().getTime()), 1000 / 30);
}
function cancelGameTick(arg) {
	return window.cancelAnimationFrame(arg);
	//clearTimeout(arg);
}

function entPhysics(self, dt) {
	var prevGround = self.currentGround;
	if (prevGround && !entsCollide(self, prevGround))
		self.currentGround = null;

	// Are we colliding with terrain?
	var bouncedX = false;
	var bouncedY = false;
	var bounce = -0.3;
	for (var i in terrain) {
		if (entsCollide(self, terrain[i])) {
			var side = entsCollideSide(self, terrain[i], dt);

			// top
			if (side === 1 && self.vy >= terrain[i].vy) {
				self.currentGround = terrain[i];

			// left
			} else if (side === 0 && !bouncedX && self.rvx > 0) {
				self.x += -self.rvx;
				self.rvx *= bounce;
				bouncedX = true;

			// right
			} else if (side === 2 && !bouncedX && self.rvx < 0) {
				self.x += -self.rvx;
				self.rvx *= bounce;
				bouncedX = true;

			// bottom
			} else if (side === 3 && self.rvy < 0) {
				self.y += -self.rvy;
				self.rvy *= bounce;
				bouncedY = true;
			}
		}
	}

	// Are we colliding with platforms?
	if (!self.currentGround) {
		for (var i in plats) {
			if (self.vy >= plats[i].vy && entsCollide(self, plats[i])) {
				self.currentGround = plats[i];
				break;
			}
		}
	}

	// Are we colliding with interactive elements?
	for (var i in interactive) {
		var ent = interactive[i];
		if (ent !== self && entsCollide(self, ent)) {
			ent.ontouch && ent.ontouch();
		}
	}

	var fric = self.currentGround ? groundFriction : airFriction;

	// Set velocity correctly
	if (!prevGround && self.currentGround) {
		if (self.vy >= self.currentGround.vy) {
			self.vy = self.currentGround.vy;
			self.rvx = 0;
			self.rvy = 0;
		}
	}

	if (self.updateRV && !bouncedX && !bouncedY)
		self.updateRV();
	if (!self.currentGround)
		self.rvy += gravity;

	self.vx = self.rvx;
	self.vy = self.rvy;

	// Friction
	var xRatio = 1 / (1 + (dt * fric));
	self.rvx *= xRatio;

	if (self.currentGround) {
		self.vx += self.currentGround.vx;
		self.vy += self.currentGround.vy;
		self.y = self.currentGround.y - self.h + 1;
	}
}

// Distance between two points
function dist(x1, y1, x2, y2) {
	var lx = x2 - x1;
	var ly = y2 - y1;
	return Math.sqrt(lx * lx) + Math.sqrt(ly * ly);
}

// Path, used for entities which use pathing
function Path(type, frames, pts) {
	var self = {};

	type = type || "bounce";
	frames = frames || 120;

	var points =
		pts.map(p => ({ x: p[0], y: p[1], n: p[2] || frames }));
	var curr = points[0];
	var curri = 0;

	var dir = 1;

	self.move = function(ent, ox, oy) {
		var rx = ent.x - ox;
		var ry = ent.y - oy;

		var d1 = dist(rx, ry, curr.x, curr.y);
		var d2 = dist(rx + ent.vx, ry + ent.vy, curr.x, curr.y);

		// If we're getting closer, do nothing
		if (Math.abs(d1) > Math.abs(d2)) {
			return;
		}

		// Set x and y to account for inaccuricies
		ent.x = ox + curr.x;
		ent.y = oy + curr.y;

		if (type === "bounce") {
			if (curri + dir >= points.length || curri + dir < 0)
				dir *= -1;
			curri += dir;
		} else if (type === "loop") {
			if (curri + dir >= points.length)
				curri = -1;
			curri += dir;
		} else {
			console.error("Unknown loop type: "+type);
		}

		curr = points[curri];
		ent.vx = (curr.x - rx) / curr.n;
		ent.vy = (curr.y - ry) / curr.n;
	}

	self.draw = function(ctx) {
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length; ++i) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.closePath();
		ctx.strokeStyle = "black";
		ctx.stroke();
	}

	return self;
}

// Include entity constructors
#include "entities.js"

// Run function 'func' for each entity
function entMap(func) {
	for (var i in ents) {
		var arr = ents[i];
		for (var j in arr) {
			var ent = arr[j];
			func(ent, arr, j);
		}
	}
}

// Make the camera smoothly move towards the player
function updateCam(ent, instant, dt) {
	var tx = ent.x + ent.w / 2 - can.width / 2;
	var ty = ent.y + ent.h / 2 - can.height / 2;
	var lerp = instant ? 1 : 0.05;

	camx += (tx - camx) * lerp * dt;
	camy += (ty - camy) * lerp * dt;
}

var can = document.getElementById("can");
var ctx = can.getContext("2d");
var level = document.getElementById("level");

var ents = [ plats, terrain, mobs, player, interactive ];
var timeout = 0;
var prevTime = 0;
function update(currTime) {
	var dt;
	if (!prevTime) {
		dt = 1;
	} else {
		dt = (currTime - prevTime) / (1000 / 60);
	}	
	prevTime = currTime;

	if (dt !== 0 && dt < 4) {
		can.width = window.innerWidth;
		can.height = window.innerHeight;

		entMap((ent, arr, j) => {
			if (ent.dead) {
				arr.splice(j, 1);
			}

			ent.update && ent.update(dt);
		});

		entMap(ent => {
			ent.x += ent.vx * dt;
			ent.y += ent.vy * dt;

			ctx.translate(
				ent.x - camx,
				ent.y - camy);
			ent.draw && ent.draw(ctx);
			ctx.resetTransform();
		});

		updateCam(player[0], false, dt);
	}

	if (timeout !== null)
		timeout = nextGameTick(update);
}

function spawn(s, obj) {
	var args = [];
	s.args.forEach(arg => {
		if (typeof arg === "string")
			args.push(obj[arg])
		else if (typeof arg === "function")
			args.push(arg(obj));
		else
			throw new Error("Invalid argument");
	});

	var ent = s.func.apply(null, args);
	s.arr.push(ent);
}

function init(lstr, nostart) {

	// Set styles
	document.body.style.cssText =
		"width: 100%;"+
		"height: 100%;"+
		"padding: 0px;"+
		"margin: 0px;"+
		"overflow: hidden;";
	level.style.display = "none";

	// Set initial values
	camx = 0;
	camy = 0;
	keys = {};
	entities.forEach(arr => arr.length = 0);
	can.width = window.innerWidth;
	can.height = window.innerHeight;

	// Spawn entities
	lstr = lstr !== undefined ? lstr : level.innerText;
	lstr.split(";").forEach(s => {
		s = s.trim();
		if (s == "")
			return;

		var name = s.split(/\s+/)[0];
		s = s.replace(name, "");
		var obj = eval("("+s+")");

		var spawnable = spawnables[name];
		if (!spawnable)
			return console.error("Unknown entity: "+name);

		spawn(spawnable, obj);
	});

	// Set camera to initial position
	updateCam(player[0], true, 1);

	// Start
	timeout = 0;
	prevTime = 0;
	if (!nostart)
		update(0);
}

function stop() {
	cancelGameTick(timeout);
	timeout = null;
}

init();

/*
 * Interfaces
 *     Entity
 *         number x, y: X and Y coordinate
 *         number w, h: width and height
 *         number vx, vy: X and Y velocity
 *         number pvx, pvy: previous X and Y velocity, managed by engine
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
 *
 *     Particle
 *         x, y: X and Y coordinates
 *         vx, vy: X and Y velocity
 *
 *     ParticleList
 *         list: List of Particle
 *         age: Age in milliseconds
 *         maxAge: Maximum age in milliseconds
 *         dimensions: Width and height of a particle
 *         color: Color string, 0-255 RGB separated by comma
 *         ax, ay: X and Y acceleration for particles
 */

(function() {

window.game = {
	init: init,
	stop: stop,
	createEnt: createEnt,
	spawn: spawn,
	setCamera: setCamera,
	drawEnt: drawEnt,
};

// Include unit conversion functions
#include "units.js"

var plats = [];
var terrain = [];
var mobs = [];
var players = [];
var interactive = [];

var player = null;
var entities = [ plats, terrain, mobs, players, interactive ];

var particles = [];

var camx;
var camy;
var shake;

var shakeDecay = 7;
var gravity = 9.8;
var groundFriction = 5;
var airFriction = 1;
// Delta time should be in seconds, meaning velocities are m/s
var dtScalar = 1000;
// 80 pixels per game 'meter' seems reasonable.
var gameScale = 80;

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
function pathArg() {
	return o => o.path && Path(o.pathType, o.pathFrames, o.pathDraw, o.path);
}
var spawnables = {
	platform: {
		func: Platform,
		args: [ "x", "y", "w", "h", pathArg() ],
		arr: plats,
	},

	wall: {
		func: Wall,
		args: [ "x", "y", "w", "h" ],
		arr: terrain,
	},

	victory: {
		func: Victory,
		args: [ "x", "y", "physics", pathArg() ],
		arr: interactive,
	},

	player: {
		func: Player,
		args: [ "x", "y" ],
		arr: players,
	},

	enemyfollower: {
		func: EnemyFollower,
		args: [ "x", "y" ],
		arr: mobs,
	}
};

// Find canvas, ctx and level
var can = document.getElementById("can");
var ctx = can.getContext("2d");
var level = document.getElementById("level");

// Expose canvas and ctx
game.can = can;
game.ctx = ctx;

// React to keyboard input
var keys = {};
window.onkeydown = key =>
	keys[keymap[key.keyCode]] = true;
window.onkeyup = key =>
	keys[keymap[key.keyCode]] = false;

// General utilities
#include "util.js"

// Utilities for drawing
#include "drawing.js"

// Utilities for physics
#include "physics.js"

// Entity constructors
#include "entities.js"

// Run function 'func' for each entity
function entMap(func) {
	for (var i in entities) {
		var arr = entities[i];
		for (var j in arr) {
			var ent = arr[j];
			func(ent, arr, j);
		}
	}
}

// Make the camera smoothly move towards the playesr
function updateCam(ent, instant, dt) {
	var tx = ent.x + ent.w / 2 - (can.width / gameScale) / 2;
	var ty = ent.y + ent.h / 2 - (can.height / gameScale) / 2;
	var lerp = 5;

	if (instant) {
		console.log("instant");
		camx = ent.x - can.width / gameScale / 2;
		camy = ent.y - can.height / gameScale / 2;
	} else {
		camx += (tx - camx) * lerp * dt;
		camy += (ty - camy) * lerp * dt;
	}
}

function setCamera(x, y) {
	camx = x;
	camy = y;
}

function drawEnt(ent, ctx, shakex, shakey) {
	ctx.translate(
		scale(ent.x - camx) + shakex,
		scale(ent.y - camy) + shakey);
	ent.draw && ent.draw(ctx);
	ctx.resetTransform();
}

function updateParticleList(partlist, ctx, dt) {
	if (partlist.age >= partlist.maxAge) {
		return false;
	}

	partlist.age += dt;

	var alpha = 1 - partlist.age / partlist.maxAge;
	if (alpha < 0) alpha = 0;
	ctx.beginPath();
	ctx.fillStyle = partlist.color,
	ctx.globalAlpha = alpha;

	var pd = scale(partlist.dimensions);
	for (var i in partlist.list) {
		var p = partlist.list[i];

		// Draw first, to capture the first frame
		ctx.rect(scale(p.x), scale(p.y), pd, pd);

		// Update position and velocity
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vx += partlist.ax * dt;
		p.vy += partlist.ay * dt;
	}
	ctx.fill();
	ctx.globalAlpha = 1;

	return true;
}

var timeout = 0;
var prevTime = 0;
var nFrames = 0;
var fps = 0;
var nMillisec = 0;
function update(currTime) {
	var dt;
	if (!prevTime) {
		dt = (1000 / 60) / dtScalar;;
	} else {
		dt = (currTime - prevTime) / dtScalar;
		nMillisec += currTime - prevTime;
	}
	prevTime = currTime;
	nFrames += 1;

	// Print FPS
	if (nMillisec >= 1000) {
		fps = nFrames;
		nFrames = nMillisec = 0;
	}

	if (dt !== 0 && dt < 6) {
		can.width = window.innerWidth;
		can.height = window.innerHeight;

		// Run physics
		entMap((ent, arr, j) => {
			if (ent.dead) {
				arr.splice(j, 1);
			}

			ent.update && ent.update(dt);
		});

		// Make screen shake
		var shakex = 0;
		var shakey = 0;
		if (shake > 0.1) {
			shakex = (Math.random() - 0.5) * shake;
			shakey = (Math.random() - 0.5) * shake;

			var xRatio = 1 / (1 + (dt * shakeDecay));
			shake *= xRatio;
		}

		// Draw entities
		entMap(ent => {
			ent.x += ent.vx * dt;
			ent.y += ent.vy * dt;
			ent.pvx = ent.vx;
			ent.pvy = ent.vy;

			drawEnt(ent, ctx, shakex, shakey);
		});

		// Draw and update particles
		ctx.translate(scale(-camx), scale(-camy));
		for (var i in particles) {
			if (!updateParticleList(particles[i], ctx, dt)) {
				particles.splice(i, 1);
			}
		}
		ctx.resetTransform();

		// Draw FPS
		ctx.fillText("FPS: "+fps, 10, 15);

		updateCam(players[0], false, dt);
	}

	if (timeout !== null)
		timeout = nextGameTick(update);
}

function createEnt(name, obj) {
	var s = spawnables[name];
	if (!s)
		throw new Error("Unknown entity: "+name);

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
	ent.pvx = ent.vx;
	ent.pvy = ent.vy;
	return ent;
}

function spawn(name, obj) {
	var s = spawnables[name];
	if (!s)
		throw new Error("Unknown entity type: "+name);
	s.arr.push(createEnt(name, obj));
}

var initStr = null;
function init(lstr, nostart) {

	// Set styles
	document.body.style.cssText =
		"width: 100%;"+
		"height: 100%;"+
		"padding: 0px;"+
		"margin: 0px;"+
		"overflow: hidden;";

	if (level)
		level.style.display = "none";

	// Set initial values
	camx = 0;
	camy = 0;
	shake = 0;
	keys = {};
	entities.forEach(arr => arr.length = 0);
	particles.length = 0;
	can.width = window.innerWidth;
	can.height = window.innerHeight;

	// Find correct level description string
	if (lstr == null) {
		if (initStr == null && level)
			lstr = initStr = level.innerText;
		else if (initStr != null)
			lstr = initStr;
		else
			lstr = initStr = "";
	} else {
		initStr = lstr;
	}

	// Spawn entities
	lstr.split(";").forEach(s => {
		s = s.trim();
		if (s == "")
			return;

		var name = s.split(/\s+/)[0];
		s = s.replace(name, "");
		var obj = eval("("+s+")");

		spawn(name, obj);
	});

	if (players.length !== 1)
		throw new Error("Invalid number of players!");
	player = players[0];

	// Set camera to initial position
	if (!nostart)
		updateCam(players[0], true);

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

function getSpawnable(name) {
	return spawnables[name];
}

}());

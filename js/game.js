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

(function() {

window.game = {
	init: init,
	stop: stop,
	createEnt: createEnt,
	spawn: spawn,
	setCamera: setCamera,
	drawEnt: drawEnt,
};

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

// Utilities for drawing
#include "drawing.js"

// Utilities for physics
#include "physics.js"

// Entity constructors
#include "entities.js"

// Run 'func' in the next game tick
function nextGameTick(func) {
	return window.requestAnimationFrame(func);
	//return setTimeout(() => func(new Date().getTime()), 1000 / 30);
}
function cancelGameTick(arg) {
	return window.cancelAnimationFrame(arg);
	//clearTimeout(arg);
}

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

function setCamera(x, y) {
	camx = x;
	camy = y;
}

function drawEnt(ent, ctx) {
	ctx.translate(
		ent.x - camx,
		ent.y - camy);
	ent.draw && ent.draw(ctx);
	ctx.resetTransform();
}

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

			drawEnt(ent, ctx);
		});

		updateCam(player[0], false, dt);
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
	return ent;
}

function spawn(name, obj) {
	var s = spawnables[name];
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
	keys = {};
	entities.forEach(arr => arr.length = 0);
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

	// Set camera to initial position
	if (!nostart)
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

function getSpawnable(name) {
	return spawnables[name];
}

}());

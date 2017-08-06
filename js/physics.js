
// Does two entities collide?
function entsCollide(ent1, ent2) {
	return (
		ent1.x + ent1.w >= ent2.x && ent1.x <= ent2.x + ent2.w &&
		ent1.y + ent1.h >= ent2.y && ent1.y <= ent2.y + ent2.h);
}

// What side does ent1 collide with ent2 on?
// left: 0, top: 1: right: 2: bottom: 3
function entsCollideSide(ent1, ent2, dt) {
	if (ent1.y + ent1.h / 2 <= ent2.y + ent1.vy * dt)
		return 1;
	if (ent1.y + ent1.h / 2 >= ent2.y + ent2.h + ent1.vy * dt)
		return 3;
	if (ent1.x + ent1.w / 2 <= ent2.x + ent2.w / 2)
		return 0;
	if (ent1.x + ent1.w / 2 >= ent2.x + ent2.w / 2)
		return 2;
}

function entPhysics(self, dt) {
	var prevGround = self.currentGround;
	if (prevGround && !entsCollide(self, prevGround))
		self.currentGround = null;

	// Are we colliding with terrain?
	var sideCollissions = [];
	for (var i in terrain) {
		if (entsCollide(self, terrain[i])) {
			var side = entsCollideSide(self, terrain[i], dt);

			// top
			if (side === 1 && self.vy >= terrain[i].vy) {
				self.currentGround = terrain[i];

			// bottom
			} else if (side === 3 && self.rvy < 0) {
				self.rvy = Math.abs(self.rvy);
				self.y += self.rvy;
			}

			if (side === 0 || side === 2) {
				sideCollissions.push(terrain[i]);
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

	// The first frame we're on ground, adjust
	// relative velocity
	if (!prevGround && self.currentGround) {
		if (self.vy >= self.currentGround.vy) {
			self.vy = self.currentGround.vy;

			// Draw particles
			var diff = Math.abs(self.rvy - self.currentGround.vy);
			createParticles({
				x: self.x + (self.w / 2),
				y: self.y + self.h,
				vx: (self.rvx - self.currentGround.vx) * 0.5,
				vy: -5,
				count: diff,
				spread: Math.PI / 16,
				maxAge: 1000,
				dimensions: 4,
				color: "rgba(0, 0, 0, 0.7)",
			});

			// Adjust relative velocity
			self.rvx -= self.currentGround.vx;
			self.rvy = 0;

		}

	// The first frame we're off the ground,
	// make relative velocity absolute again
	} else if (prevGround && !self.currentGround) {
		self.rvx += prevGround.vx;
		self.rvy += prevGround.vy;
	}

	// Let entity update its relative velocity
	if (self.updateRV)
		self.updateRV(dt);

	// Gravity if not on ground
	if (!self.currentGround)
		self.rvy += gravity * dt;

	// Friction
	var fric = self.currentGround ? groundFriction : airFriction;
	var xRatio = 1 / (1 + (dt * fric));
	self.rvx *= xRatio;

	// Update velocity based on relative velocity
	self.vx = self.rvx;
	self.vy = self.rvy;

	// Move according to ground
	if (self.currentGround) {
		self.vx += self.currentGround.vx;
		self.vy += self.currentGround.vy;
		self.y = self.currentGround.y - self.h + 1;
	}

	// Don't end up inside walls horizontally
	for (var i in sideCollissions) {
		var ent = sideCollissions[i];
		var side = entsCollideSide(self, ent, dt);

		if (side == 0 && self.vx >= 0) {
			self.x = ent.x - self.w;
			self.rvx = 0;
			self.vx = 0;
		} else if (side === 2 && self.vx <= 0) {
			self.x = ent.x + ent.w;
			self.rvx = 0;
			self.vx = 0;
		}
	}
}

// Distance between two points
function dist(x1, y1, x2, y2) {
	var lx = x2 - x1;
	var ly = y2 - y1;
	return Math.sqrt(lx * lx) + Math.sqrt(ly * ly);
}

// Path, used for entities which use pathing
function Path(type, frames, draw, pts) {
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
		if (!draw)
			return;

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

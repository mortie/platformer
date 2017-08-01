
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

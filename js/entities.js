
// Entity 'platform'
function Platform(x, y, w, h, path) {
	var self = {
		x, y, w, h,
		vx: 0, vy: 0 };

	self.draw = function(ctx) {
		path && drawPath(self, ctx, x, y, path);

		outline(self, ctx);
		ctx.fillStyle = "black";
		ctx.strokeStyle = "grey";
		ctx.fill();
		ctx.stroke();
	}

	self.update = function() {
		if (path)
			path.move(self, x, y);
	}

	return self;
}

// Entity 'wall'
function Wall(x, y, w, h) {
	var self = {
		x, y, w, h,
		vx: 0, vy: 0 };

	self.draw = function(ctx) {
		outline(self, ctx);
		ctx.strokeStyle = "black";
		ctx.stroke();
	}

	self.update = function() {}

	return self;
}

// Entity 'victory'
function Victory(x, y, physics, path) {
	var self = {
		x, y, w: 30, h: 30,
		vx: 0, vy: 0,
		rvx: 0, rvy: 0,
		currentGround: null };

	self.draw = function(ctx) {
		path && drawPath(self, ctx, x, y, path);

		ctx.beginPath();
		ctx.arc(
			self.w / 2,
			self.h / 2,
			self.w / 2,
			0, 2 * Math.PI);
		ctx.fillStyle = "green";
		ctx.strokeStyle = "blue";
		ctx.fill();
		ctx.stroke();
	}

	self.update = function(dt) {
		if (path)
			path.move(self, x, y);
		else if (physics)
			entPhysics(self, dt);
	}

	self.ontouch = function(ent) {
		console.log(ent);
		stop();
		alert("Victory!");
		setTimeout(init, 0);
	}

	return self;
}

// Entity 'player'
function Player(x, y) {
	var self = {
		x, y, w: 20, h: 20,
		vx: 0, vy: 0,
		rvx: 0, rvy: 0,
		currentGround: null };

	var spd = 1.7;
	var spdAir = 0.3;
	var spdAirLimit = 6;
	var jmp = 7;

	var jumpTimeMax = 500;
	var updrift = 0.5 / jumpTimeMax

	var jumpTime = 0;
	var jumping = false;

	var dirtEmitter = {
		count: 2,
		vy: -4,
		maxAge: 1000,
		spread: Math.PI / 14,
		color: "#000000",
		dimensions: 3,
	};
	function emitDirt() {
		dirtEmitter.x = self.x + self.w / 2;
		dirtEmitter.y = self.y + self.h;
		dirtEmitter.vx = self.vx * 0.7;
		createParticles(dirtEmitter);
	}

	self.draw = function(ctx) {
		outlineSkewed(self, ctx, 2, 1);
		ctx.fillStyle = "black";
		ctx.strokeStyle = "grey";
		ctx.fill();
		ctx.stroke();
	}

	self.update = function(dt) {
		entPhysics(self, dt);
	}

	self.updateRV = function(dt) {
		var currSpd = self.currentGround ? spd : spdAir;

		if (jumping && (self.currentGround || !keys.up))
			jumping = false;
		if (jumpTime <= 0)
			jumping = false;

		if (jumping) {
			self.rvy -= updrift * jumpTime * dt;
			jumpTime -= dt * dtScalar;
		}

		if (keys.left) {
			var newrvx = self.rvx - currSpd * dt;
			if (self.currentGround || newrvx > -spdAirLimit) {
				if (self.currentGround && self.rvx > 0.1)
					emitDirt();
				self.rvx = newrvx;
			}
		}
		if (keys.right) {
			var newrvx = self.rvx + currSpd * dt;
			if (self.currentGround || newrvx < spdAirLimit) {
				if (self.currentGround && self.rvx < -0.1)
					emitDirt();
				self.rvx = newrvx;
			}
		}
		if (keys.up && self.currentGround && self.rvy >= -1) {
			self.rvy -= jmp;
			jumping = true;
			jumpTime = jumpTimeMax;
		}
	}

	return self;
}

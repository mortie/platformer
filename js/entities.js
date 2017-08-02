
// Entity 'platform'
function Platform(x, y, w, h, path) {
	var self = {
		x, y, w, h,
		vx: 0, vy: 0 };

	self.draw = function(ctx) {
		outline(self, ctx);
		ctx.fillStyle = "black";
		ctx.strokeStyle = "grey";
		ctx.fill();
		ctx.stroke();

		if (path) {
			ctx.translate(
				-self.x + x + self.w / 2,
				-self.y + y + self.h / 2);
			path.draw(ctx);
		}
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
function Victory(x, y, path, physics) {
	var self = {
		x, y, w: 30, h: 30,
		vx: 0, vy: 0,
		rvx: 0, rvy: 0,
		currentGround: null };

	self.draw = function(ctx) {
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

	var spd = 1.5;
	var spdAir = 0.3;
	var jmp = 11;

	var jumping = false;

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

		if (jumping && self.currentGround)
			jumping = false;

		if (jumping && !keys.up && self.rvy < 0) {
			self.rvy = self.rvy * -0.5
			jumping = false;
		}

		if (keys.left)
			self.rvx -= currSpd * dt;
		if (keys.right)
			self.rvx += currSpd * dt;
		if (keys.up && self.currentGround && self.rvy >= -1) {
			self.rvx = self.vx;
			self.rvy = self.vy - jmp;
			jumping = true;
		}
	}

	return self;
}

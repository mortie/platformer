
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
		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";
		ctx.fill();
		ctx.stroke();
	}

	self.update = function() {}

	return self;
}

// Entity 'victory'
function Victory(x, y, physics, path) {
	var self = {
		x, y, w: 0.75, h: 0.75,
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
		if (ent !== player)
			return;

		stop();
		alert("Victory!");
		setTimeout(init, 0);
	}

	return self;
}

// Entity 'player'
function Player(x, y) {
	var self = {
		x, y, w: 0.25, h: 0.25,
		vx: 0, vy: 0,
		rvx: 0, rvy: 0,
		currentGround: null };

	var spd = 28;
	var spdAir = 8;
	var spdAirLimit = 6;
	var jmp = 4;

	var jumpTimeMax = 0.4;
	var updrift = 40;

	var jumpTime = 0;
	var jumping = false;

	var prevGround = null;

	var dirtEmitter = {
		count: 2,
		vy: -2,
		maxAge: 1,
		spread: Math.PI / 8,
		color: "#000000",
		dimensions: unit.cm(7),
	};
	function emitDirt(dig) {
		dirtEmitter.x = self.x + self.w / 2;
		dirtEmitter.y = self.y + self.h;
		dirtEmitter.vx = dig ? 0 : self.vx;
		createParticles(dirtEmitter);
		screenShake(Math.abs(dig ? 3 : self.vx) * 2)
	}

	self.draw = function(ctx) {
		outlineSkewed(self, ctx, unit.cm(5), unit.cm(3));
		ctx.fillStyle = "#55cc55";
		ctx.strokeStyle = "grey";
		ctx.fill();
		ctx.stroke();
	}

	self.bounceUp = function() {
		self.rvy = -Math.abs(self.rvy);
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

		// Hold up to jump higher
		if (jumping) {
			self.rvy -= updrift * jumpTime * dt;
			jumpTime -= dt;
		}

		// Move left, right, up, down
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
		if (keys.down) {
			self.ignorePlatforms = true;
			if (self.currentGround && self.currentGround.name === "platform")
				emitDirt(true);
		} else {
			self.ignorePlatforms = false;
		}


		// Shake screen on landing
		if (self.currentGround && !prevGround) {
			screenShake((self.pvy - self.currentGround.vy - 4) * 10);
		}

		prevGround = self.currentGround;
	}

	return self;
}

function EnemyFollower(x, y) {
	var self = {
		x, y, w: 0.4, h: 0.5,
		vx: 0, vy: 0,
		rvx: 0, rvy: 0,
		currentGround: null };

	var spd = 20;
	var jmp = 5.2;
	var invincible = false;
	var invincnt = 0;
	var health = 3;

	var future = {
		x: self.x, y: self.y,
		w: self.w, h: self.h,
		currentGround: self.currentGround,
	};

	var canJump = true;
	var jmpTimeout = null;
	function jump(jmp, force) {
		if (!self.currentGround)
			return;

		if (canJump || force) {
			self.rvy -= jmp;
			canJump = false;
			clearTimeout(jmpTimeout);
			jmpTimeout = setTimeout(() => canJump = true, randint(1500, 3000));
		}
	}

	self.draw = function(ctx) {
		outlineSkewed(self, ctx, unit.cm(5), unit.cm(3));
		if (invincible) {
			if (invincnt % 4 < 2)
				ctx.fillStyle = "rgb(255, 50, 50)";
			else
				ctx.fillStyle = "rgba(255, 50, 50, 0.3)";
			invincnt += 1;
		} else {
			ctx.fillStyle = "rgb(255, 50, 50)";
		}
		ctx.strokeStyle = "grey";
		ctx.fill();
		ctx.stroke();
	}

	self.update = function(dt) {
		entPhysics(self, dt);

		if (!invincible && entsCollide(self, player)) {
			var side = entsCollideSide(player, self, dt);
			if (side === 1) {
				health -= 1;
				if (health === 0) {
					self.dead = true;
				} else {
					self.h /= 1.8;
					invincible = true;
					entBounceUp(player, self, dt);
					setTimeout(() => invincible = false, 300);
				}
			} else {
				setTimeout(() => {
					stop();
					alert("Loss!");
					setTimeout(init, 0);
				}, 0);
			}
		}
	}

	self.updateRV = function(dt) {
		if (self.currentGround) {
			if (self.x + self.w / 2 > player.x + player.h / 2)
				self.rvx -= spd * dt;
			else
				self.rvx += spd * dt;

			if (self.y > player.y + 1.5)
				jump(jmp);

			// Will we be on ground next tick?
			future.currentGround = self.currentGround;
			future.x = self.x + self.vx * dt;
			future.y = self.y + self.vy * dt;
			entGroundCollissions(future, dt);
			if (!future.currentGround) {
				console.log("I will not be on ground next frame.");
				console.log(self.vy);
				jump(jmp, true);
			}
		}
	}

	return self;
}

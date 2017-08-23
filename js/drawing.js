function scale(x) {
	return x * gameScale;
}

// Create path around entity
function outline(self, ctx) {
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(scale(self.w), 0);
	ctx.lineTo(scale(self.w), scale(self.h));
	ctx.lineTo(0, scale(self.h));
	ctx.closePath();
}

// Create path around entity, skewed according to velocity
function outlineSkewed(self, ctx, mx, my) {
	if (mx == null) mx = 1;
	if (my == null) my = 1;
	var offsX = self.vx * mx;
	var offsY = self.vy * my;

	ctx.beginPath();
	ctx.moveTo(scale(-offsX), scale(-offsY));
	ctx.lineTo(scale(-offsX + self.w), scale(-offsY));
	ctx.lineTo(scale(self.w), scale(self.h));
	ctx.lineTo(0, scale(self.h));
	ctx.closePath();
}

// Draw a path from the center of entity
function drawPath(self, ctx, ox, oy, path) {
	var tx = scale(-self.x + ox + self.w / 2);
	var ty = scale(-self.y + oy + self.h / 2);
	ctx.translate(tx, ty);
	path.draw(ctx);
	ctx.translate(-tx, -ty);
}

// Shake the screen
function screenShake(n) {
	if (shake < n)
		shake = n;
}

// Create particles
// options: { x, y, vx, vy, ax, ay, count, spread, color, accel, maxAge, dimensions }
function createParticles(options) {
	if (options.count === 0)
		return;

	var spread = options.spread;
	var x = options.x + options.dimensions / 2;
	var y = options.y + options.dimensions / 2;
	var vx = options.vx;
	var vy = options.vy;
	var ax = options.ax == null ? 0 : options.ax;
	var ay = options.ay == null ? gravity : options.ay;

	var list = [];
	for (var i = 0; i < options.count; ++i) {
		var angle =
			Math.atan2(vy, vx) +
			spread - (Math.random() * spread * 2)

		var magnitude = Math.sqrt(vx * vx + vy * vy);

		var pvx = magnitude * Math.cos(angle);
		var pvy = magnitude * Math.sin(angle) * ((Math.random() * 0.5) + 1);

		list.push({
			x: x, y: y,
			vx: pvx, vy: pvy,
		});
	}

	particles.push({
		list: list,
		age: 0,
		maxAge: options.maxAge,
		dimensions: options.dimensions,
		color: options.color,
		ax, ay
	});
}


// Create path around entity
function outline(self, ctx) {
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(self.w, 0);
	ctx.lineTo(self.w, self.h);
	ctx.lineTo(0, self.h);
	ctx.closePath();
}

// Create path around entity, skewed according to velocity
function outlineSkewed(self, ctx, mx, my) {
	if (mx == null) mx = 1;
	if (my == null) my = 1;
	var offsX = self.vx * mx;
	var offsY = self.vy * my;

	ctx.beginPath();
	ctx.moveTo(-offsX, - offsY);
	ctx.lineTo(-offsX + self.w, - offsY);
	ctx.lineTo(self.w, self.h);
	ctx.lineTo(0, self.h);
	ctx.closePath();
}

// Draw a path from the center of entity
function drawPath(self, ctx, ox, oy, path) {
	var tx = -self.x + ox + self.w / 2;
	var ty = -self.y + oy + self.h / 2;
	ctx.translate(tx, ty);
	path.draw(ctx);
	ctx.translate(-tx, -ty);
}

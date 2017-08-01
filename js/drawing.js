
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
	ctx.moveTo(-offsX, 0);
	ctx.lineTo(-offsX + self.w, 0);
	ctx.lineTo(self.w, self.h + offsY);
	ctx.lineTo(0, self.h + offsY);
	ctx.closePath();
}

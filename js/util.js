
// Random integer in range
function randint(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random number in range
function random(min, max) {
	return Math.random() * (max - min + 1) + min;
}

// Run 'func' in the next game tick
function nextGameTick(func) {
	return window.requestAnimationFrame(func);
	//return setTimeout(() => func(new Date().getTime()), 1000 / 60);
}
function cancelGameTick(arg) {
	return window.cancelAnimationFrame(arg);
	//clearTimeout(arg);
}

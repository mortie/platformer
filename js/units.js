var unit = {
	s: x => x,
	ds: x => x * 0.1,
	cs: x => x * 0.01,
	ms: x => x * 0.001,

	m: x => x,
	dm: x => x * 0.1,
	cm: x => x * 0.01,
	mm: x => x * 0.001,
	pixels: x => x / gameScale,
};

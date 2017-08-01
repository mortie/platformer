var $$ = document.getElementById.bind(document);

var elems = {
	run: $$("run"),
	sidebar: $$("sidebar"),
	sidebar_name: $$("sidebar-name"),
	sidebar_props: $$("sidebar-props"),
};

function onclick(el, fn) {
	el.addEventListener("click", fn);
}

function onmove(el, fn) {
	el.addEventListener("mousemove", fn)
}

// Click on an entity
var currEnt = null;
onclick(game.can, evt => {
	var x = evt.x + camx;
	var y = evt.y + camy;

	for (var i in entities) {
		var ent = entities[i];
		var e = ent.realEnt;
		console.log(x, e.x, e.w, y, e.y, e.h);
		if (
			x >= e.x && x <= e.x + e.w &&
			y >= e.y && y <= e.y + e.h) {

			currEnt = ent;
			updateSidebar();
			return;
		}
	}

	currEnt = null;
	updateSidebar();
});

// Drag the selected entity
onmove(game.can, evt => {
	if (evt.buttons !== 1)
		return;

	if (currEnt) {
		currEnt.props.x += evt.movementX;
		currEnt.realEnt.x += evt.movementX;
		currEnt.props.y += evt.movementY;
		currEnt.realEnt.y += evt.movementY;
	} else {
		camx -= evt.movementX;
		camy -= evt.movementY;
	}
	render();
});

// Update the sidebar to reflect the currently selected entity
function updateSidebar() {
	if (currEnt == null) {
		elems.sidebar.className = "";
	} else {
		elems.sidebar.className = "active";
		elems.sidebar_name.innerText = currEnt.name;
	}
}

// Toggle running
var running = false;
onclick(elems.run, () => {
	if (running) {
		elems.run.className = "";
		stopGame();
	} else {
		elems.run.className = "running";
		startGame();
	}
	running = !running;
});

// Buttons to spawn entities
function spawnBtn(id, entType) {
	onclick($$(id), () => {
		currEnt = spawnEnt(entType, {});
		render();
	});
}
spawnBtn("spawn-platform", entTypes.platform);
spawnBtn("spawn-wall", entTypes.wall);
spawnBtn("spawn-victory", entTypes.victory);

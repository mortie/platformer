var $$ = document.getElementById.bind(document);

function throttle(fn, time) {
	if (time == null) time = 100;
	var timeout = null;
	return function() {
		if (timeout != null)
			return;
		timeout = setTimeout(() => {
			timeout = null;
			fn();
		}, time);
	}
}

var elems = {
	run: $$("run"),
	sidebar: $$("sidebar"),
	sidebar_name: $$("sidebar-name"),
	sidebar_props: $$("sidebar-props"),
};

function onclick(el, fn) {
	el.addEventListener("click", fn, false);
}

function onclickend(el, fn) {
	el.addEventListener("mouseup", fn, false);
}

function onclickstart(el, fn) {
	el.addEventListener("mousedown", fn, false);
}

function onmove(el, fn) {
	el.addEventListener("mousemove", fn, false);
}

// Click on an entity
var clickStartX = 0;
var clickStartY = 0;
onclickstart(game.can, evt => {
	clickStartX = evt.x;
	clickStartY = evt.y;
});
var currEnt = null;
onclickend(game.can, evt => {
	if (
		Math.abs(evt.x - clickStartX) > 10 ||
		Math.abs(evt.y - clickStartY) > 10)
		return;

	var x = evt.x + camx;
	var y = evt.y + camy;

	for (var i in entities) {
		var ent = entities[i];
		var e = ent.realEnt;
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
		updateSidebar();
	} else {
		camx -= evt.movementX;
		camy -= evt.movementY;
	}
	render();
});

// Update the sidebar to reflect the currently selected entity
function _updateSidebar() {
	if (currEnt == null) {
		elems.sidebar.className = "";
	} else {
		elems.sidebar.className = "active";
		elems.sidebar_name.innerText = currEnt.name;

		var p = elems.sidebar_props;
		p.innerHTML = "";

		for (var i in currEnt.props) {
			var d = document.createElement("div");
			d.innerText = i+": "+currEnt.props[i].toString();
			p.appendChild(d);
		}
	}
}
var updateSidebar = throttle(_updateSidebar);

// Toggle running
var running = false;
onclick(elems.run, () => {
	if (running) {
		elems.run.className = "";
		stopGame();
	} else {
		elems.run.className = "active";
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

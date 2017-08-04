var $$ = document.getElementById.bind(document);
var elems = {
	run: $$("run"),
	sidebar: $$("sidebar"),
	sidebar_name: $$("sidebar-name"),
	sidebar_props: $$("sidebar-props"),
	props: {
		platform: $$("ent-platform"),
		wall: $$("ent-wall"),
		victory: $$("ent-victory"),
		player: $$("ent-player"),
	},
	selection: $$("selection"),
};

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

function getElemVal(el) {
	if (el.tagName === "INPUT") {
		if (el.type === "number")
			return parseFloat(el.value);
		else if (el.type === "checkbox")
			return !!el.checked;
		else
			return el.value;
	} else if (el.tagName === "SELECT") {
		return el.value;
	} else {
		throw new Error("Invalid element type: "+el.tagName);
	}
}

function elemsAddListener(elems, evt, fn) {
	for (var i in elems) {
		elems[i].addEventListener(evt, fn);
	}
	return { fn, elems, evt };
}
function elemsRemoveListener(listeners) {
	for (var i in listeners.elems) {
		listeners.elmes[i].removeEventListener(listeners.evt, listeners.fn);
	}
}

// TODO: fix
function setElemVal(el, val) {
	el.value = val;
}

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

function onkeydown(fn) {
	window.addEventListener("keydown", fn);
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
		updateSelection();
	} else {
		camx -= evt.movementX;
		camy -= evt.movementY;
	}
	render();
});

// Keyboard control
onkeydown(evt => {
	if (currEnt == null)
		return;
	if (document.activeElement !== document.body)
		return;

	if (evt.keyCode === 37)
		currEnt.props.x -= 1;
	else if (evt.keyCode === 38)
		currEnt.props.y -= 1;
	else if (evt.keyCode === 39)
		currEnt.props.x += 1;
	else if (evt.keyCode === 40)
		currEnt.props.y += 1;
	else
		return;

	currEnt.realEnt.x = currEnt.props.x;
	currEnt.realEnt.y = currEnt.props.y;
	render();
	updateSidebar();
	updateSelection();
});

// Update the selection outline element
function updateSelection() {
	elems.selection.style.marginLeft = (currEnt.realEnt.x - camx)+"px";
	elems.selection.style.marginTop = (currEnt.realEnt.y - camy)+"px";
	elems.selection.style.width = (currEnt.realEnt.w)+"px";
	elems.selection.style.height = (currEnt.realEnt.h)+"px";
}

// Update the sidebar to reflect the currently selected entity
var lastSidebarEnt = null;
var sidebarListeners = null;
function _updateSidebar() {
	var updated = currEnt !== lastSidebarEnt;
	lastSidebarEnt = currEnt;

	if (currEnt == null) {
		elems.sidebar.className = "";
		elems.selection.className = "";

		if (sidebarListeners != null) {
			elemsRemoveListener(sidebarListeners);
			sidebarListeners = null;
		}
		return;
	}

	// Init elements
	if (updated) {

		// Init sidebar
		elems.sidebar.className = "active";
		elems.sidebar_name.innerText = currEnt.name;
		elems.sidebar_props.className = "ent-"+currEnt.name;

		// Init selection
		elems.selection.className = "active";
		updateSelection();
	}

	// Update property list with values
	var propsEl = elems.props[currEnt.name];
	var inputs = [];
	for (var i in propsEl.childNodes) {
		var node = propsEl.childNodes[i];
		if (node.tagName !== "LABEL")
			continue;

		var input = node.lastChild;
		if (currEnt.props[input.name] === undefined)
			throw new Error("Invalid property name for entity: "+input.name);
		setElemVal(input, currEnt.props[input.name]);

		if (updated)
			inputs.push(input);
	}

	// Create listeners
	if (updated) {
		var fn = evt => {
			var val = getElemVal(evt.target);
			var name = evt.target.name;

			validateProp(val, currEnt.entType.props[name]);
			if (evt.target.type === "number") {
				var delta = Math.abs(val - currEnt.props[name]);

				if (delta <= 1 || evt.type === "change") {
					currEnt.props[name] = val;
				}
			} else {
				currEnt.props[name] = val;
			}

			currEnt.createReal();
			render();
			updateSelection();
		}
		elemsAddListener(inputs, "input", fn);
		elemsAddListener(inputs, "change", fn);
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
		currEnt = null;
		updateSidebar();
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
		updateSidebar();
	});
}
spawnBtn("spawn-platform", entTypes.platform);
spawnBtn("spawn-wall", entTypes.wall);
spawnBtn("spawn-victory", entTypes.victory);

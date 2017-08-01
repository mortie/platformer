(function() {

// The various types of entities available
var entTypes = {
	platform: {
		name: "platform",
		props: {
			x: "number", y: "number",
			w: "number", h: "number",
			type: [ /bounce|loop/, "null" ],
			frames: [ "number", "null" ],
			path: [ Array, "null" ],
		},
		defaults: { x: 100, y: 100, w: 100, h: 20 },
	},

	wall: {
		name: "wall",
		props: {
			x: "number", y: "number",
			w: "number", h: "number",
		},
		defaults: { x: 100, y: 100, w: 100, h: 20 },
	},

	victory: {
		name: "victory",
		props: {
			x: "number", y: "number",
			type: [ /bounce|loop/, "null" ],
			frames: [ "number", "null" ],
			path: [ Array, "null" ],
			physics: [ "boolean", "null" ],
		},
		defaults: { x: 100, y: 100 },
	},

	player: {
		name: "player",
		props: {
			x: "number", y: "number",
		},
		defaults: { x: 100, y: 100 },
	},
};

var entities = [];

// Validate
function validateProps(entType, props) {
	function valid(real, template) {
		if (template instanceof Array) {
			for (var i in template) {
				if (valid(real, template[i]))
					return true;
			}

			return false;
		}

		if (template === "null")
			return real == null;
		if (typeof template === "string")
			return typeof real === template;
		if (template instanceof RegExp)
			return typeof real === "string" && template.match(real);
		if (typeof template === "function")
			return real instanceof template;

		throw new Error("Invalid template.");
	}

	for (var name in entType.props) {
		var real = props[name];
		var template = entType.props[name];
		if (!valid(real, template)) {
			throw new Error(
				"Invalid value for property "+name+": "+
				"Expected "+template.toString());
		}
	}
}

// Create an entity
function Entity(entType, props, idx) {
	var self = {
		name: entType.name,
		props: props,
		entType: entType,
		idx: idx,
	};

	// Set default values
	for (var i in entType.defaults) {
		if (self.props[i] == null)
			self.props[i] = entType.defaults[i];
	}

	// Are the properties valid?
	validateProps(entType, self.props);

	// Create an instance of an actual game entity
	self.createReal = function() {
		self.realEnt = game.createEnt(self.name, self.props);
	}
	
	// Start with a realEnt
	self.createReal();

	return self;
}

// Turn entities array into a level string
function createLevelString() {
	var str = "";
	entities.forEach(ent => {
		str +=
			ent.name+" "+
			JSON.stringify(ent.props)+";\n";
	});
	return str;
}

// Spawn an entity and add it to the entities array
function spawnEnt(entType, props) {
	var idx = entities.length;
	var ent = Entity(entType, props, idx);
	entities.push(ent);
	return ent;
}

// Draw the current state
var camx = 0;
var camy = 0;
function render() {
	game.init(null, true);
	game.setCamera(camx, camy);
	entities.forEach(ent => {
		game.drawEnt(ent.realEnt, game.ctx);
	});
}

// Start an actual session of the game
function startGame() {
	game.init(createLevelString());
}

// Stop the game session
function stopGame() {
	game.stop();
	render();
}

// Always start with a player and a wall
spawnEnt(entTypes.player,
	{ x: 100, y: 100 });
spawnEnt(entTypes.wall,
	{ x: 50, y: 150, w: 300 });
render();

// GUI
(function() {
#include "gui.js"
})();

})();

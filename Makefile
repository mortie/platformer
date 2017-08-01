bundle.js: js/game.js js/entities.js
	cpp -P js/game.js >bundle.js

clean:
	rm -f bundle.js

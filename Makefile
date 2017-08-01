TARGET=bundle.js
SOURCE=js/game.js

$(TARGET): $(shell find js -name '*.js') creator/bundle.js
	cpp -P $(SOURCE) >$(TARGET)

creator/bundle.js: $(shell find creator/js -name '*.js')
	make -C creator

clean:
	rm -f $(TARGET)
	make -C creator clean

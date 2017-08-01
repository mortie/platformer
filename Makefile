TARGET=bundle.js
SOURCE=js/game.js

$(TARGET): $(shell find js -name '*.js')
	cpp -P $(SOURCE) >$(TARGET)

clean:
	rm -f $(TARGET) deps.d

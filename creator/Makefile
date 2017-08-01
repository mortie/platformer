TARGET=bundle.js
SOURCE=js/creator.js

$(TARGET): $(shell find js -name '*.js')
	cpp -P $(SOURCE) >$(TARGET)

clean:
	rm -f $(TARGET)

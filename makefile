# Order matters for JS deps.
INFUSE_JS_DEPS = gen/infuse.js

INFUSE_TESTS = $(patsubst test/%.js.sdoc,gen/%-test.js,$(wildcard test/*))

INFUSE_DOCS  = $(patsubst test/%.js.sdoc,doc/%.md,$(wildcard test/*)) \
	       $(patsubst src/%.js.sdoc,doc/%-src.md,$(wildcard src/*))

.PHONY: all test

all: test infuse.js infuse-node.js infuse.min.js $(INFUSE_DOCS)

test: infuse-node.js $(INFUSE_TESTS)
	@for file in $(INFUSE_TESTS); do \
	  if node -e "infuse = require('./infuse-node'); \
		      require('./$$file')"; then \
	    echo "$$file\033[1;32m pass\033[0;0m"; \
	  else \
	    echo "$$file\033[1;31m fail\033[0;0m"; \
	  fi \
	done

infuse.js: $(INFUSE_JS_DEPS)
	cat $(INFUSE_JS_DEPS) > $@

infuse-node.js: infuse.js
	cp $< $@
	echo 'module.exports = infuse;' >> $@

# Generator rules
ifeq ($(UGLIFY), no)
%.min.js: %.js
	@echo 'note: not really minifying $@ because UGLIFY=no'
	cp $< $@
else
%.min.js: %.js
	grep -v '^\s*//' $< | uglifyjs > $@
	@echo minified size: `wc -c < $@`
	@echo min/gzip size: `gzip -c $@ | wc -c`
endif

gen/%.js: src/%.js.sdoc
	./sdoc cat code.js::$< > $@
ifneq ($(UGLIFY), no)
	uglifyjs $@ > /dev/null || mv $@ $@.broken
endif

gen/%-test.js: test/%.js.sdoc
	./sdoc cat code.js::$< \
	  | perl -ple 's@^((?:(?!->).)*)\s->\s+((?:(?!//).)+)(//.*)?$$@infuse.assert_equal(($$1), ($$2));$$3@g' \
	  > $@
ifneq ($(UGLIFY), no)
	uglifyjs $@ > /dev/null || mv $@ $@.broken
endif

doc/%.md: test/%.js.sdoc
	./sdoc cat markdown::$< > $@

doc/%-src.md: src/%.js.sdoc
	./sdoc cat markdown::$< > $@

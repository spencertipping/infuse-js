# Order matters for JS deps.
INFUSE_JS_DEPS = gen/infuse.js \
		 gen/mixin-pull.js gen/mixin-push.js \
		 gen/funnel.js gen/cell.js \
		 gen/util.js \
		 gen/heapmap.js gen/cache.js \
		 gen/fn.js gen/keygate.js \
		 gen/array.js gen/tail.js gen/object.js gen/multiobject.js \
		 gen/future.js gen/signal.js gen/edge.js \
		 gen/methods.js

INFUSE_TESTS = $(patsubst test/%.js.sdoc,gen/%-test.js,$(wildcard test/*))

INFUSE_DOCS  = $(patsubst test/%.js.sdoc,doc/%.md,$(wildcard test/*)) \
	       $(patsubst src/%.js.sdoc,doc/%-src.md,$(wildcard src/*))

.PHONY: all repl test

all: test infuse.js infuse-node.js infuse.min.js $(INFUSE_DOCS)
repl: infuse-node.js
	node -e "infuse = require('./infuse-node'); \
		 require('repl').start('infuse> ').context.infuse = infuse"

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
endif

gen/%.js: src/%.js.sdoc
	./sdoc cat code.js::$< > $@
ifneq ($(UGLIFY), no)
	uglifyjs $@ > /dev/null || rm $@
endif

gen/%-test.js: test/%.js.sdoc
	./sdoc cat code.js::$< \
	  | sed -r 's/^(.*)->\s*(.*)$$/infuse.assert_equal((\1), (\2));/g' \
	  > $@
ifneq ($(UGLIFY), no)
	uglifyjs $@ > /dev/null || rm $@
endif

doc/%.md: test/%.js.sdoc
	./sdoc cat markdown::$< > $@

doc/%-src.md: src/%.js.sdoc
	./sdoc cat markdown::$< > $@

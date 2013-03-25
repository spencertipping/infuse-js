# Infuse.js

Infuse.js provides a uniform API for accessing Javascript-native objects and
arrays, as well as defining futures, signals, inversions, invariants, and other
types of its own. Like jQuery, it maintains a separate prototype for shared
methods and does not monkey-patch any builtin prototypes.

Infuse is quite simply the best Javascript library that could ever possibly
exist, ever. I realize you don't believe me, but that's probably because you
haven't yet checked out the *totally epic* builtin types:

- [arrays](doc/array.md)
- [objects](doc/object.md)
- [multiobjects](doc/multiobject.md)
- [functions](doc/fn.md) (warning: unfathomably awesome)
- [futures](doc/future.md)
- [signals](doc/signal.md)
- [the `get` method](doc/get.md)
- [edges](doc/edge.md)
- [sorting](doc/sorting.md)
- [awaiting](doc/await.md)

Also useful:

- [methods supported by all types](doc/methods-src.md)
- [global utility functions](doc/util-src.md)

And the low-level stuff:

- [generators](doc/generators.md)
- [versions](doc/versions.md)
- [constructors](doc/constructors.md)
- [heapmap](doc/heapmap.md)

Annotated source (you should read this if you want to extend Infuse):

- [array](doc/array-src.md)
- [cache](doc/cache-src.md)
- [cell](doc/cell-src.md)
- [edge](doc/edge-src.md)
- [fn](doc/fn-src.md)
- [funnel](doc/funnel-src.md)
- [future](doc/future-src.md)
- [heapmap](doc/heapmap-src.md)
- [infuse](doc/infuse-src.md)
- [keygate](doc/keygate-src.md)
- [methods](doc/methods-src.md)
- [mixin-pull](doc/mixin-pull-src.md)
- [mixin-push](doc/mixin-push-src.md)
- [multiobject](doc/multiobject-src.md)
- [object](doc/object-src.md)
- [signal](doc/signal-src.md)
- [tail](doc/tail-src.md)
- [util](doc/util-src.md)

## Building Infuse

You'll need a fairly recent [node.js](http://nodejs.org) build, as well as
UglifyJS to build `infuse.min.js`. If you don't have or want Uglify, you can
`export UGLIFY=no`.

Building is usually as simple as running `make`:

    $ make
    [test output]
    $

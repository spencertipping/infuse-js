# Infuse.js

**Note: this library doesn't work yet.**

Infuse.js provides a uniform API for accessing Javascript-native objects and
arrays, as well as defining futures, signals, inversions, invariants, and other
types of its own. Like jQuery, it maintains a separate prototype for shared
methods and does not monkey-patch any builtin prototypes.

## Basic usage

Infuse defines a single global, `infuse`, that you use to wrap Javascript
primitive arrays and objects. For example:

```js
var xs = infuse([2, 4, 6, 8]);
xs.size()               // -> 4
xs.get()                // -> [2, 4, 6, 8]
```

You can modify any object that you create, even if you've handed it to Infuse
already. However, you can't modify the objects it returns. For example:

```js
xs.push(10);
xs.get()                // -> [2, 4, 6, 8, 10]
var ys = xs.map('_ + 1');
ys.get()                // -> [3, 5, 7, 9, 11]
ys.push(13);            // error
```

It works this way because Infuse supports lazy sequences and efficient
incremental updates:

```js
xs.push(12);
ys.get()                // -> [3, 5, 7, 9, 11, 13]
```

Normally, `map` is interpreted as a one-time operation that takes one sequence
and returns another. But in Infuse, `map` returns a _sequence view_ that is
updated on-demand. This paradigm is pervasive, even across data types:

```js
var grouped = xs.group('_ % 3');
index.get()             // -> {'0': [3, 9], '1': [7, 13], '2': [5, 11]}
xs.push(14);
index.get()             // -> {'0': [3, 9, 15], '1': [7, 13], '2': [5, 11]}
```

Garbage collection can be an issue when building views of large sequences, so
Infuse gives you a constant-time method to detach a view's source and make it
independently mutable:

```js
index.detach()          // -> index
index.push(17, '0')     // -> index
index.get()             // -> {'0': [3, 9, 15, 17], '1': [7, 13], '2': [5, 11]}
```

At this point, all data associated with `xs` can be garbage-collected once `xs`
goes out of scope.

## Semantics

Infuse objects generally share semantics with the Javascript objects they
represent, but with a few major exceptions:

1. You shouldn't modify objects that Infuse allocates.
2. There is no API to modify existing elements in an Infuse collection (that
   is, collections are append-only).
3. Derivative collections (e.g. `map` results) inherit changes from their
   source. Multilevel inheritance is fully supported, and all synchronous
   collections (i.e. not futures or signals) are only singly-linked from child
   to parent.

For more details, check out the narrative tests for each data type and utility
function:

- [arrays](doc/array.md)
- [objects](doc/object.md)
- [fn](doc/fn.md)

You can also see the low-level stuff:

- [cursors](doc/cursors.md)
- [versions](doc/versions.md)

## Building Infuse

You'll need a fairly recent [node.js](http://nodejs.org) build, as well as
UglifyJS to build `infuse.min.js`. If you don't have or want Uglify, you can
`export UGLIFY=no`.

Building is usually as simple as running `make`:

    $ make
    [test output]
    $

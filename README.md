# Infuse.js

**Note: this library doesn't work yet.**

Infuse.js implements inversions, futures, invariants, and a series of useful
methods that apply to objects and sequences. This is done non-intrusively by
constructing a wrapper around the object, similar to the way that jQuery wraps
the DOM.

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
mutable:

```js
index.detach()          // -> index
index.push(17, '0')     // -> index
index.get()             // -> {'0': [3, 9, 15, 17], '1': [7, 13], '2': [5, 11]}
```

At this point, all data associated with `xs` can be garbage-collected once `xs`
goes out of scope.

## MOAR DOCS TODO

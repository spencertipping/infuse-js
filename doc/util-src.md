Infuse utilities | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines global functions on the `infuse` global.

```js
infuse.extend(function (infuse) {
```

# Function constructors

Various commonly-used functions.

```js
infuse.identity = function (x) {return x};
infuse.id       = infuse.identity;
```

```js
infuse.always     = function (x) {return function () {return x}};
infuse.constantly = infuse.always;
infuse.k          = infuse.always;
```

```js
infuse.tap = function (v, fn) {
  infuse.fnarg(arguments, 1)(v);
  return v;
};
```

# Ordering functions

These are useful when you're sorting things. All elements are considered
distinct for orderings, so a ≮ a.

```js
infuse.comparator_to_ordering = function (comparator) {
  return function (x, y) {return comparator(x, y) < 0};
};
```

```js
infuse.comparator_from_ordering = function (ordering) {
  return function (x, y) {return ordering(x, y) ? -1 : 1};
};
```

# Internal functions

These are generally just used by Infuse.

```js
var id = 0;
infuse.gen_id = function () {return 'infuse-' + ++id};
```

```js
infuse.toa   = function (xs)    {return Array.prototype.slice.call(xs)};
infuse.slice = function (xs, n) {return Array.prototype.slice.call(xs, n)};
```

```js
infuse.fnarg = function (args, i) {
  // Make a function from arguments[i] and beyond. O(n) in the number of
  // arguments, though in most cases the GC overhead probably outweighs the
  // complexity.
  return infuse.fn.apply(this, infuse.slice(args, i));
};
```

```js
infuse.assert = function (x, message) {
  if (!x) throw new Error(message);
  return x;
};
```

```js
infuse.assert_equal = function (x, y) {
  infuse.assert(x === y, x + ' != ' + y);
  return x;
};
```

```js
});

```

Infuse utilities | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines global functions on the `infuse` global.

```js
infuse.extend(function (infuse) {
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
infuse.msb = function (x) {
  // Index of most-significant bit of x, where msb(1) = 0.
  for (var lower = 0, upper = 64; lower + 1 < upper;) {
    var mid     = lower + upper >>> 1,
        shifted = x >>> mid;
    if (shifted && shifted !== x) lower = mid;
    else                          upper = mid;
  }
  return lower;
};
```

```js
});

```

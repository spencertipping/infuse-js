Infuse utilities | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines global functions on the `infuse` global.

```js
infuse.extend(function (infuse) {
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

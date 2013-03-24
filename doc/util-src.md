Infuse utilities | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines global functions on the `infuse` global.

```js
infuse.extend(function (infuse) {
```

# Future constructors

Futures can be hard to work with on their own, so Infuse gives you some ways of
wrapping them and combining their values.

```js
infuse.immediate = function (v, k) {return infuse.future().push(v, k)};
```

The `await` function is most useful when you have multiple futures running
concurrently and want to wait for all of them to come back. It takes an object,
array, or Infuse collection whose values may include futures and returns a
future of a similarly-structured result whose values are all non-futures. That
is, it transposes the future-ness of the values of some collection across the
collection itself.

Note that awaiting a collection of futures ignores the futures' keys.

```js
infuse.await = function (xs) {
  var wrapped   = xs === (xs = infuse(xs)),
      root      = infuse.immediate(xs.zero()),
      collector = xs.reduce(root, function (base, v, k) {
        return v instanceof infuse.future || v instanceof infuse.signal
          ? base.flatmap(function (result) {
              return v.once().map(function (v) {return result.push(v, k)});
            })
          : base.map(function (result) {return result.push(v, k)});
      });
```

```js
  return collector.map(function (result) {
    return wrapped ? result : result.get();
  });
};
```

Similar to `await` is `progress`, which gives you a signal of reductions as the
individual futures complete. It supports signal values, not just future values,
and the reduction is updated each time of the signals changes.

```js
infuse.progress = function (xs) {
  var wrapped = xs === (xs = infuse(xs));
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

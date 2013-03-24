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

Note that awaiting a collection of futures ignores the futures' keys. You can
specify a keygate, however.

```js
infuse.await = function (xs, keygate) {
  var xs        = infuse(xs),
      keygate   = infuse.keygate(keygate),
      root      = infuse.immediate(xs.zero());
```

```js
  return xs.reduce(root, function (base, v, k) {
    return v instanceof infuse.future || v instanceof infuse.signal
      ? base.flatmap(function (result) {
          // once() is used to collapse signals into futures. More than one
          // result would trigger an error, since we're flatmapping into a
          // future.
          return v.once(keygate).map(function (v) {
            return result.push(v, k);
          });
        })
      : base.map(function (result) {return result.push(v, k)});
  });
};
```

Similar to `await` is `progress`, which gives you a signal of reductions as the
individual futures complete. It supports signal values, not just future values,
and the reduction is updated each time one of the signals changes. You can
think of `await` as intersecting futures/signals and `progress` as unioning
them.

```js
infuse.progress = function (xs, keygate) {
  var xs      = infuse(xs),
      keygate = infuse.keygate(keygate),
      root    = infuse.signal().push(xs.zero());
```

```js
  return xs.reduce(root, function (base, v, k) {
    var f = v instanceof infuse.future || v instanceof infuse.signal
            ? v
            : infuse.immediate(v);
    f.generator()(function (v, inner_k) {base.push(base.get().push(v, k))},
                  base.id());
    return base;
  });
};
```

Infuse gives you a global `on` function to unify futures and non-futures. If
`v` is a future or signal, then `callback` will be invoked once it is resolved;
otherwise `callback` is invoked synchronously on the value. In the latter case,
`callback` receives no key, just a value.

```js
infuse.on = function (v, keygate, callback) {
  return v instanceof infuse.future || v instanceof infuse.signal
    ? v.once(keygate, callback)
    : callback(v);
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

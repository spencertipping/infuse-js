// Infuse utilities | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module defines global functions on the `infuse` global.

infuse.extend(function (infuse) {

// Function constructors.
// Various commonly-used functions.

infuse.identity = function (x) {return x};
infuse.id       = infuse.identity;

infuse.always     = function (x) {return function () {return x}};
infuse.constantly = infuse.always;
infuse.k          = infuse.always;

infuse.tap = function (v, fn) {
  infuse.fnarg(arguments, 1)(v);
  return v;
};

// Future constructors.
// Futures can be hard to work with on their own, so Infuse gives you some ways of
// wrapping them and combining their values.

infuse.immediate = function (v, k) {return infuse.future().push(v, k)};

// The `await` function is most useful when you have multiple futures running
// concurrently and want to wait for all of them to come back. It takes an object,
// array, or Infuse collection whose values may include futures and returns a
// future of a similarly-structured result whose values are all non-futures. That
// is, it transposes the future-ness of the values of some collection across the
// collection itself.

// Note that awaiting a collection of futures ignores the futures' keys. You can
// specify a keygate, however.

infuse.await = function (xs, keygate) {
  var xs        = infuse(xs),
      keygate   = infuse.keygate(keygate),
      root      = infuse.immediate(xs.zero());

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

// Similar to `await` is `progress`, which gives you a signal of reductions as the
// individual futures complete. It supports signal values, not just future values,
// and the reduction is updated each time one of the signals changes. You can
// think of `await` as intersecting futures/signals and `progress` as unioning
// them.

infuse.progress = function (xs, keygate) {
  var xs      = infuse(xs),
      keygate = infuse.keygate(keygate),
      root    = infuse.signal().push(xs.zero());

  return xs.reduce(root, function (base, v, k) {
    var f = v instanceof infuse.future || v instanceof infuse.signal
            ? v
            : infuse.immediate(v);
    f.generator()(function (v, inner_k) {base.push(base.get().push(v, k))},
                  base.id());
    return base;
  });
};

// Infuse gives you a global `on` function to unify futures and non-futures. If
// `v` is a future or signal, then `callback` will be invoked once it is resolved;
// otherwise `callback` is invoked synchronously on the value. In the latter case,
// `callback` receives no key, just a value.

infuse.on = function (v, keygate, callback) {
  return v instanceof infuse.future || v instanceof infuse.signal
    ? v.once(keygate, callback)
    : callback(v);
};

// Ordering functions.
// These are useful when you're sorting things. All elements are considered
// distinct for orderings, so a ≮ a.

infuse.comparator_to_ordering = function (comparator) {
  return function (x, y) {return comparator(x, y) < 0};
};

infuse.comparator_from_ordering = function (ordering) {
  return function (x, y) {return ordering(x, y) ? -1 : 1};
};

// Internal functions.
// These are generally just used by Infuse.

var id = 0;
infuse.gen_id = function () {return 'infuse-' + ++id};

infuse.toa   = function (xs)    {return Array.prototype.slice.call(xs)};
infuse.slice = function (xs, n) {return Array.prototype.slice.call(xs, n)};

infuse.fnarg = function (args, i) {
  // Make a function from arguments[i] and beyond. O(n) in the number of
  // arguments, though in most cases the GC overhead probably outweighs the
  // complexity.
  return infuse.fn.apply(this, infuse.slice(args, i));
};

infuse.assert = function (x, message) {
  if (!x) throw new Error(message);
  return x;
};

infuse.assert_equal = function (x, y) {
  infuse.assert(x === y, x + ' != ' + y);
  return x;
};

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

var debruijn_shifts =
  [0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8, 31, 27, 13, 23,
   21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9];

infuse.lsb = function (x) {
  // Index of least-significant set bit of x, where lsb(1) = 0. Courtesy of
  // http://graphics.stanford.edu/~seander/bithacks.html#ZerosOnRightMultLookup
  return debruijn_shifts[(x & -x) * 0x077cb531 >>> 27];
};

});

// Generated by SDoc

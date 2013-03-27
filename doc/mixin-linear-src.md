Infuse linear-access mixin | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Some Infuse objects use numeric indexes for their elements. In these cases we
can provide some convenience methods. This mixin assumes that you have an array
(dense or sparse) called `xs_`.

```js
infuse.extend(function (infuse) {
infuse.mixin('linear', function (methods) {
```

# Retrieval

Technically we just need to implement `get` here. `first` and `last` can, in
theory, be derived from `each`, `size`, and `get`. However, doing things that
way is inefficient for arrays because we have direct access to the elements.

```js
methods.get = function (n, fn) {
  var xs = this.pull().xs_;
```

```js
  // get() -> the current backing array (don't modify this!)
  if (n === void 0) return xs;
```

```js
  // get(n) -> xs[n] or xs[n + length] if n is negative
  if (typeof n === typeof 0 || n instanceof Number)
    if (n === n >> 0)
      // n is an integer; use direct indexing (but wrap if negative)
      return xs[n < 0 ? xs.length + n : n];
    else {
      // n is a float; use interpolation.
      var f  = arguments.length > 1
               ? infuse.fnarg(arguments, 1)
               : function (a, b, x) {return a + (b-a)*x},
          i1 = (n < 0 ? xs.length : 0) + Math.floor(n),
          i2 = i1 + 1,
          x  = n - i1;
      return f(xs[i1], xs[i2], x);
    }
```

```js
  return this.get_default.apply(this, arguments);
};
```

```js
methods.first = function (n) {
  var xs = this.get();
```

```js
  // first() -> the single first element
  if (n === void 0) return xs[0];
```

```js
  // first(n) -> infuse([x0, x1, ..., xn-1])
  if (typeof n === typeof 0 || n instanceof Number)
    return infuse(xs.slice(0, n < 0 ? xs.length + n : n));
```

```js
  // first(f) -> the first element that satisfies f, or null
  var f = infuse.fn.apply(this, arguments);
  for (var i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i], i)) return xs[i];
  return null;
};
```

```js
methods.last = function (n) {
  var xs = this.get(),
      xl = xs.length;
```

```js
  // last() -> the single last element
  if (n === void 0) return xs[xl - 1];
```

```js
  // last(n) -> infuse([xn, xn+1, ..., xl-1])
  if (typeof n === typeof 0 || n instanceof Number)
    // Check for n == 0 to save an array copy if at all possible
    return infuse(n === 0 ? xs : xs.slice(n < 0 ? xl + n : n));
```

```js
  // last(f) -> the last element that satisfies f, or null
  var f = infuse.fn.apply(this, arguments);
  for (var i = xl - 1; i >= 0; ++i)
    if (f(xs[i], i)) return xs[i];
  return null;
};
```

```js
});
});

```

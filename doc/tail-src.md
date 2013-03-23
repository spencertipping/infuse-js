Infuse tails | Spencer Tipping
Licensed under the terms of the MIT source code license

# Infuse tails

A tail is an array that contains the last N items of another collection. It
uses a circular buffer to pull each update in constant time, eagerly shifting
back into a regular array when you call `get()` with no arguments.

```js
infuse.extend(function (infuse) {
infuse.type('tail', function (tail, methods) {
```

```js
infuse.mixins.pull(methods);
```

# Tail state

A tail is backed by a Javascript array. We also store the current "zero index",
which shifts as we add new elements. Tails don't always need to be derivative
objects, but that's generally where they come from.

```js
methods.initialize = function (size, generator, base) {
  this.xs_        = new Array(size),
  this.zero_      = 0,
  this.base_      = base,
  this.generator_ = generator,
  this.version_   = -1,
  this.pull();
};
```

```js
methods.size = function () {return this.xs_.length};
```

```js
methods.push_ = function (v, k) {
  var z = this.zero_++;
  this.xs_[z % this.xs_.length] = v;
  return this;
};
```

# Derivatives

Nothing particularly interesting here. Derivatives inherit the parent's size.

```js
methods.derivative = function (generator) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.tail(this.xs_.length, f, this);
};
```

# Traversal

This is kind of interesting because we want to fully update anyone following a
tail. Specifically, if someone is frequently pulling updates, they should see a
continuous array; and if they're sporadically pulling updates, they should see
as much as we can give them. This turns out to be really easy: we just use our
zero counter as an array index and behave as if we were an array.

```js
methods.generator = function () {
  var i = 0, self = this;
  return function (emit) {
    var l = self.zero_;
    i = Math.max(i, l - xs.length);
    for (var xs = self.pull().xs_; i < l;)
      if (emit(xs[i], i++) === false) return false;
  };
};
```

# Retrieval

We behave exactly like an array here, except that when interpolating we wrap
around the end.

```js
methods.get = function (n, fn) {
  var xs = this.pull().xs_,
      l  = xs.length,
      z  = this.zero_;
```

```js
  // get() -> an eager slice
  if (n === void 0)
    return xs.slice(z % l).concat(xs.slice(0, z % l));
```

```js
  // get(n) -> xs[n] or xs[n + length] if n is negative
  if (typeof n === typeof 0 || n instanceof Number)
    if (n === n >> 0)
      return xs[(n + l + z) % l];
    else {
      // interpolate
      var f  = arguments.length > 1
               ? infuse.fnarg(arguments, 1)
               : function (a, b, x) {return a + (b-a)*x},
          i1 = Math.floor(n + l + z) % l,
          i2 = (i1 + 1) % l,
          x  = n - i1;
      return f(xs[i1], xs[i2], x);
    }
```

```js
  // get([x1, x2, x3, ...]) = [get(x1), get(x2), ...]
  if (n instanceof Array) {
    for (var r = [], i = 0, l = n.length; i < l; ++i) r.push(this.get(n[i]));
    return r;
  }
```

```js
  // get(...) = fn(...)(this, this.id())
  return infuse.fn.apply(this, arguments)(this, this.id());
};
```

```js
});
});

```
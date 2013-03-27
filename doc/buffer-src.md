Infuse buffers | Spencer Tipping
Licensed under the terms of the MIT source code license

# Infuse buffers

Buffers are mutable sparse arrays. They are less efficient than normal Infuse
arrays because updates aren't localized to the end; as a result, derivatives
have to scan a heap journal to get updates.

```js
infuse.extend(function (infuse) {
infuse.type('buffer', function (buffer, methods) {
```

```js
// Use pull-propagation updating and linear indexed access
infuse.mixins.pull(methods);
infuse.mixins.linear(methods);
```

# Buffer state

A buffer holds either an array or a node.js buffer object. It also maintains an
index->version journal.

```js
methods.initialize = function (xs_or_f, base) {
  if (xs_or_f instanceof Function)
    this.xs_        = [],
    this.base_      = infuse.assert(base,
                        'infuse: attempted to construct a derivative '
                      + 'buffer without specifying a base'),
    this.generator_ = xs_or_f,
    this.version_   = -1,
    this.journal_   = infuse.heapmap(null, false),
    this.pull();
  else
    this.xs_        = xs_or_f,
    this.base_      = null,
    this.generator_ = null,
    this.version_   = 1,
    this.journal_   = null;
};
```

```js
methods.tos = function () {
  return (this.base_ ? '#[' : 'I[')
       + this.keys().sort().map('_ + ":" + xs[_]', {xs: this.xs_}).join(', ')
       + ']';
};
```

Size is the number of items known to be in the array. This is not necessarily
the same as the array's length.

```js
methods.size = function () {return this.pull().journal().size()};
```

```js
methods.push_ = function (v, i) {
  this.xs_[i = +i] = v;
  this.journal().push(this.version_, i);
  return this;
};
```

# Derivatives

See the [object source](object-src.md) for information about why we do
derivatives this way.

```js
methods.derivative = function (generator, version_base) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.buffer(f, version_base || this);
};
```

The situation in `journal` is unfortunate. The problem is that the backing
array could be sparse, in which case going through it with the usual numeric
iteration strategy would be very expensive. To work around this, we first try
going through it linearly. If we hit enough sparseness then we switch to the
object strategy.

```js
methods.journal = function () {
  var j = this.journal_;
  if (!j) {
    var xs = this.xs_,
        v  = this.version_;
```

First attempt: go through linearly, tracking the ratio of hits to misses. If we
see an undefined entry, then do the more expensive hasOwnProperty check.

```js
    j = this.journal_ = infuse.heapmap(null, false);
    var too_many_misses = false;
    for (var i = 0, l = xs.length, hits = 0, misses = 0; i < l; ++i)
      if (xs[i] === void 0 &&
          !xs.hasOwnProperty(i) &&
          (too_many_misses = (1 + hits) / (1 + hits + ++misses) < 0.01))
        break;
      else
        ++hits, j.push(v, i);
```

Second attempt: if we missed too many items, then use a sparse iterator. We
need to start over with a new heap because as far as I know there is no
guaranteed order with `for...in`, even for arrays.

```js
    if (too_many_misses) {
      j = this.journal_ = infuse.heapmap(null, false);
      for (var k in xs)
        if (xs.hasOwnProperty(k))
          j.push(v, +k);
    }
  }
  return j;
};
```

```js
methods.generator = function () {
  var journal_generator = this.journal().generator(),
      xs                = this.xs_;
  return function (emit) {
    // The version generator passes the version as 'v' and the index as 'i'; we
    // just need to translate that into our value for the key.
    return journal_generator(function (v, i) {i = +i; return emit(xs[i], i)});
  };
};
```

```js
});
});

```

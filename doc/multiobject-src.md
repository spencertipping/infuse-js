Infuse multiobjects | Spencer Tipping
Licensed under the terms of the MIT source code license

# Infuse multi-objects

These are just like Infuse objects, but they support multiple values for a
given key.

```js
infuse.extend(function (infuse) {
infuse.type('multiobject', function (multiobject, methods) {
```

```js
// Use pull-propagation updating
infuse.mixins.pull(methods);
```

# Multiobject state

Like objects, multiobjects use heapmaps to manage versioning. Unlike objects,
converting an existing object to a multiobject requires linear time and space.

```js
methods.initialize = function (o_or_f, base) {
  this.o_       = {};
  this.size_    = 0;
  this.journal_ = infuse.heapmap();
```

```js
  if (o_or_f instanceof Function)
    this.version_   = -1,
    this.generator_ = o_or_f,
    this.base_      = infuse.assert(base,
      'infuse: attempted to create a derivative multiobject without '
    + 'specifying a base'),
    this.pull();
  else {
    this.version_ = 0;
    this.generator_ = null,
    this.base_      = null;
    if (o_or_f)
      for (var k in o_or_f)
        if (Object.prototype.hasOwnProperty.call(o_or_f, k))
          this.push(o_or_f[k], k);
  }
};
```

Size is the number of key/value pairs stored, with the provision that multiple
values per key count independently. So {foo: 2, foo: 3} has size 2.

```js
methods.size = function () {return this.pull().size_};
```

```js
methods.push_ = function (v, k) {
  var o = this.o_;
```

```js
  // Even though all values we assign are truthy, it's still important to make
  // this distinction. Otherwise push_(x, 'toString') would cause a runtime
  // error.
  if (Object.prototype.hasOwnProperty.call(o, k)) o[k].push(v);
  else                                            o[k] = [v];
```

```js
  this.journal().push(this.version_, k);
  ++this.size_;
  return this;
};
```

# Derivatives

Objects can have derivatives just like arrays can, but the behavior is
different. An object derivative means "the object will gain new key/value
mappings in the future", much as an array derivative means "the array will grow
in the future". So it's a partial journal of changes that will be made to the
object.

The main difference between the two is the degree of assumption about
immutability. Arrays are only allowed to grow; we assume that elements already
in the array won't change. Objects, on the other hand, might receive value
updates for existing keys; a common case of this is when you're indexing
something. This means that a simple array journal has the potential to be
arbitrarily larger than the object it represents (since it's storing each
intermediate change).

As a result, we don't keep the journal this way. Instead, we just use an object
that maps each key to the last version at which it was modified. Each generator
can then search this object and apply updates. This makes searching O(n) when
the object has been updated, O(1) otherwise.

```js
methods.derivative = function (generator, version_base) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.multiobject(f, version_base || this);
};
```

# Traversal

This works like the one for `infuse.object`, but emits a separate key/value
pair for each value mapped by a key.

```js
methods.generator = function () {
  var journal_generator = this.journal().generator(),
      o                 = this.o_;
  return function (emit) {
    // Expand each value-array and invoke emit() multiple times per key
    return journal_generator(function (v, k) {
      for (var i = 0, xs = o[k], l = xs.length; i < l; ++i)
        if (emit(xs[i], k) === false) return false;
    });
  };
};
```

# Retrieval

The `get` method returns an array of values for any existing key.

```js
methods.get = function (k) {
  var o = this.pull().o_;
```

```js
  // get() -> o (don't modify this!)
  if (k === void 0) return o;
```

```js
  // get(k) -> o[k]
  if ((typeof k === typeof '' || k instanceof String) &&
      Object.prototype.hasOwnProperty.call(o, k))
    return o[k];
```

```js
  // get([k1, k2, ...]) = [get(k1), get(k2), ...]
  if (k instanceof Array) {
    for (var r = [], i = 0, l = k.length; i < l; ++i) r.push(this.get(k[i]));
    return r;
  }
```

```js
  // get(...) = fn(...)(this)
  return infuse.fn.apply(this, arguments)(this, this.id());
};
```

```js
});
});

```

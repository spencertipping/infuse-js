Infuse objects | Spencer Tipping
Licensed under the terms of the MIT source code license

# Infuse objects

Like Infuse arrays, objects can be constructed either by wrapping an existing
object or by specifying a generator function. If you specify a generator, the
object's value (as returned by `get`, etc) will be updated as new elements
become available.

Infuse objects are not considered to be ordered unless you call `keys` or
`values`. Each of these methods takes a sorted snapshot of the key list to
guarantee traversal order; so you could request `keys` and `values` and know
that `k[0]` corresponded to `v[0]`, for instance.

```js
infuse.extend(function (infuse) {
infuse.type('object', function (object, methods) {
```

# Object state

Like an Infuse array, an object has a backing which may be externally
allocated, and for internally-allocated backings it also has a generator and a
base.

```js
methods.initialize = function (o_or_f, base) {
  if (o_or_f instanceof Function)
    this.o_         = {},
    this.keys_      = infuse.array([]),
    this.base_      = infuse.assert(base,
                        'infuse: attempted to construct a lazy '
                      + 'object without specifying a base object'),
    this.generator_ = o_or_f,
    this.version_   = 0;
  else
    this.o_         = o_or_f,
    this.base_      = null,
    this.keys_      = null,
    this.generator_ = null,
    this.version_   = 1;
};
```

Size is the number of distinct key/value pairs stored in the object. This
function needs to be amortized O(1), so we rely on the backing key list.

```js
methods.size = function () {return this.keys().size()};
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
that maps each key to the last version at which it was modified. Each cursor
can then search this object and apply updates. This makes searching O(n) when
the object has been updated, O(1) otherwise.

```js
methods.derivative = function (generator) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.object(f, this);
};
```

```js
methods.force = function (n) {
  // FIXME
  for (var o        = this.o_,
           got_data = true,
           got_any  = false,
           emit     = function (v, k) {--n;
                                       got_data = true;
                                       o[k]     = v};
       n > 0 && got_data;
       got_any = got_any || got_data, got_data = false)
    this.generator_(emit);
  return got_any ? this.touch() : this;
};
```

```js
methods.push = function (v, k) {
  infuse.assert(!this.base_, 'infuse: attempted to modify a derivative object');
  var o = this.o_;
  if (!Object.prototype.hasOwnProperty.call(o, k)) this.keys_.push(k);
  this.touch().o_[k] = v;
  return this;
};
```

# Key/value querying

Keys and values are fairly straightforward to generate. We generally have the
keys array already, so we can just return a wrapper for it if we do. Otherwise
we generate it once on-demand.

```js
methods.keys = function () {
  var ks = this.keys_;
  if (!ks) {
    var o = this.o_;
    ks = this.keys_ = infuse.array([]);
    for (var k in o)
      if (Object.prototype.hasOwnProperty.call(o, k))
        ks.push(k);
  }
  return ks;
};
```

```js
methods.values = function () {
  // We generate this as a derivative of the key array.
  var o = this.o_;
  return this.keys().map(function (k) {return o[k]});
};
```

```js
});
```

# Object promotion

Detecting a vanilla object turns out to be tricky. We can't do the obvious `x
instanceof Object` because everything is an instance of `Object`. Long story
short, we have to rely on `Object.prototype.toString` to tell us.

```js
var obj_to_string = Object.prototype.toString.call({});
infuse.alternatives.push(
  {accepts:   function (x) {return Object.prototype.toString.call(x) ===
                                   obj_to_string},
   construct: function (x) {return infuse.object(x)}});
```

```js
});

```

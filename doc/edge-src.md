Infuse edges | Spencer Tipping
Licensed under the terms of the MIT source code license

# Infuse edges

An edge connects two signals, optionally transforming values as they travel
between them. The result is that every update to either signal will be
propagated to the other. Edges are undirected. Circular graphs will cause
stack-overflow errors, which isn't too big a deal considering what edges are
used for.

You can connect an edge to a synchronous object, but no changes will be pulled
from that object (since it never emits things asynchronously). You can,
however, invoke `pull` on the edge to look for changes on the synchronous
endpoint.

You don't generally construct edges directly; the `to` method is the simplest
way to link objects. (See the [edge tests](edge.md) for details.)

```js
infuse.extend(function (infuse) {
infuse.type('edge', function (edge, methods) {
```

```js
infuse.mixins.push(methods);
```

# Edge state

Edges maintain references to the objects they are connecting and the most
recent versions of those objects.

```js
methods.initialize = function (a, b, fab, fba) {
  this.a_    = a;
  this.b_    = b;
  this.va_   = a.version();
  this.vb_   = b.version();
  this.size_ = 0;
```

```js
  this.ga_   = a.generator();
  this.gb_   = b.generator();
```

```js
  var self = this;
  fab = infuse.fn(fab);
  fba = infuse.fn(fba);
```

```js
  this.from_a_ = function (v, k) {return self.push(fab(v, k), k)};
  this.from_b_ = function (v, k) {return self.push(fba(v, k), k)};
  this.ga_(this.from_a_, this.id());
  this.gb_(this.from_b_, this.id());
};
```

```js
methods.size = function () {return this.size_};
```

# Detachment

Detaching an edge means removing its connection to both endpoints. You can't
have an edge with just one connection. You can't reattach an edge once you have
detached it.

```js
methods.detach = function () {
  this.a_.detach_derivative(this);
  this.b_.detach_derivative(this);
  this.a_ = this.b_ = null;
  return this;
};
```

# Derivatives

Edges don't support derivatives and don't provide generators. This makes some
sense, as an edge is defined by its connectedness to specific endpoints.

```js
methods.derivative = function (generator, version_base) {
  throw new Error('infuse: cannot construct the derivative of an edge');
};
```

```js
methods.generator = function () {
  return this.sig_.generator();
};
```

# Propagation

This is tricky because each edge operates independently of other edges. As a
result, edges can't coordinate to detect infinite loops. This means that all
infinite loop detection must be done by making local observations about the
endpoints.

The key invariant here is that we're allowed to push to any endpoint we're up
to date with. So each edge becomes one-directional and idempotent within the
context of an update operation.

```js
methods.push = function (v, k) {
  var a = this.a_,
      b = this.b_;
```

```js
  infuse.assert(a && b,
    'infuse: cannot push to an edge with undefined endpoints (this '
  + 'happens if you call push() on an edge after detaching it)');
```

```js
  var va = a.version(),
      vb = b.version(),
      sa = this.va_,
      sb = this.vb_;
```

```js
  if (sa < va && sb >= vb)
    b.push(v, k),                               // commit value to b
    this.gb_(this.from_b_, this.id()),          // pull updates
    this.vb_ = sb = b.version(),                // catch up to b
    this.va_ = sa = va;                         // enable propagation back to a
```

```js
  if (sb < vb && sa >= va)
    a.push(v, k),                               // commit value to a
    this.ga_(this.from_a_, this.id()),          // pull updates
    this.va_ = sa = a.version(),                // catch up to a
    this.vb_ = sb = vb;                         // enable propagation back to b
```

```js
  return this;
};
```

You can connect an edge to one or more synchronous objects. If you do, you'll
need to manually call `pull` to get the changes to propagate. Note that if both
objects have diverged, **calling `pull` will do nothing**! You can check for
this state using the `is_divergent` method.

```js
methods.is_divergent = function () {
  return this.a_.version() > this.va_
      && this.b_.version() > this.vb_;
};
```

```js
methods.pull = function () {
  if (this.va_ < this.a_.pull().version()) this.ga_(this.from_a_, this.id());
  if (this.vb_ < this.b_.pull().version()) this.gb_(this.from_b_, this.id());
  return this;
};
```

```js
});
});

```
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

# Edge state

Edges maintain references to the objects they are connecting and the most
recent versions of those objects. They also maintain two nonderivative signals,
one for values and one for keygates, and a generator for each endpoint.

```js
methods.initialize = function (a, b, fab, fba) {
  infuse.assert(a && b,
    'infuse: must specify two non-null endpoints when constructing an '
  + 'edge (the first argument of to() is required)');
```

```js
  this.a_       = a;
  this.b_       = b;
  this.ga_      = a.generator();
  this.gb_      = b.generator();
  this.va_      = a.version();
  this.vb_      = b.version();
  this.sig_     = infuse.signal();
  this.gate_    = infuse.signal();
  this.keygate_ = this.gate_.map(infuse.keygate);
```

```js
  this.gate_.push(null);                // set up initial keygate (accept all)
```

```js
  fab = infuse.fn(fab);
  fba = infuse.fn(fba);
```

```js
  var self = this;
  this.from_a_ = function (v, k) {return self.push(fab(v, k), k)};
  this.from_b_ = function (v, k) {return self.push(fba(v, k), k)};
```

```js
  this.ga_(this.from_a_, this.id());
  this.gb_(this.from_b_, this.id());
};
```

```js
methods.tos = function () {
  return '<--[' + this.gate_.get() + ']-->';
};
```

```js
methods.size    = function () {return this.sig_.size()};
methods.version = function () {return this.sig_.version()};
```

```js
methods.get = function () {
  var s = this.sig_;
  return s.get.apply(s, arguments);
};
```

Edges can't be derivatives of anything because they have too much identity.

```js
methods.is_derivative = function () {return false};
```

# Gating

You can specify which kinds of keys propagate along the edge in two ways. The
simplest way is to call `keygate()`. If you invoke it with no arguments, it
will return the current compiled keygate.

```js
methods.keygate = function (gate) {
  if (arguments.length) {
    this.gate_.push(gate);
    return this;
  } else
    return this.keygate_.get();
};
```

The other way is to push a value into the `gate` signal. This is useful when
you want to use edges to manage the keygates of other edges.

```js
methods.gate = function () {return this.gate_};
```

# Detachment

Detaching an edge means removing its connection to both endpoints. You can't
have an edge with just one connection, and you can't reattach an edge once you
have detached it.

```js
methods.detach = function () {
  this.a_.detach_derivative(this);
  this.b_.detach_derivative(this);
  this.a_ = this.b_ = null;
  return this;
};
```

```js
methods.detach_derivative = function (derivative) {
  this.sig_.detach_derivative(derivative);
  return this;
};
```

# Derivatives

Edges derive signals that are triggered whenever a value travels along the
edge.

```js
methods.derivative = function (generator, version_base) {
  return this.sig_.derivative(generator, version_base);
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

If the value you send through an edge is a future or signal, the edge waits to
propagate the change until the future is resolved.

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
  if (!this.keygate_.get()(k))
    return this;
```

```js
  var self = this;
  infuse.on(v, null, function (v) {
    var va = a.version(),
        vb = b.version(),
        sa = self.va_,
        sb = self.vb_;
```

```js
    if (sa < va && sb >= vb)
      self.sig_.push(v, k),
      b.push(v, k),                             // commit value to b
      self.gb_(self.from_b_, self.id()),        // pull updates
      self.vb_ = sb = b.version(),              // catch up to b
      self.va_ = sa = va;                       // enable propagation back to a
```

```js
    if (sb < vb && sa >= va)
      self.sig_.push(v, k),
      a.push(v, k),                             // commit value to a
      self.ga_(self.from_a_, self.id()),        // pull updates
      self.va_ = sa = a.version(),              // catch up to a
      self.vb_ = sb = vb;                       // enable propagation back to b
  });
```

```js
  return this;
};
```

You can connect an edge to one or more synchronous objects. If you do, you'll
need to manually call `pull` to get the changes to propagate. Note that if both
objects have diverged, **calling `pull` will do nothing**! You can check for
this state using the `is_divergent` method, and you can choose either endpoint
using `choose`.

```js
methods.is_divergent = function () {
  return this.a_.version() > this.va_
      && this.b_.version() > this.vb_;
};
```

Choosing a value doesn't activate any propagation, it just makes it so that the
edge is able to push to the other endpoint. If the endpoints are synchronous,
you'll want to invoke `pull` after `choose`.

```js
methods.choose = function (x, force) {
  if (this.is_divergent() || force)
    if      (x === this.a_ || x === true)  this.vb_ = this.b_.version();
    else if (x === this.b_ || x === false) this.va_ = this.a_.version();
    else throw new Error('infuse: attempted to choose() a nonexistent '
                       + 'endpoint');
  return this;
};
```

You need to call this if you have a synchronous endpoint. Synchronous endpoints
don't push changes, so calling `pull` on the edge is the only propagation
trigger.

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

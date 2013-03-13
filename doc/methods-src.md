Infuse methods | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines most of the methods that are common to all Infuse types.
Each of the methods defined here is based on implementations of `derivative`
and `generator`.

```js
infuse.extend(function (infuse, methods) {
```

# Instance identification

For various reasons it becomes useful to have an object-key reference for any
Infuse object. This value is used as the second argument to functions given to
`get`.

```js
methods.id = function () {
  var id = this.id_;
  if (!id) id = this.id_ = infuse.gen_id();
  return id;
};
```

# Key/value querying

These are simply array objects based on the values emitted by the generator.

```js
methods.keys = function () {
  var g = this.generator();
  return infuse.array(function (emit, id) {
    g(function (v, k) {return emit(k, k)}, id);
  }, this);
};
```

```js
// This just converts the object to an Infuse array. It's important that this
// method returns a distinct object; otherwise things like detach() might be
// sent to the wrong receiver.
methods.values = function () {
  var g = this.generator();
  return infuse.array(g, this);
};
```

# Traversal

The generator order can be used to define `each`; we just throw the generator
away at the end. There is no ID associated with an `each` operation, so it will
throw an error for asynchronous objects. (If you want to handle asynchronous
operations, you should use `on`.)

```js
methods.each = function (fn) {
  var f = infuse.fn.apply(this, arguments);
  this.generator()(f);
  return this;
};
```

# Sequence transformations

The usual suspects: `map`, `flatmap`, etc. These apply to all data types based
on the semantics of `derivative` and `generator`.

```js
methods.map = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      g = this.generator();
  return this.derivative(function (emit, id) {
    g(function (v, k) {return emit(f(v, k), k)}, id);
  });
};
```

```js
methods.flatmap = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      g = this.generator();
  return this.derivative(function (emit, id) {
    g(function (v, k) {var y = f(v, k);
                       return y && infuse(f(v, k)).each(emit)}, id);
  });
};
```

```js
methods.filter = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      g = this.generator();
  return this.derivative(function (emit, id) {
    g(function (v, k) {if (f(v, k)) return emit(v, k)}, id);
  });
};
```

```js
methods.mapfilter = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      g = this.generator();
  return this.derivative(function (emit, id) {
    g(function (v, k) {
      var y = f(v, k);
      if (y) return emit(y, k);
    }, id);
  });
};
```

# Reductions

Most systems treat reductions as being generic across lazy and strict
sequences. Infuse can't do this, however, because some sequences are push-lazy
(and besides, Javascript isn't idiomatically lazy enough to have pull-lazy
sequences and lazy right-folds anyway).

As a result, we implement two forms of `reduce`. The eager one, `reduce`,
returns a final answer that is not wrapped in an Infuse object, while the lazy
one, `reductions`, returns a result whose value may be updated as the
underlying sequence gains values.

A relevant example is the difference when dealing with futures. Suppose you
have a future `f` that will end up delivering `5`. If you call
`f.reduce(0, '_1 + _2')` and `f` is not yet delivered, you'll get `0` back as
the future is said to have no elements.

If, on the other hand, you invoke `f.reductions(0, '_1 + _2')`, you'll get a
future that is initially undelivered and then becomes `5` when the first future
is delivered. (Reducing a signal is a little more interesting, since signal
reductions continue to update and accumulate.)

More intuitively, a signal is like a lazy sequence whose index is time.
Obviously you can't faithfully reduce it in a strict way, since it doesn't have
any kind of "last" value. So if you want to fold it up, the best you can do is
observe it at each change point, and to do that you ask for all of its
reductions.

```js
methods.reductions = function (into, fn) {
  var f = infuse.fnarg(arguments, 1),
      g = this.generator();
  return this.derivative(function (emit, id) {
    g(function (v, k) {return emit(into = f(into, v, k), k)}, id);
  });
};
```

```js
methods.reduce = function (into, fn) {
  var f = infuse.fnarg(arguments, 1);
  this.each(function (v, k) {into = f(into, v, k)});
  return into;
};
```

# Indexing

You can group or index a sequence's values into an object. The index function
should take an element (and optionally its key, position, whatever), and return
a string for the index.

```js
methods.index = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      g = this.generator();
  return infuse.object(function (emit, id) {
    g(function (v, k) {return emit(v, f(v, k))}, id);
  }, this);
};
```

```js
methods.group = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      g = this.generator();
  return infuse.multiobject(function (emit, id) {
    g(function (v, k) {return emit(v, f(v, k))}, id);
  }, this);
};
```

```js
});

```

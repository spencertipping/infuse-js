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

```js
methods.pairs = function () {
  var g = this.generator();
  return infuse.array(function (emit, id) {
    g(function (v, k) {return emit([v, k])}, id);
  });
};
```

```js
methods.inverse = function () {
  var g = this.generator();
  return this.derivative(function (emit, id) {
    g(function (v, k) {return emit(k, v)}, id);
  });
};
```

# Generator combination

Methods to combine multiple objects. Combined objects inherit changes from
multiple bases. `plus` is closed under the receiver's type.

```js
methods.plus = function () {
  var f = infuse.funnel([this].concat(infuse.toa(arguments)));
  return this.derivative(f.generator(), f);
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
methods.kmap = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      g = this.generator();
  return this.derivative(function (emit, id) {
    g(function (v, k) {return emit(v, f(k, v))}, id);
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

# Lazy sorting

You can sort the values in any Infuse object and the result will be updated
lazily. Generators that traverse sorted objects will remember the last value
and will pick up at that point; so even if the Infuse object receives updates
earlier on, all generators will see the most up-to-date fully-ordered view of
data possible.

Sorting functions return in constant time and the derivative collections are
lazily sorted in O(r k log n) time, where r is the number of generator
re-entrances, k is the number of realized elements, and n is the size of the
receiver.

These functions have a fairly large constant-factor overhead. You're much
better off using Javascript's native `sort()` method unless you need lazy
sorting.

```js
methods.sort = function (fn) {
  var f    = fn && infuse.fn.apply(this, arguments),
      h    = infuse.heapmap(f, this.generator(), this),
      g    = h.generator(),
      self = this;
  return this.derivative(function (emit, id) {
    g(function (v, k) {return emit(self.get(k), k)}, id);
  }, h);
};
```

```js
methods.sortby = function (fn) {
  return this.map.apply(this, arguments).sort();
};
```

The `uniq` method returns distinct values **from a sorted collection**. Because
Infuse collections are potentially infinite (or at least, they have indefinite
size), it doesn't try to maintain a set of all objects seen. As a result, it
operates in constant space and per-element time, holding only the last-seen
value. If given a function, values for which that function returns unique
values are emitted.

```js
methods.uniq = function (fn) {
  var f    = fn ? infuse.fn.apply(this, arguments)
                : function (x) {return x},
      g    = this.generator(),
      last = {};                // {} !== everything
  return this.derivative(function (emit, id) {
    g(function (v, k) {
      if (last !== (last = f(v))) return emit(v, k);
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
underlying sequence gains values. You're allowed to call `reduce` on a future
or signal, but it probably won't do anything very useful.

However, you can invoke `f.reductions(0, '_1 + _2')` to get a future that is
initially undelivered and then is delivered with the receiver. (Reducing a
signal is a little more interesting, since signal reductions continue to update
and accumulate.)

More intuitively, a signal is like a lazy sequence whose index is time.
Obviously you can't faithfully reduce it in a strict way, since it doesn't have
any kind of "last" value. So if you want to fold it up, the best you can do is
observe it at each change point, and to do that you ask for all of its
reductions.

If you're only interested in the last value of `reductions`, such as if you
just want a running total, you can use `reduction` to avoid consing up an
array.

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
methods.reduction = function (into, fn) {
  var f = infuse.fnarg(arguments, 1),
      g = this.generator();
  return infuse.cell(function (emit, id) {
    g(function (v, k) {return emit(into = f(into, v, k), k)}, id);
  }, this);
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

# Tail

Not like the UNIX `tail` command: instead, the tail of an Infuse object always
contains the N most recent elements emitted for that object. The keys are
modified to be the indexes at which the elements are emitted.

```js
methods.tail = function (n) {
  var g = this.generator();
  return infuse.tail(n, g, this);
};
```

```js
});

```

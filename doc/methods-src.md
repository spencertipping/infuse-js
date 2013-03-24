Infuse methods | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

This module defines most of the methods that are common to all Infuse types.
Each of the methods defined here is based on implementations of `derivative`
and `generator`.

```js
infuse.extend(function (infuse, methods) {
```

```js
methods.tap = function (fn) {
  infuse.fn.apply(this, arguments)(this);
  return this;
};
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

This just converts the object to an Infuse array. It's important that this
method returns a distinct object; otherwise things like detach() might be sent
to the wrong receiver.

```js
methods.values = function () {
  var g = this.generator();
  return infuse.array(g, this);
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

# Transcoding

All Infuse objects are expressed in terms of generators that emit (value, key)
tuples. This means that you can easily convert between types. The simplest way
to do it is to use `into`, which has two main modes of operation. If you say
something like `xs.into(infuse.array)`, you'll get a derivative array. If you
use it with an existing Infuse object, or something that can be promoted into
an Infuse object, you'll get that object back with extra elements.

You can't use `into` to modify a derivative; doing so will result in an error.

```js
methods.into = function (xs_or_constructor) {
  if (typeof xs_or_constructor === typeof infuse) {     // constructor function?
    var args = infuse.slice(arguments, 1);              // get extra args
    args.push(this.generator());                        // set up derivative
    args.push(this);
    return xs_or_constructor.apply(infuse, args);
  }
```

```js
  if (xs_or_constructor instanceof infuse) {            // wrapped already?
    this.generator()(function (v, k) {xs_or_constructor.push(v, k)},
                     xs_or_constructor.id());
    return xs_or_constructor;
  }
```

```js
  // A primitive type. Promote it, push values in, and then convert back to a
  // primitive.
  return this.into(infuse.apply(this, arguments)).get();
};
```

# Get shorthands

Sometimes you have multiple nested Infuse objects (particularly with futures),
and you want to get to a primitive. You can do this with `fget`:

```js
methods.fget = function () {
  var result = this.get.apply(this, arguments);
  while (result instanceof infuse) result = result.get();
  return result;
};
```

You can also use `mget` to cascade multiple `get` arguments:

```js
methods.mget = function () {
  var result = this;
  for (var i = 0, l = arguments.length; i < l; ++i)
    result = result.get(arguments[i]);
  return result;
};
```

# Pairing

Any Infuse object can be encoded as an array of `[value, key]` pairs.
Similarly, we can construct an Infuse collection of many types from such an
array. Note that while `pairs` returns a true derivative, `unpair` does not and
in general can't: it isn't always possible to attach an Infuse collection to an
arbitrary source. For cases when it is possible, you should use the `into`
method.

```js
methods.pairs = function () {
  var g = this.generator();
  return infuse.array(function (emit, id) {
    g(function (v, k) {return emit([v, k])}, id);
  }, this);
};
```

You can use `unpair` to transcode objects: `infuse({}).unpair(xs.pairs())`.
This form is useful when the receiver, which receives elements, doesn't have a
fixed type. (Though it's faster just to use `into` unless you're transforming
the values.)

```js
methods.unpair = function (pairs) {
  var g    = infuse(pairs).generator(),
      self = this;
  g(function (pair) {self.push(pair[0], pair[1])}, this.id());
  return this;
};
```

# Generator combination

Methods to combine multiple objects. Combined objects inherit changes from
multiple bases. `plus` and `zero` are closed under the receiver's type.

```js
methods.plus = function () {
  var f = infuse.funnel([this].concat(infuse.toa(arguments)));
  return this.derivative(f.generator(), f);
};
```

```js
methods.zero = function () {
  return this.derivative(function () {}, this).detach();
};
```

# Traversal

The generator order can be used to define `each`; we just throw the generator
away at the end. It is generally an error to invoke `each` on an asynchronous
collection; you should use `on` or `once` instead.

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
                       return y && infuse(y).generator()(emit, id)}, id);
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

For convenience:

```js
methods.join = function (sep) {
  return this.values().get().join(sep);
};
```

# Default function promotion

Infuse objects can be promoted into structure-preserving functions. For
example, `{foo: f}` becomes `function (x) {return {foo: f(x)}}`. Like all
Infuse objects, the function result is an automatically-updating derivative,
and it generates derivative Infuse collections.

```js
methods.fn = function () {
  var mapped = this.map(function (v, k) {return infuse.fn(v)});
  return function () {
    var self = this, args = arguments;
    return mapped.map(function (v, k) {return v.apply(self, args)});
  };
};
```

# Default `get` implementation

This is what individual Infuse collections use when no collection-specific
alternatives match. It's written so that:

    infuse([1, 2, 3]).get([2, 1])         -> infuse([3, 2])
    infuse([1, 2, 3]).get({foo: 0})       -> infuse({foo: 1})

It also has desirable properties for working with asynchronous collections.

```js
methods.get_default = function (x) {
  // get(infusable) -> infuse.map(x -> y -> y.get(x)).fn()(this, this.id())
  if (infuse.accepts(x)) {
    var self = this;
    return infuse.fn(infuse(x).map(function (x) {
      return function (y) {return y.get(x)};
    }))(this, this.id());
  }
```

```js
  // get(...) -> fn(...)(this, this.id())
  return infuse.fn.apply(this, arguments)(this, this.id());
};
```

# Lazy sorting

You can sort the values in any Infuse object and the result will be updated
lazily. Generators that traverse sorted objects will remember the last value
and will pick up at that point; so even if the Infuse object receives updates
earlier on, all generators will see the most up-to-date fully-ordered view of
data possible.

Sorting functions return in constant time and the derivative collections are
lazily sorted in O(n log n + r(n + k log n)) time, where r is the number of
generator re-entrances, k is the number of realized elements, and n is the size
of the receiver.

These functions have a fairly large constant-factor overhead. You're probably
better off using Javascript's native `sort()` method if performance is
important. (Actually, don't use Infuse at all if you're counting microseconds;
it's fast, but indirection is indirection.)

Note that multi-objects cannot be sorted meaningfully; you'll get a multiobject
with a different structure. This problem arises because the key->value
transform of a multiobject is not a well-defined function.

Also note that this `sort` function is unstable, so it takes an ordering
function that returns `true` if its first argument is less than the second,
`false` otherwise. You can get such a function from a comparator by using
`infuse.comparator_to_ordering`.

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

Sort-by allocates a backing collection of transformed values, sorts that, and
remaps the keys back into the original collection's space. This means that your
base collection must support `get` over its keyspace.

```js
methods.sortby = function (fn) {
  var f    = infuse.fn.apply(this, arguments),
      sg   = this.generator(),
      h    = infuse.heapmap(null, function (emit, id) {
               sg(function (v, k) {return emit(f(v, k), k)}, id);
             }, this),
      g    = h.generator(),
      self = this;
  return this.derivative(function (emit, id) {
    g(function (v, k) {return emit(self.get(k), k)}, id);
  }, h);
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

Just like the UNIX `tail -f`. It keeps a circular buffer of items and supports
derivatives and updates just like other collections.

```js
methods.tail = function (n) {
  var g = this.generator();
  return infuse.tail(n, g, this);
};
```

# Edges

You can make an edge between any two objects by using the `to` function. You're
required to specify an object to connect the receiver to, and you can
optionally specify two functions, one to transform values in each direction.
`ifn` is not required to be the inverse of `fn`, but it probably should be.

Edges are legal between synchronous collections; in that case, it is up to you
to call `pull` on the edge to manually propagate changes in either direction.
See the [edge documentation](edge.md) and [source](edge-src.md) for more
details about this.

```js
methods.to = function (o, fn, ifn) {
  return infuse.edge(this, o, fn, ifn);
};
```

```js
});

```

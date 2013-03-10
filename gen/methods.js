// Infuse methods | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module defines most of the methods that are common to all Infuse types.
// Each of the methods defined here is based on implementations of a few required
// generic methods:

// | obj.each(f)           f(x1), f(x2), ...
//   obj.cursor()
//   obj.size()            must be a finite nonnegative integer
//   obj.get(n)            0 <= n < size
//   obj.force(n)          0 <= n
//   obj.derivative(f)     f is a generator function
//   obj.push(v, k)

// Forcing may throw an error for certain types, limiting the set of operations
// that they support.

infuse.extend(function (infuse, methods) {

// Versions and derivatives.
// There are some default implementations of things like `touch` and `pull`, which
// are generally straightforward. However, some types override them to increase
// efficiency (e.g. `infuse.object`).

methods.touch = function () {
  // Unconditionally assume a change of some sort. Don't call this method
  // unless you actually change something!
  ++this.version_;
  return this;
};

methods.pull = function () {
  // Does nothing if we have no base.
  var b = this.base(),
      v = b && b.pull().version();
  if (v && v > this.version_) this.force(b.size()).version_ = v;
  return this;
};

methods.base    = function () {return this.base_};
methods.version = function () {return this.version_};

methods.detach = function () {
  // This is simple enough: just free references to the generator function and
  // the base object. After this, push() will see that base_ is null and won't
  // complain if you try to change the object.
  this.base_ = this.generator_ = null;
  return this;
};

// Sequence transformations.
// The usual suspects: `map`, `flatmap`, etc. These apply to all data types based
// on the semantics of `derivative` and `cursor`.

methods.map = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {emit(f(v, k), k)});
  });
};

methods.flatmap = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {infuse(f(v, k)).each(emit)});
  });
};

methods.filter = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {if (f(v, k)) emit(v, k)});
  });
};

methods.mapfilter = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {
      var y = f(v, k);
      if (y) emit(y, k);
    });
  });
};

// Reductions.
// Most systems treat reductions as being generic across lazy and strict
// sequences. Infuse can't do this, however, because some sequences are push-lazy
// (and besides, Javascript isn't idiomatically lazy enough to have pull-lazy
// sequences and lazy right-folds anyway).

// As a result, we implement two forms of `reduce`. The eager one, `reduce`,
// returns a final answer that is not wrapped in an Infuse object, while the lazy
// one, `reductions`, returns a result whose value may be updated as the
// underlying sequence gains values.

// A relevant example is the difference when dealing with futures. Suppose you
// have a future `f` that will end up delivering `5`. If you call `f.reduce(0, '_1
// + _2')` and `f` is not yet delivered, you'll get `0` back as the future is said
// to have no elements.

// If, on the other hand, you invoke `f.reductions(0, '_1 + _2')`, you'll get a
// future that is initially undelivered and then becomes `5` when the first future
// is delivered. (Reducing a signal is a little more interesting, since signal
// reductions continue to update and accumulate.)

// More intuitively, a signal is like a lazy sequence whose index is time.
// Obviously you can't faithfully reduce it in a strict way, since it doesn't have
// any kind of "last" value. So if you want to fold it up, the best you can do is
// observe it at each change point, and to do that you ask for all of its
// reductions.

methods.reductions = function (into, fn) {
  var f = infuse.fnarg(arguments, 1),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {emit(into = f(into, v, k), k)});
  });
};

methods.reduce = function (into, fn) {
  var f = infuse.fnarg(arguments, 1);
  this.each(function (v, k) {into = f(into, v, k)});
  return into;
};

// Indexing.
// You can group or index a sequence's values into an object. The index function
// should take an element (and optionally its key, position, whatever), and return
// a string for the index.

methods.index = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return infuse.object(function (emit) {
    c(function (v, k) {emit(v, f(v, k))});
  });
};

methods.group = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return infuse.multi_object(function (emit) {
    c(function (v, k) {emit(v, f(v, k))});
  });
};

});

// Generated by SDoc

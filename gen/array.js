// Infuse arrays | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Infuse arrays.
// Infuse gives you two options for working with arrays. You can promote an
// existing array, in which case the `force()` method will provide no new data and
// will throw an error. Alternatively, you can invoke `infuse.array()` on a
// generator function to create an array-backed lazy sequence. If you do this,
// `force()` will add elements to the end of the array if any are available.

// A secondary consequence of using a generator function is that derivative
// arrays, objects, etc, are themselves lazy. In these cases, forcing derivative
// `map`, `filter`, etc results will cause more elements to be dynamically
// generated and transformed accordingly. (Internally this happens when the `pull`
// method is called.)

infuse.extend(function (infuse) {
infuse.type('array', function (array, methods) {

// Mixins.
// Arrays are "pulling" collections: derivatives are linked to their sources, not
// the other way around.

infuse.mixins.pull(methods);

// Array state.
// Every Infuse array is backed by a Javascript array. If the backing was provided
// as a constructor argument, then we aren't allowed to modify it; so the sequence
// is considered to be definite and can't have a generator.

// Otherwise the sequence is a generated array, in which case we allocate a
// private backing and fill it as the user forces things.

methods.initialize = function (xs_or_f, base) {
  if (xs_or_f instanceof Function)
    this.xs_        = [],
    this.base_      = base,
    this.generator_ = xs_or_f,
    this.version_   = -1,
    this.pull();
  else
    this.xs_        = xs_or_f instanceof Array
                      ? xs_or_f
                      : infuse.toa(xs_or_f),
    this.base_      = null,
    this.generator_ = null,
    this.version_   = 1;
};

methods.tos = function () {
  return (this.base_ ? '#[' : 'I[') + this.join(', ') + ']';
};

// Size is always expressed as the number of items currently realized, not the
// eventual size of a lazy sequence. Any given lazy sequence will be both finite
// (as its size is finite) and indefinite at the same time, and operations such as
// `map` and `flatmap` will apply eagerly to the currently-realized part.

methods.size = function () {return this.pull().xs_.length};

// We mixin the `pull` behavior, which relies on this `push_` method to actually
// add things to the array. We don't need to worry about versioning.

methods.push_ = function (v, k) {
  this.xs_.push(v);
  return this;
};

// Derivatives.
// Laziness requires that we pass on certain metadata about the base whenever we
// construct any derivative. To do this, we have the derivative link to its base
// so that any new elements on the base can be transformed accordingly.

methods.derivative = function (generator, version_base) {
  var f = infuse.fn(generator);
  return infuse.array(f, version_base || this);
};

// Traversal.
// A generator is a stateful iterator that takes an emitter function and invokes
// it once for each item in the array. It re-checks the array's size each time it
// is called, so a generator can represent a collection whose size changes over
// time.

methods.generator = function () {
  var i = 0, self = this;
  return function (emit) {
    for (var xs = self.pull().xs_, l = xs.length; i < l;)
      // It's important to do the increment here so that it happens even if we
      // break out of the loop.
      if (emit(xs[i], i++) === false) return false;
  };
};

// Retrieval.
// Technically we just need to implement `get` here. `first` and `last` can, in
// theory, be derived from `each`, `size`, and `get`. However, doing things that
// way is inefficient for arrays because we have direct access to the elements.

methods.get = function (n, fn) {
  var xs = this.pull().xs_;

  // get() -> the current backing array (don't modify this!)
  if (n === void 0) return xs;

  // get(n) -> xs[n] or xs[n + length] if n is negative
  if (typeof n === typeof 0 || n instanceof Number)
    if (n === n >> 0)
      // n is an integer; use direct indexing (but wrap if negative)
      return xs[n < 0 ? xs.length + n : n];
    else {
      // n is a float; use interpolation.
      var f  = arguments.length > 1
               ? infuse.fnarg(arguments, 1)
               : function (a, b, x) {return a + (b-a)*x},
          i1 = (n < 0 ? xs.length : 0) + Math.floor(n),
          i2 = i1 + 1,
          x  = n - i1;
      return f(xs[i1], xs[i2], x);
    }

  return this.get_default.apply(this, arguments);
};

methods.first = function (n) {
  var xs = this.get();

  // first() -> the single first element
  if (n === void 0) return xs[0];

  // first(n) -> infuse([x0, x1, ..., xn-1])
  if (typeof n === typeof 0 || n instanceof Number)
    return infuse.array(xs.slice(0, n < 0 ? xs.length + n : n));

  // first(f) -> the first element that satisfies f, or null
  var f = infuse.fn.apply(this, arguments);
  for (var i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i], i)) return xs[i];
  return null;
};

methods.last = function (n) {
  var xs = this.get(),
      xl = xs.length;

  // last() -> the single last element
  if (n === void 0) return xs[xl - 1];

  // last(n) -> infuse([xn, xn+1, ..., xl-1])
  if (typeof n === typeof 0 || n instanceof Number)
    // Check for n == 0 to save an array copy if at all possible
    return infuse.array(n === 0 ? xs : xs.slice(n < 0 ? xl + n : n));

  // last(f) -> the last element that satisfies f, or null
  var f = infuse.fn.apply(this, arguments);
  for (var i = xl - 1; i >= 0; ++i)
    if (f(xs[i], i)) return xs[i];
  return null;
};

});     // end infuse.type('array')

// Array promotion.
// This hook allows you to say `infuse([1, 2, 3])` and get back an `infuse.array`
// object.

infuse.alternatives.push(
  {accepts:   function (x) {return x instanceof Array},
   construct: function (x) {return infuse.array(x)}});

});

// Generated by SDoc

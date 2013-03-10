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
    this.generator_ = xs_or_f;
  else
    this.xs_        = xs_or_f instanceof Array
                      ? xs_or_f
                      : infuse.toa(xs_or_f),
    this.base_      = null,
    this.generator_ = function (emit) {
      // For externally-backed arrays, no new elements can be generated.
      throw new Error('infuse: attempted to request new elements '
                    + 'for an array with no specified generator '
                    + '(this usually means that the array is '
                    + 'backed by a real Javascript array and is '
                    + 'therefore a read-only view)');
    };

  // Important: set up the version. Derivative sequences use this information.
  this.version_ = 0;
};

// Size is always expressed as the number of items currently realized, not the
// eventual size of a lazy sequence. Any given lazy sequence will be both finite
// (as its size is finite) and indefinite at the same time, and operations such as
// `map` and `flatmap` will apply eagerly to the currently-realized part.

methods.size = function () {return this.xs_.length};

// Derivatives.
// Laziness requires that we pass on certain metadata about the base whenever we
// construct any derivative. To do this, we have the derivative link to its base
// so that any new elements on the base can be transformed accordingly.

methods.derivative = function (generator) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.array(f, this);
};

// Forcing requests that elements be computed, up to the specified size. The
// result may be smaller than `n` if fewer elements are available, and if no
// elements are added then the version remains the same.

methods.force = function (n) {
  for (var xs           = this.xs_,
           start_size   = xs.length,
           current_size = -1,
           emit         = function (x) {xs.push(x)};
       xs.length > current_size && (current_size = xs.length) < n;)
    this.generator_(emit);
  return current_size > start_size ? this.touch() : this;
};

// Key/value querying.
// Methods to build out lists of keys and values. The `values` case is
// particularly simple: we just return the current object. `keys` is unfortunate
// and inefficient for arrays, so you probably shouldn't use it.

methods.keys = function () {
  for (var r = [], i = 0, l = this.size(); i < l; ++i) r.push(i);
  return infuse.array(r);
};

methods.values = function () {return this};

// Traversal.
// Infuse uses the `each` method to implement a number of other things, so it has
// a minimal protocol: the iterator function can return `false` to break out of
// the loop. We're required to provide an implementation.

methods.each = function () {
  this.pull();
  var f = infuse.fn.apply(this, arguments);
  for (var xs = this.xs_, i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i], i) === false) break;
  return this;
};

// Similar to `each` is `cursor`, which returns a closure that runs over each item
// in the array exactly once. It runs eagerly but doesn't force anything.

methods.cursor = function () {
  var i = 0, self = this.pull();
  return function (f) {
    for (var xs = self.xs_, l = xs.length; i < l; ++i)
      if (f(xs[i], i) === false) break;
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
      // Is n an integer? If so, use direct indexing.
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

  // get([x1, x2, x3, ...]) = [get(x1), get(x2), ...]
  if (n instanceof Array) {
    for (var r = [], i = 0, l = xs.length; i < l; ++i) r.push(this.get(xs[i]));
    return r;
  }

  // get(...) = fn(...)(this)
  return infuse.fn.apply(this, arguments)(this);
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

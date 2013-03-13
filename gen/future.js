// Infuse futures | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// A future is a container for a value that will become available later on,
// generally by an asynchronous callback. Futures represent callbacks that have
// not yet been invoked, allowing you to transform the values they will receive or
// otherwise manipulate them as objects.

// Things you can do trivially with futures that are more difficult with just
// callbacks include having an indefinite number of listeners for the result and
// combining N pending results into a single object. Futures are also useful for
// chaining asynchronous computations, but callbacks don't make this particularly
// difficult to begin with.

infuse.extend(function (infuse) {
infuse.type('future', function (future, methods) {

infuse.mixins.push(methods);

// Future state.
// Each future contains a key and a result; the key contextualizes the value and
// is emitted from generators when the value is delivered. Futures have two
// states, undelivered and delivered, and the only transition that happens is from
// undelivered to delivered. So for most purposes they are immutable, and they
// converge to immutable objects. (If you don't want this convergence, you should
// use a signal instead.)

// Because we have this immutability, we can unlink all derivatives once the state
// is finalized.

methods.initialize = function (generator, base) {
  this.listeners_ = {};         // null once the future is decided
  this.bases_     = {};         // null once the future is decided
  this.value_     = null;
  this.key_       = null;
  this.generator_ = null;       // generated on demand

  if (generator) {
    infuse.assert(base,
      'infuse: attempted to construct a derivative future without specifying '
    + 'a base');

    var self = this;
    generator(function (v, k) {return self.push(v, k)}, this.id());
    this.bases_[base.id()] = base;
  }
};

methods.size  = function () {return +!this.listeners_};
methods.key   = function () {return this.key_};
methods.value = function () {return this.value_};

// Derivatives.
// Future derivatives are push-notified, not pull-notified, so they work
// differently. We create the derivative and doubly-link it to the base for
// reasons I'll explain in more detail later. At that point we don't need to do
// anything else until we get a value through `push`.

methods.derivative = function (generator) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.future(f, this);
};

methods.generator = function () {
  var g = this.generator_;
  if (!g) {
    var self = this;
    g = this.generator_ = function (emit, id) {
      var ls = self.listeners_;
      if (ls) id != null && (ls[id] = emit);
      else    return emit(self.value_, self.key_);
    };
  }
  return g;
};

methods.push = function (v, k) {
  infuse.assert(this.listeners_,
    'infuse: attempted to push to an already-decided future');

  // Alert listeners...
  var ls = this.listeners_;
  for (var id in ls)
    if (Object.prototype.hasOwnProperty.call(ls, id))
      ls[id](v, k);

  this.listeners_ = null;       // ... and then free them; we are now immutable
  this.value_     = v;
  this.key_       = k;
  return this;
};

// Retrieval.
// Futures are modeled sort of like objects with a single key/value after they're
// decided, and no existence at all before they're decided.

methods.get = function (k) {
  // get() -> {} if undecided, {k: v} if decided
  if (k === void 0)
    if (this.listeners_) return {};
    else {
      var result = {};
      result[this.key_] = this.value_;
      return result;
    }

  // get(k) -> v if decided and k === key, otherwise null
  if (k === this.key_) return this.value_;
  else                 return null;
};

// Callback interface.
// You can use a future to invoke a callback, and you can also create a callback
// that will trigger the future when you invoke it. Each of these use cases ties a
// key to the callback, which is useful for things like error processing. See the
// future tests for examples.

// If `target` is not a string, it is assumed to be a function that can be
// promoted with `infuse.fn`. This is useful when you want to capture all
// outcomes: `on(/.*/, callback_fn)`.

methods.on = function (target, callback) {
  var f = typeof target === typeof '' || target instanceof String
          ? function (x) {return x === target}
          : infuse.fn(target);

  this.generator()(function (v, k) {if (f(k)) callback(v, k)},
                   infuse.gen_id());
  return this;
};

// Futures can be resolved at most once, so these methods do the same thing.
// (But this is not the case for signals.)
methods.once = methods.on;

methods.trigger = function (k) {
  var self = this;
  return function (v) {self.push(v, k)};
};

});
});

// Generated by SDoc
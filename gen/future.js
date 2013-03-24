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

methods.tos = function () {
  var is_derivative = false, bs = this.bases_;
  for (var k in bs)
    if (Object.prototype.hasOwnProperty.call(bs, k)) {
      is_derivative = true;
      break;
    }
  return (is_derivative ? '#future(' : 'future(')
    + (this.size() ? this.value_ + (this.key_ == null ? '' : ', ' + this.key_)
                   : '')
    + ')';
};

methods.size = function () {return +!this.listeners_};
methods.key  = function () {return this.key_};

// Derivatives.
// Future derivatives are push-notified, not pull-notified, so they work
// differently. We create the derivative and doubly-link it to the base for
// reasons I'll explain in more detail later. At that point we don't need to do
// anything else until we get a value through `push`.

methods.derivative = function (generator, version_base) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.future(f, version_base || this);
};

// Future generators support ID-less emit function registrations. Signals don't
// because a signal will hold onto such a function indefinitely, but futures let
// go of the functions once they are decided, so the scope of the space leak is
// less egregious. It's still a better idea to use `on` or `once` to get a
// singleton future that you use for the callback; that way you can free both by
// calling `detach`.

methods.generator = function () {
  var g = this.generator_;
  if (!g) {
    var self = this;
    g = this.generator_ = function (emit, id) {
      var ls = self.listeners_;
      if (ls) ls[id || infuse.gen_id()] = emit;
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

  this.detach();
  this.listeners_ = null;       // ... and then free them; we are now immutable
  this.value_     = v;
  this.key_       = k;
  return this;
};

// Retrieval.
// Futures are modeled sort of like objects with a single key/value after they're
// decided, and no existence at all before they're decided.

methods.get = function (k) {
  // get() -> v if decided, null if undecided
  if (k === void 0) return this.value_;

  // get(k) -> v if decided and k === key, otherwise null
  if (typeof k === typeof '' || k instanceof String)
    if (k === this.key_) return this.value_;
    else                 return null;

  return this.get_default.apply(this, arguments);
};

// Callback interface.
// You can use a future to invoke a callback, and you can also create a callback
// that will trigger the future when you invoke it. Each of these use cases ties a
// key to the callback, which is useful for things like error processing. See the
// future tests for examples.

methods.on = function (keygate, callback, id) {
  keygate = infuse.keygate(keygate);

  // on(keygate) -> signal
  if (!callback) {
    var g = this.generator();
    return infuse.signal(function (emit, id) {
      g(function (v, k) {if (keygate(k)) return emit(v, k)}, id);
    }, this);
  }

  // on(keygate, callback) -> this
  this.generator()(function (v, k) {if (keygate(k)) callback(v, k)},
                   id || infuse.gen_id());
  return this;
};

// Futures can be resolved at most once, so these methods do the same thing. (But
// this is not the case for signals.) Note that it is not a good idea for `once()`
// to optimize the no-keygate case, for two reasons. First, the user can change
// the behavior of an unspecified (undefined) keygate; and second, the result
// should always be different from the receiver so that calling `detach` on it
// won't disrupt the receiver's derivative status.

methods.once = function (keygate, callback, id) {
  keygate = infuse.keygate(keygate);

  // once(keygate) -> future
  if (!callback) {
    var g = this.generator();
    return this.derivative(function (emit, id) {
      g(function (v, k) {if (keygate(k)) return emit(v, k)}, id);
    });
  }

  // once(keygate, callback) -> this
  return this.on(keygate, callback, id);
};

methods.trigger = function (k) {
  var self = this;
  return function (v) {self.push(v, k)};
};

});
});

// Generated by SDoc

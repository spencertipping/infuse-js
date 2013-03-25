// Infuse signals | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// A signal is just like a future, but it can be resolved asynchronously multiple
// times. As a result, it retains its listener list, which means that derivatives
// are live until the base is freed.

infuse.extend(function (infuse) {
infuse.type('signal', function (signal, methods) {

infuse.mixins.push(methods);

// Signal state.
// Signals retain the last key/value they took on, and they also maintain the list
// of listeners indefinitely.

methods.initialize = function (generator, base) {
  this.listeners_ = {};         // stored until explicitly detached
  this.bases_     = {};         // stored until explicitly detached
  this.value_     = null;
  this.key_       = null;
  this.generator_ = null;       // generated on demand
  this.size_      = 0;          // number of values processed by the signal

  if (generator) {
    infuse.assert(base,
      'infuse: attempted to construct a derivative signal without specifying '
    + 'a base');

    var self = this;
    generator(function (v, k) {return self.push(v, k)}, this.id());
    this.bases_[base.id()] = base;
  }
};

methods.tos = function () {
  return (this.is_derivative() ? '#signal(' : 'signal(')
    + (this.size_ ? this.value_ + (this.key_ == null ? '' : ', ' + this.key_)
                  : '')
    + ')';
};

methods.size = function () {return this.size_};
methods.key  = function () {return this.key_};

// Derivatives.
// Signals are linked back to their "version bases", or the objects that have been
// tasked with keeping them up to date. This makes it possible to call `detach` on
// a derivative future and remove both linkages.

methods.derivative = function (generator, version_base) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.signal(f, version_base || this);
};

methods.generator = function () {
  var g = this.generator_;
  if (!g) {
    var self = this;
    g = this.generator_ = function (emit, id) {
      infuse.assert(id != null,
        'infuse: attempted to construct a push generator without specifying '
      + 'an ID (this may cause space leaks, so it is disallowed)');
      self.listeners_[id] = emit;
    };
  }
  return g;
};

// Order of operations matters inside `push`. We need to increment the version
// before alerting listeners so that listeners can use version deltas to figure
// out which of potentially many signals emitted a value.

methods.push = function (v, k) {
  // Update state to reflect the change...
  this.value_ = v;
  this.key_   = k;
  ++this.size_;

  // ... and alert listeners.
  var ls = this.listeners_;
  for (var id in ls)
    if (Object.prototype.hasOwnProperty.call(ls, id))
      ls[id](v, k);

  return this;
};

// Retrieval.
// Signals behave just like futures that change if decided again. They always
// consist of a single key/value mapping, and sometimes the key is empty or null.

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
// You can use a signal to invoke a callback, and you can also create a callback
// that will trigger the signal when you invoke it.

methods.on = function (keygate, callback, id) {
  keygate = infuse.keygate(keygate);

  // on(keygate) -> signal
  if (!callback) {
    var g = this.generator();
    return this.derivative(function (emit, id) {
      g(function (v, k) {if (keygate(k)) return emit(v, k)}, id);
    }, this);
  }

  // on(keygate, callback) -> this
  this.generator()(function (v, k) {if (keygate(k)) callback(v, k)},
                   id || infuse.gen_id());
  return this;
};

// Similar to `on` is `once`, which creates a callback that is invoked only once
// and then removed from the listener list. This can prevent a space leak for
// cases where you need transient anonymous listeners. Invoked without a callback,
// `once` returns a future that is triggered on the receiver's first value.

methods.once = function (keygate, callback, id) {
  id      = id || infuse.gen_id();
  keygate = infuse.keygate(keygate);

  // once(keygate) -> future
  if (!callback) {
    var g = this.generator();
    return infuse.future(function (emit, id) {
      g(function (v, k) {if (keygate(k)) return emit(v, k)}, id);
    }, this);
  }

  // once(keygate, callback) -> this
  var self = this;
  this.generator()(function (v, k) {
                     if (keygate(k)) {
                       delete self.listeners_[id];
                       callback(v, k);
                     }
                   }, id);
  return this;
};

methods.trigger = function (k) {
  var self = this;
  return function (v) {self.push(v, k)};
};

});
});

// Generated by SDoc

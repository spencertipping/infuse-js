Infuse signals | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

A signal is just like a future, but it can be resolved asynchronously multiple
times. As a result, it retains its listener list, which means that derivatives
are live until the base is freed.

```js
infuse.extend(function (infuse) {
infuse.type('signal', function (signal, methods) {
```

```js
infuse.mixins.push(methods);
```

# Signal state

Signals retain the last key/value they took on, and they also maintain the list
of listeners indefinitely.

```js
methods.initialize = function (generator, base) {
  this.listeners_ = {};         // stored until explicitly detached
  this.bases_     = {};         // stored until explicitly detached
  this.value_     = null;
  this.key_       = null;
  this.generator_ = null;       // generated on demand
  this.size_      = 0;          // number of values processed by the signal
```

```js
  if (generator) {
    infuse.assert(base,
      'infuse: attempted to construct a derivative signal without specifying '
    + 'a base');
```

```js
    var self = this;
    generator(function (v, k) {return self.push(v, k)}, this.id());
    this.bases_[base.id()] = base;
  }
};
```

```js
methods.size  = function () {return this.size_};
methods.key   = function () {return this.key_};
methods.value = function () {return this.value_};
```

# Derivatives

Like futures, signals don't have base objects since updates are propagated
forwards.

```js
methods.derivative = function (generator) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.signal(f, this);
};
```

```js
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
```

```js
methods.push = function (v, k) {
  // Alert listeners...
  var ls = this.listeners_;
  for (var id in ls)
    if (Object.prototype.hasOwnProperty.call(ls, id))
      ls[id](v, k);
```

```js
  // ... then track the signal's current state
  this.value_ = v;
  this.key_   = k;
  ++this.size_;
  return this;
};
```

# Retrieval

Signals behave just like futures that change if decided again. They always
consist of a single key/value mapping, and sometimes the key is empty or null.

```js
methods.get = function (k) {
  // get() -> {} if undecided, {k: v} if decided
  if (k === void 0) {
    var result = {};
    if (this.key_ != null) result[this.key_] = this.value_;
    return result;
  }
```

```js
  // get(k) -> v if decided and k === key, otherwise null
  if (k === this.key_) return this.value_;
  else                 return null;
};
```

# Callback interface

You can use a signal to invoke a callback, and you can also create a callback
that will trigger the signal when you invoke it.

```js
methods.on = function (target, callback) {
  var f = typeof target === typeof '' || target instanceof String
          ? function (x) {return x === target}
          : infuse.fn(target);
```

```js
  this.generator()(function (v, k) {if (f(k)) callback(v, k)},
                   infuse.gen_id());
  return this;
};
```

Similar to `on` is `once`, which creates a callback that is invoked only once
and then removed from the listener list. This can prevent a space leak for
cases where you need transient anonymous listeners.

```js
methods.once = function (target, callback) {
  var f    = typeof target === typeof '' || target instanceof String
             ? function (x) {return x === target}
             : infuse.fn(target),
      id   = infuse.gen_id(),
      self = this;
```

```js
  this.generator()(function (v, k) {
                     if (f(k)) {
                       delete self.listeners_[id];
                       callback(v, k);
                     }
                   }, id);
  return this;
};
```

```js
methods.trigger = function (k) {
  var self = this;
  return function (v) {self.push(v, k)};
};
```

```js
});
});

```

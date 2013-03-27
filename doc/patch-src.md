Infuse patch | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

A patch holds `[value, key]` pairs and makes it easy to apply these pairs to
other objects. It stores the pairs efficiently, flattening them into a single
large array.

```js
infuse.extend(function (infuse) {
infuse.type('patch', function (patch, methods) {
```

```js
infuse.mixins.pull(methods);
```

# Patch state

A patch is much like an array in that it just keeps track of its elements. It
is an append-only structure.

```js
methods.initialize = function (generator, base) {
  this.vks_       = [];
  this.generator_ = generator;
  this.base_      = base;
  this.version_   = -1;
```

```js
  infuse.assert(!!generator === !!base,
    'infuse: base and generator must be specified together ('
  + 'error constructing patch)');
};
```

```js
methods.tos = function () {
  return (this.base_ ? '#<<' : '<<')
       + this.map('_2 + ":" + _1').join(', ')
       + '>>';
};
```

```js
methods.size = function () {return this.vks_.length >>> 1};
```

```js
methods.push_ = function (v, k) {
  var vks = this.vks_;
  vks.push(v);
  vks.push(k);
  return this;
};
```

# Derivatives

Patches are append-only, so derivatives work just like they do for Infuse
arrays.

```js
methods.derivative = function (generator, version_base) {
  var f = infuse.fn(generator);
  return infuse.patch(f, version_base || this);
};
```

```js
methods.generator = function () {
  var self = this,
      i    = 0;
  return function (emit, id) {
    for (var vks = self.pull().vks_, l = vks.length; i < l;)
      if (emit(vks[i++], vks[i++]) === false) return false;
  };
};
```

# Retrieval

This collection isn't indexed by key, so there is no get(k) interface. As a
result, you can't sort patches.

```js
methods.get = function () {
  return this.get_default.apply(this, arguments);
};
```

```js
});
});

```

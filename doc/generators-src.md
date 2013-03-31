Infuse generators | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Infuse uses generators to propagate values from source collections to
derivatives. A generator is an object that provides a few methods: `generate`,
`generator_state`, `version`, and `derivative`.

Collections are themselves generators, but Infuse also defines generators that
lazily transform values that originated somewhere else. Generators behave like
Infuse collections in that you can call `map`, `filter`, etc, on them to
construct derivatives.

```js
infuse.extend(function (infuse) {
```

# Generator metaclasses

There are two fairly straightforward kinds of transforming generators. One, the
stateless generator, applies a consistent transformation to the key/value
space. The other, the nonreducing generator, transforms each pair
independently.

```js
infuse.stateless_generator = function (name, transform) {
  return infuse.type(name, function (self, methods) {
    infuse.mixins.transforming_generator(methods);
```

```js
    methods.initialize = function (generator) {
      this.generator_ = generator;
    };
```

```js
    methods.transform = transform;
  });
};
```

```js
infuse.nonreducing_generator = function (name, transform) {
  return infuse.type(name, function (self, methods) {
    infuse.mixins.transforming_generator(methods);
```

```js
    methods.initialize = function (generator, f) {
      this.generator_ = generator;
      this.f_         = f;
    };
```

```js
    methods.transform = transform;
  });
};
```

# Stateless generators

Fairly self-explanatory. There isn't a whole lot of interesting stuff that can
happen here.

```js
infuse.stateless_generator('identity_generator',
  function (target, v, k) {return target.push_pair(v, k)});
```

```js
infuse.stateless_generator('key_generator',
  function (target, v, k) {return target.push_pair(k, k)});
```

```js
infuse.stateless_generator('inverse_generator',
  function (target, v, k) {return target.push_pair(k, v)});
```

# Nonreducing generators

These store a pair-transforming function `f_` that side-effectfully updates the
target with some transformation of the given (value, key) pair.

```js
infuse.nonreducing_generator('map_generator',
  function (target, v, k) {return target.push_pair(this.f_(v, k), k)});
```

```js
infuse.nonreducing_generator('filter_generator',
  function (target, v, k) {if (this.f_(v, k)) return target.push_pair(v, k)});
```

```js
infuse.nonreducing_generator('mapfilter_generator',
  function (target, v, k) {
    var y = this.f_(v, k);
    if (y) return target.push_pair(y, k);
  });
```

```js
infuse.nonreducing_generator('flatmap_generator',
  function (target, v, k) {
    var r = this.f_(v, k);
    return r && infuse(r).into(target);
  });
```

```js
infuse.nonreducing_generator('kmap_generator',
  function (target, v, k) {return target.push_pair(v, this.f_(k, v))});
```

```js
infuse.nonreducing_generator('kmapfilter_generator',
  function (target, v, k) {
    var j = this.f_(k, v);
    if (j) return target.push_pair(v, j);
  });
```

# Reducing generators

These maintain state between `transform` calls, which makes order more
important.

```js
infuse.type('reducing_generator', function (gen, methods) {
  infuse.mixins.transforming_generator(methods);
```

```js
  methods.initialize = function (generator, initial, f) {
    this.generator_ = generator;
    this.v_         = initial;
    this.f_         = f;
  };
```

```js
  methods.transform = function (target, v, k) {
    return target.push_pair(this.v_ = this.f_(this.v_, v, k), k);
  };
});
```

```js
});

```

Infuse funnels | Spencer Tipping
Licensed under the terms of the MIT source code license

# Infuse funnels

A funnel is a virtual object that unifies multiple bases. It maintains no
state, and as such has no `get` method.

```js
infuse.extend(function (infuse) {
infuse.type('funnel', function (funnel, methods) {
```

Although funnels are structurally pull-collections, we don't mixin the pull
collection base here. The pull-collection base assumes just one base, but
funnels have many. Funnels also don't store versions; the funnel's version is
just the sum of the versions of its bases.

```js
methods.initialize = function (bases) {
  this.bases_ = bases;
};
```

```js
methods.version = function () {
  for (var v = 0, i = 0, bs = this.bases_, l = bs.length; i < l; ++i)
    v += bs[i].version();
  return v;
};
```

Funnels maintain no real state, so pulling does nothing. Changes are always
propagated from generators.

```js
methods.pull = function () {return this};
```

# Derivatives

Funnels don't support derivatives, but they do provide generators.

```js
methods.derivative = function () {
  throw new Error('infuse: funnels cannot produce derivatives');
};
```

```js
methods.generator = function () {
  var generators = [],
      versions   = [],
      self       = this;
  for (var i = 0, bs = this.bases_, l = bs.length; i < l; ++i)
    generators.push(bs[i].generator()),
    versions.push(-1);
```

```js
  return function (emit, id) {
    var v  = 0,
        bs = self.bases_;
    if (bs)
      for (var i = 0, l = versions.length; i < l; ++i)
        if ((v = bs[i].pull().version()) > versions[i])
          versions[i] = v,
          generators[i](emit, id);
  };
};
```

```js
methods.detach = function () {
  for (var i = 0, bs = this.bases_, l = bs.length; i < l; ++i)
    bs[i].detach_derivative(this);
  this.bases_ = null;
  return this;
};
```

```js
methods.detach_derivative = function (derivative) {
  return this;
};
```

```js
});
});

```

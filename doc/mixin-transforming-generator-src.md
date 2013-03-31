Infuse transforming generator mixin | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Most pair-transforming generators have a lot of shared boilerplate, in this
case factored off into a single mixin.

```js
infuse.extend(function (infuse) {
infuse.mixin('transforming_generator', function (methods) {
```

Getting the derivative of a generator is kind of interesting. The assumption is
that the caller has already transformed the receiver's generator somehow, and
wants a new object of the same type with the given transformation. In our case,
we just return the generator as-is; we have no state to add to it.

```js
methods.derivative = function (generator) {return generator};
methods.generator  = function ()          {return this};
```

```js
methods.detach_derivative = function (derivative) {
  this.generator_.detach_derivative(derivative);
  return this;
};
```

```js
methods.generator_state = function () {
  return this.generator_.generator_state();
};
```

```js
methods.generate = function (target, state) {
  var self = this;
  return this.generator_.generate({
    push_pair: function (v, k) {return self.transform(this, v, k)},
    id:        function ()     {return self.id()}});
};
```

```js
});
});

```

Infuse pull-propagation mixin | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

All Infuse collections support some form of derivatives and dynamic updating.
This mixin assumes the presence of a few instance variables and provides the
methods required to create linked derivatives. To use this mixin, you need to
define/maintain the following:

    this.base_            the source for this derivative collection
    this.generator_       a generator function that accepts an emitter
    this.version_         the current version of this object
    this.push_(v, k)      a function that adds a new element to the object

Given that, this mixin provides a complete implementation of pull-propagation,
as well as defining a wrapper `push` method that takes care of version
updating and derivative checking.

```js
infuse.extend(function (infuse) {
infuse.mixin('pull', function (methods) {
```

# Trivial accessors

We assume the presence of `base_`, `version_`, and `generator_`. Of these,
`generator_` is kept private because accessing it changes its state.

```js
methods.base          = function () {return this.base_};
methods.version       = function () {return this.version_};
methods.is_derivative = function () {return !!this.base_};
```

```js
methods.bases = function () {return this.base_ ? [this.base_] : []};
```

# Pull propagation

You can pull any collection with a base (it's a nop for independent
collections). An invariant is that invoking `pull` with no arguments will cause
the receiver to become up-to-date with the base. As a result, the receiver's
version will bet set equal to the base's version.

```js
methods.pull = function () {
  var b = this.base_,
      v = b && b.pull().version();
```

```js
  // Invoking generators is potentially expensive, so only do it if there's a
  // version discrepancy.
  if (v && v > this.version_) {
    // Optimistically pre-increment the version so that any push_ calls made by
    // the generator will see the new version.
    ++this.version_;
    var self = this;
    this.generator_(function (v, k) {self.push_(v, k)}, this.id());
    this.version_ = v;
  }
```

```js
  return this;
};
```

```js
methods.push = function (v, k) {
  infuse.assert(!this.base_, 'infuse: attempted to push onto a derivative');
  ++this.version_;
  return this.push_(v, k);
};
```

# Detaching

You can detach any pull-propagated collection from its source to allow the
source to be garbage-collected. Doing this also enables the collection to be
modified by using `push`. `detach` does nothing if the collection is already
detached.

```js
methods.detach = function () {
  if (this.base_) this.base_.detach_derivative(this);
  this.base_ = this.generator_ = null;
  return this;
};
```

```js
// Do nothing; we don't track derivatives.
methods.detach_derivative = function (derivative) {
  return this;
};
```

```js
});
});

```

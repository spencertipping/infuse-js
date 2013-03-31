// Infuse pull-propagation mixin | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// All Infuse collections support some form of derivatives and dynamic updating.
// This mixin assumes the presence of a few instance variables and provides the
// methods required to create linked derivatives. To use this mixin, you need to
// define/maintain the following:

// | this.generator_       a generator object
//   this.version_         the current version of this object
//   this.push_pair(v, k)  a function that adds a new element to the object

// Given that, this mixin provides a complete implementation of pull-propagation,
// as well as defining a wrapper `push` method that takes care of version
// updating and derivative checking.

infuse.extend(function (infuse) {
infuse.mixin('pull', function (methods) {

// Trivial accessors.
// We assume the presence of `version_` and `generator_`. Of these, `generator_`
// is kept private because using it changes its state.

methods.version = function () {return this.version_};

// Pull propagation.
// You can pull any collection with a base (it's a nop for independent
// collections). An invariant is that invoking `pull` with no arguments will cause
// the receiver to become up-to-date with the base. As a result, the receiver's
// version will bet set equal to the base's version.

methods.pull = function () {
  var g = this.generator_,
      v = g && g.version();

  // Invoking generators is potentially expensive, so only do it if there's a
  // version discrepancy.
  if (v && v > this.version_) {
    // Optimistically pre-increment the version so that any push_pair() calls
    // made by the generator will see the new version.
    ++this.version_;
    if (g.into(this) !== false) this.version_ = v;
  }
  return this;
};

methods.push = function (v, k) {
  ++this.version_;
  this.push_pair(v, k);
  return this;
};

// Generators.
// We need a way to go from a collection, whose derivatives are buffered, to a
// generator, whose derivatives are unbuffered. To do this, we just construct an
// identity generator around the receiver.

methods.generator = function () {return infuse.identity_generator(this)};

// Detaching.
// You can detach any pull-propagated collection from its source to allow the
// source to be garbage-collected. Doing this also enables the collection to be
// modified by using `push`. `detach` does nothing if the collection is already
// detached.

methods.detach = function () {
  if (this.generator_) this.generator_.detach_derivative(this);
  this.generator_ = null;
  return this;
};

methods.detach_derivative = function (derivative) {
  // Do nothing. Pull-collections don't maintain forward links to derivatives.
  return this;
};

});
});

// Generated by SDoc

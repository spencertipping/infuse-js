// Infuse push-propagation mixin | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This mixin provides method implementations useful for push-updated objects. The
// assumption is that push updates happen asynchronously, though they could also
// be synchronous in certain cases.

infuse.extend(function (infuse) {
infuse.mixin('push', function (methods) {

// Compatibility.
// It's legal to use a push collection as the basis for a pull collection, and
// this actually happens quite frequently. To make this work, we need to implement
// two methods: `pull` (which does nothing), and `version`. A push-propagated
// object's version is just its size; presumably this is monotonically increasing
// (if not, you should define a different version strategy).

methods.pull    = function () {return this};
methods.version = function () {return this.size() + 1};

methods.is_derivative = function () {
  var bs = this.bases_;
  for (var k in bs)
    if (Object.prototype.hasOwnProperty.call(bs, k))
      return true;
  return false;
};

methods.bases = function () {
  var r = [], bs = this.bases_;
  for (var k in bs)
    if (Object.prototype.hasOwnProperty.call(bs, k))
      r.push(bs[k]);
  return r;
};

// Detachment.
// Push objects are forward-linked, so we need to inform the parent that the
// derivative should be detached. In order to do this, we need to construct a
// unique identifier for each derivative.

methods.detach = function (base) {
  // Two possibilities. If a base is specified, then detach from that one
  // specifically. Otherwise, detach from all bases.
  if (base)
    base.detach_derivative(this),
    delete this.bases_[base.id()];
  else {
    var bs = this.bases_;
    for (var id in bs)
      if (Object.prototype.hasOwnProperty.call(bs, id))
        bs[id].detach_derivative(this),
        delete bs[id];
  }
  return this;
};

methods.detach_derivative = function (derivative) {
  // Free the listener if possible.
  var ls = this.listeners_;
  if (ls) delete ls[derivative.id()];
  return this;
};

});
});

// Generated by SDoc

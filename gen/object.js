// Infuse objects | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Infuse objects.
// Like Infuse arrays, objects can be constructed either by wrapping an existing
// object or by specifying a generator function. If you specify a generator, the
// object's value (as returned by `get`, etc) will be updated as new elements
// become available.

// Infuse objects are not considered to be ordered unless you call `keys` or
// `values`. Each of these methods takes a sorted snapshot of the key list to
// guarantee traversal order; so you could request `keys` and `values` and know
// that `k[0]` corresponded to `v[0]`, for instance.

infuse.extend(function (infuse) {
infuse.type('object', function (object, methods) {

// Use pull-propagation updating
infuse.mixins.pull(methods);

// Object state.
// Like an Infuse array, an object has a backing which may be externally
// allocated, and for internally-allocated backings it also has a generator and a
// base.

methods.initialize = function (o_or_f, base) {
  if (o_or_f instanceof Function)
    this.o_         = {},
    this.base_      = infuse.assert(base,
                        'infuse: attempted to construct a derivative '
                      + 'object without specifying a base'),
    this.generator_ = o_or_f,
    this.version_   = -1,
    this.journal_   = infuse.heapmap(),
    this.pull();
  else
    this.o_         = o_or_f,
    this.base_      = null,
    this.generator_ = null,
    this.version_   = 1,
    this.journal_   = null;
};

methods.tos = function () {
  return (this.base_ ? '#{' : 'I{')
       + this.keys().sort().map('_ + ": " + o[_]', {o: this.o_}).join(', ')
       + '}';
};

// Size is the number of distinct key/value pairs stored in the object. This
// function needs to be amortized O(1), so we use the journal to tell us how many
// items we have.

methods.size = function () {return this.pull().journal().size()};

methods.push_ = function (v, k) {
  var o = this.o_;
  o[k] = v;
  this.journal().push(this.version_, k);
  return this;
};

// Derivatives.
// Objects can have derivatives just like arrays can, but the behavior is
// different. An object derivative means "the object will gain new key/value
// mappings in the future", much as an array derivative means "the array will grow
// in the future". So it's a partial journal of changes that will be made to the
// object.

// The main difference between the two is the degree of assumption about
// immutability. Arrays are only allowed to grow; we assume that elements already
// in the array won't change. Objects, on the other hand, might receive value
// updates for existing keys; a common case of this is when you're indexing
// something. This means that a simple array journal has the potential to be
// arbitrarily larger than the object it represents (since it's storing each
// intermediate change).

// As a result, we don't keep the journal this way. Instead, we just use an object
// that maps each key to the last version at which it was modified. Each generator
// can then search this object and apply updates. This makes searching O(n) when
// the object has been updated, O(1) otherwise.

methods.derivative = function (generator, version_base) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.object(f, version_base || this);
};

methods.journal = function () {
  var j = this.journal_;
  if (!j) {
    var o = this.o_,
        v = this.version_;

    // Update all keys to the current version.
    j = this.journal_ = infuse.heapmap();
    for (var k in o)
      if (Object.prototype.hasOwnProperty.call(o, k))
        j.push(v, k);
  }
  return j;
};

// Traversal.
// This is tricky. We need to go through the object's keys in the right order, but
// we can't use the `keys` function to do it because `keys` is defined in terms of
// `generator`. Instead, we maintain a maxheap of key -> version and use that to
// pull changes.

// Heap generators aren't the same as generators for other objects; see
// `infuse.heapmap` for details.

methods.generator = function () {
  var journal_generator = this.journal().generator(),
      o                 = this.o_;
  return function (emit) {
    // The version generator passes the version as 'v' and the key as 'k'; we
    // just need to translate that into our value for the key.
    return journal_generator(function (v, k) {return emit(o[k], k)});
  };
};

// Retrieval.
// Objects don't support `first` or `last`, but they do support `get`, which takes
// a string or array of strings.

methods.get = function (k) {
  var o = this.pull().o_;

  // get() -> the current backing object (don't modify this!)
  if (k === void 0) return o;

  // get(k) -> o[k]
  if (typeof k === typeof '' || k instanceof String) return o[k];

  return this.get_default.apply(this, arguments);
};

});

// Object promotion.
// Detecting a vanilla object turns out to be tricky. We can't do the obvious `x
// instanceof Object` because everything is an instance of `Object`. Long story
// short, we have to rely on `Object.prototype.toString` to tell us.

var obj_tos = Object.prototype.toString.call({});
infuse.alternatives.push(
  {accepts:   function (x) {return Object.prototype.toString.call(x) === obj_tos
                                && !(x instanceof infuse)},
   construct: function (x) {return infuse.object(x)}});

});

// Generated by SDoc

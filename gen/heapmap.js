// Infuse heapmap | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// A fairly trivial minheap-map implementation used by the cache as a priority
// queue. This heap stores objects independently from their priorities, so you can
// update an object's priority dynamically and it will heapify up or down
// accordingly.

// A heap is an Infuse object, so it supports the usual set of methods. It also
// supports the following heap-specific methods:

// | push(k, index) -> this        // insert, or update if already there
//   pop()          -> k           // remove item with minimum index
//   first(index)   -> [k1, ...]   // get all keys whose values are <= index

// In every other way it behaves like an object that maps keys to heap indexes.

// Performance.
// Heap maps have the following performance characteristics:

// Method       | worst-time | amortized time | ephemeral | persistent | amortized
// :-----       | :--------: | :------------: | :-------: | :--------: | :-------:
// `size`       | O(1)       | O(1)           | O(0)      | O(0)       | O(0)
// `derivative` | O(1)       | O(1)           | O(1)      | O(0)       | O(0)
// `force`      | O(k log n) | O(k log n)     | O(k)      | O(k)       | O(k)
// `touch`      | Θ(n)       | Θ(n)           | O(n)      | O(k)       | O(k)
// `each`       | Θ(n)       | Θ(n)           | O(1)      | O(0)       | O(0)
// `keys`       | Θ(n)       | Θ(n)           | Θ(n)      | O(0)       | O(0)
// `values`     | O(n)       | O(1)           | O(0)      | O(n)       | Θ(1)
// `cursor`     | O(1)       | O(1)           | O(n)      | O(0)       | O(0)
// `get`        | O(1)       | O(1)           | O(0)      | O(0)       | O(0)
// **Custom**   |            |                |           |            |
// `push`       | O(log n)   | O(log n)       | Θ(1)      | Θ(1)       | Θ(1)
// `pop`        | O(log n)   | O(log n)       | Θ(0)      | Θ(-1)      | Θ(-1)
// `first`      | Θ(k)       | Θ(k)           | Θ(k)      | O(0)       | O(0)

infuse.extend(function (infuse) {
infuse.type('heapmap', function (heapmap, methods) {

// Heap state.
// A heap stores the ordering function, which takes two elements and returns true
// if the first should be above the second (so for a minheap, `a < b`). It also
// contains the element set, an internal map that keeps track of where each
// element is stored in the array, and, of course, a version.

// Heapmaps are maps, so you can't store arbitrary data in them (well, you can,
// but then the map will break). If you want the map functionality, then the data
// you're storing must be a string.

methods.initialize = function (above, generator, base) {
  // Default to a minheap of numeric/comparable things.
  this.above_     = above ? infuse.fn(above) : function (a, b) {return a < b};
  this.elements_  = [];
  this.positions_ = {};
  this.base_      = base || null;
  this.generator_ = generator || null;
  this.versions_  = {};
  this.version_   = 0;
};

methods.size = function () {return this.pull().elements_.length};

// Derivatives.
// You can construct a derivative for any heapmap.

methods.derivative = function (generator) {
  return infuse.heapmap(this.above_, generator, this);
};

methods.force = function (n) {
  
};

methods.touch = function (touched_keys) {
  
};

// Traversal.
// Heapmaps behave like Infuse objects, but the traversal order depends on the
// layout of the heap.

methods.each = function () {
  var f = infuse.fn.apply(this, arguments);
  for (var xs = this.elements_, i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i].k, i) === false) break;
  return this;
};

methods.get = function (k) {
  var map = this.positions_;
  return Object.prototype.hasOwnProperty.call(map, k)
    ? this.elements_[map[k]].v
    : infuse.fn.apply(this, arguments)(this);
};

methods.pop = function () {
  var xs  = this.elements_,
      map = this.positions_;
  if (!xs.length) return void 0;      // can't pop an empty heap

  this.touch();                       // update version
  var first = xs[0];
  xs[0] = xs_.pop();                  // standard last->first...
  this.heapify_down_(0);              // then heapify down
  map[xs[0].k] = 0;                   // update position map
  delete map[first.k];
  return first.k;
};

methods.push = function (k, v) {
  var xs  = this.elements_,
      map = this.positions_;

  this.touch();
  if (Object.prototype.hasOwnProperty.call(map, k)) {
    // Update, not insert. Change the value, then heapify up or down
    // depending on the value ordering.
    var i          = map[k],
        x          = xs[i],
        original_v = x.v;
    x.v = v;

    return this.above_(v, original_v)
      ? this.heapify_up_(i)
      : this.heapify_down_(i);
  } else {
    // Insert. This is the easy case: build a new container, add to end of
    // elements, and heapify up.
    var l = xs.length;
    xs.push({k: k, v: v});
    map[k] = l;
    return this.heapify_up_(l);
  }
};

methods.swap_ = function (i, j) {
  var xs  = this.elements_,
      map = this.positions_,
      tmp = xs[i];
  xs[i] = xs[j];                      // swap the elements
  xs[j] = tmp;
  map[xs[i].k] = i;                   // update position map
  map[xs[j].k] = j;
  return this;
};

methods.heapify_down_ = function (i) {
  var xs = this.elements_;
  if (i << 1 >= xs.length)
    // Can't heapify down beyond the bottom of the heap
    return this;

  // Swap with the greater of the two children unless the current element is
  // greater than both.
  var left  = i << 1,
      right = i << 1 | 1,
      xi    = xs[i].v,
      xl    = xs[left].v,
      xr    = xs[right];      // this might not exist

  if (this.above_(xi, xl) && !xr || this.above_(xi, xr.v))
    // We're done; neither child is greater.
    return this;

  // Swap with the greater of the two children.
  var swap_index = !xr || this.above_(xl, xr.v) ? left : right;
  return this.swap_(i, swap_index).heapify_down_(swap_index);
};

methods.heapify_up_ = function (i) {
  var xs = this.elements_,
      up = i >>> 1;

  return i && this.above_(xs[i], xs[up])
    ? this.swap_(i, up).heapify_up_(up)
    : this;
};

});
});

// Generated by SDoc

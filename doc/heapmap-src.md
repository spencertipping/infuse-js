Infuse heapmap | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

A fairly trivial minheap-map implementation used by the cache as a priority
queue. This heap stores objects independently from their priorities, so you can
update an object's priority dynamically and it will heapify up or down
accordingly.

Note that **heaps are not real Infuse objects** in that they are inherently
mutable. This means that you can't make derivatives of them, so all of the
usual transformation methods will fail if you use them with heaps.

# Performance

Heap maps have the following performance characteristics:

Method       | worst-time | amortized time | ephemeral | persistent | amortized
:-----       | :--------: | :------------: | :-------: | :--------: | :-------:
`size`       | O(1)       | O(1)           | O(0)      | O(0)       | O(0)
`derivative` | O(1)       | O(1)           | O(1)      | O(0)       | O(0)
`force`      | O(k log n) | O(k log n)     | O(k)      | O(k)       | O(k)
`touch`      | Θ(n)       | Θ(n)           | O(n)      | O(k)       | O(k)
`each`       | Θ(n)       | Θ(n)           | O(1)      | O(0)       | O(0)
`keys`       | Θ(n)       | Θ(n)           | Θ(n)      | O(0)       | O(0)
`values`     | O(n)       | O(1)           | O(0)      | O(n)       | Θ(1)
`cursor`     | O(1)       | O(1)           | O(n)      | O(0)       | O(0)
`get`        | O(1)       | O(1)           | O(0)      | O(0)       | O(0)
**Custom**   |            |                |           |            |
`push`       | O(log n)   | O(log n)       | Θ(1)      | Θ(1)       | Θ(1)
`pop`        | O(log n)   | O(log n)       | Θ(0)      | Θ(-1)      | Θ(-1)
`first`      | Θ(k)       | Θ(k)           | Θ(k)      | O(0)       | O(0)

```js
infuse.extend(function (infuse) {
infuse.type('heapmap', function (heapmap, methods) {
```

# Heap state

A heap stores the ordering function, which takes two elements and returns true
if the first should be above the second (so for a minheap, `a < b`). It also
contains the element set, an internal map that keeps track of where each
element is stored in the array, and, of course, a version.

Heapmaps are maps, so you can't store arbitrary data in them (well, you can,
but then the map will break). If you want the map functionality, then the data
you're storing must be a string.

```js
methods.initialize = function (above) {
  // Default to a minheap of numeric/comparable things.
  this.above_     = above ? infuse.fn(above) : function (a, b) {return a < b};
  this.elements_  = [];
  this.positions_ = {};
};
```

```js
methods.size = function () {return this.elements_.length};
```

# Derivatives

All derivative methods are disabled because heapmaps are too mutable to
sensibly transform them.

```js
methods.derivative = function (generator) {
  throw new Error('infuse: cannot create derivative of a heap');
};
```

```js
methods.force = function (n) {
  throw new Error('infuse: cannot force a heap');
};
```

```js
methods.touch = function () {return this};
```

# Traversal

Heapmaps behave like Infuse objects, but the traversal order depends on the
layout of the heap.

```js
methods.each = function () {
  var f = infuse.fn.apply(this, arguments);
  for (var xs = this.elements_, i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i].k, i) === false) break;
  return this;
};
```

```js
methods.get = function (k) {
  var map = this.positions_;
  return Object.prototype.hasOwnProperty.call(map, k)
    ? this.elements_[map[k]].v
    : infuse.fn.apply(this, arguments)(this);
};
```

```js
methods.peek = function () {
  var xs = this.elements_;
  if (!xs.length) return void 0;
  return xs[0].k;
};
```

```js
methods.pop = function () {
  var xs  = this.elements_,
      map = this.positions_;
  if (!xs.length) return void 0;      // can't pop an empty heap
  var first = xs[0];
  xs[0] = xs.pop();                   // standard last->first...
  this.heapify_down_(0);              // then heapify down
  map[xs[0].k] = 0;                   // update position map
  delete map[first.k];
  return first.k;
};
```

```js
methods.push = function (k, v) {
  var xs  = this.elements_,
      map = this.positions_;
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
```

```js
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
```

```js
methods.heapify_down_ = function (i) {
  var xs = this.elements_;
  if (i << 1 >= xs.length)
    // Can't heapify down beyond the bottom of the heap
    return this;
```

```js
  // Swap with the greater of the two children unless the current element is
  // greater than both.
  var left  = i << 1,
      right = left | 1,
      xi    = xs[i].v,
      xl    = xs[left].v,
      xr    = xs[right];      // this might not exist
```

```js
  if (this.above_(xi, xl) && (!xr || this.above_(xi, xr.v)))
    // We're done; neither child is greater.
    return this;
```

```js
  // Swap with the greater of the two children.
  var swap_index = !xr || this.above_(xl, xr.v) ? left : right;
  return this.swap_(i, swap_index).heapify_down_(swap_index);
};
```

```js
methods.heapify_up_ = function (i) {
  var xs = this.elements_,
      up = i >>> 1;
```

```js
  return i && this.above_(xs[i].v, xs[up].v)
    ? this.swap_(i, up).heapify_up_(up)
    : this;
};
```

```js
});
});

```

Infuse AA-tree | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

A straightforward AA-tree implementation used as a key modification journal by
objects and buffers. Like heapmaps, AA-trees have generators that traverse the
key/value pairs in value-sorted order.

```js
infuse.extend(function (infuse) {
infuse.type('aatree', function (aatree, methods) {
```

```js
infuse.mixins.pull(methods);
```

# AA-tree state

We store the ordering function, which takes two values and returns true if the
first should be stored to the left of the second. When searching for elements,
equality is determined with `===`.

Storing AA-trees in an array is _completely and utterly impractical_, so we
define a class representing a tree node.

```js
methods.initialize = function (lt, use_strings, generator, base) {
  this.lt_        = lt ? infuse.fn(lt)
                       : function (a, b) {return a < b};
  this.root_      = null;
  this.size_      = 0;
  this.version_   = -1;
  this.base_      = base;
  this.generator_ = generator;
```

```js
  infuse.assert(!!base === !!generator,
    'infuse: base and generator must be specified together ('
  + 'error constructing aatree)');
};
```

```js
methods.tos = function () {
  return (this.base_ ? '#t<' : '#<')
       + this.map('_2 + ": " + _1').join(', ')
       + '>';
};
```

```js
methods.size = function () {return this.size_};
```

# Node state

Each node contains a key, value, level, left child, and right child. Nodes are
not parent-linked.

```js
methods.aatree_node_ = function (v, k, level, l, r) {
  this.v     = v;
  this.k     = k;
  this.level = level;
  this.l     = l;
  this.r     = r;
};
```

# Rebalancing

Skew operation, which does this:

       L <- [T]              [L] -> T
      / \      \     ->     /      / \
     A   B      R          A      B   R

The brackets indicate reference; for the skew operation, the parent's child
pointer may change from T to L.

```js
methods.aatree_node_.prototype.skew = function () {
  var l = this.l;
  if (l && l.level === this.level) {
    this.l = l.r;
    l.r    = this;
    return l;
  }
  return this;
};
```

Split operation:

                              [R]
       [T] -> R -> X         /   \
      /      /         ->   T     X
     A      B              / \
                          A   B

Just like in `skew`, we return the parent's new child.

```js
methods.aatree_node_.prototype.split = function () {
  var r  = this.r;
  var rr = r && r.r;
  if (rr && this.level === rr.level) {
    this.r = r.l;
    r.l    = this;
    ++r.level;
    return r;
  }
  return this;
};
```

# Insertion

Destructively inserts a node into the tree, returning the new root. This
implementation of AA trees supports multiple identical instances of the same
key/value pair. Algorithms here are based on the implementation described in
http://user.it.uu.se/~arnea/ps/simp.ps.

```js
methods.aatree_node_.prototype.insert = function (v, k, tree) {
  if (tree.lt_(k, this.k))
    this.left  = this.left  ? this.left.insert(v, k, tree)
                            : new methods.aatree_node_(v, k, 1, null, null);
  else
    this.right = this.right ? this.right.insert(v, k, tree)
                            : new methods.aatree_node_(v, k, 1, null, null);
  var t = this;
  t = t.skew();
  t = t.split();
  return t;
};
```

# Deletion

Algorithm here is based on Wikipedia, original AA-tree paper, and Javascript
implementation at
http://thomaswilburn.net/typedefs/index.php/tree/aa/aa_trees.html.

```js
methods.aatree_node_.prototype.remove = function (k, tree) {
  var l, r;
  var lt = tree.lt_(this.k, k);
  if      ((r = this.r) && lt)                  this.r = r.remove(k, tree);
  else if ((l = this.l) && this.k !== k && !lt) this.l = l.remove(k, tree);
  else if (!l && !r) return null;
  else if (!l) l = this.next(), this.r = r.remove(l.k, tree),
               this.v = l.v, this.k = l.k;
  else         r = this.prev(), this.l = l.remove(r.k, tree),
               this.v = r.v, this.k = r.k;
```

```js
  var l1 = this.level - 1;
  if ((l = this.l).level < l1 || (r = this.r).level < l1) {
    --this.level;
    r.level = Math.min(r.level, this.level);
    var t = this.skew();
    t.r = t.r && t.r.skew();
    if (t.r) (t.r.r = t.r.r && t.r.r.skew());
    t = t.split();
    if (t.r) t.r = t.r.split();
    return t;
  }
};
```

```js
methods.aatree_node_.prototype.next = function () {
  var t = this.right;
  while (t.left) t = t.left;
  return t;
};
```

```js
methods.aatree_node_.prototype.prev = function () {
  var t = this.left;
  while (t.right) t = t.right;
  return t;
};
```

# Traversal

There are two cases here. First, we can search for and retrieve a node with the
given key (ultimately compared with `===`); and second, we can do an in-order
traversal beginning at a given point. `search` returns the node associated with
a key.

```js
methods.aatree_node_.prototype.search = function (k, tree) {
  return k === this.k        ? this
       : tree.lt_(k, this.k) ? this.l && this.l.search(k, tree)
       :                       this.r && this.r.search(k, tree);
};
```

```js
methods.aatree_node_.prototype.traverse = function (start, tree, target) {
  if (start === void 0 || tree.lt_(start, this.k)) {
    if (this.l) this.l.traverse(start, tree, target);
    if (target.push(this.v, this.k) === false) return false;
  }
  if (this.r) this.r.traverse(start, tree, target);
};
```

# Outer tree interface

The node class takes care of almost everything. We just need to manage the
root.

```js
methods.push_ = function (v, k) {
  this.root_ = this.root_ ? this.root_.insert(v, k, this)
                          : new methods.aatree_node_(v, k, 1, null, null);
  ++this.size_;
  return this;
};
```

NOTE: The object being removed is assumed to be in the tree! If it isn't, then
the size counter will become incorrect.

```js
methods.remove = function (k) {
  if (this.root_) --this.size_;
  this.root_ = this.root_ && this.root_.remove(k, this);
  return this;
};
```

# Derivatives

Generators traverse the tree in key order, which involves maintaining a
reference to the last one seen.

```js
methods.derivative = function (generator, version_base) {
  var f = infuse.fn(generator);
  return infuse.aatree(this.lt_, !(this.map_ instanceof Array),
                       f, version_base || this);
};
```

```js
methods.generator = function () {
  var last = void 0,
      self = this;
  return function (target) {
    var r = self.root_;
    if (!r) return;
    r.traverse(last, self, {push: function (v, k) {
      if (target.push(v, k) === false) return false;
      last = v;
    }});
  };
};
```

```js
});
});

```

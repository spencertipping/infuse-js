// Infuse AA-tree | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// A straightforward AA-tree implementation used as a key modification journal by
// objects and buffers. AA-trees have generators that traverse the key/value pairs
// in key-sorted order.

infuse.extend(function (infuse) {
infuse.type('aatree', function (aatree, methods) {

infuse.mixins.pull(methods);

// AA-tree state.
// We store the ordering function, which takes two values and returns true if the
// first should be stored to the left of the second. When searching for elements,
// equality is determined with `===`.

methods.initialize = function (lt, generator) {
  this.lt_        = lt ? infuse.fn(lt)
                       : function (a, b) {return a < b};
  this.root_      = null;
  this.size_      = 0;
  this.version_   = -1;
  this.generator_ = generator;
  this.first_     = null;
  this.last_      = null;

  this.pull();
};

methods.tos = function () {
  return (this.generator_ ? '#t<' : '#<')
       + this.map('_2 + ": " + _1').join(', ')
       + '>';
};

methods.internal_tos = function () {
  return this.internal_tos_(this.root_);
};

methods.internal_tos_ = function (node) {
  if (node) return node.k + '.' + node.level
                          + ' [' + this.internal_tos_(node.l) + ']'
                          + ' [' + this.internal_tos_(node.r) + ']';
  return '';
};

// Node state.
// Each node contains a key, value, level, left child, and right child. Nodes are
// not parent-linked.

methods.aatree_node_ = function (v, k, level, l, r) {
  this.v     = v;
  this.k     = k;
  this.level = level;
  this.l     = l;
  this.r     = r;
};

// Rebalancing.
// Skew operation, which does this:

// |    L <- [T]              [L] -> T
//     / \      \     ->     /      / \
//    A   B      R          A      B   R

// The brackets indicate reference; for the skew operation, the parent's child
// pointer may change from T to L.

methods.skew_ = function (node) {
  if (!node) return node;
  var l = node.l;
  if (l && l.level === node.level) {
    node.l = l.r;
    l.r    = node;
    return l;
  }
  return node;
};

// Split operation:

// |                           [R]
//      [T] -> R -> X         /   \
//     /      /         ->   T     X
//    A      B              / \
//                         A   B

// Just like in `skew`, we return the parent's new child.

methods.split_ = function (node) {
  if (!node) return node;
  var r  = node.r;
  var rr = r && r.r;
  if (rr && node.level === rr.level) {
    node.r = r.l;
    r.l    = node;
    ++r.level;
    return r;
  }
  return node;
};

// Insertion.
// Destructively inserts a node into the tree, returning the new root. This
// implementation of AA trees supports multiple identical instances of the same
// key/value pair. Algorithms here are based on the implementation described in
// http://user.it.uu.se/~arnea/ps/simp.ps.

methods.insert_ = function (node, v, k) {
  if (node == null) return new methods.aatree_node_(v, k, 1, null, null);
  else if (this.lt_(k, node.k)) node.l = this.insert_(node.l, v, k);
  else                          node.r = this.insert_(node.r, v, k);
  return this.split_(this.skew_(node));
};

// Deletion.
// Algorithm here is based on Wikipedia, original AA-tree paper, and Javascript
// implementation at
// http://thomaswilburn.net/typedefs/index.php/tree/aa/aa_trees.html.

// The idea here is that there are a few different cases, which we test for in
// this order. First, is the to-be-removed node to the left? Then we delegate. Is
// it strictly to the right? (Hence the `===` check; not-less-than isn't the same
// as greater than.) We delegate for this too. As a third option, we can simply
// delete ourselves if we're a leaf.

// The remaining two cases happen if we are not a leaf but we need to delete
// ourselves. The idea is to find the nearest leaf that _can_ be deleted, then
// take over the value from that leaf.

methods.remove_ = function (node, k) {
  if (!node || !node.l && !node.r) return null;
  else if (this.lt_(k, node.k)) node.l = this.remove_(node.l, k);
  else if (k !== node.k)        node.r = this.remove_(node.r, k);
  else if (!node.l) {
    for (var next = node.r; next.l; next = next.l);
    node.r = this.remove_(node.r, next.k);
    node.k = next.k, node.v = next.v;
  } else {
    for (var prev = node.l; prev.r; prev = prev.r);
    node.l = this.remove_(node.l, prev.k);
    node.k = prev.k, node.v = prev.v;
  }

  var minlevel = 1 + Math.min(node.l ? node.l.level : 0,
                              node.r ? node.r.level : 0);
  if (minlevel < node.level) {
    node.level = minlevel;
    if (node.r && minlevel < node.r.level) node.r.level = minlevel;
    if (node     = this.skew_(node))
      if (node.r = this.skew_(node.r))
        node.r.r = this.skew_(node.r.r);
    if (node = this.split_(node))
      node.r = this.split_(node.r);
  }
  return node;
};

// Traversal.
// There are two cases here. First, we can search for and retrieve a node with the
// given key (ultimately compared with `===`); and second, we can do an in-order
// traversal beginning at a given point. `search` returns the node associated with
// a key.

methods.search_ = function (node, k) {
  if (!node) return null;
  var tk = node.k;
  return k === tk        ? node
       : this.lt_(k, tk) ? this.search_(node.l, k)
       :                   this.search_(node.r, k);
};

// Traversal requires O(k + log n) comparisons, where k is the number of nodes
// that are in range.

methods.traverse_ = function (node, start, target) {
  if (!node) return;
  var k = node.k;
  if (start === void 0 || this.lt_(start, k)) {
    this.traverse_(node.l, start, target);
    if (target.push(node.v, k) === false) return false;
  }
  this.traverse_(node.r, start, target);
};

// Outer tree interface.
// The node class takes care of almost everything. We just need to manage the
// root.

methods.push_pair = function (v, k) {
  if (arguments.length === 1) k = this.version_;
  this.root_ = this.insert_(this.root_, v, k);
  this.first_ = this.last_ = null;
  return this;
};

methods.remove = function (k) {
  this.root_ = this.remove_(this.root_, k);
  this.first_ = this.last_ = null;
  return this;
};

methods.lookup = function (k) {
  var r = this.search_(this.root_, k);
  return r && r.v;
};

methods.first_node_ = function () {
  if (!this.root_) return null;
  var f = this.first_;
  if (f == null) {
    for (f = this.root_; f.l; f = f.l);
    this.first_ = f;
  }
  return f;
};

methods.first = function () {
  var f = this.first_node_();
  return f && f.v;
};

methods.kfirst = function () {
  var f = this.first_node_();
  return f && f.k;
};

methods.last_node_ = function () {
  if (!this.root_) return null;
  var l = this.last_;
  if (l == null) {
    for (l = this.root_; l.r; l = l.r);
    this.last_ = l;
  }
  return l;
};

methods.last = function () {
  var l = this.last_node_();
  return l && l.v;
};

methods.klast = function () {
  var l = this.last_node_();
  return l && l.k;
};

// Derivatives.
// Generators traverse the tree in key order, which involves maintaining a
// reference to the last one seen.

methods.derivative = function (fn) {
  return infuse.aatree(this.lt_, infuse.fnarg(arguments, 0));
};

methods.generator_state = function () {return {last: void 0}};
methods.generate = function (target, state) {
  return this.root_ && this.root_.traverse(function (v, k) {
    if (target.push_pair(v, k) !== false) state.last = k;
    else                                  return false;
  });
};

});
});

// Generated by SDoc

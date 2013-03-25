// Infuse edges.
// See also the [Infuse edge source](edge-src.md).

// Edges preserve invariants between signals. For example, let's suppose you have
// two signals, each of which might change independently, and you want to preserve
// the invariant that `b.get() = a.get() + 1`.

var a = $i.signal();
var b = $i.signal();
var e = a.to(b, '_ + 1', '_ - 1');

var a_called = 0;
a.on(/.*/, function (v, k) {++a_called});
var b_called = 0;
b.on(/.*/, function (v, k) {++b_called});

a.push(5);
infuse.assert_equal((b.get()                        ), (6));
infuse.assert_equal((a_called                       ), (1));
infuse.assert_equal((b_called                       ), (1));

b.push(5);
infuse.assert_equal((a.get()                        ), (4));
infuse.assert_equal((a_called                       ), (2));
infuse.assert_equal((b_called                       ), (2));

// Detaching an edge causes it to stop propagating changes:

infuse.assert_equal((e.detach()                     ), (e));
a.push(10);
infuse.assert_equal((a_called                       ), (3));
infuse.assert_equal((b_called                       ), (2));
infuse.assert_equal((b.get()                        ), (5));

b.push(1000);
infuse.assert_equal((a_called                       ), (3));
infuse.assert_equal((b_called                       ), (3));
infuse.assert_equal((a.get()                        ), (10));

// We can connect arbitrarily many objects together in any acyclic topology. For
// example:

var c = $i.signal();
var d = $i.signal();

// Let's make the values increase by one between `a`, `b`, `c`, and `d`
// respectively.

var ab = a.to(b, '_ + 1', '_ - 1');
var bc = b.to(c, '_ + 1', '_ - 1');
var cd = c.to(d, '_ + 1', '_ - 1');

a.push(2);
infuse.assert_equal((d.get()                        ), (5));
infuse.assert_equal((c.get()                        ), (4));
infuse.assert_equal((b.get()                        ), (3));
d.push(1);
infuse.assert_equal((a.get()                        ), (-2));
infuse.assert_equal((b.get()                        ), (-1));
infuse.assert_equal((c.get()                        ), (0));

// Infuse does not support cyclic graphs. If you create one, it will cause a stack
// overflow.

ab.detach();
var ac = a.to(c, '_ + 2', '_ - 2');
a.push(8);
infuse.assert_equal((c.get()                        ), (10));
infuse.assert_equal((b.get()                        ), (9));

d.push(9);
infuse.assert_equal((a.get()                        ), (6));
infuse.assert_equal((b.get()                        ), (7));
infuse.assert_equal((c.get()                        ), (8));

// Edges generalize to all Infuse objects. If you're connecting synchronous
// objects, you'll need to call `pull` on the edge to trigger propagation. Also
// note that pre-connection object state is not transferred through the edge; only
// updates after the edge is connected will be propagated.

var xs = $i([]);
var o  = $i({});
var e  = xs.to(o);

o.push('bar', 'foo');

e.pull();
infuse.assert_equal((o.size()                       ), (1));
infuse.assert_equal((xs.join(',')                   ), ('bar'));
infuse.assert_equal((xs.size()                      ), (1));
infuse.assert_equal((xs.keys().join(',')            ), ('0'));

xs.push('bif');
infuse.assert_equal((xs.keys().sort().join(',')     ), ('0,1'));
infuse.assert_equal((xs.size()                      ), (2));
e.pull();
infuse.assert_equal((o.size()                       ), (2));
infuse.assert_equal((o.keys().sort().join(',')      ), ('foo,1'));

// So far we've had synchronous edges, but you can also propagate the changes
// asynchronously. This happens if you send a future or a signal through an edge.
// For example:

var a = $i.signal();
var b = $i.signal();

var gate_ab = $i.signal();
var gate_ba = $i.signal();

var e = a.to(b, $i.always(gate_ab), $i.always(gate_ba));

a.push(3);
infuse.assert_equal((b.get()                        ), (null));
gate_ab.push(4);
infuse.assert_equal((b.get()                        ), (4));
infuse.assert_equal((a.get()                        ), (3));

// Only the first result is used; signals are internally collapsed into futures
// using `once`.

gate_ab.push(5);
infuse.assert_equal((b.get()                        ), (4));

b.push(10);
infuse.assert_equal((a.get()                        ), (3));
gate_ba.push(8);
infuse.assert_equal((a.get()                        ), (8));
gate_ba.push(7);
infuse.assert_equal((a.get()                        ), (8));

// One thing to watch out for is that asynchronous propagation won't clobber an
// updated endpoint. For example:

a.push('foo');
b.push('bar');
gate_ab.push('bif');
infuse.assert_equal((a.get()                        ), ('foo'));
infuse.assert_equal((b.get()                        ), ('bar'));

gate_ba.push('baz');
infuse.assert_equal((a.get()                        ), ('foo'));
infuse.assert_equal((b.get()                        ), ('bar'));

// At this point the edge is divergent:

infuse.assert_equal((e.is_divergent()               ), (true));

// You can fix this by choosing the value from either endpoint:

infuse.assert_equal((e.choose(a)                    ), (e));

// Choosing a value doesn't propagate anything, but it does resolve the conflict.

infuse.assert_equal((a.get()                        ), ('foo'));
infuse.assert_equal((b.get()                        ), ('bar'));

a.push(144);
gate_ab.push(288);
infuse.assert_equal((b.get()                        ), (288));

// Each edge has a keygate that you can use to filter the values that it
// propagates. For example:

var a = $i.signal();
var b = $i.signal();
var e = a.to(b);

e.keygate(/foo/);

a.push(5, 'bar');
infuse.assert_equal((a.get()                        ), (5));
infuse.assert_equal((a.key()                        ), ('bar'));
infuse.assert_equal((b.get()                        ), (null));
infuse.assert_equal((b.key()                        ), (null));

a.push(6, 'foo');
infuse.assert_equal((a.get()                        ), (6));
infuse.assert_equal((a.key()                        ), ('foo'));
infuse.assert_equal((b.get()                        ), (6));
infuse.assert_equal((b.key()                        ), ('foo'));

// You can change the keygate dynamically:

e.keygate(/bar/);

b.push(4, 'bar');
infuse.assert_equal((a.get()                        ), (4));
infuse.assert_equal((a.key()                        ), ('bar'));
infuse.assert_equal((b.get()                        ), (4));
infuse.assert_equal((b.key()                        ), ('bar'));

b.push(5, 'foo');
infuse.assert_equal((a.get()                        ), (4));
infuse.assert_equal((a.key()                        ), ('bar'));
infuse.assert_equal((b.get()                        ), (5));
infuse.assert_equal((b.key()                        ), ('foo'));

// Generated by SDoc

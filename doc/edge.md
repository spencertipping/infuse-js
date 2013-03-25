# Infuse edges

See also the [Infuse edge source](edge-src.md).

Edges preserve invariants between signals. For example, let's suppose you have
two signals, each of which might change independently, and you want to preserve
the invariant that `b.get() = a.get() + 1`.

```js
var a = $i.signal();
var b = $i.signal();
var e = a.to(b, '_ + 1', '_ - 1');
```

```js
var a_called = 0;
a.on(/.*/, function (v, k) {++a_called});
var b_called = 0;
b.on(/.*/, function (v, k) {++b_called});
```

```js
a.push(5);
b.get()                         -> 6
a_called                        -> 1
b_called                        -> 1
```

```js
b.push(5);
a.get()                         -> 4
a_called                        -> 2
b_called                        -> 2
```

Detaching an edge causes it to stop propagating changes:

```js
e.detach()                      -> e
a.push(10);
a_called                        -> 3
b_called                        -> 2
b.get()                         -> 5
```

```js
b.push(1000);
a_called                        -> 3
b_called                        -> 3
a.get()                         -> 10
```

We can connect arbitrarily many objects together in any acyclic topology. For
example:

```js
var c = $i.signal();
var d = $i.signal();
```

Let's make the values increase by one between `a`, `b`, `c`, and `d`
respectively.

```js
var ab = a.to(b, '_ + 1', '_ - 1');
var bc = b.to(c, '_ + 1', '_ - 1');
var cd = c.to(d, '_ + 1', '_ - 1');
```

```js
a.push(2);
d.get()                         -> 5
c.get()                         -> 4
b.get()                         -> 3
d.push(1);
a.get()                         -> -2
b.get()                         -> -1
c.get()                         -> 0
```

Infuse does not support cyclic graphs. If you create one, it will cause a stack
overflow.

```js
ab.detach();
var ac = a.to(c, '_ + 2', '_ - 2');
a.push(8);
c.get()                         -> 10
b.get()                         -> 9
```

```js
d.push(9);
a.get()                         -> 6
b.get()                         -> 7
c.get()                         -> 8
```

Edges generalize to all Infuse objects. If you're connecting synchronous
objects, you'll need to call `pull` on the edge to trigger propagation. Also
note that pre-connection object state is not transferred through the edge; only
updates after the edge is connected will be propagated.

```js
var xs = $i([]);
var o  = $i({});
var e  = xs.to(o);
```

```js
o.push('bar', 'foo');
```

```js
e.pull();
o.size()                        -> 1
xs.join(',')                    -> 'bar'
xs.size()                       -> 1
xs.keys().join(',')             -> '0'
```

```js
xs.push('bif');
xs.keys().sort().join(',')      -> '0,1'
xs.size()                       -> 2
e.pull();
o.size()                        -> 2
o.keys().sort().join(',')       -> 'foo,1'
```

So far we've had synchronous edges, but you can also propagate the changes
asynchronously. This happens if you send a future or a signal through an edge.
For example:

```js
var a = $i.signal();
var b = $i.signal();
```

```js
var gate_ab = $i.signal();
var gate_ba = $i.signal();
```

```js
var e = a.to(b, $i.always(gate_ab), $i.always(gate_ba));
```

```js
a.push(3);
b.get()                         -> null
gate_ab.push(4);
b.get()                         -> 4
a.get()                         -> 3
```

Only the first result is used; signals are internally collapsed into futures
using `once`.

```js
gate_ab.push(5);
b.get()                         -> 4
```

```js
b.push(10);
a.get()                         -> 3
gate_ba.push(8);
a.get()                         -> 8
gate_ba.push(7);
a.get()                         -> 8
```

One thing to watch out for is that asynchronous propagation won't clobber an
updated endpoint. For example:

```js
a.push('foo');
b.push('bar');
gate_ab.push('bif');
a.get()                         -> 'foo'
b.get()                         -> 'bar'
```

```js
gate_ba.push('baz');
a.get()                         -> 'foo'
b.get()                         -> 'bar'
```

At this point the edge is divergent:

```js
e.is_divergent()                -> true
```

You can fix this by choosing the value from either endpoint:

```js
e.choose(a)                     -> e
```

Choosing a value doesn't propagate anything, but it does resolve the conflict.

```js
a.get()                         -> 'foo'
b.get()                         -> 'bar'
```

```js
a.push(144);
gate_ab.push(288);
b.get()                         -> 288
```

Each edge has a keygate that you can use to filter the values that it
propagates. For example:

```js
var a = $i.signal();
var b = $i.signal();
var e = a.to(b);
```

```js
e.keygate(/foo/);
```

```js
a.push(5, 'bar');
a.get()                         -> 5
a.key()                         -> 'bar'
b.get()                         -> null
b.key()                         -> null
```

```js
a.push(6, 'foo');
a.get()                         -> 6
a.key()                         -> 'foo'
b.get()                         -> 6
b.key()                         -> 'foo'
```

You can change the keygate dynamically:

```js
e.keygate(/bar/);
```

```js
b.push(4, 'bar');
a.get()                         -> 4
a.key()                         -> 'bar'
b.get()                         -> 4
b.key()                         -> 'bar'
```

```js
b.push(5, 'foo');
a.get()                         -> 4
a.key()                         -> 'bar'
b.get()                         -> 5
b.key()                         -> 'foo'

```

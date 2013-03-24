# Infuse types and constructors

Every Infuse object is an instance of the global `infuse`, as well as being an
instance of its constructor. For example:

```js
infuse([]) instanceof infuse                    -> true
infuse([]) instanceof infuse.array              -> true
```

```js
infuse({}) instanceof infuse                    -> true
infuse({}) instanceof infuse.object             -> true
```

Infuse objects never inherit from each other, however. The only inheritance is
from `infuse`.

```js
infuse([]) instanceof infuse.object             -> false
```

These inheritance properties also apply to asynchronous objects:

```js
infuse.future() instanceof infuse               -> true
infuse.future() instanceof infuse.future        -> true
infuse.signal() instanceof infuse               -> true
infuse.signal() instanceof infuse.signal        -> true
```

You can convert between Infuse collection types using `into`. For example:

```js
var o = infuse(['foo', 'bar', 'bif']).into(infuse.object);
o.tos()                                         -> '#{0: foo, 1: bar, 2: bif}'
```

```js
var o = {};
infuse(['a', 'b', 'c', 'd']).into(o);
infuse(o).tos()                                 -> 'I{0: a, 1: b, 2: c, 3: d}'
```

```js
var o  = infuse({foo: 'bar', bif: 'baz'});
var xs = [];
o.into(xs)                                      -> xs
xs.sort().join(',')                             -> 'bar,baz'
```

The same mechanism works between synchronous and asynchronous objects.

```js
var sig = infuse.signal();
var o   = infuse({});
sig.into(o)                                     -> o
sig.push(4, 'foo').push(5, 'bar')               -> sig
o.tos()                                         -> 'I{bar: 5, foo: 4}'
o.size()                                        -> 2
o.keys().sort().join(',')                       -> 'bar,foo'
o.get(['foo', 'bar']).join(',')                 -> '4,5'
```

At this point `o` is not a proper derivative of `sig`, nor can it be since
Infuse objects can never transition into being derivatives. However, signals
can forward events to things that are not technically derivatives of
themselves, and you can remove any such quasiderivative by using the
`detach_derivative` method:

```js
sig.detach_derivative(o)                        -> sig
sig.push(6, 'bif')                              -> sig
o.size()                                        -> 2
```

A useful idiom is to maintain a window of signal history using a tail. For
example:

```js
var sig  = infuse.signal();
var tail = sig.into(infuse.tail, 3);    // last 3 elements
```

```js
tail.size()                                     -> 0
sig.push('foo');
tail.join(',')                                  -> 'foo'
sig.push('bar').push('bif').push('baz');
tail.join(',')                                  -> 'bar,bif,baz'
```

Tails are useful for limiting memory use when you have a potentially unbounded
stream of values. But be careful what you do with them; if you group a tail,
for instance, that grouping may store old values:

```js
var group = tail.group('_');
group.size()                                    -> 3
group.get('bar').size()                         -> 1
```

```js
sig.push('bok');
tail.size()                                     -> 3
group.size()                                    -> 4
sig.push('bar');
group.size()                                    -> 5
group.get('bar').size()                         -> 2

```

# Infuse signals

See also the [Infuse signal source](signal-src.md).

More encapsulated callbacks! For example:

```js
var f      = infuse.signal();
var called = 0;
var errors = 0;
```

```js
var grouped = f.group('_2');    // group by key, or callback type (see below)
```

```js
grouped.size()                  -> 0
```

```js
f.size()                        -> 0
f.on('value', function (x) {++called});
f.on('error', function (x) {++errors});
```

```js
called                          -> 0
f.size()                        -> 0
```

```js
var trigger = f.trigger('value');
trigger(5);
called                          -> 1
f.size()                        -> 1
```

If `f` were a future, it would be finalized; but because it's a signal it can
still get new values. For example:

```js
trigger(5);
called                          -> 2
```

If you're using a signal to represent an event, then you'll probably want to
handle error cases somehow. To do that, we just create another trigger:

```js
var ohnoes = f.trigger('error');
errors                          -> 0
ohnoes('something bad happened');
errors                          -> 1
```

Earlier we called `f.group`, constructing a derivative multiobject. Even though
futures update asynchronously, the grouped index is kept up-to-date (this time
using push-updating instead of pull-updating):

```js
grouped.get('value').join(',')  -> '5,5'
grouped.get('error').join(',')  -> 'something bad happened'
grouped.size()                  -> 3
```

One cool thing we can do with signals is reduce them. A future takes on a
series of values over time, so we can build a new signal whose values represent
an accumulation. For example:

```js
var g = f.reductions(0, '_1 + _2');
var g_called = 0;
```

```js
g.on('value', function (x) {++g_called});
```

```js
g_called                        -> 0
g.size()                        -> 0
```

```js
trigger(1);
g.size()                        -> 1
g.get()                         -> 1
g_called                        -> 1
```

```js
trigger(2);
g.get()                         -> 3
trigger(3);
g.get()                         -> 6
```

When you want to free memory, you can detach a derivative signal from its base.
This prevents it from receiving future events from that base.

```js
g.detach();
trigger(4);
g.get()                         -> 6
```

You can't detach callbacks because they aren't Infuse objects (internally, the
problem is that they have no string identifier). However, you have two options
for working around this. One is to use `once` instead of `on`, which works if
you just need the first event. The other is to create a derivative signal that
triggers the anonymous callbacks.

```js
var once_called = 0;
g.once('value', function (x) {
  ++once_called                 -> 1
  x                             -> 10
});
```

```js
g.push(10, 'value');
once_called                     -> 1
g.get()                         -> 10
```

```js
g.push(15, 'value');
once_called                     -> 1
g.get()                         -> 15
```

We didn't detach the grouped multiobject, so we still have it:

```js
grouped.size()                  -> 7
grouped.get('value').join(',')  -> '5,5,1,2,3,4'
```

You can get a future from a signal by invoking `once` with no callback:

```js
var future = g.once();
future.get()                    -> null
g.push(6).get()                 -> 6
future.get()                    -> 6
g.push(7).get()                 -> 7
future.get()                    -> 6
```

You can also specify a keygate, in which case the first matching event will
trigger the future:

```js
var future2 = g.once('foo bar');
future2.get()                   -> null
g.push(5, 'banana');
future2.get()                   -> null
g.push(5, 'foo');
future2.get()                   -> 5
```

Like futures, signals support flatmapping. However, be careful: flatmapping
signals will most likely cause a space leak and is probably not what you want
to do. If you do need to flatmap a signal, you should demote the outer one into
a future by calling `once`. I'm doing it the wrong way below to illustrate what
happens:

```js
var sig1 = infuse.signal();
var sig2 = null;
var both = sig1.flatmap(function (v) {
  sig2 = infuse.signal();
  return sig2.map('_ + v', {v: v});
});
```

```js
var calls = 0;
both.on(null, function () {++calls});
```

```js
both.get()                      -> null
sig1.push(3).get()              -> 3
both.get()                      -> null
sig2.get()                      -> null
```

```js
sig2.push(4).get()              -> 4
both.get()                      -> 7
calls                           -> 1
```

Here's what I mentioned earlier about the space leak:

```js
sig1.push(5);
sig2.push(5);
calls                                   -> 3
[8, 10].indexOf(both.get()) >= 0        -> true
```

The value of `both` is nondeterministic at this point. It is being updated by
two children of `sig1`, and signal broadcast events occur in no specified
order.

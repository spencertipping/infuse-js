# Awaiting asynchronous things

Infuse provides some global functions that help you work with futures. Two
useful ones are `await` and `progress`:

```js
var f1 = infuse.future();
var f2 = infuse.future();
var f = infuse.await([f1, f2]);
```

```js
f.get()                                 -> null
f.toString()                            -> '#future()'
```

```js
var f_called = false;
f.on(null, function (result) {
  f_called = true;
  result.toString()                     -> 'I[3, 5]'
});
```

```js
f2.push(5);
f_called                                -> false
f.get()                                 -> null
```

```js
f1.push(3);
f_called                                -> true
f.get().tos()                           -> 'I[3, 5]'
f.tos()                                 -> 'future(I[3, 5])'
```

Notice that `await` preserves the order of the original futures, regardless of
the order in which they are delivered.

Awaiting is appropriate when you want to block on all futures (or signals), but
sometimes you want updates as they are resolved. In that case use `progress`:

```js
var sig1 = infuse.signal();
var sig2 = infuse.signal();
var both = infuse.progress(infuse({foo: sig1, bar: sig2}));
```

```js
both.tos()                              -> 'signal(I{})'
sig1.push(5);
both.tos()                              -> 'signal(I{foo: 5})'
sig1.push(6);
both.tos()                              -> 'signal(I{foo: 6})'
sig2.push(3);
both.tos()                              -> 'signal(I{bar: 3, foo: 6})'
```

Warning: **`progress` will not do the right thing with arrays**! Infuse arrays
are dense and append-only, which means that there isn't a way to update
existing elements. As a result, progressing signals into an array will result
in an array that grows with elements in the order that the signals emitted
them. For example:

```js
var sig1 = infuse.signal();
var sig2 = infuse.signal();
var all  = infuse.progress([sig1, sig2]);
```

```js
all.tos()                               -> 'signal(I[])'
sig2.push(4);
all.tos()                               -> 'signal(I[4])'
sig2.push(5);
all.tos()                               -> 'signal(I[4, 5])'
sig1.push(10);
all.tos()                               -> 'signal(I[4, 5, 10])'
```

You should use objects if you need keys to be significant.

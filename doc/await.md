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
```

```js
var f_called = false;
f.on(null, function (result) {
  f_called = true;
  result.join(',')                      -> '3,5'
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
f.get().join(',')                       -> '3,5'
```

Awaiting is appropriate when you want to block on all futures (or signals), but
sometimes you want updates as they are resolved. In that case use `progress`:

```js
var sig1 = infuse.signal();
var sig2 = infuse.signal();
var both = infuse.progress(infuse({foo: sig1, bar: sig2}));
```

```js
both.get()                              -> null
sig1.push(5);
both.get().keys().sort().join(',')      -> 'foo'
both.get().get('foo')                   -> 5
sig1.push(6);
both.get().keys().sort().join(',')      -> 'foo'
both.get().get('foo')                   -> 6
sig2.push(3);
both.get().keys().sort().join(',')      -> 'bar,foo'
both.get().get('foo')                   -> 6
both.get().get('bar')                   -> 3

```

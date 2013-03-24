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

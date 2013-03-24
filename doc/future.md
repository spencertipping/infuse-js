# Infuse futures

See also the [Infuse future source](future-src.md).

Encapsulated callbacks! For example:

```js
var f      = infuse.future();
var called = false;
```

```js
f.on('value', function (x) {
  x                             -> 5
  called = true;
});
```

```js
called                          -> false
```

```js
var trigger = f.trigger('value');
trigger(5);
called                          -> true
```

At this point, `f` is finalized; we can't change its value. But we can still
construct derivatives of it:

```js
var g = f.map('_ + 1');
g.on('value', function (x) {
  x                             -> 6
});
```

And we can get its value directly:

```js
f.get()                         -> 5
g.get()                         -> 6
```

Futures also support flat-mapping, which lets you compose asynchronous
computation:

```js
var f = infuse.future();
var g = infuse.future();
```

```js
var got_first  = false;
var got_second = false;
```

```js
var both = f.flatmap(function (v) {
  got_first = true;
  return g;
});
```

```js
g.on(null, function (v) {got_second = true});
f.push('foo');
f.get()                         -> 'foo'
g.get()                         -> null
both.get()                      -> null
got_first                       -> true
got_second                      -> false
```

```js
g.push('bar');
g.get()                         -> 'bar'
both.get()                      -> 'bar'
got_first                       -> true
got_second                      -> true

```

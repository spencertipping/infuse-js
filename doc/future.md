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
f.value()                       -> 5
g.value()                       -> 6

```

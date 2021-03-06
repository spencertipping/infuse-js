# Incremental update generators

See also the source for the [Infuse pull-propagation mixin](mixin-pull-src.md)
and the [push-propagation mixin](mixin-push-src.md).

Every object type defines a `generator` method that gives you a single-pass,
generally constant-memory iterator for a data structure. Generators are used by
`map`, `filter`, etc, to build and maintain derivative data structures. For
example:

```js
var arr = [1, 2, 3, 4, 5];
var xs  = $i(arr);
var g   = xs.generator();
```

Now we can invoke the generator on a function that takes `value, key` pairs.
Returning `false` from this function causes it to stop iterating until we call
the generator again.

```js
g(function (x, i) {
  x                             -> 1
  i                             -> 0
  return false;                 // stops iteration for the moment
});
```

```js
g(function (x, i) {
  i > 0                         -> true
  x === arr[i]                  -> true
});
```

Now the generator is up-to-date; calling it further won't have any effect:

```js
var called = false;
g(function () {called = true});
called                          -> false
```

However, if we add a new element and then call the generator, we'll get that
update:

```js
xs.push(6);
g(function (x, i) {
  x                             -> 6
  i                             -> 5
});
```

Big warning: If you're using a push-propagated object like a future or a
signal, then you need to pass a second argument into the generator. This second
argument is the Infuse ID of the object that will be receiving updates from the
generator. If you aren't updating an Infuse object, you can just use
`$i.gen_id()` to create an anonymous ID.

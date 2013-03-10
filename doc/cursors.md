# Incremental update cursors

Every object type defines a `cursor` method that gives you a single-pass,
generally constant-memory iterator for a data structure. Cursors are used by
`map`, `filter`, etc, to build and maintain derivative data structures. For
example:

```js
var arr = [1, 2, 3, 4, 5];
var xs  = infuse(arr);
var c   = xs.cursor();
```

Now we can invoke the cursor on a function that takes `value, key` pairs.
Returning `false` from this function causes it to stop iterating until we call
the cursor again.

```js
c(function (x, i) {
  x                             -> 1
  i                             -> 0
  return false;                 // stops iteration for the moment
});
```

```js
c(function (x, i) {
  i > 0                         -> true
  x === arr[i]                  -> true
});
```

Now the cursor is up-to-date; calling it further won't have any effect:

```js
var called = false;
c(function () {called = true});
called                          -> false
```

However, if we add a new element and then call the cursor, we'll get that
update:

```js
xs.push(6);
c(function (x, i) {
  x                             -> 6
  i                             -> 5
});

```

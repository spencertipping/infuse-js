# AA trees

AA trees are used by Infuse as a journaling structure for mutable-object
updates.

```js
var t = $i.aatree();
t.push(1, 4);
```

```js
var called = 0;
t.generator()(function (v, k) {
  v                                     -> 1
  k                                     -> 4
  ++called;
});
called                                  -> 1
```

```js
var called = 0;
t.push(2, 5);
t.generator()(function (v, k) {
  if (called === 0) {
    v                                   -> 1
    k                                   -> 4
  } else {
    v                                   -> 2
    k                                   -> 5
  }
  ++called;
});
called                                  -> 2

```

# AA trees

Infuse uses AA trees as priority queues and update journals. They collect
key/value pairs and emit them in key-sorted order. So, for example:

```js
var t = $i.aatree();
t.push('foo', 1);
```

AA trees keep cached first/last pointers so you can use them as priority
queues.

```js
t.first()                               -> 'foo'
t.last()                                -> 'foo'
```

```js
t.push('bar', 2);       // 2 sorts after 1, so 'bar' should be last
t.first()                               -> 'foo'
t.last()                                -> 'bar'
t.push('bif', 3);
t.first()                               -> 'foo'
t.last()                                -> 'bif'
t.push('baz', 4);
t.first()                               -> 'foo'
t.last()                                -> 'baz'
```

```js
t.lookup(1)                             -> 'foo'
t.lookup(2)                             -> 'bar'
t.lookup(3)                             -> 'bif'
t.lookup(4)                             -> 'baz'
```

```js
t.remove(1);
t.first()                               -> 'bar'
t.last()                                -> 'baz'
t.remove(3);
t.first()                               -> 'bar'
t.last()                                -> 'baz'
t.remove(4);
t.first()                               -> 'bar'
t.last()                                -> 'bar'
t.remove(2);
t.first()                               -> null
t.last()                                -> null
```

In general, trees behave just like always-sorted collections. That is:

```js
for (var i = 2; i < 128; ++i) {
  var t  = $i.aatree();
  var xs = [];
```

```js
  for (var j = 0, x; j < i; ++j) {
    x = Math.random() * 10000 >>> 0;
    xs.push(x);
    t.push(j, x);
  }
```

```js
  for (var j = 0; j < i; ++j) {
    var sorted = xs.slice().sort(function (a, b) {return a - b});
    t.kfirst()                          -> sorted[0]
    t.klast()                           -> sorted[sorted.length - 1]
```

```js
    var cut = Math.random() * xs.length >>> 0;
    t.remove(xs[cut]);
    xs.splice(cut, 1);
  }
}

```

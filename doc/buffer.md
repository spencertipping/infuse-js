# Infuse buffers

See also the [Infuse buffer source](buffer-src.md).

Like all Infuse objects, buffers support `size`, `get`, and a number of other
accessor methods:

```js
var xs = $i.buffer([1, 2, 3]);
xs.get(0)                       -> 1
xs.get(-1)                      -> 3
xs.tos()                        -> 'I[0:1, 1:2, 2:3]'
```

Buffers support the same kind of linear interpolation that arrays do:

```js
xs.get(0.5)                     -> 1.5
```

```js
var quadratic = function (a, b, x) {return a + (b - a) * x*x};
xs.get(0.5, quadratic)          -> 1.25
xs.get(0, quadratic)            -> 1
```

And without arguments, `get` returns a regular Javascript array:

```js
xs.get()[0]                     -> 1
xs.get().length                 -> 3
```

# Transformations

Buffers can be transformed just like arrays can:

```js
var ys = xs.map('_ + 1');
var sum = xs.reduction(0, '_1 + _2');
ys.tos()                        -> '#[0:2, 1:3, 2:4]'
ys.version() > 0                -> true
sum.get()                       -> 6
```

```js
var t = xs.tail(2);
t.tos()                         -> '#[... 2, 3]'
```

However, buffers are a little more flexible than arrays as they let you update
previously-specified elements:

```js
xs.push(10, 0);
ys.tos()                        -> '#[0:11, 1:3, 2:4]'
sum.get()                       -> 16
```

Obviously something is a little wrong with `reduction` as applied to the array.
The problem here is that `reduction` applies to elements in update-order, which
for normal arrays works like you would expect since all updates occur at the
end. In general, it isn't possible to have a partially-lazy reduction over
mutable collections.

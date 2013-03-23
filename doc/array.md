# Infuse arrays

See also the [Infuse array source](array-src.md).

When you say `infuse([1, 2, 3])`, Infuse selects the `infuse.array` alternative
and invokes that instead, as if you had written `infuse.array([1, 2, 3])`:

```js
infuse([1, 2, 3]).size()        -> 3
infuse.array([1, 2, 3]).size()  -> 3
```

Like all Infuse objects, arrays support `size`, `get`, and a number of other
accessor methods:

```js
var xs = infuse([1, 2, 3]);
xs.get(0)                       -> 1
xs.get(-1)                      -> 3
```

For arrays specifically, Infuse gives you generic linear interpolation between
elements:

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

Arrays can be transformed eagerly and lazily. For example:

```js
var ys = xs.map('_ + 1');
var sum = xs.reduction(0, '_1 + _2');
ys.size()                       -> 3
ys.get().join(',')              -> '2,3,4'
ys.version() > 0                -> true
```

```js
sum.get()                       -> 6
```

```js
var t = xs.tail(2);
t.size()                        -> 2
t.get().join(',')               -> '2,3'
```

As mentioned in the readme, transformations are stored so that incremental
updates to the original array are reflected in any derivative arrays.

```js
xs.push(5)                      -> xs
xs.size()                       -> 4
xs.get().join(',')              -> '1,2,3,5'
t.get().join(',')               -> '3,5'
t.size()                        -> 2
sum.get()                       -> 11
ys.get(-1)                      -> 6
ys.size()                       -> 4
```

We can construct lazily-updated derivatives of the mapped output as well:

```js
var ys2 = ys.map('_ * 2');
ys2.size()                      -> 4
ys2.get().join(',')             -> '4,6,8,12'
xs.push(6)                      -> xs
ys2.get().join(',')             -> '4,6,8,12,14'
```

This includes things like filters and flatmaps, but with the caveat that
already-realized elements won't be recomputed:

```js
var zs = xs.flatmap('[_ + 1, _ + 2]');
zs.size()                       -> 10
zs.get().join(',')              -> '2,3,3,4,4,5,6,7,7,8'
```

```js
xs.push('foo')                  -> xs
zs.get().join(',')              -> '2,3,3,4,4,5,6,7,7,8,foo1,foo2'
```

Infuse objects can be combined with each other to collect changes from multiple
bases. For example:

```js
var all = xs.plus(zs);
all.size()             -> xs.size() + zs.size()
all.get().join(',')    -> '1,2,3,5,6,foo,2,3,3,4,4,5,6,7,7,8,foo1,foo2'
```

And like any other object, `all` will stay up to date with the objects it's
based on:

```js
xs.push(4);
all.get().join(',')    -> '1,2,3,5,6,foo,2,3,3,4,4,5,6,7,7,8,foo1,foo2,4,5,6'
```

Objects of any type can be combined. When they are, the result has the type of
the receiver. For example:

```js
var sig = infuse.signal();
var all = xs.plus(sig);
```

```js
all.get().join(',')     -> '1,2,3,5,6,foo,4'
sig.push('hi');
all.get().join(',')     -> '1,2,3,5,6,foo,4,hi'
```

```js
var o = infuse({});
all = all.plus(o);
```

```js
o.push('val', 'k');
all.get().join(',')     -> '1,2,3,5,6,foo,4,hi,val'

```

# Infuse arrays

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
ys.version()                    -> 0
ys.size()                       -> 3
ys.get().join(',')              -> '2,3,4'
ys.version() > 0                -> true
```

As mentioned in the readme, transformations are stored so that incremental
updates to the original array are reflected in any derivative arrays.

```js
xs.push(5)                      -> xs
xs.size()                       -> 4
xs.get(-1)                      -> 5
ys.get(-1)                      -> 6
ys.size()                       -> 4
```

This includes things like filters and flatmaps, but with the caveat that
already-realized elements won't be recomputed:

```js
var zs = xs.flatmap('[_ + 1, _ + 2]');
zs.size()                       -> 8
zs.get().join(',')              -> '2,3,3,4,4,5,6,7'
```

```js
xs.push('foo')                  -> xs
zs.get().join(',')              -> '2,3,3,4,4,5,6,7,foo1,foo2'

```

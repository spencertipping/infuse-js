# Infuse object versioning

There are some rules governing the way updates are propagated between objects.
First, some background. Each object is append-only, so in some sense it gains
information over time. This monotonic information gain is represented by the
object's version, which is a number that increases each time the object
changes:

```js
var xs = $i([]);
```

```js
xs.version()                            -> 1
xs.push(1)                              -> xs
xs.version()                            -> 2
xs.push(2).push(3)                      -> xs
xs.version()                            -> 4
xs.size()                               -> 3
```

Infuse makes no guarantees about the absolute values of the version, just that
it increases each time an object is changed. (A "change" here can mean that an
array gets five new elements, for instance; there is no 1:1 relationship, just
the requirement that each change be atomic.)

Derivatives are generally updated using generators. A generator is a one-pass
iterator over an object that invokes an emitter function. Emitters usually wrap
the `push` method in some fairly trivial way. For example:

```js
var g  = xs.generator();
var ys = xs.derivative(function (emit) {
  g(function (v, k) {
    emit(v, k);
  });
});
```

```js
ys.size()                               -> 3
ys.version()                            -> 4
ys.join(',')                            -> '1,2,3'
```

This is how almost all of the transformation methods work. For example, here's
how `map` is implemented:

```js
var f      = $i.fn('_ * 3');
var g2     = xs.generator();
var mapped = xs.derivative(function (emit) {
  g2(function (v, k) {
    emit(f(v, k), k);
  });
});
```

```js
mapped.size()                           -> 3
mapped.version()                        -> 4
mapped.join(',')                        -> '3,6,9'

```

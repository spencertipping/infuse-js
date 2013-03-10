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

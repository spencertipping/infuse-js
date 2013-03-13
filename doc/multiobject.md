# Infuse multiobjects

See also the [Infuse multiobject source](multiobject-src.md).

Just like objects, but each key maps to multiple values:

```js
var o = infuse.multiobject();
```

```js
o.size()                        -> 0
o.push(1, 'foo')                -> o
o.push(2, 'foo')                -> o
o.push(1, 'bar')                -> o
```

```js
o.get('foo').join(',')          -> '1,2'
o.get('bar').join(',')          -> '1'
```

```js
o.size()                        -> 3
```

Multiobjects are generated when you `group` a collection. For example:

```js
var xs = infuse([1, 2, 3, 4, 5, 6]);
var grouped = xs.group('_ % 3');
var indexed = xs.index('_ % 3');
```

```js
grouped.size()                  -> 6
grouped.get('0').join(',')      -> '3,6'
grouped.get('1').join(',')      -> '1,4'
```

```js
indexed.size()                  -> 3
indexed.get('0')                -> 6
indexed.get('1')                -> 4
```

And like all other Infuse collections, multiobjects provide dynamic updating:

```js
xs.push(7)                      -> xs
grouped.get('1').join(',')      -> '1,4,7'
grouped.size()                  -> 7

```

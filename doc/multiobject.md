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
o.tos()                         -> 'I{bar::I[1], foo::I[1, 2]}'
o.get('foo').tos()              -> 'I[1, 2]'
o.get('bar').tos()              -> 'I[1]'
o.size()                        -> 3
```

```js
var i = o.inverse();
i.tos()                         -> '#{1::I[foo, bar], 2::I[foo]}'
i.get('1').tos()                -> 'I[foo, bar]'
i.size()                        -> 3
```

```js
o.push(2, 'bif');
i.size()                        -> 4
i.get('2').join(',')            -> 'foo,bif'
```

Multiobjects are generated when you `group` a collection. For example:

```js
var xs = infuse([1, 2, 3, 4, 5, 6]);
var grouped = xs.group('_ % 3');
var indexed = xs.index('_ % 3');
```

```js
grouped.tos()                   -> '#{0::I[3, 6], 1::I[1, 4], 2::I[2, 5]}'
grouped.size()                  -> 6
grouped.get('0').join(',')      -> '3,6'
grouped.get('1').join(',')      -> '1,4'
```

```js
indexed.tos()                   -> '#{0: 6, 1: 4, 2: 5}'
indexed.size()                  -> 3
indexed.get('0')                -> 6
indexed.get('1')                -> 4
```

And like all other Infuse collections, multiobjects provide dynamic updating:

```js
xs.push(7)                      -> xs
grouped.get('1').tos()          -> 'I[1, 4, 7]'
grouped.size()                  -> 7

```

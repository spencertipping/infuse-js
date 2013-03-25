# Infuse objects

See also the [Infuse object source](object-src.md).

These are instantiated like arrays and support a similar API:

```js
var o = $i({foo: 1, bar: 2, bif: 3});
var keys = o.keys();
o.size()                        -> 3
keys.size()                     -> 3
o.get('foo')                    -> 1
o.tos()                         -> 'I{bar: 2, bif: 3, foo: 1}'
```

```js
var i = o.inverse();
i.get('1')                      -> 'foo'
i.tos()                         -> '#{1: foo, 2: bar, 3: bif}'
```

Also like arrays, you can `map` objects:

```js
var mapped = o.map('_ + 1');
mapped.size()                   -> 3
mapped.get('foo')               -> 2
mapped.get('bar')               -> 3
mapped.tos()                    -> '#{bar: 3, bif: 4, foo: 2}'
```

And like any Infuse object, changes you make to the base will be reflected in
the mapped output:

```js
o.push(4, 'baz')                -> o
o.size()                        -> 4
i.get('4')                      -> 'baz'
i.tos()                         -> '#{1: foo, 2: bar, 3: bif, 4: baz}'
mapped.size()                   -> 4
mapped.get('baz')               -> 5
```

```js
keys.size()                     -> 4
keys.get().sort().join(',')     -> 'bar,baz,bif,foo'
```

```js
o.push(5, 'five') .push(6, 'six');
i.get('5')                      -> 'five'
i.get('6')                      -> 'six'
```

```js
o.push(7, 'seven').push(8, 'eight');
```

```js
keys.get().sort().join(',')     -> 'bar,baz,bif,eight,five,foo,seven,six'
mapped.get('five')              -> 6
mapped.get('six')               -> 7
mapped.get('seven')             -> 8
mapped.get('eight')             -> 9
```

```js
mapped.size()                   -> 8
i.size()                        -> 8

```

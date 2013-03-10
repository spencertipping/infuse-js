# Infuse objects

These are instantiated like arrays and support a similar API:

```js
var o = infuse({foo: 1, bar: 2, bif: 3});
o.size()                        -> 3
o.keys().size()                 -> 3
o.get('foo')                    -> 1
```

Also like arrays, you can `map` objects:

```js
var mapped = o.map('_ + 1');
mapped.size()                   -> 3
mapped.get('foo')               -> 2
mapped.get('bar')               -> 3

```
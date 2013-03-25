# Infuse function promotion

See also the [Infuse fn source](fn-src.md).

Infuse promotes functions using a multimethod called `$i.fn`. This method
maintains a bounded LRU cache of anything it compiles to minimize the
performance impact of using functions inside loops. Here are some function
promotions:

```js
$i.fn('_ + 1')(5)                   -> 6
$i.fn('_1 + _2')(5, 6)              -> 11
```

You can also create closure variables for compiled functions:

```js
$i.fn('x + _', {x: 5})(6)           -> 11
$i.fn('x + _', {x: 'foo'})('bar')   -> 'foobar'
```

In addition to strings, Infuse gives you some other options like regular
expressions. You can also add your own types by appending elements to
`$i.fn.alternatives`.

```js
$i.fn(/f(..)/)('foo')[0]            -> 'oo'
$i.fn(/f(..)/)('bar')               -> null
$i.fn(/f(.)(.)/)('foo').length      -> 2
$i.fn(/f(.)(.)/)('foo')[0]          -> 'o'
$i.fn(/f(.)(.)/)('foo')[1]          -> 'o'
$i.fn(/foo*/)('fooooo')             -> 'fooooo'
$i.fn(/foo*/)('baaaar')             -> null
```

And naturally, functions go straight through without any modification.

```js
var f = function (x) {return x + 1};
$i.fn(f)(5)                         -> 6
```

# The cool part

All Infuse objects compile into structure-preserving functions. For example:

```js
var o      = $i({foo: '_ + 1', bar: ['_', '_ + 2']});
var f      = $i.fn(o);
var val    = $i([1, 2]);
var mapped = val.map(f);
```

```js
mapped.size()           -> 2
mapped.tos()            -> '#[#{bar: #[1, 3], foo: 2}, #{bar: #[2, 4], foo: 3}]'
```

```js
// mget(x, y, ...) = get(x).get(y)....
mapped.mget(0, 'foo')   -> 2
mapped.mget(1, 'foo')   -> 3
```

At this point, each value in `mapped` is a *derivative of the function*. So if
we change the object the function was built from, those changes will be
reflected in all results from that function:

```js
o.tos()                 -> 'I{bar: _,_ + 2, foo: _ + 1}'
mapped.get(0).tos()     -> '#{bar: #[1, 3], foo: 2}'
```

```js
o.push('"bif" + _', 'bif');
o.tos()                 -> 'I{bar: _,_ + 2, bif: "bif" + _, foo: _ + 1}'
mapped.get(0).tos()     -> '#{bar: #[1, 3], bif: bif1, foo: 2}'
```

```js
mapped.size()           -> 2
mapped.tos()            -> '#[#{bar: #[1, 3], bif: bif1, foo: 2}, #{bar: #[2, 4], bif: bif2, foo: 3}]'
```

```js
mapped.mget(0, 'bif')   -> 'bif1'
mapped.mget(1, 'bif')   -> 'bif2'
```

We also have the usual property that `mapped` is a derivative of `val`:

```js
val.push(3);
mapped.size()           -> 3
mapped.tos()            -> '#[#{bar: #[1, 3], bif: bif1, foo: 2}, #{bar: #[2, 4], bif: bif2, foo: 3}, #{bar: #[3, 5], bif: bif3, foo: 4}]'
```

```js
mapped.mget(2, 'foo')   -> 4
mapped.mget(2, 'bif')   -> 'bif3'
```

We can see the linkages by asking each object to list its bases:

```js
mapped.bases()[0].id()                          -> val.id()
mapped.get(0).bases()[0].bases()[0].id()        -> o.id()
```

Like everything else in Infuse, all of this happens without recomputing any
existing results.

# Infuse function promotion

See also the [Infuse fn source](fn-src.md).

Infuse promotes functions using a multimethod called `infuse.fn`. This method
maintains a bounded LRU cache of anything it compiles to minimize the
performance impact of using functions inside loops. Here are some function
promotions:

```js
infuse.fn('_ + 1')(5)                   -> 6
infuse.fn('_1 + _2')(5, 6)              -> 11
```

You can also create closure variables for compiled functions:

```js
infuse.fn('x + _', {x: 5})(6)           -> 11
infuse.fn('x + _', {x: 'foo'})('bar')   -> 'foobar'
```

In addition to strings, Infuse gives you some other options like regular
expressions. You can also add your own types by appending elements to
`infuse.fn.alternatives`.

```js
infuse.fn(/f(..)/)('foo')[0]            -> 'oo'
infuse.fn(/f(..)/)('bar')               -> null
infuse.fn(/f(.)(.)/)('foo').length      -> 2
infuse.fn(/f(.)(.)/)('foo')[0]          -> 'o'
infuse.fn(/f(.)(.)/)('foo')[1]          -> 'o'
infuse.fn(/foo*/)('fooooo')             -> 'fooooo'
infuse.fn(/foo*/)('baaaar')             -> null
```

And naturally, functions go straight through without any modification.

```js
var f = function (x) {return x + 1};
infuse.fn(f)(5)                         -> 6
```

# The cool part

All Infuse objects compile into structure-preserving functions. For example:

```js
var o      = infuse({foo: '_ + 1', bar: ['_', '_ + 2']});
var f      = infuse.fn(o);
var val    = infuse([1, 2]);
var mapped = val.map(f);
```

```js
mapped.size()                           -> 2
mapped.get(0).get('foo')                -> 2
mapped.get(0).get('bar').join(',')      -> '1,3'
mapped.get(1).get('foo')                -> 3
mapped.get(1).get('bar').join(',')      -> '2,4'
```

At this point `mapped` is a *derivative of the function*:

```js
o.push('"bif" + _', 'bif');
mapped.get(0).get('bif')                -> 'bif1'
mapped.get(1).get('bif')                -> 'bif2'
```

It is also still a derivative of `val`:

```js
val.push(3);
mapped.get(2).get('foo')                -> 4
mapped.get(2).get('bar').join(',')      -> '3,5'
mapped.get(2).get('bif')                -> 'bif3'

```

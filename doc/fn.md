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
mapped.size()           -> 2
mapped.tos()            -> '#[#{bar: #[1, 3], foo: 2}, #{bar: #[2, 4], foo: 3}]'
```

```js
// mget(x, y, ...) = get(x).get(y)....
mapped.mget(0, 'foo')   -> 2
mapped.mget(1, 'foo')   -> 3
```

At this point `mapped` is a *derivative of the function*. So if we change the
object the function was built from, those changes will be reflected in all
results from that function:

```js
o.tos()                 -> 'I{bar: _,_ + 2, foo: _ + 1}'
```

```js
o.push('"bif" + _', 'bif');
o.tos()                 -> 'I{bar: _,_ + 2, bif: "bif" + _, foo: _ + 1}'
```

```js
mapped.size()           -> 2
mapped.tos()            -> '#[#{bar: #[1, 3], bif: bif1, foo: 2}, #{bar: #[2, 4], bif: bif2, foo: 3}]'
```

```js
mapped.mget(0, 'bif')   -> 'bif1'
mapped.mget(1, 'bif')   -> 'bif2'
```

It is also still a derivative of `val`:

```js
val.push(3);
mapped.size()           -> 3
mapped.tos()            -> '#[#{bar: #[1, 3], bif: bif1, foo: 2}, #{bar: #[2, 4], bif: bif2, foo: 3}, #{bar: #[3, 5], bif: bif3, foo: 4}]'
```

```js
mapped.mget(2, 'foo')   -> 4
mapped.mget(2, 'bif')   -> 'bif3'

```

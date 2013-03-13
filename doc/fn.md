# Infuse function promotion

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

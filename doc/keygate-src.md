Infuse keygates | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Keygates are functions that are used to filter values based on their keys. For
instance, futures and signals support an `on` method that allows you to observe
their values asynchronously:

    a_signal.on('foo', function (x) {...});

Here, `'foo'` is a _keygate_: it is a value that is used to filter the space of
keys that will end up triggering the callback.

Infuse promotes all keygates with the `infuse.keygate` dispatcher. It is
structurally similar to `infuse.fn`, and unhandled values are promoted with
`infuse.fn`.

All builtin keygates treat `null` and `undefined` as universal passthroughs:
these will always be handled. Similarly, `null` and `undefined` as keygates
will accept all keys.

```js
infuse.extend(function (infuse) {
```

```js
infuse.keygate       = infuse.dispatcher('infuse.keygate');
infuse.keygate.cache = infuse.cache(infuse.cache.lru({capacity: 2048}));
```

# Infuse.fn failover

The default action is just to promote a keygate as an Infuse fn.

```js
infuse.keygate.alternatives.push(
  {accepts:   function () {return true},
   construct: function () {return infuse.fn.apply(this, arguments)}});
```

# Strings

A string is split into words, any of which is allowed to pass through.

```js
infuse.keygate.words = function (words) {
  return function (k) {
    return k == null || words.indexOf(k) > -1;
  };
};
```

```js
infuse.keygate.alternatives.push(
  {accepts:   function (x) {return typeof x === typeof ''
                                || x instanceof String},
   construct: function (s) {
     return infuse.keygate.cache(s, function () {
       return infuse.keygate.words(s.split(/\s+/));
     });
   }});
```

# Catch-alls

`null` and `undefined` turn into catch-alls. This is to support easy grabbing
of all keys: `sig.on(null, f)`.

```js
infuse.keygate.alternatives.push(
  {accepts:   function (x) {return x == null},
   construct: function ()  {return function () {return true}}});
```

```js
});

```
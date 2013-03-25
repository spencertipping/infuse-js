# Using `get`

`get` is implemented specifically for each type of Infuse object, but it also
has common behavior that applies across all types. For example:

```js
var xs = $i([1, 2, 3]);
xs.tos()                -> 'I[1, 2, 3]'
xs.get(0)               -> 1            // array-specific
xs.get(-1)              -> 3            // array-specific
xs.get([0, -1]).tos()   -> '#[1, 3]'    // generic (arrays -> functions)
```

Notice the difference between `xs.tos()` and `xs.get(...).tos()` above. Infuse
is telling you that `xs` is a regular array, whereas `xs.get(...).tos()` is a
derivative array. In general, any derivative object will have a `tos()` that
begins with `#`.

The `get` result is a derivative because we can change the getter and the
results will be updated as well. For example:

```js
var getter = $i([0, -1]);
var ys = xs.get(getter);
ys.tos()                -> '#[1, 3]'
getter.push(-2);
ys.tos()                -> '#[1, 3, 2]'
```

Internally, `get` transposes itself across whatever data structure you pass in
by using `map`. This means we can use any Infuse type as a getter:

```js
var sig    = $i.signal();
var result = xs.get(sig);
sig.push(0);
result.tos()            -> '#signal(1)'
sig.push(-1);
result.tos()            -> '#signal(3)'
```

The process is recursive:

```js
var getter = $i([sig]);
var result = xs.get(getter);
sig.push(-1);
result.tos()            -> '#[#signal(3)]'
getter.push(0);
result.tos()            -> '#[#signal(3), 1]'
getter.push({foo: -2});
result.tos()            -> '#[#signal(3), 1, #{foo: 2}]'
```

Another option is to use a function as a getter. In this case, the function
will simply receive the receiver as the first argument:

```js
$i([1, 2]).get('_.size()')                      -> 2    // dangerous (see below)
```

Be careful though! Arrays don't use strings as keys, but almost everything else
does. To be on the safe side you should explicitly coerce the getter into a
function:

```js
$i([1, 2]).get($i.fn('_.size()'))               -> 2
$i({foo: 'bar'}).get($i.fn('_.size()'))         -> 1
```

If you forget to do this, Infuse will think you want the value of a key called
`'_.size()'` and will return `undefined`:

```js
$i({foo: 'bar'}).get('_.size()')                -> undefined

```

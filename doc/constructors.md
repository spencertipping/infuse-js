# Infuse types and constructors

Every Infuse object is an instance of the global `infuse`, as well as being an
instance of its constructor. For example:

```js
infuse([]) instanceof infuse                    -> true
infuse([]) instanceof infuse.array              -> true
```

```js
infuse({}) instanceof infuse                    -> true
infuse({}) instanceof infuse.object             -> true
```

Infuse objects never inherit from each other, however. The only inheritance is
from `infuse`.

```js
infuse([]) instanceof infuse.object             -> false
```

These inheritance properties also apply to asynchronous objects:

```js
infuse.future() instanceof infuse               -> true
infuse.future() instanceof infuse.future        -> true
infuse.signal() instanceof infuse               -> true
infuse.signal() instanceof infuse.signal        -> true

```

# Heap map objects

Heapmaps are basically priority queues. They aren't normal Infuse objects
(generally they're just used internally for LRU caches and such), and you can't
make derivatives out of them.

```js
var h = infuse.heapmap();       // uses minheap of numbers by default
h.push('foo', 0)                -> h
h.push('bar', 1)                -> h
h.peek()                        -> 'foo'
h.get('foo')                    -> 0
h.push('bif', 2)                -> h
h.push('baz', -1)               -> h
```

At this point `baz` is at the top of the heap, but we can change its heap index
to rearrange stuff.

```js
h.peek()                        -> 'baz'
h.get('baz')                    -> -1
h.push('baz', 3)                -> h
h.pop()                         -> 'foo'
h.pop()                         -> 'bar'
h.pop()                         -> 'bif'
h.size()                        -> 1

```

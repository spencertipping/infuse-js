# Heap map objects

Heapmaps are basically priority queues. They aren't normal Infuse objects
(generally they're just used internally for LRU caches and such), and you can't
make derivatives out of them.

```js
var h = infuse.heapmap();       // uses minheap of numbers by default
h.push(0, 'foo')                -> h
h.push(1, 'bar')                -> h
h.size()                        -> 2
h.peek()                        -> 'foo'
h.get('foo')                    -> 0
h.push(2, 'bif')                -> h
h.push(-1, 'baz')               -> h
h.size()                        -> 4
```

At this point `baz` is at the top of the heap, but we can change its heap index
to rearrange stuff.

```js
h.peek()                        -> 'baz'
h.get('baz')                    -> -1
h.push(3, 'baz')                -> h
h.size()                        -> 4
h.pop()                         -> 'foo'
h.pop()                         -> 'bar'
h.pop()                         -> 'bif'
h.pop()                         -> 'baz'
h.size()                        -> 0

```

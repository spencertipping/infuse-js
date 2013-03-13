# Heap map objects

See also the [Infuse heapmap source](heapmap-src.md).

Heap maps give you a way to implement priority queues and similar data
structures. They are full Infuse objects, which means you can create
lazily-updated derivatives and they support all of the usual methods (e.g.
`map`, etc). However, a heap map derivative doesn't behave the same way that
most derivatives do. See the [heapmap source](heapmap-src.md) for details about
why it works this way.

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

# Type/method performance bounds

- B = best case
- W = worst case
- A = average case

For example, "Ω(n) BA" means that in the best and average cases, the operation
is bounded below by a linear function.

These performance bounds are in terms of trivial Javascript operations (e.g.
array/hash access, constant-space allocation, etc). So the following code is
characterized as O(n) time and GC overhead:

```js
var result = [];
for (var i = 0, l = n; i < l; ++i)
  result.push([i]);
```

## All types

### Maximum allowable time complexity

Here, _n_ is the size of the receiver and _k_, where applicable, is the size of
the update.

| Method       | worst-case       | amortized        |
| :-----       | :--------:       | :-------:        |
| `size`       | O(n)             | O(1)             |
| `derivative` | O(log n)         | O(log n)         |
| `force`      | O((k + n) log n) | O((k + n) log n) |
| `touch`      | O(k log n)       | O((k + n) log n) |
| `each`       | O(n log n)       | O(n)             |
| `keys`       | O(n log n)       | O(n)             |
| `values`     | O(n log n)       | O(1)             |
| `cursor`     | O(n log n)       | O(1)             |
| `get`        | O(log n)         | O(log n)         |
| `push`       | O(log n)         | O(log n)         |

### Maximum allowable GC overhead

Same as before for _n_ and _k_. "Ephemeral" refers to allocations that can be
freed before the object is freed, whereas "persistent" allocations are
referenced by the object.

| Method       | ephemeral  | persistent | persistent amortized |
| :-----       | :-------:  | :--------: | :------------------: |
| `size`       | O(n)       | O(n)       | O(1)                 |
| `derivative` | O(log n)   | O(0)       | O(0)                 |
| `force`      | O(n log n) | O(k log n) | O(k log n)           |
| `touch`      | O(n log n) | O(k log n) | O(k log n)           |
| `each`       | O(1)       | O(n)       | O(1)                 |
| `keys`       | O(n log n) | O(n)       | O(1)                 |
| `values`     | O(n log n) | O(n)       | O(1)                 |
| `cursor`     | O(n log n) | O(0)       | O(0)                 |
| `get`        | O(log n)   | O(log n)   | O(0)                 |
| `push`       | O(log n)   | O(log n)   | O(log n)             |

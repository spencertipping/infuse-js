# Infuse.js

**Note: this library doesn't work yet.**

Infuse.js implements inversions, futures, invariants, and a series of useful
methods that apply to objects and sequences. This is done non-intrusively by
constructing a wrapper around the object, similar to the way that jQuery wraps
the DOM.

## Concepts

### Wrapped arrays/objects

Infuse doesn't extend the `Array` or `Object` prototypes. Instead, you create a
wrapper for a value (this is always O(1) in space and time). For example:

```js
var xs  = [1, 2, 3, 4, 5];
var ixs = infuse(xs);

ixs.version()                   // -> 1

var mapped = ixs.map(function (x) {return x + 1});
mapped.get()                    // -> [2, 3, 4, 5, 6]
mapped.each(function (x) {
  console.log(x);
});                             // logs 2, 3, 4, 5, 6 (on separate lines)

mapped.each(function (x, i) {   // each value and its index
  console.log(i + ' -> ' + x);
});

var indexed = ixs.index(function (x) {return x % 1});
indexed.get()                   // -> {'0': 4, '1': 5}

var grouped = ixs.group(function (x) {return x % 1});
grouped.get()                   // -> {'0': [2, 4], '1': [1, 3, 5]}

ixs.get(0)                      // -> 1
ixs.get(-1)                     // -> 5
ixs.size()                      // -> 5

// linear interpolation FTW
ixs.get(1.3)                    // -> 1.3

// custom interpolation
ixs.get(1.3, function (x1, x2, f) {
  return x1 + (x2 - x1) * f*f;
});                             // -> 1.09 (= 1 + (2 - 1) * 0.09)

// multi-get
ixs.get([1, -1.2, -1])          // -> [1, 4.8, 5]

ixs.first()                     // -> 1
var even = function (x) {return x % 2 === 0};
ixs.first(even)                 // -> 2

xs.push(2);
ixs.touch().size()              // -> 6
ixs.sort().uniq().size()        // -> 5 (total complexity is O(n log n))
ixs.indexes().get()             // -> [0, 1, 2, 3, 4]
ixs.values()                    // -> ixs
ixs.version()                   // -> 2 (because we called touch())
```

You can also wrap objects:

```js
var iobj = infuse({foo: 1, bar: 2, bif: 3});
var mapped = iobj.map(function (x) {return x + 1});
mapped.get()                    // -> {foo: 2, bar: 3, bif: 4}

// function shorthands (described in detail some distance below)
iobj.index('_ % 1').get()       // -> {'0': 'bar', '1': 'bif'}
iobj.group('_ % 1').get()       // -> {'0': ['bar'], '1': ['foo', 'bif']}

iobj.get('foo')                 // -> 1
iobj.get('.foo')                // -> 1 (see "inversions" below)
iobj.get('_.foo')               // -> 1 (function shorthand)

iobj.indexes().get()            // -> ['bar', 'bif', 'foo'] (sorted)
iobj.indices().get()            // -> ditto
iobj.values()                   // -> [[3, 4], [5], [1, 2]] (sorted)
iobj.each(function (v) {
  console.log(v);
});

iobj.each(function (v, k) ...); // note! value always comes first
```

**NOTE**: If you destructively update an object that you've already passed into
Infuse, you need to `touch` the infuse instance that you gave it to in order
for it to observe the change. Otherwise, `get`, `size`, and all other method
calls may continue to operate on the original object.

### Inversions

An inversion is a way to flip an object inside-out. It's a lot like a zipper
for objects and arrays. For example:

```js
var iobj = infuse({foo: 1, bar: [1, 2, 3]});
var inv  = iobj.at('.bar[2]');
inv.get()                       // -> 3
var edited = inv.map(function (x) {return 5});
edited.get()                    // -> 5
edited.at(-2).get()             // -> {foo: 1, bar: [1, 2, 5]}
inv.get()                       // -> {foo: 1, bar: [1, 2, 3]}
```

Notice that no value is changed destructively; inversions always return new
objects without modifying the originals. This means that you can edit the
original and replay the inversion's changes:

```js
iobj.get().bar[0] = 'hi';
iobj.touch();                   // inform iobj that its object has changed
edited.get()                    // -> {foo: 1, bar: ['hi', 2, 5]}
```

If your inversion path contains wildcards, you'll get an array of inversions
back:

```js
var iobj = infuse({foo: [1, 2], bar: [3, 4], bif: [5]});
var results = iobj.at('.*[0]').map(function (inv) {return inv.get()});
results.get()                   // -> [1, 3, 5]

// perhaps more conveniently:
iobj.get('.*[0]')               // -> [1, 3, 5]
iobj.get('.*[1]')               // -> [1, 3]
iobj.first('.*[0]')             // -> 3 (keys are sorted)
iobj.last('.*[0]')              // -> 1
```

### Futures

A future is an object that will become available asynchronously. It's more
flexible than a callback in a number of ways; for example:

```js
var future = infuse.future();
future.size()                   // -> 0
$.getJSON('/foo', future);

var somefield = future.map(function (result) {
  future.size()                 // -> 1
  return infuse(result).at('.foo.bar[0].bif').get();
});

somefield.each(function (result) {
  console.log('got the result: ' + JSON.stringify(result));
});
```

Futures also solve the multiple-request problem:

```js
var result1 = infuse.future();
var result2 = infuse.future();
$.getJSON('/foo', result1);
$.getJSON('/bar', result2);

infuse.future([result1, result2]).each(function (both) {
  console.log('result1 is ' + JSON.stringify(both[0]));
  console.log('result2 is ' + JSON.stringify(both[1]));
});

infuse.future({foo: result1, bar: result2}).each(function (both) {
  // same as before, but with both.foo and both.bar
});
```

And last but not least:

```js
var first = infuse.future();
$.getJSON('/step1', first);

var second = first.flatmap(function (result) {
  var second = infuse.future();
  $.getJSON('/step2?arg=' + result, second);
  return second;
});

second.each(function (result) {
  // now, result refers to the outcome of /step2?arg=X
  console.log('the final result is ' + JSON.stringify(result));
});
```

### Signals

A signal is just like a future that can be resolved more than once. For
example:

```js
var sig = infuse.signal();
sig.size()                      // -> 0
sig.each(function (result) {
  console.log(result);
});

sig(1);                         // -> null, logs '1'
sig(2);                         // -> null, logs '2'
sig.size()                      // -> 2
sig.get()                       // -> 2
```

Signals forget all of their previous values, so they function more as streams
than as lazy sequences. But like lazy sequences, you can `fold` and `filter`
them:

```js
var sum = sig.fold(0, function (total, x) {
  return total + x;
});

sum.each(function (x) {
  console.log('so far the total is ' + x);
});

sig(3);                         // logs 'so far the total is 3'
sig(10);                        // logs 'so far the total is 13'
```

Like futures, you can transpose signals across array and object boundaries:

```js
var sig1 = infuse.signal();
var sig2 = infuse.signal();

var both  = infuse.signal([sig1, sig2]);
var both2 = infuse.signal({first: sig1, second: sig2});
```

If you do this, `both` and `both2` will be updated anytime either `sig1` or
`sig2` changes. (Initially, signals have the value `null`.)

### Invariants

Javascript doesn't have real invariants (e.g. those created by something like a
type system), but we can approximate the effect by using a state-propagating
edge. These edges are used to connect signals together. For example:

```js
var inputbox = $('#my-input');
var inputsig = infuse.signal();

inputbox.change(function (e) {
  inputsig($(this).val());
});

inputsig.each(function (val) {
  inputbox.val(val);
});

var parsed = infuse.signal();
var edge   = parsed.connect(inputsig, JSON.stringify, JSON.parse);

parsed([1, 2, 3]);              // causes textbox contents to change
inputsig.get()                  // -> '[1,2,3]'

// now simulate a user edit
// note that inputsig('{"foo": 4}') would work just as well
$('#my-input').val('{"foo": 4}').change();

parsed.get()                    // -> {foo: 4}

var pair = edge.pair();         // the edge going the other way
edge.each(function (value) {
  // spy on the values traveling through the edge
  console.log('parsed->inputsig: ' + JSON.stringify(value));
});

pair.each(function (value) {
  console.log('inputsig->parsed: ' + JSON.stringify(value));
});

edge.remove();

// all signals remember their values, but propagation no longer happens
parsed.get()                    // -> {foo: 4}
inputsig.get()                  // -> '{"foo": 4}'
```

The purpose of an invariant is to make it so you don't have to think about
state propagation. Instead, you just drop a value somewhere and know that
everything connected to that value will automatically be updated.

## The power

You've probably noticed that regardless of what kind of object we're dealing
with, most of the same methods (`each`, `map`, etc) are available. This isn't
an accident: *every* `infuse` object has the same set of methods (and most of
them work on every kind of object). The methods are adapted to whatever kind of
thing you're doing. For example:

```js
var future = infuse.future();
$.getJSON('/foo', future);

var subobject = future.at('.result[0]');
subobject.each(function (x) {
  console.log('/foo .result[0] is ' + JSON.stringify(x));
});
```

Because futures may not be resolved, calling `at` on one gives you another
future whose value will be retrieved by using `at` on the result of the first.
The same goes for signals. In general, if there is any reasonably obvious way
that Infuse can do what you're asking, it probably will (and if it doesn't,
then it's a bug).

### Equivalences

For all infuse objects `i`, the following hold, where `x ~= y` means "x is
semantically equivalent to y":

- `i.map(f).map(g) ~= i.map(compose(g, f))`
- `i.map(f).flatmap(g) ~= i.flatmap(compose(g, f))`
- `i.map(identity).each(f) ~= i.each(f)`

### Methods that don't work everywhere

The following method calls will fail with a runtime error:

- `future.force()`: this isn't possible in Javascript.
- `signal.force()`: this also isn't possible and its meaning is unclear.

### Function shorthands

For all its virtues, Javascript has awful function syntax. Infuse helps out a
little by compiling functions for you on the fly. For example:

```js
var words = infuse('foo bar bif baz bok'.split(/\s+/));
words.filter('_.charAt(0) === "b"').size()      // -> 4
words.filter(/^b/).size()                       // -> 4
words.map('.length').last()                     // -> 3
words.map(/.(.)./).join('')                     // -> 'oaiao'
words.map({foo: 'FOO'}).join(' ')               // -> 'FOO bar bif baz bok'
```

**WARNING**: `'.foo[0]'` and `'_.foo[0]'` aren't the same thing! `'.foo[0]'` is
an Infuse path (since it begins with `.` or `[`) and `'_.foo[0]'` is an
anonymous function. The difference is that Infuse paths won't fail for null
intermediate objects:

```js
var objects = infuse([null, {foo: null}, {foo: [10]}]);
objects.map('_.foo[0]').get()                   // blows up
objects.map('.foo[0]').get()                    // -> [null, null, 10]
```

You can also bind local variables within an anonymous function (though you
can't modify their values):

```js
var log = function (x) {console.log(x)};
objects.each('log(_)', {log: log});
```

### Lazy sequences

A signal is a sort of push-sequence: `map` and `each` evaluation happens when
stuff is pushed onto the end. Lazy sequences are pull-sequences: `map` and
`each` happen in response to the user pulling values from them.

Unlike implementations in a lot of languages, Infuse will never implicitly
force a sequence. Instead, you explicitly tell it to force until some condition
is reached. For example:

```js
// lazy sequence of nonnegative integers:
var lazy = infuse.iterate(0, '_ + 1');
lazy.size()                     // -> 0 (no elements forced yet)
lazy.get()                      // -> [] (all forced elements)

// this is boring; let's get some elements
lazy.force(10)                  // -> lazy
lazy.size()                     // -> 10
lazy.get(-1)                    // -> 9
```

Note that `force` touches the sequence object if any new elements are added.
Each `force` operation increments the version by at most 1, and elements added
to the sequence with `force` are added atomically.

Here's where things get interesting. Laziness is contagious: if you index a
lazy sequence, you'll get an object whose values change as more things are
forced. The same goes for mapped sequences, etc. For example:

```js
var idx = lazy.index('_ % 3');
idx.get()                       // -> {'0': 9, '1': 7, '2': 8}
idx.force(11)                   // -> idx
lazy.size()                     // -> 11
idx.get()                       // -> {'0': 9, '1': 10, '2': 8}
lazy.force(12)                  // -> lazy
idx.get()                       // -> {'0': 9, '1': 10, '2': 11}
idx.get(0)                      // -> 9
idx.size()                      // -> 3
```

**BIG HUGE WARNING**: Infuse is allowed to destructively change the objects it
gives you as `get` results! Anything it generates is as mutable as the object
that generated it. Behavior is undefined if you destructively change an object
created by an Infuse wrapper.

If you request an index that isn't in range and the sequence has a lazy
generator, then you'll get a future that is resolved once the sequence is
forced:

```js
var future = lazy.get(20);
future.each('console.log(_)');
future.get()                    // -> null
lazy.force(20);                 // logs 19
future.get()                    // -> 19
```

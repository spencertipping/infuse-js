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

var mapped = ixs.map(function (x) {return x + 1});
mapped.get()                    // -> [2, 3, 4, 5, 6]
mapped.each(function (x) {
  console.log(x);
});                             // logs 2, 3, 4, 5, 6 (on separate lines)

var grouped = ixs.groupby(function (x) {return x % 1});
grouped.get()                   // -> {'0': [2, 4], '1': [1, 3, 5]}

ixs.get(0)                      // -> 1
ixs.get(-1)                     // -> 5
ixs.size()                      // -> 5

ixs.first()                     // -> 1
var even = function (x) {return x % 2 === 0};
ixs.first(even)                 // -> 2
```

### Inversions

An inversion is a way to flip an object inside-out. It's a lot like a zipper
for objects and arrays. For example:

```js
iobj.get()                      // -> {foo: 1, bar: [1, 2, 3]}
var inv = iobj.at('.bar[2]');
inv.get()                       // -> 3
inv.up().get()                  // -> [1, 2, 3]
inv.up(2).get()                 // -> {foo: 1, bar: [1, 2, 3]}
inv.set(5).up(2).get()          // -> {foo: 1, bar: [1, 2, 5]}
inv.up(2).get()                 // -> {foo: 1, bar: [1, 2, 3]}
```

Notice that no value is actually edited; inversions copy the values they are
traversing before committing the change. Inversions themselves don't change
either; instead, each one points to the one before to form a linked list of
changes.

### Futures

A future is an object that will become available asynchronously. It's more
flexible than a callback in a number of ways; for example:

```js
var future = infuse.future();
$.getJSON('/foo', future);

var somefield = future.map(function (result) {
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
sig.each(function (result) {
  console.log(result);
});

sig(1);                         // -> null, logs '1'
sig(2);                         // -> null, logs '2'

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
an accident: *every* `infuse` object has the same set of methods. The methods
are adapted to whatever kind of thing you're doing. For example:

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

For all infuse objects `i`, the following hold, where `x ~= y` means "*x* is
semantically equivalent to *y*":

- `i.map(f).map(g) ~= i.map(compose(g, f))`
- `i.map(f).flatmap(g) ~= i.flatmap(compose(g, f))`
- `i.map(identity).each(f) ~= i.each(f)`

### Function shorthands

For all its virtues, Javascript has awful function syntax. Infuse helps out a
little by compiling functions for you on the fly. For example:

```js
var words = infuse('foo bar bif baz bok'.split(/\s+/));
words.filter('_.charAt(0) === "b"').size()      // -> 4
words.filter(/^b/).size()                       // -> 4
words.map('.length').last()                     // -> 3
words.map(/.(.)./).join('')                     // -> 'oaiao'
```

Note that `'.foo[0]'` and `'_.foo[0]'` aren't the same thing! `'.foo[0]'` is an
Infuse path (since it begins with `.` or `[`) and `'_.foo[0]'` is an anonymous
function. The difference is that Infuse paths won't fail for null intermediate
objects:

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

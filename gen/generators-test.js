// Incremental update generators.
// See also the source for the [Infuse pull-propagation mixin](mixin-pull-src.md)
// and the [push-propagation mixin](mixin-push-src.md).

// Every object type defines a `generator` method that gives you a single-pass,
// generally constant-memory iterator for a data structure. Generators are used by
// `map`, `filter`, etc, to build and maintain derivative data structures. For
// example:

var arr = [1, 2, 3, 4, 5];
var xs  = infuse(arr);
var g   = xs.generator();

// Now we can invoke the generator on a function that takes `value, key` pairs.
// Returning `false` from this function causes it to stop iterating until we call
// the generator again.

g(function (x, i) {
infuse.assert_equal((  x                             ), (1));
infuse.assert_equal((  i                             ), (0));
  return false;                 // stops iteration for the moment
});

g(function (x, i) {
infuse.assert_equal((  i > 0                         ), (true));
infuse.assert_equal((  x === arr[i]                  ), (true));
});

// Now the generator is up-to-date; calling it further won't have any effect:

var called = false;
g(function () {called = true});
infuse.assert_equal((called                          ), (false));

// However, if we add a new element and then call the generator, we'll get that
// update:

xs.push(6);
g(function (x, i) {
infuse.assert_equal((  x                             ), (6));
infuse.assert_equal((  i                             ), (5));
});

// Big warning: If you're using a push-propagated object like a future or a
// signal, then you need to pass a second argument into the generator. This second
// argument is the Infuse ID of the object that will be receiving updates from the
// generator. If you aren't updating an Infuse object, you can just use
// `infuse.gen_id()` to create an anonymous ID.
// Generated by SDoc

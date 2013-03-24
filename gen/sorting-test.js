// Lazy sorting.
// All Infuse objects can be lazily heap-sorted; this includes synchronous
// collections (arrays, objects, etc) as well as asynchronous ones (futures,
// signals). Generators over sorted collections will always provide sorted views,
// ignoring any new elements that occur prior to their positions. For example:

var xs = infuse([4, 3, 1, 2]);
var sorted = xs.sort();

infuse.assert_equal((sorted.size()                           ), (4));
infuse.assert_equal((sorted.join(',')                        ), ('1,2,3,4'));

// Sorted collections are append-only views, so elements that sort before
// already-realized objects in the sorted collection aren't added:

xs.push(2.1);
infuse.assert_equal((sorted.join(',')                        ), ('1,2,3,4'));

// However, if we observe a change that we can append, we do it:

xs.push(5);
infuse.assert_equal((sorted.join(',')                        ), ('1,2,3,4,5'));

// Sorted collections are unique under the sorted value; any new values must sort
// strictly above the last-seen value. But you can collapse contiguous runs of
// values with the `uniq` method:

var uniqs = xs.uniq();
infuse.assert_equal((uniqs.join(',')                         ), ('4,3,1,2,2.1,5'));
xs.push(3).push(4).push(4);
infuse.assert_equal((uniqs.join(',')                         ), ('4,3,1,2,2.1,5,3,4'));

// You can sort the values of asynchronous collections, but you'll first have to
// collect the values into some structure that keeps old ones around.

var sig = infuse.signal();
var sorted_vals = sig.values().sort();

infuse.assert_equal((sorted_vals.size()                      ), (0));
sig.push(5).push(6).push(3);
infuse.assert_equal((sorted_vals.join(',')                   ), ('3,5,6'));

// Like before, the sorted collection is append-only:

sig.push(5.5);
infuse.assert_equal((sorted_vals.join(',')                   ), ('3,5,6'));
sig.push(9).push(7).push(8);
infuse.assert_equal((sorted_vals.join(',')                   ), ('3,5,6,7,8,9'));

// Sorting should always mirror the behavior of the native `sort` method, modulo
// comparator differences:

var numeric = function (a, b) {return a - b};
for (var i = 3; i < 100; ++i) {
  for (var xs = [], j = 0; j < i; ++j)
    xs.push(Math.random() * 100 >>> 0);
infuse.assert_equal((  infuse(xs).sort().join(',')           ), (xs.slice().sort(numeric).join(',')));
}

// Generated by SDoc

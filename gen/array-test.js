// Infuse arrays.
// See also the [Infuse array source](array-src.md).

// When you say `infuse([1, 2, 3])`, Infuse selects the `infuse.array` alternative
// and invokes that instead, as if you had written `infuse.array([1, 2, 3])`:

infuse.assert_equal((infuse([1, 2, 3]).size()        ), (3));
infuse.assert_equal((infuse.array([1, 2, 3]).size()  ), (3));

// Like all Infuse objects, arrays support `size`, `get`, and a number of other
// accessor methods:

var xs = infuse([1, 2, 3]);
infuse.assert_equal((xs.get(0)                       ), (1));
infuse.assert_equal((xs.get(-1)                      ), (3));

// For arrays specifically, Infuse gives you generic linear interpolation between
// elements:

infuse.assert_equal((xs.get(0.5)                     ), (1.5));

var quadratic = function (a, b, x) {return a + (b - a) * x*x};
infuse.assert_equal((xs.get(0.5, quadratic)          ), (1.25));
infuse.assert_equal((xs.get(0, quadratic)            ), (1));

// And without arguments, `get` returns a regular Javascript array:

infuse.assert_equal((xs.get()[0]                     ), (1));
infuse.assert_equal((xs.get().length                 ), (3));

// Transformations.
// Arrays can be transformed eagerly and lazily. For example:

var ys = xs.map('_ + 1');
infuse.assert_equal((ys.size()                       ), (3));
infuse.assert_equal((ys.get().join(',')              ), ('2,3,4'));
infuse.assert_equal((ys.version() > 0                ), (true));

var t = xs.tail(2);
infuse.assert_equal((t.size()                        ), (2));
infuse.assert_equal((t.get().join(',')               ), ('2,3'));

// As mentioned in the readme, transformations are stored so that incremental
// updates to the original array are reflected in any derivative arrays.

infuse.assert_equal((xs.push(5)                      ), (xs));
infuse.assert_equal((xs.size()                       ), (4));
infuse.assert_equal((xs.get(-1)                      ), (5));
infuse.assert_equal((t.get(-1)                       ), (5));
infuse.assert_equal((t.size()                        ), (2));
infuse.assert_equal((ys.get(-1)                      ), (6));
infuse.assert_equal((ys.size()                       ), (4));

// We can construct lazily-updated derivatives of the mapped output as well:

var ys2 = ys.map('_ * 2');
infuse.assert_equal((ys2.size()                      ), (4));
infuse.assert_equal((ys2.get().join(',')             ), ('4,6,8,12'));
infuse.assert_equal((xs.push(6)                      ), (xs));
infuse.assert_equal((ys2.get().join(',')             ), ('4,6,8,12,14'));

// This includes things like filters and flatmaps, but with the caveat that
// already-realized elements won't be recomputed:

var zs = xs.flatmap('[_ + 1, _ + 2]');
infuse.assert_equal((zs.size()                       ), (10));
infuse.assert_equal((zs.get().join(',')              ), ('2,3,3,4,4,5,6,7,7,8'));

infuse.assert_equal((xs.push('foo')                  ), (xs));
infuse.assert_equal((zs.get().join(',')              ), ('2,3,3,4,4,5,6,7,7,8,foo1,foo2'));

// Generated by SDoc

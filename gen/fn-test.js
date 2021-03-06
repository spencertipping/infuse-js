// Infuse function promotion.
// See also the [Infuse fn source](fn-src.md).

// Infuse promotes functions using a multimethod called `$i.fn`. This method
// maintains a bounded LRU cache of anything it compiles to minimize the
// performance impact of using functions inside loops. Here are some function
// promotions:

infuse.assert_equal(($i.fn('_ + 1')(5)                  ), (6));
infuse.assert_equal(($i.fn('_1 + _2')(5, 6)             ), (11));

// You can also create closure variables for compiled functions:

infuse.assert_equal(($i.fn('x + _', {x: 5})(6)          ), (11));
infuse.assert_equal(($i.fn('x + _', {x: 'foo'})('bar')  ), ('foobar'));

// In addition to strings, Infuse gives you some other options like regular
// expressions. You can also add your own types by appending elements to
// `$i.fn.alternatives`.

infuse.assert_equal(($i.fn(/f(..)/)('foo')[0]           ), ('oo'));
infuse.assert_equal(($i.fn(/f(..)/)('bar')              ), (null));
infuse.assert_equal(($i.fn(/f(.)(.)/)('foo').length     ), (2));
infuse.assert_equal(($i.fn(/f(.)(.)/)('foo')[0]         ), ('o'));
infuse.assert_equal(($i.fn(/f(.)(.)/)('foo')[1]         ), ('o'));
infuse.assert_equal(($i.fn(/foo*/)('fooooo')            ), ('fooooo'));
infuse.assert_equal(($i.fn(/foo*/)('baaaar')            ), (null));

// And naturally, functions go straight through without any modification.

var f = function (x) {return x + 1};
infuse.assert_equal(($i.fn(f)(5)                        ), (6));

// The cool part.
// All Infuse objects compile into structure-preserving functions. For example:

var o      = $i({foo: '_ + 1', bar: ['_', '_ + 2']});
var f      = $i.fn(o);
var val    = $i([1, 2]);
var mapped = val.map(f);

infuse.assert_equal((mapped.size()          ), (2));
infuse.assert_equal((mapped.tos()           ), ('#[#{bar: #[1, 3], foo: 2}, #{bar: #[2, 4], foo: 3}]'));

// mget(x, y, ...) = get(x).get(y)....
infuse.assert_equal((mapped.mget(0, 'foo')  ), (2));
infuse.assert_equal((mapped.mget(1, 'foo')  ), (3));

// At this point, each value in `mapped` is a *derivative of the function*. So if
// we change the object the function was built from, those changes will be
// reflected in all results from that function:

infuse.assert_equal((o.tos()                ), ('I{bar: _,_ + 2, foo: _ + 1}'));
infuse.assert_equal((mapped.get(0).tos()    ), ('#{bar: #[1, 3], foo: 2}'));

o.push('"bif" + _', 'bif');
infuse.assert_equal((o.tos()                ), ('I{bar: _,_ + 2, bif: "bif" + _, foo: _ + 1}'));
infuse.assert_equal((mapped.get(0).tos()    ), ('#{bar: #[1, 3], bif: bif1, foo: 2}'));

infuse.assert_equal((mapped.size()          ), (2));
infuse.assert_equal((mapped.tos()           ), ('#[#{bar: #[1, 3], bif: bif1, foo: 2}, #{bar: #[2, 4], bif: bif2, foo: 3}]'));

infuse.assert_equal((mapped.mget(0, 'bif')  ), ('bif1'));
infuse.assert_equal((mapped.mget(1, 'bif')  ), ('bif2'));

// We also have the usual property that `mapped` is a derivative of `val`:

val.push(3);
infuse.assert_equal((mapped.size()          ), (3));
infuse.assert_equal((mapped.tos()           ), ('#[#{bar: #[1, 3], bif: bif1, foo: 2}, #{bar: #[2, 4], bif: bif2, foo: 3}, #{bar: #[3, 5], bif: bif3, foo: 4}]'));

infuse.assert_equal((mapped.mget(2, 'foo')  ), (4));
infuse.assert_equal((mapped.mget(2, 'bif')  ), ('bif3'));

// We can see the linkages by asking each object to list its bases:

infuse.assert_equal((mapped.bases()[0].id()                         ), (val.id()));
infuse.assert_equal((mapped.get(0).bases()[0].bases()[0].id()       ), (o.id()));

// Like everything else in Infuse, all of this happens without recomputing any
// existing results.
// Generated by SDoc

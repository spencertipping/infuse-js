// Infuse multiobjects.
// See also the [Infuse multiobject source](multiobject-src.md).

// Just like objects, but each key maps to multiple values:

var o = infuse.multiobject();

infuse.assert_equal((o.size()                        ), (0));
infuse.assert_equal((o.push(1, 'foo')                ), (o));
infuse.assert_equal((o.push(2, 'foo')                ), (o));
infuse.assert_equal((o.push(1, 'bar')                ), (o));

infuse.assert_equal((o.get('foo').join(',')          ), ('1,2'));
infuse.assert_equal((o.get('bar').join(',')          ), ('1'));

infuse.assert_equal((o.size()                        ), (3));

// Multiobjects are generated when you `group` a collection. For example:

var xs = infuse([1, 2, 3, 4, 5, 6]);
var grouped = xs.group('_ % 3');
var indexed = xs.index('_ % 3');

infuse.assert_equal((grouped.size()                  ), (6));
infuse.assert_equal((grouped.get('0').join(',')      ), ('3,6'));
infuse.assert_equal((grouped.get('1').join(',')      ), ('1,4'));

infuse.assert_equal((indexed.size()                  ), (3));
infuse.assert_equal((indexed.get('0')                ), (6));
infuse.assert_equal((indexed.get('1')                ), (4));

// And like all other Infuse collections, multiobjects provide dynamic updating:

infuse.assert_equal((xs.push(7)                      ), (xs));
infuse.assert_equal((grouped.get('1').join(',')      ), ('1,4,7'));
infuse.assert_equal((grouped.size()                  ), (7));

// Generated by SDoc

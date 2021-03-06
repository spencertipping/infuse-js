// Infuse objects.
// See also the [Infuse object source](object-src.md).

// These are instantiated like arrays and support a similar API:

var o = $i({foo: 1, bar: 2, bif: 3});
var keys = o.keys();
infuse.assert_equal((o.size()                       ), (3));
infuse.assert_equal((keys.size()                    ), (3));
infuse.assert_equal((o.get('foo')                   ), (1));
infuse.assert_equal((o.tos()                        ), ('I{bar: 2, bif: 3, foo: 1}'));

var i = o.inverse();
infuse.assert_equal((i.get('1')                     ), ('foo'));
infuse.assert_equal((i.tos()                        ), ('#{1: foo, 2: bar, 3: bif}'));

// Also like arrays, you can `map` objects:

var mapped = o.map('_ + 1');
infuse.assert_equal((mapped.size()                  ), (3));
infuse.assert_equal((mapped.get('foo')              ), (2));
infuse.assert_equal((mapped.get('bar')              ), (3));
infuse.assert_equal((mapped.tos()                   ), ('#{bar: 3, bif: 4, foo: 2}'));

// And like any Infuse object, changes you make to the base will be reflected in
// the mapped output:

infuse.assert_equal((o.push(4, 'baz')               ), (o));
infuse.assert_equal((o.size()                       ), (4));
infuse.assert_equal((i.get('4')                     ), ('baz'));
infuse.assert_equal((i.tos()                        ), ('#{1: foo, 2: bar, 3: bif, 4: baz}'));
infuse.assert_equal((mapped.size()                  ), (4));
infuse.assert_equal((mapped.get('baz')              ), (5));

infuse.assert_equal((keys.size()                    ), (4));
infuse.assert_equal((keys.get().sort().join(',')    ), ('bar,baz,bif,foo'));

o.push(5, 'five') .push(6, 'six');
infuse.assert_equal((i.get('5')                     ), ('five'));
infuse.assert_equal((i.get('6')                     ), ('six'));

o.push(7, 'seven').push(8, 'eight');

infuse.assert_equal((keys.get().sort().join(',')    ), ('bar,baz,bif,eight,five,foo,seven,six'));
infuse.assert_equal((mapped.get('five')             ), (6));
infuse.assert_equal((mapped.get('six')              ), (7));
infuse.assert_equal((mapped.get('seven')            ), (8));
infuse.assert_equal((mapped.get('eight')            ), (9));

infuse.assert_equal((mapped.size()                  ), (8));
infuse.assert_equal((i.size()                       ), (8));

// Generated by SDoc

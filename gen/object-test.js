// Infuse objects.
// These are instantiated like arrays and support a similar API:

var o = infuse({foo: 1, bar: 2, bif: 3});
infuse.assert_equal((o.size()                        ), (3));
infuse.assert_equal((o.keys().size()                 ), (3));
infuse.assert_equal((o.get('foo')                    ), (1));

// Also like arrays, you can `map` objects:

var mapped = o.map('_ + 1');
infuse.assert_equal((mapped.size()                   ), (3));
infuse.assert_equal((mapped.get('foo')               ), (2));
infuse.assert_equal((mapped.get('bar')               ), (3));

// Generated by SDoc

// Infuse types and constructors.
// Every Infuse object is an instance of the global `infuse`, as well as being an
// instance of its constructor. For example:

infuse.assert_equal(($i([]) instanceof $i                           ), (true));
infuse.assert_equal(($i([]) instanceof $i.array                     ), (true));

infuse.assert_equal(($i({}) instanceof $i                           ), (true));
infuse.assert_equal(($i({}) instanceof $i.object                    ), (true));

// Infuse objects never inherit from each other, however. The only inheritance is
// from `infuse`.

infuse.assert_equal(($i([]) instanceof $i.object                    ), (false));

// These inheritance properties also apply to asynchronous objects:

infuse.assert_equal(($i.future() instanceof $i                      ), (true));
infuse.assert_equal(($i.future() instanceof $i.future               ), (true));
infuse.assert_equal(($i.signal() instanceof $i                      ), (true));
infuse.assert_equal(($i.signal() instanceof $i.signal               ), (true));

// You can convert between Infuse collection types using `into`. For example:

var o = $i(['foo', 'bar', 'bif']).into($i.object);
infuse.assert_equal((o.tos()                                        ), ('#{0: foo, 1: bar, 2: bif}'));

var o = {};
$i(['a', 'b', 'c', 'd']).into(o);
infuse.assert_equal(($i(o).tos()                                    ), ('I{0: a, 1: b, 2: c, 3: d}'));

var o  = $i({foo: 'bar', bif: 'baz'});
var xs = [];
infuse.assert_equal((o.into(xs)                                     ), (xs));
infuse.assert_equal((xs.sort().join(',')                            ), ('bar,baz'));

// The same mechanism works between synchronous and asynchronous objects.

var sig = $i.signal();
var o   = $i({});
infuse.assert_equal((sig.into(o)                                    ), (o));
infuse.assert_equal((sig.push(4, 'foo').push(5, 'bar')              ), (sig));
infuse.assert_equal((o.tos()                                        ), ('I{bar: 5, foo: 4}'));
infuse.assert_equal((o.size()                                       ), (2));
infuse.assert_equal((o.keys().sort().join(',')                      ), ('bar,foo'));
infuse.assert_equal((o.get(['foo', 'bar']).join(',')                ), ('4,5'));

// At this point `o` is not a proper derivative of `sig`, nor can it be since
// Infuse objects can never transition into being derivatives. However, signals
// can forward events to things that are not technically derivatives of
// themselves, and you can remove any such quasiderivative by using the
// `detach_derivative` method:

infuse.assert_equal((sig.detach_derivative(o)                       ), (sig));
infuse.assert_equal((sig.push(6, 'bif')                             ), (sig));
infuse.assert_equal((o.size()                                       ), (2));

// A useful idiom is to maintain a window of signal history using a tail. For
// example:

var sig  = $i.signal();
var tail = sig.into($i.tail, 3);    // last 3 elements

infuse.assert_equal((tail.size()                                    ), (0));
sig.push('foo');
infuse.assert_equal((tail.join(',')                                 ), ('foo'));
sig.push('bar').push('bif').push('baz');
infuse.assert_equal((tail.join(',')                                 ), ('bar,bif,baz'));

// Tails are useful for limiting memory use when you have a potentially unbounded
// stream of values. But be careful what you do with them; if you group a tail,
// for instance, that grouping may store old values:

var group = tail.group('_');
infuse.assert_equal((group.size()                                   ), (3));
infuse.assert_equal((group.get('bar').size()                        ), (1));

sig.push('bok');
infuse.assert_equal((tail.size()                                    ), (3));
infuse.assert_equal((group.size()                                   ), (4));
sig.push('bar');
infuse.assert_equal((group.size()                                   ), (5));
infuse.assert_equal((group.get('bar').size()                        ), (2));

// Generated by SDoc

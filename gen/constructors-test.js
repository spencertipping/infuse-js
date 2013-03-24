// Infuse types and constructors.
// Every Infuse object is an instance of the global `infuse`, as well as being an
// instance of its constructor. For example:

infuse.assert_equal((infuse([]) instanceof infuse                    ), (true));
infuse.assert_equal((infuse([]) instanceof infuse.array              ), (true));

infuse.assert_equal((infuse({}) instanceof infuse                    ), (true));
infuse.assert_equal((infuse({}) instanceof infuse.object             ), (true));

// Infuse objects never inherit from each other, however. The only inheritance is
// from `infuse`.

infuse.assert_equal((infuse([]) instanceof infuse.object             ), (false));

// These inheritance properties also apply to asynchronous objects:

infuse.assert_equal((infuse.future() instanceof infuse               ), (true));
infuse.assert_equal((infuse.future() instanceof infuse.future        ), (true));
infuse.assert_equal((infuse.signal() instanceof infuse               ), (true));
infuse.assert_equal((infuse.signal() instanceof infuse.signal        ), (true));

// You can convert between Infuse collection types using `into`. For example:

var o = infuse(['foo', 'bar', 'bif']).into(infuse.object);
infuse.assert_equal((o.keys().sort().join(',')                       ), ('0,1,2'));
infuse.assert_equal((o.get(['0', '1', '2']).join(',')                ), ('foo,bar,bif'));

var o = {};
infuse(['a', 'b', 'c', 'd']).into(o);
infuse.assert_equal((o['0']                                          ), ('a'));
infuse.assert_equal((o['3']                                          ), ('d'));

var o  = infuse({foo: 'bar', bif: 'baz'});
var xs = [];
infuse.assert_equal((o.into(xs)                                      ), (xs));
infuse.assert_equal((xs.sort().join(',')                             ), ('bar,baz'));

// The same mechanism works between synchronous and asynchronous objects.

var sig = infuse.signal();
var o   = infuse({});
infuse.assert_equal((sig.into(o)                                     ), (o));
infuse.assert_equal((sig.push(4, 'foo').push(5, 'bar')               ), (sig));
infuse.assert_equal((o.size()                                        ), (2));
infuse.assert_equal((o.keys().sort().join(',')                       ), ('bar,foo'));
infuse.assert_equal((o.get(['foo', 'bar']).join(',')                 ), ('4,5'));

// At this point `o` is not a proper derivative of `sig`, nor can it be since
// Infuse objects can never transition into being derivatives. However, signals
// can forward events to things that are not technically derivatives of
// themselves, and you can remove any such quasiderivative by using the
// `detach_derivative` method:

infuse.assert_equal((sig.detach_derivative(o)                        ), (sig));
infuse.assert_equal((sig.push(6, 'bif')                              ), (sig));
infuse.assert_equal((o.size()                                        ), (2));

// A useful idiom is to maintain a window of signal history using a tail. For
// example:

var sig  = infuse.signal();
var tail = sig.into(infuse.tail, 3);    // last 3 elements

infuse.assert_equal((tail.size()                                     ), (0));
sig.push('foo');
infuse.assert_equal((tail.join(',')                                  ), ('foo'));
sig.push('bar').push('bif').push('baz');
infuse.assert_equal((tail.join(',')                                  ), ('bar,bif,baz'));

// Tails are useful for limiting memory use when you have a potentially unbounded
// stream of values. But be careful what you do with them; if you group a tail,
// for instance, that grouping may store old values:

var group = tail.group('_');
infuse.assert_equal((group.size()                                    ), (3));
infuse.assert_equal((group.get('bar').length                         ), (1));

sig.push('bok');
infuse.assert_equal((tail.size()                                     ), (3));
infuse.assert_equal((group.size()                                    ), (4));
sig.push('bar');
infuse.assert_equal((group.size()                                    ), (5));
infuse.assert_equal((group.get('bar').length                         ), (2));

// Generated by SDoc

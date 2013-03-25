// Infuse signals.
// See also the [Infuse signal source](signal-src.md).

// More encapsulated callbacks! For example:

var s      = $i.signal();
var called = 0;
var errors = 0;

var grouped = s.group('_2');    // group by key, or callback type (see below)

infuse.assert_equal((grouped.size()                 ), (0));
infuse.assert_equal((grouped.tos()                  ), ('#{}'));

infuse.assert_equal((s.size()                       ), (0));
s.on('value', function (x) {++called});
s.on('error', function (x) {++errors});
infuse.assert_equal((called                         ), (0));
infuse.assert_equal((s.size()                       ), (0));
infuse.assert_equal((s.tos()                        ), ('signal()'));

var trigger = s.trigger('value');
trigger(5);
infuse.assert_equal((called                         ), (1));
infuse.assert_equal((s.size()                       ), (1));
infuse.assert_equal((s.tos()                        ), ('signal(5, value)'));

// If `s` were a future, it would be finalized; but because it's a signal it can
// still get new values. For example:

trigger(5);
infuse.assert_equal((s.tos()                        ), ('signal(5, value)'));
infuse.assert_equal((called                         ), (2));

// If you're using a signal to represent an event, then you'll probably want to
// handle error cases somehow. To do that, we just create another trigger:

var ohnoes = s.trigger('error');
infuse.assert_equal((errors                         ), (0));
ohnoes('something bad happened');
infuse.assert_equal((errors                         ), (1));
infuse.assert_equal((s.tos()                        ), ('signal(something bad happened, error)'));

// Earlier we called `s.group`, constructing a derivative multiobject. Even though
// futures update asynchronously, the grouped index is kept up-to-date (this time
// using push-updating instead of pull-updating):

infuse.assert_equal((grouped.get('value').join(',') ), ('5,5'));
infuse.assert_equal((grouped.get('error').join(',') ), ('something bad happened'));
infuse.assert_equal((grouped.size()                 ), (3));

// One cool thing we can do with signals is reduce them. A future takes on a
// series of values over time, so we can build a new signal whose values represent
// an accumulation. For example:

var g = s.reductions(0, '_1 + _2');
var g_called = 0;

g.on('value', function (x) {++g_called});

infuse.assert_equal((g_called                       ), (0));
infuse.assert_equal((g.size()                       ), (0));

trigger(1);
infuse.assert_equal((g.size()                       ), (1));
infuse.assert_equal((g.get()                        ), (1));
infuse.assert_equal((g_called                       ), (1));

trigger(2);
infuse.assert_equal((g.get()                        ), (3));
trigger(3);
infuse.assert_equal((g.get()                        ), (6));

// When you want to free memory, you can detach a derivative signal from its base.
// This prevents it from receiving future events from that base.

g.detach();
trigger(4);
infuse.assert_equal((g.get()                        ), (6));

// You can't detach callbacks because they aren't Infuse objects (internally, the
// problem is that they have no string identifier). However, you have two options
// for working around this. One is to use `once` instead of `on`, which works if
// you just need the first event. The other is to create a derivative signal that
// triggers the anonymous callbacks.

var once_called = 0;
g.once('value', function (x) {
infuse.assert_equal((  ++once_called                ), (1));
infuse.assert_equal((  x                            ), (10));
});

g.push(10, 'value');
infuse.assert_equal((once_called                    ), (1));
infuse.assert_equal((g.get()                        ), (10));

g.push(15, 'value');
infuse.assert_equal((once_called                    ), (1));
infuse.assert_equal((g.get()                        ), (15));

// We didn't detach the grouped multiobject, so we still have it:

infuse.assert_equal((grouped.size()                 ), (7));
infuse.assert_equal((grouped.get('value').join(',') ), ('5,5,1,2,3,4'));

// You can get a future from a signal by invoking `once` with no callback:

var future = g.once();
infuse.assert_equal((future.get()                   ), (null));
infuse.assert_equal((g.push(6).get()                ), (6));
infuse.assert_equal((future.get()                   ), (6));
infuse.assert_equal((g.push(7).get()                ), (7));
infuse.assert_equal((future.get()                   ), (6));

// You can also specify a keygate, in which case the first matching event will
// trigger the future:

var future2 = g.once('foo bar');
infuse.assert_equal((future2.get()                  ), (null));
g.push(5, 'banana');
infuse.assert_equal((future2.get()                  ), (null));
g.push(5, 'foo');
infuse.assert_equal((future2.get()                  ), (5));

// Like futures, signals support flatmapping. However, be careful: flatmapping
// signals will most likely cause a space leak and is probably not what you want
// to do. If you do need to flatmap a signal, you should demote the inner one into
// a future by calling `once`. I'm doing it the wrong way below to illustrate what
// happens:

var sig1 = $i.signal();
var sig2 = null;
var both = sig1.flatmap(function (v) {
  sig2 = $i.signal();
  return sig2.map('_ + v', {v: v});
});

var calls = 0;
both.on(null, function () {++calls});

infuse.assert_equal((both.get()                     ), (null));
infuse.assert_equal((sig1.push(3).get()             ), (3));
infuse.assert_equal((both.get()                     ), (null));
infuse.assert_equal((sig2.get()                     ), (null));

infuse.assert_equal((sig2.push(4).get()             ), (4));
infuse.assert_equal((both.get()                     ), (7));
infuse.assert_equal((calls                          ), (1));

// Here's what I mentioned earlier about the space leak:

var old_sig2 = sig2;
sig1.push(5);                   // this changes the value of sig2
sig2.push(5);                   // the new sig2
infuse.assert_equal((both.get()                             ), (10));
infuse.assert_equal((calls                                  ), (2));

old_sig2.push(5);
infuse.assert_equal((both.get()                             ), (8));
infuse.assert_equal((calls                                  ), (3));

// At this point, `both` will get asynchronous updates from the old `sig2` and the
// new `sig2` in whatever order they occur. Worse is that the old signals aren't
// detached; none of the old signals will be freed until you call `detach` on
// `both`.
// Generated by SDoc

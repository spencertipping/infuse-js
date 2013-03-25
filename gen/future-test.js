// Infuse futures.
// See also the [Infuse future source](future-src.md).

// Encapsulated callbacks! For example:

var f      = $i.future();
var called = false;

f.on('value', function (x) {
infuse.assert_equal((  x                            ), (5));
  called = true;
});

infuse.assert_equal((called                         ), (false));
infuse.assert_equal((f.tos()                        ), ('future()'));

var trigger = f.trigger('value');
trigger(5);
infuse.assert_equal((called                         ), (true));
infuse.assert_equal((f.tos()                        ), ('future(5, value)'));

// At this point, `f` is finalized; we can't change its value. But we can still
// construct derivatives of it:

var g = f.map('_ + 1');
infuse.assert_equal((g.tos()                        ), ('#future(6, value)'));
g.on('value', function (x) {
infuse.assert_equal((  x                            ), (6));
});

// And we can get its value directly:

infuse.assert_equal((f.get()                        ), (5));
infuse.assert_equal((g.get()                        ), (6));

// Futures also support flat-mapping, which lets you compose asynchronous
// computation:

var f = $i.future();
var g = $i.future();

var got_first  = false;
var got_second = false;

var both = f.flatmap(function (v) {
  got_first = true;
  return g;
});

infuse.assert_equal((f.tos()                        ), ('future()'));
infuse.assert_equal((g.tos()                        ), ('future()'));
infuse.assert_equal((both.tos()                     ), ('#future()'));

g.on(null, function (v) {got_second = true});
f.push('foo');
infuse.assert_equal((f.tos()                        ), ('future(foo)'));
infuse.assert_equal((f.get()                        ), ('foo'));
infuse.assert_equal((g.get()                        ), (null));
infuse.assert_equal((both.get()                     ), (null));
infuse.assert_equal((got_first                      ), (true));
infuse.assert_equal((got_second                     ), (false));

g.push('bar');
infuse.assert_equal((g.tos()                        ), ('future(bar)'));
infuse.assert_equal((g.get()                        ), ('bar'));
infuse.assert_equal((both.tos()                     ), ('future(bar)'));
infuse.assert_equal((both.get()                     ), ('bar'));
infuse.assert_equal((got_first                      ), (true));
infuse.assert_equal((got_second                     ), (true));

// Generated by SDoc

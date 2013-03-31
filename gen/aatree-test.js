// AA trees.
// Infuse uses AA trees as priority queues and update journals. They collect
// key/value pairs and emit them in key-sorted order. So, for example:

var t = $i.aatree();
t.push('foo', 1);

// AA trees keep cached first/last pointers so you can use them as priority
// queues.

infuse.assert_equal((t.first()                              ), ('foo'));
infuse.assert_equal((t.last()                               ), ('foo'));

t.push('bar', 2);       // 2 sorts after 1, so 'bar' should be last
infuse.assert_equal((t.first()                              ), ('foo'));
infuse.assert_equal((t.last()                               ), ('bar'));
t.push('bif', 3);
infuse.assert_equal((t.first()                              ), ('foo'));
infuse.assert_equal((t.last()                               ), ('bif'));
t.push('baz', 4);
infuse.assert_equal((t.first()                              ), ('foo'));
infuse.assert_equal((t.last()                               ), ('baz'));

infuse.assert_equal((t.lookup(1)                            ), ('foo'));
infuse.assert_equal((t.lookup(2)                            ), ('bar'));
infuse.assert_equal((t.lookup(3)                            ), ('bif'));
infuse.assert_equal((t.lookup(4)                            ), ('baz'));

t.remove(1);
infuse.assert_equal((t.first()                              ), ('bar'));
infuse.assert_equal((t.last()                               ), ('baz'));
t.remove(3);
infuse.assert_equal((t.first()                              ), ('bar'));
infuse.assert_equal((t.last()                               ), ('baz'));
t.remove(4);
infuse.assert_equal((t.first()                              ), ('bar'));
infuse.assert_equal((t.last()                               ), ('bar'));
t.remove(2);
infuse.assert_equal((t.first()                              ), (null));
infuse.assert_equal((t.last()                               ), (null));

// In general, trees behave just like always-sorted collections. That is:

for (var i = 2; i < 128; ++i) {
  var t  = $i.aatree();
  var xs = [];

  for (var j = 0, x; j < i; ++j) {
    x = Math.random() * 10000 >>> 0;
    xs.push(x);
    t.push(j, x);
  }

  for (var j = 0; j < i; ++j) {
    var sorted = xs.slice().sort(function (a, b) {return a - b});
infuse.assert_equal((    t.kfirst()                         ), (sorted[0]));
infuse.assert_equal((    t.klast()                          ), (sorted[sorted.length - 1]));

    var cut = Math.random() * xs.length >>> 0;
    t.remove(xs[cut]);
    xs.splice(cut, 1);
  }
}

// Generated by SDoc

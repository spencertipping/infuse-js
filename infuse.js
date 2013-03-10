// Infuse core | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// All Infuse objects support a large set of core methods. Many of these methods
// are implemented in terms of other, type-specific methods; for example, `each`
// is a type-specific method that is used for `all` and `any`. This file defines
// the global `infuse` function and the mechanism used to define type-specific
// infuse implementations.

(function () {
  var original_infuse = typeof infuse !== typeof void 0 ? infuse : undefined;

  var dispatcher = function (name) {
    var result = function (x) {
      for (var xs = result.alternatives, i = xs.length - 1, t; i >= 0; --i)
        if ((t = xs[i]).accepts.apply(t, arguments))
          return t.construct.apply(t, arguments);
      throw new Error(
        name + '(' + Array.prototype.slice.call(arguments).join(', ')
             + ') is not supported (no alternative accepted the supplied '
             + 'arguments)');
    };

    result.alternatives = [];
    return result;
  };

  var infuse_global = dispatcher('infuse');
  infuse_global.dispatcher = dispatcher;

  infuse_global.hide = function () {
    infuse = original_infuse;
    original_infuse = null;
    delete infuse_global.hide;
    return infuse_global;
  };

  infuse_global.unloaders = [];
  infuse_global.unload = function () {
    for (var xs = infuse_global.unloaders, i = 0, l = xs.length; i < l; ++i)
      xs[i]();
  };

  infuse = infuse_global;
})();

infuse.extend = function (body) {
  return body.call(infuse, infuse, infuse.prototype) || infuse;
};

infuse.extend(function (infuse) {

// Infuse function instantiation.
// We don't really advertise this because it isn't generally useful, but you can
// instantiate the global Infuse object as a class to enable prototype
// inheritance. Infuse uses this internally when you define new types.

var as_ctor = {};
infuse.alternatives.push(
  {accepts:   function (x) {return x === as_ctor},
   construct: function ()  {}});

// Methods and type definition.
// All global methods are installed on `infuse.prototype`. Subclasses then inherit
// from `infuse` using the usual Javascript inheritance pattern.

infuse.type = function (name, body) {
  var ctor = infuse[name] = function () {
    if (this.constructor !== ctor) {
      var result = new ctor();
      result.initialize.apply(result, arguments);
      return result;
    }
  };
  (ctor.prototype = new infuse(as_ctor)).constructor = ctor;
  return body.call(ctor, ctor, ctor.prototype) || ctor;
};

});

// Generated by SDoc
// Infuse utilities | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module defines global functions on the `infuse` global.

infuse.extend(function (infuse) {

infuse.toa   = function (xs)    {return Array.prototype.slice.call(xs)};
infuse.slice = function (xs, n) {return Array.prototype.slice.call(xs, n)};

infuse.fnarg = function (args, i) {
  // Make a function from arguments[i] and beyond. O(n) in the number of
  // arguments, though in most cases the GC overhead probably outweighs the
  // complexity.
  return infuse.fn.apply(this, infuse.slice(args, i));
};

infuse.assert = function (x, message) {
  if (!x) throw new Error(message);
  return x;
};

infuse.assert_equal = function (x, y) {
  infuse.assert(x === y, x + ' != ' + y);
  return x;
};

});

// Generated by SDoc
// Infuse heapmap | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// A fairly trivial minheap-map implementation used by the cache as a priority
// queue. This heap stores objects independently from their priorities, so you can
// update an object's priority dynamically and it will heapify up or down
// accordingly.

// Note that **heaps are not real Infuse objects** in that they are inherently
// mutable. This means that you can't make derivatives of them, so all of the
// usual transformation methods will fail if you use them with heaps.

// Performance.
// Heap maps have the following performance characteristics:

// Method       | worst-time | amortized time | ephemeral | persistent | amortized
// :-----       | :--------: | :------------: | :-------: | :--------: | :-------:
// `size`       | O(1)       | O(1)           | O(0)      | O(0)       | O(0)
// `derivative` | O(1)       | O(1)           | O(1)      | O(0)       | O(0)
// `force`      | O(k log n) | O(k log n)     | O(k)      | O(k)       | O(k)
// `touch`      | Θ(n)       | Θ(n)           | O(n)      | O(k)       | O(k)
// `each`       | Θ(n)       | Θ(n)           | O(1)      | O(0)       | O(0)
// `keys`       | Θ(n)       | Θ(n)           | Θ(n)      | O(0)       | O(0)
// `values`     | O(n)       | O(1)           | O(0)      | O(n)       | Θ(1)
// `cursor`     | O(1)       | O(1)           | O(n)      | O(0)       | O(0)
// `get`        | O(1)       | O(1)           | O(0)      | O(0)       | O(0)
// **Custom**   |            |                |           |            |
// `push`       | O(log n)   | O(log n)       | Θ(1)      | Θ(1)       | Θ(1)
// `pop`        | O(log n)   | O(log n)       | Θ(0)      | Θ(-1)      | Θ(-1)
// `first`      | Θ(k)       | Θ(k)           | Θ(k)      | O(0)       | O(0)

infuse.extend(function (infuse) {
infuse.type('heapmap', function (heapmap, methods) {

// Heap state.
// A heap stores the ordering function, which takes two elements and returns true
// if the first should be above the second (so for a minheap, `a < b`). It also
// contains the element set, an internal map that keeps track of where each
// element is stored in the array, and, of course, a version.

// Heapmaps are maps, so you can't store arbitrary data in them (well, you can,
// but then the map will break). If you want the map functionality, then the data
// you're storing must be a string.

methods.initialize = function (above) {
  // Default to a minheap of numeric/comparable things.
  this.above_     = above ? infuse.fn(above) : function (a, b) {return a < b};
  this.elements_  = [];
  this.positions_ = {};
};

methods.size = function () {return this.elements_.length};

// Derivatives.
// All derivative methods are disabled because heapmaps are too mutable to
// sensibly transform them.

methods.derivative = function (generator) {
  throw new Error('infuse: cannot create derivative of a heap');
};

methods.force = function (n) {
  throw new Error('infuse: cannot force a heap');
};

methods.touch = function () {return this};

// Traversal.
// Heapmaps behave like Infuse objects, but the traversal order depends on the
// layout of the heap.

methods.each = function () {
  var f = infuse.fn.apply(this, arguments);
  for (var xs = this.elements_, i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i].k, i) === false) break;
  return this;
};

methods.get = function (k) {
  var map = this.positions_;
  return Object.prototype.hasOwnProperty.call(map, k)
    ? this.elements_[map[k]].v
    : infuse.fn.apply(this, arguments)(this);
};

methods.peek = function () {
  var xs = this.elements_;
  if (!xs.length) return void 0;
  return xs[0].k;
};

methods.pop = function () {
  var xs  = this.elements_,
      map = this.positions_;
  if (!xs.length) return void 0;      // can't pop an empty heap
  var first = xs[0];
  xs[0] = xs.pop();                   // standard last->first...
  this.heapify_down_(0);              // then heapify down
  map[xs[0].k] = 0;                   // update position map
  delete map[first.k];
  return first.k;
};

methods.push = function (k, v) {
  var xs  = this.elements_,
      map = this.positions_;
  if (Object.prototype.hasOwnProperty.call(map, k)) {
    // Update, not insert. Change the value, then heapify up or down
    // depending on the value ordering.
    var i          = map[k],
        x          = xs[i],
        original_v = x.v;
    x.v = v;
    return this.above_(v, original_v)
      ? this.heapify_up_(i)
      : this.heapify_down_(i);
  } else {
    // Insert. This is the easy case: build a new container, add to end of
    // elements, and heapify up.
    var l = xs.length;
    xs.push({k: k, v: v});
    map[k] = l;
    return this.heapify_up_(l);
  }
};

methods.swap_ = function (i, j) {
  var xs  = this.elements_,
      map = this.positions_,
      tmp = xs[i];
  xs[i] = xs[j];                      // swap the elements
  xs[j] = tmp;
  map[xs[i].k] = i;                   // update position map
  map[xs[j].k] = j;
  return this;
};

methods.heapify_down_ = function (i) {
  var xs = this.elements_;
  if (i << 1 >= xs.length)
    // Can't heapify down beyond the bottom of the heap
    return this;

  // Swap with the greater of the two children unless the current element is
  // greater than both.
  var left  = i << 1,
      right = left | 1,
      xi    = xs[i].v,
      xl    = xs[left].v,
      xr    = xs[right];      // this might not exist

  if (this.above_(xi, xl) && (!xr || this.above_(xi, xr.v)))
    // We're done; neither child is greater.
    return this;

  // Swap with the greater of the two children.
  var swap_index = !xr || this.above_(xl, xr.v) ? left : right;
  return this.swap_(i, swap_index).heapify_down_(swap_index);
};

methods.heapify_up_ = function (i) {
  var xs = this.elements_,
      up = i >>> 1;

  return i && this.above_(xs[i].v, xs[up].v)
    ? this.swap_(i, up).heapify_up_(up)
    : this;
};

});
});

// Generated by SDoc
// Infuse caches | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module defines various kinds of caches for Infuse. These are used
// internally in cases where a weak reference map would ordinarily be used; for
// instance, caching compiled functions.

infuse.extend(function (infuse) {

infuse.cache = function (eviction_strategy) {
  var cache = {},       // cache data
      state = {};       // eviction strategy state
  eviction_strategy = eviction_strategy || infuse.cache.lru();
  var result = function (obj, generate) {
    return eviction_strategy(result, cache, state, obj, generate);
  };
  result(null, null);   // initialize the cache
  return result;
};

// Eviction strategies.
// An eviction strategy is notified whenever an entry is created, accessed, added,
// or removed from the cache. It then, potentially asynchronously, acts on the
// cache object to evict something if necessary. The eviction strategy owns the
// cache object exclusively; no user of the cache has access to it.

//   LRU eviction.
//   This is the most straightforward. We just keep a simple mapping from key to
//   access-time, and maintain a priority queue of evictable elements. This makes
//   cache access O(log n) in the number of elements, which is bounded above by
//   the cache capacity.

//   LRU eviction allows the user to evict an element at any point by calling the
//   `evict_one` method on the cache object. This can be useful if you want to
//   simulate weak references by slowly freeing memory over time, for instance.

  infuse.cache.lru = function (options) {
    options = options || {};
    var capacity = options.capacity || 1000,
        evict    = function (cache, state) {
          // Do nothing if there are no elements.
          if (!state.size) return false;
          --state.size;
          return delete cache[state.priority_queue.pop()];
        },
        clear    = function (cache, state) {
          for (var k in cache) delete cache[k];
          while (state.priority_queue.size()) state.priority_queue.pop();
          state.size = 0;
        };

    return function (f, cache, state, key, generate) {
      // Initialize the state if necessary. This happens before any objects are
      // inserted into the cache.
      if (key === null && generate === null) {
        state.size           = 0,
        state.access_counter = 0,
        state.priority_queue = infuse.heapmap(),
        f.hits               = 0,
        f.evictions          = 0,
        f.misses             = 0,
        f.evict_one          = function () {return evict(cache, state)},
        f.clear              = function () {return clear(cache, state)};
        return null;
      }

      // Prefix the key with something not used by Javascript. Otherwise we
      // risk colliding with native methods like Object.prototype.toString.
      key = '@' + key;

      // First, determine whether we have the item. If we do, just update the
      // access time and take no further action.
      var hit = cache[key];
      if (hit) {
        ++f.hits;
        state.priority_queue.push(key, ++state.access_counter);
        return hit;
      }

      // Cache miss, so go ahead and generate a value and insert the result.
      // If we're over capacity, evict the least-recent access, which will be
      // the top element in the priority queue.
      var value = generate(key);
      ++f.misses;
      if (++state.size > capacity) {
        ++f.evictions;
        evict(cache, state);
      }
      state.priority_queue.push(key, ++state.access_counter);
      return cache[key] = value;
    };
  };

});

// Generated by SDoc
// Infuse function promotion | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// Javascript's function syntax is verbose, so Infuse supports implicit function
// promotion. This means that any method expecting a function can also accept
// other values like regular expressions or strings, and Infuse will produce a
// function from these other values.

// All Infuse extensions are written using `infuse.extend`. This binds a local
// variable `infuse` that won't change even if the user calls `infuse.hide()`
// (which removes the global reference).

infuse.extend(function (infuse) {

infuse.fn       = infuse.dispatcher('infuse.fn');
infuse.fn.cache = infuse.cache(infuse.cache.lru({capacity: 2048}));

infuse.fn.auto_gc = function () {
  // Automatically clear out the function cache over time. There is no reason
  // to do this very quickly, since compiled functions don't hold any large
  // references (i.e. they aren't closures over user-specified data).
  //
  // In general it isn't safe to use intervals to control caches, since the
  // interval is a global reference that will prevent the whole cache from
  // being garbage-collected. However it is reasonable in this particular case
  // because the cache is already a global object.
  infuse.fn.cache_interval = setInterval(infuse.fn.cache.evict_one, 1000);

  infuse.unloaders.push(function () {
    clearInterval(infuse.fn.cache_interval);
  });
};

// Regular expressions.
// Regular expression functions return either a match object (for regexps with
// no capturing groups), or strings (for regexps with one or more capturing
// groups).

// | infuse.fn(/foo/)      -> function (x) {return /foo/.exec(x)}
//   infuse.fn(/f(o)o/)    -> function (x) {
//                              var result = /f(o)o/.exec(x);
//                              return result && result[1];
//                            }

// Regexps are most useful when used on sequences of strings:
// `infuse(...).map(/f(.)o/)`.

infuse.fn.alternatives.push(
  {accepts:   function (x) {return x.constructor === RegExp},
   construct: function (regexp) {
     return infuse.fn.regexp_group_count(regexp)
       // We have match groups; concatenate and return them as a single
       // string.
       ? function (x) {
           var result = regexp.exec(x);
           return result && Array.prototype.slice.call(result, 1).join("");
         }

       // No match groups; just return the matchdata object.
       : function (x) {return regexp.exec(x)};
   }});

infuse.fn.regexp_group_count = function (regexp) {
  // Simple regexp parse: look for unescaped open-parens that aren't followed
  // by ?.
  for (var s = regexp.toString(),  groups     = 0,     group_check = -1,
           l = s.lastIndexOf('/'), escape     = false,
           i = 1,                  char_class = false, c;
       i < l; ++i) {
    c = s.charCodeAt(i);
    if      (escape)   escape = false;
    else if (c === 92) escape = true;                         // 92 = \
    else if (c === 93) char_class = false;                    // 93 = ]
    else if (char_class);
    else if (c === 91) char_class = true;                     // 91 = [
    else if (c === 40) group_check = i + 1, ++groups;         // 40 = (
    else if (i === group_check && c === 63) --groups;         // 63 = ?
  }
  return groups;
};

// Strings.
// There are two possibilities for strings. If the string begins with `[` or
// `.`, then it's assumed to be an object traversal path; otherwise it's
// compiled into a function. In the latter case, a second argument can be
// specified to bind closure variables. Function compilation is expensive, so we
// use the function cache to prevent unnecessary recompilation.

infuse.fn.is_path = function (s) {return /^[\.\[]/.test(s)};
infuse.fn.is_js   = function (s) {return /^[-+\/~!$\w([{'"]/.test(s)};

infuse.fn.alternatives.push(
  {accepts:   function (x) {return x.constructor === String
                                && infuse.fn.is_path(x)},
   construct: function (s) {
     return infuse.fn.cache(s, function () {
       var path = infuse.inversion.parse_path(s);
       return function (x) {
         return infuse.inversion.at(path, x);
       };
     });
   }});

infuse.fn.alternatives.push(
  {accepts:   function (x) {return x.constructor === String
                                && infuse.fn.is_js(x)},
   construct: function (s, bindings) {
     // Function body case: prepend local variables in sorted order to make
     // sure that shadowing cases are distinct in the cache. We don't cache
     // the fully-instantiated closure; instead, we allocate a new closure
     // specific to the bindings that we have.
     return infuse.fn.cache(infuse.fn.binding_prefix(bindings) + s,
       function () {
         // The bindings passed to compile() are just for reference so that
         // compile() can bake in the right local variables ...
         return infuse.fn.compile(s, bindings);
       })(bindings);          // ... and this is where we pass them in.
   }});

// Function compilation.
// Compile a function with a list of bindings. This involves converting each
// binding key into a local variable.

infuse.fn.binding_prefix = function (bindings) {
  if (!bindings) return '';
  var bindings = [];
  for (var k in bindings)
    if (Object.prototype.hasOwnProperty.call(bindings, k))
      bindings.push(k);
  return bindings.sort().join(',') + ':';
};

infuse.fn.body_arity = function (body_string) {
  // Find the underscore-variable with the largest subscript. We support up to
  // _9, where _1 (also called _) is the first argument.
  for (var formals = body_string.match(/_\d?/g),
           i       = 0,
           l       = formals.length,
           max     = +!!formals.length;
       i < l; ++i)
    max = Math.max(max, +formals[i].substr(1));
  return max;
};

infuse.fn.compile = function (code, bindings) {
  var locals = [], formals = [];

  // Alias each binding into a local variable.
  for (var k in bindings)
    if (Object.prototype.hasOwnProperty.call(bindings, k))
      locals.push('var ' + k + ' = _.' + k + ';\n');

  // Now build the list of formals.
  for (var i = 0, l = infuse.fn.body_arity(code); i < l; ++i)
    formals.push('_' + (i + 1));

  return new Function(
    '_',
    locals
    + 'return function (' + formals.join(', ') + ') {\n'
      + (formals.length ? 'var _ = _1;\n' : '')
      + 'return ' + code + ';\n'
    + '};');
};

// Functions.
// If we omit this, then it becomes impossible to pass in regular functions as
// functions. Putting it at the end makes it a little faster for the no-conversion
// fast case.

infuse.fn.alternatives.push(
  {accepts:   function (x) {return x instanceof Function},
   construct: function (x) {return x}});

});

// Generated by SDoc
// Infuse arrays | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Infuse arrays.
// Infuse gives you two options for working with arrays. You can promote an
// existing array, in which case the `force()` method will provide no new data and
// will throw an error. Alternatively, you can invoke `infuse.array()` on a
// generator function to create an array-backed lazy sequence. If you do this,
// `force()` will add elements to the end of the array if any are available.

// A secondary consequence of using a generator function is that derivative
// arrays, objects, etc, are themselves lazy. In these cases, forcing derivative
// `map`, `filter`, etc results will cause more elements to be dynamically
// generated and transformed accordingly. (Internally this happens when the `pull`
// method is called.)

infuse.extend(function (infuse) {
infuse.type('array', function (array, methods) {

// Array state.
// Every Infuse array is backed by a Javascript array. If the backing was provided
// as a constructor argument, then we aren't allowed to modify it; so the sequence
// is considered to be definite and can't have a generator.

// Otherwise the sequence is a generated array, in which case we allocate a
// private backing and fill it as the user forces things.

methods.initialize = function (xs_or_f, base) {
  if (xs_or_f instanceof Function)
    this.xs_        = [],
    this.base_      = base,
    this.generator_ = xs_or_f,
    this.version_   = 0;
  else
    this.xs_        = xs_or_f instanceof Array
                      ? xs_or_f
                      : infuse.toa(xs_or_f),
    this.base_      = null,
    this.generator_ = null,
    this.version_   = 1;
};

// Size is always expressed as the number of items currently realized, not the
// eventual size of a lazy sequence. Any given lazy sequence will be both finite
// (as its size is finite) and indefinite at the same time, and operations such as
// `map` and `flatmap` will apply eagerly to the currently-realized part.

methods.size = function () {return this.pull().xs_.length};

// Derivatives.
// Laziness requires that we pass on certain metadata about the base whenever we
// construct any derivative. To do this, we have the derivative link to its base
// so that any new elements on the base can be transformed accordingly.

methods.derivative = function (generator) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.array(f, this);
};

// Forcing requests that elements be computed, up to the specified number of
// updates. The result may be smaller than `n` if fewer elements are available,
// and if no elements are added then the version remains the same. If `n` is
// unspecified, it defaults to 32.

methods.force = function (n) {
  infuse.assert(this.generator_,
    'infuse: attempted to generate new elements for a non-derivative array');
  if (n === void 0) n = 32;
  for (var xs      = this.xs_,
           start_n = n + 1,
           start_l = xs.length,
           emit    = function (x) {xs.push(x); return --n > 0};
       start_n > (start_n = n);)
    this.generator_(emit);
  return xs.length > start_l ? this.touch() : this;
};

methods.push = function (v) {
  infuse.assert(!this.base_, 'infuse: attempted to modify a derivative array');
  this.xs_.push(v);
  return this.touch();
};

// Key/value querying.
// Methods to build out lists of keys and values. The `values` case is
// particularly simple: we just return the current object. `keys` is unfortunate
// and inefficient for arrays, so you probably shouldn't use it. If you do use it
// repeatedly, be sure to cache the result to avoid unnecessary recomputation.

methods.keys = function () {
  for (var r = [], i = 0, l = this.size(); i < l; ++i) r.push(i);
  return infuse.array(r);
};

methods.values = function () {return this};

// Traversal.
// Infuse uses the `each` method to implement a number of other things, so it has
// a minimal protocol: the iterator function can return `false` to break out of
// the loop. We're required to provide an implementation.

methods.each = function () {
  this.pull();
  var f = infuse.fn.apply(this, arguments);
  for (var xs = this.xs_, i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i], i) === false) break;
  return this;
};

// Similar to `each` is `cursor`, which returns a closure that runs over each item
// in the array exactly once. It runs eagerly but doesn't force anything.

methods.cursor = function () {
  var i = 0, self = this;
  return function (f) {
    for (var xs = self.pull().xs_, l = xs.length; i < l;)
      // It's important to do the increment here so that it happens even if we
      // break out of the loop.
      if (f(xs[i], i++) === false) break;
  };
};

// Retrieval.
// Technically we just need to implement `get` here. `first` and `last` can, in
// theory, be derived from `each`, `size`, and `get`. However, doing things that
// way is inefficient for arrays because we have direct access to the elements.

methods.get = function (n, fn) {
  var xs = this.pull().xs_;

  // get() -> the current backing array (don't modify this!)
  if (n === void 0) return xs;

  // get(n) -> xs[n] or xs[n + length] if n is negative
  if (typeof n === typeof 0 || n instanceof Number)
    if (n === n >> 0)
      // n is an integer; use direct indexing (but wrap if negative)
      return xs[n < 0 ? xs.length + n : n];
    else {
      // n is a float; use interpolation.
      var f  = arguments.length > 1
               ? infuse.fnarg(arguments, 1)
               : function (a, b, x) {return a + (b-a)*x},
          i1 = (n < 0 ? xs.length : 0) + Math.floor(n),
          i2 = i1 + 1,
          x  = n - i1;
      return f(xs[i1], xs[i2], x);
    }

  // get([x1, x2, x3, ...]) = [get(x1), get(x2), ...]
  if (n instanceof Array) {
    for (var r = [], i = 0, l = xs.length; i < l; ++i) r.push(this.get(xs[i]));
    return r;
  }

  // get(...) = fn(...)(this)
  return infuse.fn.apply(this, arguments)(this);
};

methods.first = function (n) {
  var xs = this.get();

  // first() -> the single first element
  if (n === void 0) return xs[0];

  // first(n) -> infuse([x0, x1, ..., xn-1])
  if (typeof n === typeof 0 || n instanceof Number)
    return infuse.array(xs.slice(0, n < 0 ? xs.length + n : n));

  // first(f) -> the first element that satisfies f, or null
  var f = infuse.fn.apply(this, arguments);
  for (var i = 0, l = xs.length; i < l; ++i)
    if (f(xs[i], i)) return xs[i];
  return null;
};

methods.last = function (n) {
  var xs = this.get(),
      xl = xs.length;

  // last() -> the single last element
  if (n === void 0) return xs[xl - 1];

  // last(n) -> infuse([xn, xn+1, ..., xl-1])
  if (typeof n === typeof 0 || n instanceof Number)
    // Check for n == 0 to save an array copy if at all possible
    return infuse.array(n === 0 ? xs : xs.slice(n < 0 ? xl + n : n));

  // last(f) -> the last element that satisfies f, or null
  var f = infuse.fn.apply(this, arguments);
  for (var i = xl - 1; i >= 0; ++i)
    if (f(xs[i], i)) return xs[i];
  return null;
};

});     // end infuse.type('array')

// Array promotion.
// This hook allows you to say `infuse([1, 2, 3])` and get back an `infuse.array`
// object.

infuse.alternatives.push(
  {accepts:   function (x) {return x instanceof Array},
   construct: function (x) {return infuse.array(x)}});

});

// Generated by SDoc
// Infuse objects | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Infuse objects.
// Like Infuse arrays, objects can be constructed either by wrapping an existing
// object or by specifying a generator function. If you specify a generator, the
// object's value (as returned by `get`, etc) will be updated as new elements
// become available.

// Infuse objects are not considered to be ordered unless you call `keys` or
// `values`. Each of these methods takes a sorted snapshot of the key list to
// guarantee traversal order; so you could request `keys` and `values` and know
// that `k[0]` corresponded to `v[0]`, for instance.

infuse.extend(function (infuse) {
infuse.type('object', function (object, methods) {

// Object state.
// Like an Infuse array, an object has a backing which may be externally
// allocated, and for internally-allocated backings it also has a generator and a
// base.

methods.initialize = function (o_or_f, base) {
  if (o_or_f instanceof Function)
    this.o_         = {},
    this.keys_      = null,
    this.base_      = infuse.assert(base,
                        'infuse: attempted to construct a lazy '
                      + 'object without specifying a base object'),
    this.generator_ = o_or_f,
    this.version_   = 0;
  else
    this.o_         = o_or_f,
    this.base_      = null,
    this.keys_      = null,
    this.generator_ = null,
    this.version_   = 1;
};

// Size is the number of distinct key/value pairs stored in the object. This
// function needs to be amortized O(1), so we rely on the backing key list.

methods.size = function () {return this.keys().size()};

// Derivatives.
// Objects can have derivatives just like arrays can, but the behavior is
// different. An object derivative means "the object will gain new key/value
// mappings in the future", much as an array derivative means "the array will grow
// in the future". So it's a partial journal of changes that will be made to the
// object.

// The main difference between the two is the degree of assumption about
// immutability. Arrays are only allowed to grow; we assume that elements already
// in the array won't change. Objects, on the other hand, might receive value
// updates for existing keys; a common case of this is when you're indexing
// something. This means that a simple array journal has the potential to be
// arbitrarily larger than the object it represents (since it's storing each
// intermediate change).

// As a result, we don't keep the journal this way. Instead, we just use an object
// that maps each key to the last version at which it was modified. Each cursor
// can then search this object and apply updates. This makes searching O(n) when
// the object has been updated, O(1) otherwise.

methods.derivative = function (generator) {
  var f = infuse.fn.apply(this, arguments);
  return infuse.object(f, this);
};

methods.force = function (n) {
  // FIXME
  for (var o        = this.o_,
           got_data = true,
           got_any  = false,
           emit     = function (v, k) {--n;
                                       got_data = true;
                                       o[k]     = v};
       n > 0 && got_data;
       got_any = got_any || got_data, got_data = false)
    this.generator_(emit);
  return got_any ? this.touch() : this;
};

methods.push = function (v, k) {
  infuse.assert(!this.base_, 'infuse: attempted to modify a derivative object');
  var o = this.o_;
  if (!Object.prototype.hasOwnProperty.call(o, k)) this.keys_.push(k);
  this.touch().o_[k] = v;
  return this;
};

// Key/value querying.
// Keys and values are fairly straightforward to generate. We generally have the
// keys array already, so we can just return a wrapper for it if we do. Otherwise
// we generate it once on-demand.

methods.keys = function () {
  var ks = this.pull().keys_;
  if (!ks) {
    var o = this.o_;
    ks = this.keys_ = infuse.array([]);
    for (var k in o)
      if (Object.prototype.hasOwnProperty.call(o, k))
        ks.push(k);
  }
  return ks;
};

methods.values = function () {
  // We generate this as a derivative of the key array.
  var vs = this.pull().values_;
  if (!vs) {
    var o = this.o_;
    vs = this.values_ = this.keys().map(function (k) {return o[k]});
  }
  return vs.pull();
};

// Traversal.
// Always go through the object in the same order.

methods.each = function (fn) {
  var ks = this.keys().get(),
      o  = this.o_,
      f  = infuse.fn.apply(this, arguments);
  for (var i = 0, l = ks.length, k; i < l; ++i)
    if (Object.prototype.hasOwnProperty.call(o, k = ks[i])
        && f(o[k], k) === false)
      break;
  return this;
};

// Object values don't change; like arrays, objects are append-only, so the most
// that can happen is that any given key gets updated. Because of this, cursors
// can act on the key array directly.

methods.cursor = function () {
  var i = 0, o = this.o_, keys = this.keys();
  return function (f) {
    for (var ks = keys.get(), l = ks.length, k; i < l;)
      if (Object.prototype.hasOwnProperty.call(o, k = ks[i++])
          && f(o[k], k) === false)
        break;
  };
};

// Retrieval.
// Objects don't support `first` or `last`, but they do support `get`, which takes
// a string or array of strings.

methods.get = function (k) {
  var o = this.pull().o_;

  // get() -> the current backing object (don't modify this!)
  if (k === void 0) return o;

  // get(k) -> o[k]
  if ((typeof k === typeof '' || k instanceof String) &&
      Object.prototype.hasOwnProperty.call(o, k))
    return o[k];

  // get([k1, k2, ...]) = [get(k1), get(k2), ...]
  if (n instanceof Array) {
    for (var r = [], i = 0, l = xs.length; i < l; ++i) r.push(this.get(xs[i]));
    return r;
  }

  // get(...) = fn(...)(this)
  return infuse.fn.apply(this, arguments)(this);
};

});

// Object promotion.
// Detecting a vanilla object turns out to be tricky. We can't do the obvious `x
// instanceof Object` because everything is an instance of `Object`. Long story
// short, we have to rely on `Object.prototype.toString` to tell us.

var obj_to_string = Object.prototype.toString.call({});
infuse.alternatives.push(
  {accepts:   function (x) {return Object.prototype.toString.call(x) ===
                                   obj_to_string},
   construct: function (x) {return infuse.object(x)}});

});

// Generated by SDoc
// Infuse methods | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// This module defines most of the methods that are common to all Infuse types.
// Each of the methods defined here is based on implementations of a few required
// generic methods:

// | obj.each(f)           f(x1), f(x2), ...
//   obj.cursor()
//   obj.size()            must be a finite nonnegative integer
//   obj.get(n)            0 <= n < size
//   obj.force(n)          0 <= n
//   obj.derivative(f)     f is a generator function
//   obj.push(v, k)

// Forcing may throw an error for certain types, limiting the set of operations
// that they support.

infuse.extend(function (infuse, methods) {

// Versions and derivatives.
// There are some default implementations of things like `touch` and `pull`, which
// are generally straightforward. However, some types override them to increase
// efficiency (e.g. `infuse.object`).

methods.touch = function () {
  // Unconditionally assume a change of some sort. Don't call this method
  // unless you actually change something!
  ++this.version_;
  return this;
};

methods.pull = function () {
  // Does nothing if we have no base.
  var b = this.base(),
      v = b && b.pull().version();
  if (v && v > this.version_) this.force(b.size()).version_ = v;
  return this;
};

methods.base    = function () {return this.base_};
methods.version = function () {return this.version_};

methods.detach = function () {
  // This is simple enough: just free references to the generator function and
  // the base object. After this, push() will see that base_ is null and won't
  // complain if you try to change the object.
  this.base_ = this.generator_ = null;
  return this;
};

// Sequence transformations.
// The usual suspects: `map`, `flatmap`, etc. These apply to all data types based
// on the semantics of `derivative` and `cursor`.

methods.map = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {emit(f(v, k), k)});
  });
};

methods.flatmap = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {infuse(f(v, k)).each(emit)});
  });
};

methods.filter = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {if (f(v, k)) emit(v, k)});
  });
};

methods.mapfilter = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {
      var y = f(v, k);
      if (y) emit(y, k);
    });
  });
};

// Reductions.
// Most systems treat reductions as being generic across lazy and strict
// sequences. Infuse can't do this, however, because some sequences are push-lazy
// (and besides, Javascript isn't idiomatically lazy enough to have pull-lazy
// sequences and lazy right-folds anyway).

// As a result, we implement two forms of `reduce`. The eager one, `reduce`,
// returns a final answer that is not wrapped in an Infuse object, while the lazy
// one, `reductions`, returns a result whose value may be updated as the
// underlying sequence gains values.

// A relevant example is the difference when dealing with futures. Suppose you
// have a future `f` that will end up delivering `5`. If you call `f.reduce(0, '_1
// + _2')` and `f` is not yet delivered, you'll get `0` back as the future is said
// to have no elements.

// If, on the other hand, you invoke `f.reductions(0, '_1 + _2')`, you'll get a
// future that is initially undelivered and then becomes `5` when the first future
// is delivered. (Reducing a signal is a little more interesting, since signal
// reductions continue to update and accumulate.)

// More intuitively, a signal is like a lazy sequence whose index is time.
// Obviously you can't faithfully reduce it in a strict way, since it doesn't have
// any kind of "last" value. So if you want to fold it up, the best you can do is
// observe it at each change point, and to do that you ask for all of its
// reductions.

methods.reductions = function (into, fn) {
  var f = infuse.fnarg(arguments, 1),
      c = this.cursor();
  return this.derivative(function (emit) {
    c(function (v, k) {emit(into = f(into, v, k), k)});
  });
};

methods.reduce = function (into, fn) {
  var f = infuse.fnarg(arguments, 1);
  this.each(function (v, k) {into = f(into, v, k)});
  return into;
};

// Indexing.
// You can group or index a sequence's values into an object. The index function
// should take an element (and optionally its key, position, whatever), and return
// a string for the index.

methods.index = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return infuse.object(function (emit) {
    c(function (v, k) {emit(v, f(v, k))});
  });
};

methods.group = function (fn) {
  var f = infuse.fn.apply(this, arguments),
      c = this.cursor();
  return infuse.multi_object(function (emit) {
    c(function (v, k) {emit(v, f(v, k))});
  });
};

});

// Generated by SDoc

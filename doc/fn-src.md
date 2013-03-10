Infuse function promotion | Spencer Tipping
Licensed under the terms of the MIT source code license

# Introduction

Javascript's function syntax is verbose, so Infuse supports implicit function
promotion. This means that any method expecting a function can also accept
other values like regular expressions or strings, and Infuse will produce a
function from these other values.

All Infuse extensions are written using `infuse.extend`. This binds a local
variable `infuse` that won't change even if the user calls `infuse.hide()`
(which removes the global reference).

```js
infuse.extend(function (infuse) {
```

```js
infuse.fn       = infuse.dispatcher('infuse.fn');
infuse.fn.cache = infuse.cache(infuse.cache.lru({capacity: 2048}));
```

```js
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
```

```js
  infuse.unloaders.push(function () {
    clearInterval(infuse.fn.cache_interval);
  });
};
```

# Regular expressions

Regular expression functions return either a match object (for regexps with
no capturing groups), or strings (for regexps with one or more capturing
groups).

    infuse.fn(/foo/)      -> function (x) {return /foo/.exec(x)}
    infuse.fn(/f(o)o/)    -> function (x) {
                               var result = /f(o)o/.exec(x);
                               return result && result[1];
                             }

Regexps are most useful when used on sequences of strings:
`infuse(...).map(/f(.)o/)`.

```js
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
```

```js
       // No match groups; just return the matchdata object.
       : function (x) {return regexp.exec(x)};
   }});
```

```js
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
```

# Strings

There are two possibilities for strings. If the string begins with `[` or
`.`, then it's assumed to be an object traversal path; otherwise it's
compiled into a function. In the latter case, a second argument can be
specified to bind closure variables. Function compilation is expensive, so we
use the function cache to prevent unnecessary recompilation.

```js
infuse.fn.is_path = function (s) {return /^[\.\[]/.test(s)};
infuse.fn.is_js   = function (s) {return /^[-+\/~!$\w([{'"]/.test(s)};
```

```js
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
```

```js
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
```

# Function compilation

Compile a function with a list of bindings. This involves converting each
binding key into a local variable.

```js
infuse.fn.binding_prefix = function (bindings) {
  if (!bindings) return '';
  var bindings = [];
  for (var k in bindings)
    if (Object.prototype.hasOwnProperty.call(bindings, k))
      bindings.push(k);
  return bindings.sort().join(',') + ':';
};
```

```js
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
```

```js
infuse.fn.compile = function (code, bindings) {
  var locals = [], formals = [];
```

```js
  // Alias each binding into a local variable.
  for (var k in bindings)
    if (Object.prototype.hasOwnProperty.call(bindings, k))
      locals.push('var ' + k + ' = _.' + k + ';\n');
```

```js
  // Now build the list of formals.
  for (var i = 0, l = infuse.fn.body_arity(code); i < l; ++i)
    formals.push('_' + (i + 1));
```

```js
  return new Function(
    '_',
    locals
    + 'return function (' + formals.join(', ') + ') {\n'
      + (formals.length ? 'var _ = _1;\n' : '')
      + 'return ' + code + ';\n'
    + '};');
};
```

# Functions

If we omit this, then it becomes impossible to pass in regular functions as
functions. Putting it at the end makes it a little faster for the no-conversion
fast case.

```js
infuse.fn.alternatives.push(
  {accepts:   function (x) {return x instanceof Function},
   construct: function (x) {return x}});
```

```js
});

```

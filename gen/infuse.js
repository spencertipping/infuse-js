// Infuse core | Spencer Tipping
// Licensed under the terms of the MIT source code license

// Introduction.
// All Infuse objects support a large set of core methods. Many of these methods
// are implemented in terms of other, type-specific methods; for example, `each`
// is a type-specific method that is used for `all` and `any`. This file defines
// the global `infuse` function and the mechanism used to define type-specific
// infuse implementations.

(function () {
  var original_infuse = typeof infuse !== typeof void 0 ? infuse : undefined,
      original_$i     = typeof $i     !== typeof void 0 ? $i     : undefined;

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
    result.accepts = function (x) {
      for (var xs = result.alternatives, i = xs.length - 1, t; i >= 0; --i)
        if ((t = xs[i]).accepts.apply(t, arguments))
          return true;
      return false;
    };

    return result;
  };

  var infuse_global = dispatcher('infuse');
  infuse_global.dispatcher = dispatcher;

  infuse_global.hide = function (all) {
    if ($i === infuse_global)
      $i = original_$i,
      original_$i = null;

    if (all && infuse === infuse_global)
      infuse = original_infuse,
      original_infuse = null;

    return infuse_global;
  };

  $i = infuse = infuse_global;
})();

// Bind a local variable so that extend() works even after hiding the global.
(function (infuse) {
  infuse.extend = function (body) {
    return body.call(infuse, infuse, infuse.prototype) || infuse;
  };
})(infuse);

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

infuse.mixins = {};
infuse.mixin = function (name, body) {
  var methods = {};
  body.call(methods, methods);

  return infuse.mixins[name] = function (proto) {
    // Mix methods into proto.
    for (var k in methods)
      if (Object.prototype.hasOwnProperty.call(methods, k))
        proto[k] = methods[k];
    return proto;
  };
};

// Infuse object passthrough.
// If you invoke `infuse()` on something that is already an Infuse object, the
// object is returned verbatim. This allows you to transparently promote
// non-Infuse objects.

infuse.alternatives.push(
  {accepts:   function (x) {return x instanceof infuse},
   construct: function (x) {return x}});

});

// Generated by SDoc

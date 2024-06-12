(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global = global || self, global.milestones = factory());
}(this, (function () {
  'use strict';

  var xhtml = 'http://www.w3.org/1999/xhtml';

  var namespaces = {
    svg: 'http://www.w3.org/2000/svg',
    xhtml: xhtml,
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace',
    xmlns: 'http://www.w3.org/2000/xmlns/',
  };

  function namespace(name) {
    var prefix = name += '', i = prefix.indexOf(':');
    if (i >= 0 && (prefix = name.slice(0, i)) !== 'xmlns') {
      name = name.slice(i + 1);
    }
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
  }

  function creatorInherit(name) {
    return function () {
      var document = this.ownerDocument,
        uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function () {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
  }

  function none() {
  }

  function selector(selector) {
    return selector == null ? none : function () {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== 'function') {
      select = selector(select);
    }

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ('__data__' in node) {
            subnode.__data__ = node.__data__;
          }
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function () {
      return this.querySelectorAll(selector);
    };
  }

  function selection_selectAll(select) {
    if (typeof select !== 'function') {
      select = selectorAll(select);
    }

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection(subgroups, parents);
  }

  function matcher(selector) {
    return function () {
      return this.matches(selector);
    };
  }

  function selection_filter(match) {
    if (typeof match !== 'function') {
      match = matcher(match);
    }

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function (child) {
      return this._parent.insertBefore(child, this._next);
    },
    insertBefore: function (child, next) {
      return this._parent.insertBefore(child, next);
    },
    querySelector: function (selector) {
      return this._parent.querySelector(selector);
    },
    querySelectorAll: function (selector) {
      return this._parent.querySelectorAll(selector);
    },
  };

  function constant(x) {
    return function () {
      return x;
    };
  }

  var keyPrefix = '$'; // Protect against keys like “__proto__”.

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
        if (keyValue in nodeByKeyValue) {
          exit[i] = node;
        } else {
          nodeByKeyValue[keyValue] = node;
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = keyPrefix + key.call(parent, data[i], i, data);
      if (node = nodeByKeyValue[keyValue]) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue[keyValue] = null;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
        exit[i] = node;
      }
    }
  }

  function selection_data(value, key) {
    if (!value) {
      data = new Array(this.size()), j = -1;
      this.each(function (d) {
        data[++j] = d;
      });
      return data;
    }

    var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

    if (typeof value !== 'function') {
      value = constant(value);
    }

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) {
            i1 = i0 + 1;
          }
          while (!(next = updateGroup[i1]) && ++i1 < dataLength) {
          }
          previous._next = next || null;
        }
      }
    }

    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_join(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    enter = typeof onenter === 'function' ? onenter(enter) : enter.append(onenter + '');
    if (onupdate != null) {
      update = onupdate(update);
    }
    if (onexit == null) {
      exit.remove();
    } else {
      onexit(exit);
    }
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge(selection) {

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) {
            next.parentNode.insertBefore(node, next);
          }
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) {
      compare = ascending;
    }

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    var nodes = new Array(this.size()), i = -1;
    this.each(function () {
      nodes[++i] = this;
    });
    return nodes;
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) {
          return node;
        }
      }
    }

    return null;
  }

  function selection_size() {
    var size = 0;
    this.each(function () {
      ++size;
    });
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) {
          callback.call(node, node.__data__, i, group);
        }
      }
    }

    return this;
  }

  function attrRemove(name) {
    return function () {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function () {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, value) {
    return function () {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS(fullname, value) {
    return function () {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction(name, value) {
    return function () {
      var v = value.apply(this, arguments);
      if (v == null) {
        this.removeAttribute(name);
      } else {
        this.setAttribute(name, v);
      }
    };
  }

  function attrFunctionNS(fullname, value) {
    return function () {
      var v = value.apply(this, arguments);
      if (v == null) {
        this.removeAttributeNS(fullname.space, fullname.local);
      } else {
        this.setAttributeNS(fullname.space, fullname.local, v);
      }
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
    }

    return this.each((value == null
      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === 'function'
        ? (fullname.local ? attrFunctionNS : attrFunction)
        : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
  }

  function styleRemove(name) {
    return function () {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, value, priority) {
    return function () {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction(name, value, priority) {
    return function () {
      var v = value.apply(this, arguments);
      if (v == null) {
        this.style.removeProperty(name);
      } else {
        this.style.setProperty(name, v, priority);
      }
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
      ? this.each((value == null
        ? styleRemove : typeof value === 'function'
          ? styleFunction
          : styleConstant)(name, value, priority == null ? '' : priority))
      : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function () {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function () {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function () {
      var v = value.apply(this, arguments);
      if (v == null) {
        delete this[name];
      } else {
        this[name] = v;
      }
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
      ? this.each((value == null
        ? propertyRemove : typeof value === 'function'
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute('class') || '');
  }

  ClassList.prototype = {
    add: function (name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute('class', this._names.join(' '));
      }
    },
    remove: function (name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute('class', this._names.join(' '));
      }
    },
    contains: function (name) {
      return this._names.indexOf(name) >= 0;
    },
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) {
      list.add(names[i]);
    }
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) {
      list.remove(names[i]);
    }
  }

  function classedTrue(names) {
    return function () {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function () {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function () {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + '');

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) {
        if (!list.contains(names[i])) {
          return false;
        }
      }
      return true;
    }

    return this.each((typeof value === 'function'
      ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = '';
  }

  function textConstant(value) {
    return function () {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function () {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? '' : v;
    };
  }

  function selection_text(value) {
    return arguments.length
      ? this.each(value == null
        ? textRemove : (typeof value === 'function'
          ? textFunction
          : textConstant)(value))
      : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = '';
  }

  function htmlConstant(value) {
    return function () {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function () {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? '' : v;
    };
  }

  function selection_html(value) {
    return arguments.length
      ? this.each(value == null
        ? htmlRemove : (typeof value === 'function'
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) {
      this.parentNode.appendChild(this);
    }
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) {
      this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === 'function' ? name : creator(name);
    return this.select(function () {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === 'function' ? name : creator(name),
      select = before == null ? constantNull : typeof before === 'function' ? before : selector(before);
    return this.select(function () {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) {
      parent.removeChild(this);
    }
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
      ? this.property('__data__', value)
      : this.node().__data__;
  }

  var filterEvents = {};

  if (typeof document !== 'undefined') {
    var element = document.documentElement;
    if (!('onmouseenter' in element)) {
      filterEvents = {mouseenter: 'mouseover', mouseleave: 'mouseout'};
    }
  }

  function filterContextListener(listener, index, group) {
    listener = contextListener(listener, index, group);
    return function (event) {
      var related = event.relatedTarget;
      if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
        listener.call(this, event);
      }
    };
  }

  function contextListener(listener, index, group) {
    return function (event1) {
      try {
        listener.call(this, this.__data__, index, group);
      } finally {
      }
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function (t) {
      var name = '', i = t.indexOf('.');
      if (i >= 0) {
        name = t.slice(i + 1), t = t.slice(0, i);
      }
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function () {
      var on = this.__on;
      if (!on) {
        return;
      }
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.capture);
        } else {
          on[++i] = o;
        }
      }
      if (++i) {
        on.length = i;
      } else {
        delete this.__on;
      }
    };
  }

  function onAdd(typename, value, capture) {
    var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
    return function (d, i, group) {
      var on = this.__on, o, listener = wrap(value, i, group);
      if (on) {
        for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
            this.addEventListener(o.type, o.listener = listener, o.capture = capture);
            o.value = value;
            return;
          }
        }
      }
      this.addEventListener(typename.type, listener, capture);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
      if (!on) {
        this.__on = [o];
      } else {
        on.push(o);
      }
    };
  }

  function selection_on(typename, value, capture) {
    var typenames = parseTypenames(typename + ''), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) {
        for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    if (capture == null) {
      capture = false;
    }
    for (i = 0; i < n; ++i) {
      this.each(on(typenames[i], value, capture));
    }
    return this;
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
      event = window.CustomEvent;

    if (typeof event === 'function') {
      event = new event(type, params);
    } else {
      event = window.document.createEvent('Event');
      if (params) {
        event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      } else {
        event.initEvent(type, false, false);
      }
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function () {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function () {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === 'function'
      ? dispatchFunction
      : dispatchConstant)(type, params));
  }

  var root = [null];

  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection([[document.documentElement]], root);
  }

  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: selection_select,
    selectAll: selection_selectAll,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    join: selection_join,
    merge: selection_merge,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch,
  };

  function select(selector) {
    return typeof selector === 'string'
      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
      : new Selection([[selector]], root);
  }

  function selectAll(selector) {
    return typeof selector === 'string'
      ? new Selection([document.querySelectorAll(selector)], [document.documentElement])
      : new Selection([selector == null ? [] : selector], root);
  }

  function ascending$1(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) {
      compare = ascendingComparator(compare);
    }
    return {
      left: function (a, x, lo, hi) {
        if (lo == null) {
          lo = 0;
        }
        if (hi == null) {
          hi = a.length;
        }
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) {
            lo = mid + 1;
          } else {
            hi = mid;
          }
        }
        return lo;
      },
      right: function (a, x, lo, hi) {
        if (lo == null) {
          lo = 0;
        }
        if (hi == null) {
          hi = a.length;
        }
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) {
            hi = mid;
          } else {
            lo = mid + 1;
          }
        }
        return lo;
      },
    };
  }

  function ascendingComparator(f) {
    return function (d, x) {
      return ascending$1(f(d), x);
    };
  }

  var ascendingBisect = bisector(ascending$1);
  var bisectRight = ascendingBisect.right;

  function extent(values, valueof) {
    var n = values.length,
      i = -1,
      value,
      min,
      max;

    if (valueof == null) {
      while (++i < n) { // Find the first comparable value.
        if ((value = values[i]) != null && value >= value) {
          min = max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = values[i]) != null) {
              if (min > value) {
                min = value;
              }
              if (max < value) {
                max = value;
              }
            }
          }
        }
      }
    } else {
      while (++i < n) { // Find the first comparable value.
        if ((value = valueof(values[i], i, values)) != null && value >= value) {
          min = max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = valueof(values[i], i, values)) != null) {
              if (min > value) {
                min = value;
              }
              if (max < value) {
                max = value;
              }
            }
          }
        }
      }
    }

    return [min, max];
  }

  var e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);

  function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
    if (error >= e10) {
      step1 *= 10;
    } else if (error >= e5) {
      step1 *= 5;
    } else if (error >= e2) {
      step1 *= 2;
    }
    return stop < start ? -step1 : step1;
  }

  function max(values, valueof) {
    var n = values.length,
      i = -1,
      value,
      max;

    if (valueof == null) {
      while (++i < n) { // Find the first comparable value.
        if ((value = values[i]) != null && value >= value) {
          max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = values[i]) != null && value > max) {
              max = value;
            }
          }
        }
      }
    } else {
      while (++i < n) { // Find the first comparable value.
        if ((value = valueof(values[i], i, values)) != null && value >= value) {
          max = value;
          while (++i < n) { // Compare the remaining values.
            if ((value = valueof(values[i], i, values)) != null && value > max) {
              max = value;
            }
          }
        }
      }
    }

    return max;
  }

  var prefix = '$';

  function Map() {
  }

  Map.prototype = map.prototype = {
    constructor: Map,
    has: function (key) {
      return (prefix + key) in this;
    },
    get: function (key) {
      return this[prefix + key];
    },
    set: function (key, value) {
      this[prefix + key] = value;
      return this;
    },
    remove: function (key) {
      var property = prefix + key;
      return property in this && delete this[property];
    },
    clear: function () {
      for (var property in this) {
        if (property[0] === prefix) {
          delete this[property];
        }
      }
    },
    keys: function () {
      var keys = [];
      for (var property in this) {
        if (property[0] === prefix) {
          keys.push(property.slice(1));
        }
      }
      return keys;
    },
    values: function () {
      var values = [];
      for (var property in this) {
        if (property[0] === prefix) {
          values.push(this[property]);
        }
      }
      return values;
    },
    entries: function () {
      var entries = [];
      for (var property in this) {
        if (property[0] === prefix) {
          entries.push({key: property.slice(1), value: this[property]});
        }
      }
      return entries;
    },
    size: function () {
      var size = 0;
      for (var property in this) {
        if (property[0] === prefix) {
          ++size;
        }
      }
      return size;
    },
    empty: function () {
      for (var property in this) {
        if (property[0] === prefix) {
          return false;
        }
      }
      return true;
    },
    each: function (f) {
      for (var property in this) {
        if (property[0] === prefix) {
          f(this[property], property.slice(1), this);
        }
      }
    },
  };

  function map(object, f) {
    var map = new Map;

    // Copy constructor.
    if (object instanceof Map) {
      object.each(function (value, key) {
        map.set(key, value);
      });
    }

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
      var i = -1,
        n = object.length,
        o;

      if (f == null) {
        while (++i < n) {
          map.set(i, object[i]);
        }
      } else {
        while (++i < n) {
          map.set(f(o = object[i], i, object), o);
        }
      }
    }

    // Convert object to map.
    else if (object) {
      for (var key in object) {
        map.set(key, object[key]);
      }
    }

    return map;
  }

  function nest() {
    var keys = [],
      sortKeys = [],
      sortValues,
      rollup,
      nest;

    function apply(array, depth, createResult, setResult) {
      if (depth >= keys.length) {
        if (sortValues != null) {
          array.sort(sortValues);
        }
        return rollup != null ? rollup(array) : array;
      }

      var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        value,
        valuesByKey = map(),
        values,
        result = createResult();

      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(value = array[i]) + '')) {
          values.push(value);
        } else {
          valuesByKey.set(keyValue, [value]);
        }
      }

      valuesByKey.each(function (values, key) {
        setResult(result, key, apply(values, depth, createResult, setResult));
      });

      return result;
    }

    function entries(map, depth) {
      if (++depth > keys.length) {
        return map;
      }
      var array, sortKey = sortKeys[depth - 1];
      if (rollup != null && depth >= keys.length) {
        array = map.entries();
      } else {
        array = [], map.each(function (v, k) {
          array.push({key: k, values: entries(v, depth)});
        });
      }
      return sortKey != null ? array.sort(function (a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }

    return nest = {
      object: function (array) {
        return apply(array, 0, createObject, setObject);
      },
      map: function (array) {
        return apply(array, 0, createMap, setMap);
      },
      entries: function (array) {
        return entries(apply(array, 0, createMap, setMap), 0);
      },
      key: function (d) {
        keys.push(d);
        return nest;
      },
      sortKeys: function (order) {
        sortKeys[keys.length - 1] = order;
        return nest;
      },
      sortValues: function (order) {
        sortValues = order;
        return nest;
      },
      rollup: function (f) {
        rollup = f;
        return nest;
      },
    };
  }

  function createObject() {
    return {};
  }

  function setObject(object, key, value) {
    object[key] = value;
  }

  function createMap() {
    return map();
  }

  function setMap(map, key, value) {
    map.set(key, value);
  }

  function Set() {
  }

  var proto = map.prototype;

  Set.prototype = set.prototype = {
    constructor: Set,
    has: proto.has,
    add: function (value) {
      value += '';
      this[prefix + value] = value;
      return this;
    },
    remove: proto.remove,
    clear: proto.clear,
    values: proto.keys,
    size: proto.size,
    empty: proto.empty,
    each: proto.each,
  };

  function set(object, f) {
    var set = new Set;

    // Copy constructor.
    if (object instanceof Set) {
      object.each(function (value) {
        set.add(value);
      });
    }

    // Otherwise, assume it’s an array.
    else if (object) {
      var i = -1, n = object.length;
      if (f == null) {
        while (++i < n) {
          set.add(object[i]);
        }
      } else {
        while (++i < n) {
          set.add(f(object[i], i, object));
        }
      }
    }

    return set;
  }

  var array = Array.prototype;

  var map$1 = array.map;
  var slice = array.slice;

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) {
      prototype[key] = definition[key];
    }
    return prototype;
  }

  function Color() {
  }

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = '\\s*([+-]?\\d+)\\s*',
    reN = '\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*',
    reP = '\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*',
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp('^rgb\\(' + [reI, reI, reI] + '\\)$'),
    reRgbPercent = new RegExp('^rgb\\(' + [reP, reP, reP] + '\\)$'),
    reRgbaInteger = new RegExp('^rgba\\(' + [reI, reI, reI, reN] + '\\)$'),
    reRgbaPercent = new RegExp('^rgba\\(' + [reP, reP, reP, reN] + '\\)$'),
    reHslPercent = new RegExp('^hsl\\(' + [reN, reP, reP] + '\\)$'),
    reHslaPercent = new RegExp('^hsla\\(' + [reN, reP, reP, reN] + '\\)$');

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32,
  };

  define(Color, color, {
    copy: function (channels) {
      return Object.assign(new this.constructor, this, channels);
    },
    displayable: function () {
      return this.rgb().displayable();
    },
    hex: color_formatHex, // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb,
  });

  function color_formatHex() {
    return this.rgb().formatHex();
  }

  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }

  function color_formatRgb() {
    return this.rgb().formatRgb();
  }

  function color(format) {
    var m, l;
    format = (format + '').trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
        : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
            : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
              : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
            : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
              : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
                : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
                  : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
                    : format === 'transparent' ? new Rgb(NaN, NaN, NaN, 0)
                      : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) {
      r = g = b = NaN;
    }
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) {
      o = color(o);
    }
    if (!o) {
      return new Rgb;
    }
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter: function (k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function (k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function () {
      return this;
    },
    displayable: function () {
      return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex, // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb,
  }));

  function rgb_formatHex() {
    return '#' + hex(this.r) + hex(this.g) + hex(this.b);
  }

  function rgb_formatRgb() {
    var a = this.opacity;
    a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? 'rgb(' : 'rgba(')
      + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ', '
      + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ', '
      + Math.max(0, Math.min(255, Math.round(this.b) || 0))
      + (a === 1 ? ')' : ', ' + a + ')');
  }

  function hex(value) {
    value = Math.max(0, Math.min(255, Math.round(value) || 0));
    return (value < 16 ? '0' : '') + value.toString(16);
  }

  function hsla(h, s, l, a) {
    if (a <= 0) {
      h = s = l = NaN;
    } else if (l <= 0 || l >= 1) {
      h = s = NaN;
    } else if (s <= 0) {
      h = NaN;
    }
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) {
      return new Hsl(o.h, o.s, o.l, o.opacity);
    }
    if (!(o instanceof Color)) {
      o = color(o);
    }
    if (!o) {
      return new Hsl;
    }
    if (o instanceof Hsl) {
      return o;
    }
    o = o.rgb();
    var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
    if (s) {
      if (r === max) {
        h = (g - b) / s + (g < b) * 6;
      } else if (g === max) {
        h = (b - r) / s + 2;
      } else {
        h = (r - g) / s + 4;
      }
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter: function (k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function (k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function () {
      var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity,
      );
    },
    displayable: function () {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl: function () {
      var a = this.opacity;
      a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? 'hsl(' : 'hsla(')
        + (this.h || 0) + ', '
        + (this.s || 0) * 100 + '%, '
        + (this.l || 0) * 100 + '%'
        + (a === 1 ? ')' : ', ' + a + ')');
    },
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
  }

  var deg2rad = Math.PI / 180;
  var rad2deg = 180 / Math.PI;

  var A = -0.14861,
    B = +1.78277,
    C = -0.29227,
    D = -0.90649,
    E = +1.97294,
    ED = E * D,
    EB = E * B,
    BC_DA = B * C - D * A;

  function cubehelixConvert(o) {
    if (o instanceof Cubehelix) {
      return new Cubehelix(o.h, o.s, o.l, o.opacity);
    }
    if (!(o instanceof Rgb)) {
      o = rgbConvert(o);
    }
    var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
    return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
  }

  function cubehelix(h, s, l, opacity) {
    return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
  }

  function Cubehelix(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Cubehelix, cubehelix, extend(Color, {
    brighter: function (k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function (k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function () {
      var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
      return new Rgb(
        255 * (l + a * (A * cosh + B * sinh)),
        255 * (l + a * (C * cosh + D * sinh)),
        255 * (l + a * (E * cosh)),
        this.opacity,
      );
    },
  }));

  function constant$1(x) {
    return function () {
      return x;
    };
  }

  function linear(a, d) {
    return function (t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
      return Math.pow(a + t * b, y);
    };
  }

  function hue(a, b) {
    var d = b - a;
    return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$1(isNaN(a) ? b : a);
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function (a, b) {
      return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
  }

  var rgb$1 = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb$1(start, end) {
      var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
      return function (t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + '';
      };
    }

    rgb$1.gamma = rgbGamma;

    return rgb$1;
  })(1);

  function numberArray(a, b) {
    if (!b) {
      b = [];
    }
    var n = a ? Math.min(b.length, a.length) : 0,
      c = b.slice(),
      i;
    return function (t) {
      for (i = 0; i < n; ++i) {
        c[i] = a[i] * (1 - t) + b[i] * t;
      }
      return c;
    };
  }

  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  function genericArray(a, b) {
    var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(na),
      c = new Array(nb),
      i;

    for (i = 0; i < na; ++i) {
      x[i] = interpolateValue(a[i], b[i]);
    }
    for (; i < nb; ++i) {
      c[i] = b[i];
    }

    return function (t) {
      for (i = 0; i < na; ++i) {
        c[i] = x[i](t);
      }
      return c;
    };
  }

  function date(a, b) {
    var d = new Date;
    return a = +a, b = +b, function (t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  function reinterpolate(a, b) {
    return a = +a, b = +b, function (t) {
      return a * (1 - t) + b * t;
    };
  }

  function object(a, b) {
    var i = {},
      c = {},
      k;

    if (a === null || typeof a !== 'object') {
      a = {};
    }
    if (b === null || typeof b !== 'object') {
      b = {};
    }

    for (k in b) {
      if (k in a) {
        i[k] = interpolateValue(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }

    return function (t) {
      for (k in i) {
        c[k] = i[k](t);
      }
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, 'g');

  function zero(b) {
    return function () {
      return b;
    };
  }

  function one(b) {
    return function (t) {
      return b(t) + '';
    };
  }

  function string(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + '', b = b + '';

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
    && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) {
          s[i] += bs;
        } // coalesce with previous string
        else {
          s[++i] = bs;
        }
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) {
          s[i] += bm;
        } // coalesce with previous string
        else {
          s[++i] = bm;
        }
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: reinterpolate(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) {
        s[i] += bs;
      } // coalesce with previous string
      else {
        s[++i] = bs;
      }
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
      : (b = q.length, function (t) {
        for (var i = 0, o; i < b; ++i) {
          s[(o = q[i]).i] = o.x(t);
        }
        return s.join('');
      });
  }

  function interpolateValue(a, b) {
    var t = typeof b, c;
    return b == null || t === 'boolean' ? constant$1(b)
      : (t === 'number' ? reinterpolate
        : t === 'string' ? ((c = color(b)) ? (b = c, rgb$1) : string)
          : b instanceof color ? rgb$1
            : b instanceof Date ? date
              : isNumberArray(b) ? numberArray
                : Array.isArray(b) ? genericArray
                  : typeof b.valueOf !== 'function' && typeof b.toString !== 'function' || isNaN(b) ? object
                    : reinterpolate)(a, b);
  }

  function interpolateRound(a, b) {
    return a = +a, b = +b, function (t) {
      return Math.round(a * (1 - t) + b * t);
    };
  }

  function cubehelix$1(hue) {
    return (function cubehelixGamma(y) {
      y = +y;

      function cubehelix$1(start, end) {
        var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
        return function (t) {
          start.h = h(t);
          start.s = s(t);
          start.l = l(Math.pow(t, y));
          start.opacity = opacity(t);
          return start + '';
        };
      }

      cubehelix$1.gamma = cubehelixGamma;

      return cubehelix$1;
    })(1);
  }

  cubehelix$1(hue);
  var cubehelixLong = cubehelix$1(nogamma);

  function constant$2(x) {
    return function () {
      return x;
    };
  }

  function number(x) {
    return +x;
  }

  var unit = [0, 1];

  function deinterpolateLinear(a, b) {
    return (b -= (a = +a))
      ? function (x) {
        return (x - a) / b;
      }
      : constant$2(b);
  }

  function deinterpolateClamp(deinterpolate) {
    return function (a, b) {
      var d = deinterpolate(a = +a, b = +b);
      return function (x) {
        return x <= a ? 0 : x >= b ? 1 : d(x);
      };
    };
  }

  function reinterpolateClamp(reinterpolate) {
    return function (a, b) {
      var r = reinterpolate(a = +a, b = +b);
      return function (t) {
        return t <= 0 ? a : t >= 1 ? b : r(t);
      };
    };
  }

  function bimap(domain, range, deinterpolate, reinterpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    if (d1 < d0) {
      d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);
    } else {
      d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
    }
    return function (x) {
      return r0(d0(x));
    };
  }

  function polymap(domain, range, deinterpolate, reinterpolate) {
    var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

    // Reverse descending domains.
    if (domain[j] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }

    while (++i < j) {
      d[i] = deinterpolate(domain[i], domain[i + 1]);
      r[i] = reinterpolate(range[i], range[i + 1]);
    }

    return function (x) {
      var i = bisectRight(domain, x, 1, j) - 1;
      return r[i](d[i](x));
    };
  }

  function copy(source, target) {
    return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp());
  }

  // deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
  // reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
  function continuous(deinterpolate, reinterpolate) {
    var domain = unit,
      range = unit,
      interpolate = interpolateValue,
      clamp = false,
      piecewise,
      output,
      input;

    function rescale() {
      piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }

    function scale(x) {
      return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate)))(+x);
    }

    scale.invert = function (y) {
      return (input || (input = piecewise(range, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
    };

    scale.domain = function (_) {
      return arguments.length ? (domain = map$1.call(_, number), rescale()) : domain.slice();
    };

    scale.range = function (_) {
      return arguments.length ? (range = slice.call(_), rescale()) : range.slice();
    };

    scale.rangeRound = function (_) {
      return range = slice.call(_), interpolate = interpolateRound, rescale();
    };

    scale.clamp = function (_) {
      return arguments.length ? (clamp = !!_, rescale()) : clamp;
    };

    scale.interpolate = function (_) {
      return arguments.length ? (interpolate = _, rescale()) : interpolate;
    };

    return rescale();
  }

  function nice(domain, interval) {
    domain = domain.slice();

    var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

    if (x1 < x0) {
      t = i0, i0 = i1, i1 = t;
      t = x0, x0 = x1, x1 = t;
    }

    domain[i0] = interval.floor(x0);
    domain[i1] = interval.ceil(x1);
    return domain;
  }

  var t0 = new Date,
    t1 = new Date;

  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = arguments.length === 0 ? new Date : new Date(+date)), date;
    }

    interval.floor = function (date) {
      return floori(date = new Date(+date)), date;
    };

    interval.ceil = function (date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };

    interval.round = function (date) {
      var d0 = interval(date),
        d1 = interval.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.offset = function (date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function (start, stop, step) {
      var range = [], previous;
      start = interval.ceil(start);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) {
        return range;
      } // also handles Invalid Date
      do {
        range.push(previous = new Date(+start)), offseti(start, step), floori(start);
      }
      while (previous < start && start < stop);
      return range;
    };

    interval.filter = function (test) {
      return newInterval(function (date) {
        if (date >= date) {
          while (floori(date), !test(date)) {
            date.setTime(date - 1);
          }
        }
      }, function (date, step) {
        if (date >= date) {
          if (step < 0) {
            while (++step <= 0) {
              while (offseti(date, -1), !test(date)) {
              } // eslint-disable-line no-empty
            }
          } else {
            while (--step >= 0) {
              while (offseti(date, +1), !test(date)) {
              } // eslint-disable-line no-empty
            }
          }
        }
      });
    };

    if (count) {
      interval.count = function (start, end) {
        t0.setTime(+start), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };

      interval.every = function (step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
          : !(step > 1) ? interval
            : interval.filter(field
              ? function (d) {
                return field(d) % step === 0;
              }
              : function (d) {
                return interval.count(0, d) % step === 0;
              });
      };
    }

    return interval;
  }

  var millisecond = newInterval(function () {
    // noop
  }, function (date, step) {
    date.setTime(+date + step);
  }, function (start, end) {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = function (k) {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) {
      return null;
    }
    if (!(k > 1)) {
      return millisecond;
    }
    return newInterval(function (date) {
      date.setTime(Math.floor(date / k) * k);
    }, function (date, step) {
      date.setTime(+date + step * k);
    }, function (start, end) {
      return (end - start) / k;
    });
  };

  var durationSecond = 1e3;
  var durationMinute = 6e4;
  var durationHour = 36e5;
  var durationDay = 864e5;
  var durationWeek = 6048e5;

  var second = newInterval(function (date) {
    date.setTime(date - date.getMilliseconds());
  }, function (date, step) {
    date.setTime(+date + step * durationSecond);
  }, function (start, end) {
    return (end - start) / durationSecond;
  }, function (date) {
    return date.getUTCSeconds();
  });

  var minute = newInterval(function (date) {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
  }, function (date, step) {
    date.setTime(+date + step * durationMinute);
  }, function (start, end) {
    return (end - start) / durationMinute;
  }, function (date) {
    return date.getMinutes();
  });

  var hour = newInterval(function (date) {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
  }, function (date, step) {
    date.setTime(+date + step * durationHour);
  }, function (start, end) {
    return (end - start) / durationHour;
  }, function (date) {
    return date.getHours();
  });

  var day = newInterval(function (date) {
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setDate(date.getDate() + step);
  }, function (start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
  }, function (date) {
    return date.getDate() - 1;
  });

  function weekday(i) {
    return newInterval(function (date) {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, function (date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function (start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
    });
  }

  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);

  var month = newInterval(function (date) {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setMonth(date.getMonth() + step);
  }, function (start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, function (date) {
    return date.getMonth();
  });

  var year = newInterval(function (date) {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function (start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function (date) {
    return date.getFullYear();
  });

  // An optimized implementation for this simple case.
  year.every = function (k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function (date, step) {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };

  var utcDay = newInterval(function (date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function (start, end) {
    return (end - start) / durationDay;
  }, function (date) {
    return date.getUTCDate() - 1;
  });

  function utcWeekday(i) {
    return newInterval(function (date) {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, function (date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function (start, end) {
      return (end - start) / durationWeek;
    });
  }

  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);

  var utcYear = newInterval(function (date) {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function (start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function (date) {
    return date.getUTCFullYear();
  });

  // An optimized implementation for this simple case.
  utcYear.every = function (k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function (date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };

  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }

  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }

  function newDate(y, m, d) {
    return {y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0};
  }

  function formatLocale(locale) {
    var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

    var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

    var formats = {
      'a': formatShortWeekday,
      'A': formatWeekday,
      'b': formatShortMonth,
      'B': formatMonth,
      'c': null,
      'd': formatDayOfMonth,
      'e': formatDayOfMonth,
      'f': formatMicroseconds,
      'g': formatYearISO,
      'G': formatFullYearISO,
      'H': formatHour24,
      'I': formatHour12,
      'j': formatDayOfYear,
      'L': formatMilliseconds,
      'm': formatMonthNumber,
      'M': formatMinutes,
      'p': formatPeriod,
      'q': formatQuarter,
      'Q': formatUnixTimestamp,
      's': formatUnixTimestampSeconds,
      'S': formatSeconds,
      'u': formatWeekdayNumberMonday,
      'U': formatWeekNumberSunday,
      'V': formatWeekNumberISO,
      'w': formatWeekdayNumberSunday,
      'W': formatWeekNumberMonday,
      'x': null,
      'X': null,
      'y': formatYear,
      'Y': formatFullYear,
      'Z': formatZone,
      '%': formatLiteralPercent,
    };

    var utcFormats = {
      'a': formatUTCShortWeekday,
      'A': formatUTCWeekday,
      'b': formatUTCShortMonth,
      'B': formatUTCMonth,
      'c': null,
      'd': formatUTCDayOfMonth,
      'e': formatUTCDayOfMonth,
      'f': formatUTCMicroseconds,
      'g': formatUTCYearISO,
      'G': formatUTCFullYearISO,
      'H': formatUTCHour24,
      'I': formatUTCHour12,
      'j': formatUTCDayOfYear,
      'L': formatUTCMilliseconds,
      'm': formatUTCMonthNumber,
      'M': formatUTCMinutes,
      'p': formatUTCPeriod,
      'q': formatUTCQuarter,
      'Q': formatUnixTimestamp,
      's': formatUnixTimestampSeconds,
      'S': formatUTCSeconds,
      'u': formatUTCWeekdayNumberMonday,
      'U': formatUTCWeekNumberSunday,
      'V': formatUTCWeekNumberISO,
      'w': formatUTCWeekdayNumberSunday,
      'W': formatUTCWeekNumberMonday,
      'x': null,
      'X': null,
      'y': formatUTCYear,
      'Y': formatUTCFullYear,
      'Z': formatUTCZone,
      '%': formatLiteralPercent,
    };

    var parses = {
      'a': parseShortWeekday,
      'A': parseWeekday,
      'b': parseShortMonth,
      'B': parseMonth,
      'c': parseLocaleDateTime,
      'd': parseDayOfMonth,
      'e': parseDayOfMonth,
      'f': parseMicroseconds,
      'g': parseYear,
      'G': parseFullYear,
      'H': parseHour24,
      'I': parseHour24,
      'j': parseDayOfYear,
      'L': parseMilliseconds,
      'm': parseMonthNumber,
      'M': parseMinutes,
      'p': parsePeriod,
      'q': parseQuarter,
      'Q': parseUnixTimestamp,
      's': parseUnixTimestampSeconds,
      'S': parseSeconds,
      'u': parseWeekdayNumberMonday,
      'U': parseWeekNumberSunday,
      'V': parseWeekNumberISO,
      'w': parseWeekdayNumberSunday,
      'W': parseWeekNumberMonday,
      'x': parseLocaleDate,
      'X': parseLocaleTime,
      'y': parseYear,
      'Y': parseFullYear,
      'Z': parseZone,
      '%': parseLiteralPercent,
    };

    // These recursive directive definitions must be deferred.
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);

    function newFormat(specifier, formats) {
      return function (date) {
        var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

        if (!(date instanceof Date)) {
          date = new Date(+date);
        }

        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad = pads[c = specifier.charAt(++i)]) != null) {
              c = specifier.charAt(++i);
            } else {
              pad = c === 'e' ? ' ' : '0';
            }
            if (format = formats[c]) {
              c = format(date, pad);
            }
            string.push(c);
            j = i + 1;
          }
        }

        string.push(specifier.slice(j, i));
        return string.join('');
      };
    }

    function newParse(specifier, Z) {
      return function (string) {
        var d = newDate(1900, undefined, 1),
          i = parseSpecifier(d, specifier, string += '', 0),
          week, day$1;
        if (i != string.length) {
          return null;
        }

        // If a UNIX timestamp is specified, return it.
        if ('Q' in d) {
          return new Date(d.Q);
        }
        if ('s' in d) {
          return new Date(d.s * 1000 + ('L' in d ? d.L : 0));
        }

        // If this is utcParse, never use the local timezone.
        if (Z && !('Z' in d)) {
          d.Z = 0;
        }

        // The am-pm flag is 0 for AM, and 1 for PM.
        if ('p' in d) {
          d.H = d.H % 12 + d.p * 12;
        }

        // If the month was not specified, inherit from the quarter.
        if (d.m === undefined) {
          d.m = 'q' in d ? d.q : 0;
        }

        // Convert day-of-week and week-of-year to day-of-year.
        if ('V' in d) {
          if (d.V < 1 || d.V > 53) {
            return null;
          }
          if (!('w' in d)) {
            d.w = 1;
          }
          if ('Z' in d) {
            week = utcDate(newDate(d.y, 0, 1)), day$1 = week.getUTCDay();
            week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
            week = utcDay.offset(week, (d.V - 1) * 7);
            d.y = week.getUTCFullYear();
            d.m = week.getUTCMonth();
            d.d = week.getUTCDate() + (d.w + 6) % 7;
          } else {
            week = localDate(newDate(d.y, 0, 1)), day$1 = week.getDay();
            week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
            week = day.offset(week, (d.V - 1) * 7);
            d.y = week.getFullYear();
            d.m = week.getMonth();
            d.d = week.getDate() + (d.w + 6) % 7;
          }
        } else if ('W' in d || 'U' in d) {
          if (!('w' in d)) {
            d.w = 'u' in d ? d.u % 7 : 'W' in d ? 1 : 0;
          }
          day$1 = 'Z' in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
          d.m = 0;
          d.d = 'W' in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
        }

        // If a time zone is specified, all fields are interpreted as UTC and then
        // offset according to the specified time zone.
        if ('Z' in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }

        // Otherwise, all fields are in local time.
        return localDate(d);
      };
    }

    function parseSpecifier(d, specifier, string, j) {
      var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

      while (i < n) {
        if (j >= m) {
          return -1;
        }
        c = specifier.charCodeAt(i++);
        if (c === 37) {
          c = specifier.charAt(i++);
          parse = parses[c in pads ? specifier.charAt(i++) : c];
          if (!parse || ((j = parse(d, string, j)) < 0)) {
            return -1;
          }
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }

      return j;
    }

    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }

    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }

    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }

    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }

    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }

    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }

    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }

    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }

    function formatQuarter(d) {
      return 1 + ~~(d.getMonth() / 3);
    }

    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }

    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }

    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }

    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }

    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }

    function formatUTCQuarter(d) {
      return 1 + ~~(d.getUTCMonth() / 3);
    }

    return {
      format: function (specifier) {
        var f = newFormat(specifier += '', formats);
        f.toString = function () {
          return specifier;
        };
        return f;
      },
      parse: function (specifier) {
        var p = newParse(specifier += '', false);
        p.toString = function () {
          return specifier;
        };
        return p;
      },
      utcFormat: function (specifier) {
        var f = newFormat(specifier += '', utcFormats);
        f.toString = function () {
          return specifier;
        };
        return f;
      },
      utcParse: function (specifier) {
        var p = newParse(specifier += '', true);
        p.toString = function () {
          return specifier;
        };
        return p;
      },
    };
  }

  var pads = {'-': '', '_': ' ', '0': '0'},
    numberRe = /^\s*\d+/, // note: ignores next directive
    percentRe = /^%/,
    requoteRe = /[\\^$*+?|[\]().{}]/g;

  function pad(value, fill, width) {
    var sign = value < 0 ? '-' : '',
      string = (sign ? -value : value) + '',
      length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }

  function requote(s) {
    return s.replace(requoteRe, '\\$&');
  }

  function formatRe(names) {
    return new RegExp('^(?:' + names.map(requote).join('|') + ')', 'i');
  }

  function formatLookup(names) {
    var map = {}, i = -1, n = names.length;
    while (++i < n) {
      map[names[i].toLowerCase()] = i;
    }
    return map;
  }

  function parseWeekdayNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }

  function parseWeekdayNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.u = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberISO(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.V = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }

  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }

  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
  }

  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || '00')), i + n[0].length) : -1;
  }

  function parseQuarter(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
  }

  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }

  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }

  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }

  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }

  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }

  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }

  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }

  function parseMicroseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 6));
    return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
  }

  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }

  function parseUnixTimestamp(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.Q = +n[0], i + n[0].length) : -1;
  }

  function parseUnixTimestampSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.s = +n[0], i + n[0].length) : -1;
  }

  function formatDayOfMonth(d, p) {
    return pad(d.getDate(), p, 2);
  }

  function formatHour24(d, p) {
    return pad(d.getHours(), p, 2);
  }

  function formatHour12(d, p) {
    return pad(d.getHours() % 12 || 12, p, 2);
  }

  function formatDayOfYear(d, p) {
    return pad(1 + day.count(year(d), d), p, 3);
  }

  function formatMilliseconds(d, p) {
    return pad(d.getMilliseconds(), p, 3);
  }

  function formatMicroseconds(d, p) {
    return formatMilliseconds(d, p) + '000';
  }

  function formatMonthNumber(d, p) {
    return pad(d.getMonth() + 1, p, 2);
  }

  function formatMinutes(d, p) {
    return pad(d.getMinutes(), p, 2);
  }

  function formatSeconds(d, p) {
    return pad(d.getSeconds(), p, 2);
  }

  function formatWeekdayNumberMonday(d) {
    var day = d.getDay();
    return day === 0 ? 7 : day;
  }

  function formatWeekNumberSunday(d, p) {
    return pad(sunday.count(year(d) - 1, d), p, 2);
  }

  function dISO(d) {
    var day = d.getDay();
    return (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
  }

  function formatWeekNumberISO(d, p) {
    d = dISO(d);
    return pad(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
  }

  function formatWeekdayNumberSunday(d) {
    return d.getDay();
  }

  function formatWeekNumberMonday(d, p) {
    return pad(monday.count(year(d) - 1, d), p, 2);
  }

  function formatYear(d, p) {
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatYearISO(d, p) {
    d = dISO(d);
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatFullYear(d, p) {
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatFullYearISO(d, p) {
    var day = d.getDay();
    d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? '-' : (z *= -1, '+'))
      + pad(z / 60 | 0, '0', 2)
      + pad(z % 60, '0', 2);
  }

  function formatUTCDayOfMonth(d, p) {
    return pad(d.getUTCDate(), p, 2);
  }

  function formatUTCHour24(d, p) {
    return pad(d.getUTCHours(), p, 2);
  }

  function formatUTCHour12(d, p) {
    return pad(d.getUTCHours() % 12 || 12, p, 2);
  }

  function formatUTCDayOfYear(d, p) {
    return pad(1 + utcDay.count(utcYear(d), d), p, 3);
  }

  function formatUTCMilliseconds(d, p) {
    return pad(d.getUTCMilliseconds(), p, 3);
  }

  function formatUTCMicroseconds(d, p) {
    return formatUTCMilliseconds(d, p) + '000';
  }

  function formatUTCMonthNumber(d, p) {
    return pad(d.getUTCMonth() + 1, p, 2);
  }

  function formatUTCMinutes(d, p) {
    return pad(d.getUTCMinutes(), p, 2);
  }

  function formatUTCSeconds(d, p) {
    return pad(d.getUTCSeconds(), p, 2);
  }

  function formatUTCWeekdayNumberMonday(d) {
    var dow = d.getUTCDay();
    return dow === 0 ? 7 : dow;
  }

  function formatUTCWeekNumberSunday(d, p) {
    return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
  }

  function UTCdISO(d) {
    var day = d.getUTCDay();
    return (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
  }

  function formatUTCWeekNumberISO(d, p) {
    d = UTCdISO(d);
    return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
  }

  function formatUTCWeekdayNumberSunday(d) {
    return d.getUTCDay();
  }

  function formatUTCWeekNumberMonday(d, p) {
    return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
  }

  function formatUTCYear(d, p) {
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCYearISO(d, p) {
    d = UTCdISO(d);
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCFullYear(d, p) {
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCFullYearISO(d, p) {
    var day = d.getUTCDay();
    d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCZone() {
    return '+0000';
  }

  function formatLiteralPercent() {
    return '%';
  }

  function formatUnixTimestamp(d) {
    return +d;
  }

  function formatUnixTimestampSeconds(d) {
    return Math.floor(+d / 1000);
  }

  var locale;
  var timeFormat;
  var timeParse;
  var utcFormat;
  var utcParse;

  defaultLocale({
    dateTime: '%x, %X',
    date: '%-m/%-d/%Y',
    time: '%-I:%M:%S %p',
    periods: ['AM', 'PM'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  });

  function defaultLocale(definition) {
    locale = formatLocale(definition);
    timeFormat = locale.format;
    timeParse = locale.parse;
    utcFormat = locale.utcFormat;
    utcParse = locale.utcParse;
    return locale;
  }

  var isoSpecifier = '%Y-%m-%dT%H:%M:%S.%LZ';

  function formatIsoNative(date) {
    return date.toISOString();
  }

  var formatIso = Date.prototype.toISOString
    ? formatIsoNative
    : utcFormat(isoSpecifier);

  function parseIsoNative(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  }

  var parseIso = +new Date('2000-01-01T00:00:00.000Z')
    ? parseIsoNative
    : utcParse(isoSpecifier);

  var durationSecond$1 = 1000,
    durationMinute$1 = durationSecond$1 * 60,
    durationHour$1 = durationMinute$1 * 60,
    durationDay$1 = durationHour$1 * 24,
    durationWeek$1 = durationDay$1 * 7,
    durationMonth = durationDay$1 * 30,
    durationYear = durationDay$1 * 365;

  function date$1(t) {
    return new Date(t);
  }

  function number$1(t) {
    return t instanceof Date ? +t : +new Date(+t);
  }

  function calendar(year, month, week, day, hour, minute, second, millisecond, format) {
    var scale = continuous(deinterpolateLinear, reinterpolate),
      invert = scale.invert,
      domain = scale.domain;

    var formatMillisecond = format('.%L'),
      formatSecond = format(':%S'),
      formatMinute = format('%I:%M'),
      formatHour = format('%I %p'),
      formatDay = format('%a %d'),
      formatWeek = format('%b %d'),
      formatMonth = format('%B'),
      formatYear = format('%Y');

    var tickIntervals = [
      [second, 1, durationSecond$1],
      [second, 5, 5 * durationSecond$1],
      [second, 15, 15 * durationSecond$1],
      [second, 30, 30 * durationSecond$1],
      [minute, 1, durationMinute$1],
      [minute, 5, 5 * durationMinute$1],
      [minute, 15, 15 * durationMinute$1],
      [minute, 30, 30 * durationMinute$1],
      [hour, 1, durationHour$1],
      [hour, 3, 3 * durationHour$1],
      [hour, 6, 6 * durationHour$1],
      [hour, 12, 12 * durationHour$1],
      [day, 1, durationDay$1],
      [day, 2, 2 * durationDay$1],
      [week, 1, durationWeek$1],
      [month, 1, durationMonth],
      [month, 3, 3 * durationMonth],
      [year, 1, durationYear],
    ];

    function tickFormat(date) {
      return (second(date) < date ? formatMillisecond
        : minute(date) < date ? formatSecond
          : hour(date) < date ? formatMinute
            : day(date) < date ? formatHour
              : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
                : year(date) < date ? formatMonth
                  : formatYear)(date);
    }

    function tickInterval(interval, start, stop, step) {
      if (interval == null) {
        interval = 10;
      }

      // If a desired tick count is specified, pick a reasonable tick interval
      // based on the extent of the domain and a rough estimate of tick size.
      // Otherwise, assume interval is already a time interval and use it.
      if (typeof interval === 'number') {
        var target = Math.abs(stop - start) / interval,
          i = bisector(function (i) {
            return i[2];
          }).right(tickIntervals, target);
        if (i === tickIntervals.length) {
          step = tickStep(start / durationYear, stop / durationYear, interval);
          interval = year;
        } else if (i) {
          i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
          step = i[1];
          interval = i[0];
        } else {
          step = Math.max(tickStep(start, stop, interval), 1);
          interval = millisecond;
        }
      }

      return step == null ? interval : interval.every(step);
    }

    scale.invert = function (y) {
      return new Date(invert(y));
    };

    scale.domain = function (_) {
      return arguments.length ? domain(map$1.call(_, number$1)) : domain().map(date$1);
    };

    scale.ticks = function (interval, step) {
      var d = domain(),
        t0 = d[0],
        t1 = d[d.length - 1],
        r = t1 < t0,
        t;
      if (r) {
        t = t0, t0 = t1, t1 = t;
      }
      t = tickInterval(interval, t0, t1, step);
      t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
      return r ? t.reverse() : t;
    };

    scale.tickFormat = function (count, specifier) {
      return specifier == null ? tickFormat : format(specifier);
    };

    scale.nice = function (interval, step) {
      var d = domain();
      return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
        ? domain(nice(d, interval))
        : scale;
    };

    scale.copy = function () {
      return copy(scale, calendar(year, month, week, day, hour, minute, second, millisecond, format));
    };

    return scale;
  }

  function time() {
    return calendar(year, month, sunday, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
  }

  function colors(s) {
    return s.match(/.{6}/g).map(function (x) {
      return '#' + x;
    });
  }

  colors('1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf');

  colors('393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6');

  colors('3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9');

  colors('1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5');

  cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

  var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

  var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

  var rainbow = cubehelix();

  function ramp(range) {
    var n = range.length;
    return function (t) {
      return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
  }

  ramp(colors('44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725'));

  var magma = ramp(colors('00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf'));

  var inferno = ramp(colors('00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4'));

  var plasma = ramp(colors('0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921'));

  // second, minute, hour, day, week, month, quarter, year
  var aggregateFormats = {
    second: '%Y-%m-%d %H:%M:%S',
    minute: '%Y-%m-%d %H:%M',
    hour: '%Y-%m-%d %H:00',
    day: '%Y-%m-%d',
    week: '%Y week %W',
    month: '%Y-%m',
    quarter: '%Y-Q%Q',
    year: '%Y',
  };

  function api(methods) {
    function methodChainer(wrapper, method) {
      return function (d) {
        method(d);
        return wrapper;
      };
    }

    return Object.keys(methods).reduce(function (API, methodName) {
      API[methodName] = methodChainer(API, methods[methodName]);
      return API;
    }, {});
  }

  var cssPrefix = 'milestones';
  var cssCategoryClass = cssPrefix + '__category_label';
  var cssHorizontalLineClass = cssPrefix + '__horizontal_line';
  var cssVerticalLineClass = cssPrefix + '__vertical_line';
  var cssGroupClass = cssPrefix + '__group';
  var cssBulletClass = cssGroupClass + '__bullet';
  var cssLabelClass = cssGroupClass + '__label';
  var cssLastClass = cssLabelClass + '-last';
  var cssAboveClass = cssLabelClass + '-above';
  var cssTextClass = cssLabelClass + '__text';
  var cssTitleClass = cssTextClass + '__title';
  var cssEventClass = cssTextClass + '__event';
  var cssEventHoverClass = cssEventClass + '--hover';

  function isAbove(i, distribution) {
    var above = i % 2;
    if (distribution === 'top') {
      above = true;
    } else if (distribution === 'bottom') {
      above = false;
    }
    return above > 0;
  }

  function getAttribute(d, attribute) {
    return parseInt(d.style[attribute].replace('px', ''), 10);
  }

  var labelRightMargin = 6;

  var getAvailableWidth = function (
    aggregateFormatParse,
    currentNode,
    index,
    mapping,
    nestedData,
    nestedNode,
    nextCheck,
    nextGroupHeight,
    offset,
    offsetCheckAttribute,
    offsetAttribute,
    orientation,
    textMerge,
    width,
    x,
    useNext,
  ) {
    if (useNext === void 0) useNext = true;

    // get the available width until the uber-next group
    var nextTestIndex =
      orientation === 'horizontal' && useNext
        ? index + nextCheck
        : index - nextCheck;

    var nextTestItem;

    do {
      if (orientation === 'horizontal' && useNext) {
        nextTestIndex += nextCheck;
      } else {
        nextTestIndex -= nextCheck;
      }
      nextTestItem = textMerge._groups[nextTestIndex];
      if (typeof nextTestItem === 'undefined') {
        break;
      }
    } while (nextGroupHeight >= nextTestItem[0][offsetAttribute]);

    var uberNextItem;

    if (typeof mapping.category === 'undefined') {
      uberNextItem = nestedData[nestedNode.timelineIndex][nextTestIndex];
    } else {
      uberNextItem = nestedData[nestedNode.timelineIndex].entries[nextTestIndex];
    }

    var availableWidth = getAttribute(currentNode, offsetCheckAttribute);

    if (typeof uberNextItem !== 'undefined') {
      var offsetUberNextItem = x(aggregateFormatParse(uberNextItem.key));

      if ((orientation === 'horizontal') & useNext) {
        availableWidth = offsetUberNextItem - offset - labelRightMargin;
      } else if ((orientation === 'horizontal') & !useNext) {
        availableWidth = offsetUberNextItem - labelRightMargin;
      } else {
        availableWidth = offset - offsetUberNextItem - labelRightMargin;
      }
    } else {
      if ((orientation === 'horizontal') & useNext) {
        availableWidth = width - offset - labelRightMargin;
      } else if ((orientation === 'horizontal') & !useNext) {
        availableWidth = offset - labelRightMargin;
      } else {
        availableWidth = offset - labelRightMargin;
      }
    }

    if (nextCheck < 0) {
      return Math.min(offset, availableWidth);
    } else {
      return availableWidth;
    }
  };

  var getNextGroup = function (orientation, nodes, index, nextCheck) {
    var nextGroup =
      orientation === 'horizontal'
        ? nodes[index + nextCheck]
        : nodes[index - nextCheck];

    return nextGroup;
  };

  var getNextGroupHeight = function (
    index,
    nextCheck,
    nodes,
    offsetAttribute,
    orientation,
  ) {
    // get the height of the next group
    var defaultPadding = 3;

    var nextGroup = getNextGroup(orientation, nodes, index, nextCheck);

    var nextGroupHeight;

    if (typeof nextGroup !== 'undefined') {
      nextGroupHeight = nextGroup[0][offsetAttribute] + defaultPadding;
    }

    return nextGroupHeight;
  };

  var MAX_OPTIMIZER_RUNS = 20;

  var getIntValueFromPxAttribute = function (domElement, attribute) {
    return parseInt(domElement.style(attribute).replace('px', ''), 10);
  };

  var getParentElement = function (domElement) {
    return domElement.select(function () {
      return this.parentNode;
    });
  };

  var isSameDistribution = function (index, nextCheck, overlapCheckIndex) {
    var itemRowCheck = index % nextCheck;
    var distributionCheck = (overlapCheckIndex + itemRowCheck) % nextCheck;

    return distributionCheck !== 0;
  };

  var optimize = function (
    aggregateFormatParse,
    distribution,
    labelMaxWidth,
    mapping,
    nestedData,
    orientation,
    textMerge,
    width,
    widthAttribute,
    x,
  ) {
    var nestedNodes = nest()
      .key(function (d) {
        return selectAll(d).data()[0].timelineIndex;
      })
      .entries(textMerge._groups);

    var nextCheck = distribution === 'top-bottom' ? 2 : 1;

    var runOptimizer = function (optimizerRuns) {
      var updated = 0;

      nestedNodes.forEach(function (d) {
        var nodes = d.values;
        nodes.forEach(function (node) {
          var d = selectAll(node).data()[0];

          var index =
            orientation === 'horizontal' ? nodes.length - d.index - 1 : d.index;

          var item = selectAll(nodes[index]).data()[0];
          var offset = x(aggregateFormatParse(item.key));
          var currentNode = nodes[index][0];

          var scrollCheckAttribute =
            orientation === 'horizontal' ? 'offsetWidth' : 'offsetHeight';

          var offsetCheckAttribute =
            orientation === 'horizontal' ? 'width' : 'height';

          var offsetComparator = orientation === 'horizontal' ? 60 : 20;

          var offsetCheck = getAttribute(currentNode, offsetCheckAttribute);

          var domElement = selectAll(nodes[index]);

          var backwards = getParentElement(domElement).classed(cssLastClass);

          var offsetAttribute =
            orientation === 'horizontal' ? 'offsetHeight' : 'offsetWidth';

          var paddingAbove =
            orientation === 'horizontal' ? 'padding-bottom' : 'padding-right';

          var paddingBelow =
            orientation === 'horizontal' ? 'padding-top' : 'padding-left';

          var padding = isAbove(index, distribution)
            ? paddingAbove
            : paddingBelow;

          // Because on a resize a previous optimization could already have
          // repositioned items, we reset them on the first optimizer run
          if (optimizerRuns === 0) {
            backwards = false;
            domElement.style(padding, '0px');
            getParentElement(domElement).classed(cssLastClass, backwards);
          }

          var overflow = backwards
            ? offset - offsetCheck < 0
            : offset + offsetCheck > width;

          if (
            currentNode[scrollCheckAttribute] > offsetCheck ||
            offsetCheck < offsetComparator ||
            backwards ||
            overflow
          ) {
            var availableWidth = null;
            var runs = 0;
            var nextCheckIterator =
              orientation === 'horizontal' ? nextCheck - 1 : nextCheck + 1;

            do {
              if (orientation === 'horizontal') {
                nextCheckIterator++;
              } else {
                nextCheckIterator--;
              }

              runs++;

              if (nextCheckIterator > 0) {
                var nextGroupHeight = getNextGroupHeight(
                  index,
                  nextCheck,
                  nodes,
                  offsetAttribute,
                  orientation,
                );

                var previousGroupHeight =
                  orientation === 'horizontal'
                    ? getNextGroupHeight(
                      index,
                      nextCheck * -1,
                      nodes,
                      offsetAttribute,
                      orientation,
                    )
                    : nextGroupHeight;

                var useNext =
                  nextGroupHeight <= previousGroupHeight &&
                  nextGroupHeight !== undefined;

                if (!useNext) {
                  useNext = offset < offsetComparator;
                }

                var groupHeight = useNext
                  ? nextGroupHeight
                  : previousGroupHeight;
                var check = useNext ? nextCheck : nextCheck * -1;

                domElement.style(padding, groupHeight + 'px');

                getParentElement(domElement).classed(cssLastClass, !useNext);

                availableWidth = getAvailableWidth(
                  aggregateFormatParse,
                  currentNode,
                  index,
                  mapping,
                  nestedData,
                  d,
                  check,
                  groupHeight,
                  offset,
                  offsetCheckAttribute,
                  offsetAttribute,
                  orientation,
                  textMerge,
                  width,
                  x,
                  useNext,
                );
              }
            } while (
              availableWidth < currentNode[scrollCheckAttribute] &&
              runs < MAX_OPTIMIZER_RUNS
              );

            if (orientation === 'horizontal') {
              availableWidth = Math.min(labelMaxWidth, availableWidth);
            }

            // because labels could be left or right aligned,
            // we shrink the available width to the inner text width
            // so labels facing each other will require less space.
            domElement.style(widthAttribute, availableWidth + 'px');
            var innerWidth = getIntValueFromPxAttribute(
              domElement.select('.wrapper'),
              'width',
            );
            if (innerWidth < availableWidth) {
              availableWidth = innerWidth + 6;
              domElement.style(widthAttribute, availableWidth + 'px');
            }

            if (optimizerRuns > 0 && orientation === 'horizontal') {
              var itemWidth = getIntValueFromPxAttribute(domElement, 'width');
              var checkOffset = backwards
                ? offset - itemWidth
                : offset + itemWidth;

              var minPadding = Number.POSITIVE_INFINITY;

              nodes.forEach(function (overlapCheckNode, overlapCheckIndex) {
                var overlapCheckItem = selectAll(overlapCheckNode)
                  .data()[0];

                if (
                  overlapCheckItem.key === item.key ||
                  isSameDistribution(index, nextCheck, overlapCheckIndex)
                ) {
                  return;
                }

                var overlapCheckOffset =
                  x(aggregateFormatParse(overlapCheckItem.key)) - 5;
                var overlapItemOffsetAnchor = overlapCheckOffset;
                var overlapCheckDomElement = selectAll(
                  nodes[overlapCheckIndex],
                );
                var overlapCheckBackwards = getParentElement(
                  overlapCheckDomElement,
                ).classed(cssLastClass);

                if (backwards && !overlapCheckBackwards) {
                  var overlapCheckItemWidth = getIntValueFromPxAttribute(
                    overlapCheckDomElement,
                    'width',
                  );
                  overlapCheckOffset =
                    overlapCheckOffset + overlapCheckItemWidth + 5;
                }

                if (!backwards && overlapCheckBackwards) {
                  var overlapCheckItemWidth$1 = getIntValueFromPxAttribute(
                    overlapCheckDomElement,
                    'width',
                  );
                  overlapCheckOffset =
                    overlapCheckOffset - overlapCheckItemWidth$1 - 5;
                }

                var overlapCheck1 = backwards
                  ? overlapCheckOffset > checkOffset
                  : checkOffset > overlapItemOffsetAnchor;

                var overlapCheck2 = backwards
                  ? overlapItemOffsetAnchor < offset
                  : overlapItemOffsetAnchor > offset;

                if (overlapCheck1 && overlapCheck2) {
                  var overlapCheckHeight = overlapCheckNode[0][offsetAttribute];
                  var itemPadding = getIntValueFromPxAttribute(
                    domElement,
                    padding,
                  );

                  if (itemPadding < overlapCheckHeight) {
                    // offsetComparator
                    // find out if there's enough place to get rid of overlap
                    // by adjusted the items width
                    var checkWidth = backwards
                      ? overlapCheckOffset - checkOffset
                      : checkOffset - overlapItemOffsetAnchor;
                    var currentWidth = getIntValueFromPxAttribute(
                      domElement,
                      widthAttribute,
                    );
                    var reducedWidth = currentWidth - checkWidth - 6;

                    if (reducedWidth > offsetComparator) {
                      availableWidth = Math.min(availableWidth, reducedWidth);
                      domElement.style(widthAttribute, (availableWidth + 'px'));
                    } else {
                      domElement.style(padding, ((overlapCheckHeight + 5) + 'px'));
                    }
                    updated++;
                  }
                }
              });

              // The optimizer might push all labels too far up. If all labels
              // have a minimum padding of more than 0, we'll shrink all offsets
              // back so the label with the smallest padding ends up directly
              // at the timeline.
              if (minPadding > 0) {
                nodes.forEach(function (overlapCheckNode, overlapCheckIndex) {
                  var itemRowCheck = index % nextCheck;
                  var distributionCheck =
                    (overlapCheckIndex + itemRowCheck) % nextCheck;

                  if (distributionCheck !== 0) {
                    return;
                  }

                  var overlapCheckDomElement = selectAll(
                    nodes[overlapCheckIndex],
                  );
                  var itemPadding = getIntValueFromPxAttribute(
                    overlapCheckDomElement,
                    padding,
                  );
                  overlapCheckDomElement.style(
                    padding,
                    ((itemPadding - minPadding) + 'px'),
                  );
                });
              }
            }
          }
        });
      });

      return updated;
    };

    var optimizerRuns = 0;
    var updated = 0;

    do {
      updated = runOptimizer(optimizerRuns);
      optimizerRuns++;

      // make sure we run a second optimizer call
      if (optimizerRuns === 1) {
        updated = 1;
      }
    } while (optimizerRuns < MAX_OPTIMIZER_RUNS && updated > 0);
  };

  function timeFormat$1(f) {
    if (f === '%Y-Q%Q') {
      var quarterFormatter = timeFormat(aggregateFormats.month);
      return function (d) {
        var formattedDate = quarterFormatter(d);
        var month = formattedDate.split('-')[1];
        var quarter = Math.ceil(parseInt(month) / 3);
        return formattedDate.split('-')[0] + '-Q' + quarter;
      };
    }
    return timeFormat(f);
  }

  function timeParse$1(f) {
    if (f === '%Y-Q%Q') {
      var quarterParser = timeParse(aggregateFormats.month);
      return function (d) {
        if (d.search('-Q') === -1) {
          var quarter = Math.ceil(parseInt(d.split('-')[1]) / 3);
          var quarterFirstMonthAsString = quarter * 3 - 2 + '';
          var quarterFirstMonthLeadingZero =
            quarterFirstMonthAsString.length < 2
              ? '0' + quarterFirstMonthAsString
              : quarterFirstMonthAsString;
          return quarterParser(
            d.split('-')[0] + '-' + quarterFirstMonthLeadingZero,
          );
        } else {
          var monthAsString = parseInt(d.split('-')[1][1]) * 3 + '';
          var monthLeadingZero =
            monthAsString.length < 2 ? '0' + monthAsString : monthAsString;
          return quarterParser(d.split('-')[0] + '-' + monthLeadingZero);
        }
      };
    }
    return timeParse(f);
  }

  function transform(aggregateFormat, data, mapping, parseTime) {
    var groupBy = function (d) {
      return aggregateFormat(parseTime(d[mapping.timestamp]));
    };

    // test for different data structures
    if (
      typeof mapping.category !== 'undefined' &&
      typeof mapping.entries !== 'undefined'
    ) {
      data = data.map(function (timeline, timelineIndex) {
        return {
          category: timeline[mapping.category],
          entries: getNestedEntries(timeline[mapping.entries], timelineIndex),
        };
      });
      return data;
    } else if (typeof data !== 'undefined' && !Array.isArray(data[0])) {
      data = [data];
    }

    function getNestedEntries(t, tI) {
      var nested = nest().key(groupBy).sortKeys(ascending$1).entries(t);
      return nested.map(function (d, dI) {
        d.index = dI;
        d.timelineIndex = tI;
        return d;
      });
    }

    return data.map(function (t, tI) {
      return getNestedEntries(t, tI);
    });
  }

  function milestones(selector) {

    function setTimeFormatDefaultLocale(locale) {
      defaultLocale(locale);
    }

    var distribution = 'top-bottom';

    function setDistribution(d) {
      distribution = d;
    }

    var optimizeLayout = false;

    function setOptimizeLayout(d) {
      optimizeLayout = d;
    }

    var orientation = 'horizontal';

    function setOrientation(d) {
      orientation = d;
      // purge the DOM to avoid layout issues when switching orientation
      select(selector).html('');
    }

    var parseTime = parseIso;

    function setParseTime(d) {
      parseTime = timeParse$1(d);
    }

    var mapping = {
      category: undefined,
      entries: undefined,
      timestamp: 'timestamp',
      text: 'text',
    };

    function assignMapping(d) {
      mapping = Object.assign(mapping, d);
    }

    var labelFormat;

    function setLabelFormat(d) {
      labelFormat = timeFormat$1(d);
    }

    setLabelFormat('%Y-%m-%d %H:%M');

    var range;

    function setRange(d) {
      if (Array.isArray(d) && d.length == 2) {
        range = d;
      }
    }

    var useLabels;

    function setUseLabels(d) {
      useLabels = d;
    }

    setUseLabels(true);

    // set callback for event mouseover
    var callBackMouseOver;

    function setEventMouseOverCallback(callback) {
      callBackMouseOver = callback;
    }

    function eventMouseOver(d) {
      if (typeof callBackMouseOver === 'function') {
        select(this).classed(cssEventHoverClass, true);
        callBackMouseOver(d);
      }
      return d;
    }

    // set callback for event mouseleave
    var callBackMouseLeave;

    function setEventMouseLeaveCallback(callback) {
      callBackMouseLeave = callback;
    }

    function eventMouseLeave(d) {
      if (typeof callBackMouseOver === 'function') {
        select(this).classed(cssEventHoverClass, false);
        callBackMouseLeave(d);
      }
      return d;
    }

    // set callback for event click
    var callbackClick;

    function setEventClickCallback(callback) {
      callbackClick = callback;
    }

    function eventClick(d) {
      if (typeof callbackClick === 'function') {
        callbackClick(d);
      }
      return d;
    }

    var aggregateFormat = timeFormat$1(aggregateFormats.minute);
    var aggregateFormatParse = timeParse$1(aggregateFormats.minute);

    function setAggregateBy(d) {
      aggregateFormat = timeFormat$1(aggregateFormats[d]);
      aggregateFormatParse = timeParse$1(aggregateFormats[d]);
      setLabelFormat(aggregateFormats[d]);
    }

    window.addEventListener('resize', function () {
        return window.requestAnimationFrame(function () {
          return render();
        });
      },
    );

    function render(data) {

      var widthAttribute = orientation === 'horizontal' ? 'width' : 'height';
      var marginTimeAttribute =
        orientation === 'horizontal' ? 'margin-left' : 'margin-top';
      var cssLineClass =
        orientation === 'horizontal'
          ? cssHorizontalLineClass
          : cssVerticalLineClass;
      var labelMaxWidth = orientation === 'horizontal' ? 180 : 100;

      var timelineSelection = select(selector).selectAll('.' + cssPrefix);
      var nestedData =
        typeof data !== 'undefined'
          ? transform(aggregateFormat, data, mapping, parseTime)
          : timelineSelection.data();
      var timeline = timelineSelection.data(nestedData);

      var timelineEnter = timeline
        .enter()
        .append('div')
        .attr('class', cssPrefix);

      timeline.exit().remove();

      // rightMargin compensates for the right most bullet position
      var rightMargin = 11;
      var selectorWidth =
        parseFloat(select(selector).style(widthAttribute)) - rightMargin;

      if (typeof mapping.category !== 'undefined') {
        timelineEnter
          .append('div')
          .attr('class', cssCategoryClass)
          .text(function (d) {
            return d.category;
          });

        timelineEnter
          .append('div')
          .attr('class', 'data-js-timeline')
          .append('div')
          .attr('class', cssLineClass);
      } else {
        timelineEnter.append('div').attr('class', cssLineClass);
      }
      var timelineMerge = timeline.merge(timelineEnter);

      var categoryLabelWidths = [];
      var categoryLabels = timelineMerge.selectAll('.' + cssCategoryClass);
      categoryLabels.each(function (d, i, node) {
        categoryLabelWidths.push(node[i].offsetWidth);
      });
      var maxCategoryLabelWidth = Math.round(max(categoryLabelWidths) || 0);
      var timelineLeftMargin = 10;
      var width = selectorWidth - maxCategoryLabelWidth - timelineLeftMargin;
      categoryLabels.style('width', maxCategoryLabelWidth + 'px');
      if (orientation === 'vertical') {
        categoryLabels.style('margin-left', '-50%');
        categoryLabels.style('text-align', 'center');
      }
      timelineMerge
        .selectAll('.data-js-timeline')
        .style(
          marginTimeAttribute,
          maxCategoryLabelWidth + timelineLeftMargin + 'px',
        );
      timelineMerge
        .selectAll('.' + cssLineClass)
        .style(widthAttribute, width + 'px');

      var groupSelector =
        typeof mapping.category === 'undefined'
          ? timelineMerge
          : timelineMerge.selectAll('.data-js-timeline');
      var groupSelection = groupSelector.selectAll('.' + cssGroupClass);

      var group = groupSelection.data(function (d) {
        return typeof mapping.category === 'undefined' ? d : d.entries;
      });

      var allKeys = nestedData.reduce(function (keys, timeline) {
        var t =
          typeof mapping.category === 'undefined' ? timeline : timeline.entries;
        t.map(function (d) {
          return keys.push(d.key);
        });
        return keys;
      }, []);

      var domain =
        typeof range !== 'undefined'
          ? range.map(aggregateFormatParse)
          : extent(allKeys, function (d) {
            return aggregateFormatParse(d);
          });

      var x = time()
        .rangeRound([0, width])
        // sets oldest and newest date as the scales domain
        .domain(domain);

      var groupEnter = group.enter().append('div').attr('class', cssGroupClass);

      group.exit().remove();

      groupEnter.append('div').attr('class', cssBulletClass);

      var groupMerge = groupEnter
        .merge(group)
        .style(marginTimeAttribute, function (d) {
          return x(aggregateFormatParse(d.key)) + 'px';
        });

      if (useLabels) {
        var label = groupMerge
          .selectAll('.' + cssLabelClass + '-' + orientation)
          .data(function (d) {
            return [d];
          });

        var labelMerge = label
          .enter()
          .append('div')
          .attr('class', cssLabelClass + '-' + orientation)
          .merge(label)
          // .classed(cssLastClass, (d) => {
          //   const mostRightPosition = Math.round(x.range()[1]);
          //   const currentPosition = x(aggregateFormatParse(d.key));
          //   return (
          //     mostRightPosition === currentPosition &&
          //     orientation === 'horizontal'
          //   );
          // })
          .classed(cssAboveClass + '-' + orientation, function (d) {
              return isAbove(d.index, distribution);
            },
          );

        var text = labelMerge
          .selectAll('.' + cssTextClass + '-' + orientation)
          .data(function (d) {
            return [d];
          });

        var textEnter = text
          .enter()
          .append('div')
          .attr('class', cssTextClass + '-' + orientation)
          .merge(text)
          .style(widthAttribute, function (d) {
            // calculate the available width
            var offset = x(aggregateFormatParse(d.key));
            // get the next and previous item on the same lane
            var nextItem;
            var previousItem;
            var itemNumTotal;
            var itemNum = d.index + 1;
            var nextCheck = distribution === 'top-bottom' ? 2 : 1;
            if (typeof mapping.category === 'undefined') {
              nextItem = nestedData[d.timelineIndex][d.index + nextCheck];
              previousItem = nestedData[d.timelineIndex][d.index - nextCheck];
              itemNumTotal = nestedData[d.timelineIndex].length;
            } else {
              nextItem = nestedData[d.timelineIndex].entries[d.index + nextCheck];
              previousItem =
                nestedData[d.timelineIndex].entries[d.index - nextCheck];
              itemNumTotal = nestedData[d.timelineIndex].entries.length;
            }

            var availableWidth;
            var compareItem1 =
              orientation === 'horizontal' ? nextItem : previousItem;
            var compareItem2 =
              orientation === 'horizontal' ? previousItem : nextItem;

            if (typeof compareItem1 !== 'undefined') {
              var offsetNextItem = x(aggregateFormatParse(compareItem1.key));
              availableWidth =
                orientation === 'horizontal'
                  ? offsetNextItem - offset
                  : offset - offsetNextItem;

              if (itemNumTotal - itemNum === 2) {
                availableWidth /= 2;
              }
            } else {
              if (itemNumTotal - itemNum === 1) {
                availableWidth =
                  orientation === 'horizontal' ? width - offset : offset;
              } else if (itemNumTotal - itemNum === 0) {
                if (typeof compareItem2 !== 'undefined') {
                  var offsetPreviousItem = x(
                    aggregateFormatParse(compareItem2.key),
                  );
                  availableWidth =
                    orientation === 'horizontal'
                      ? (width - offsetPreviousItem) / 2
                      : offsetPreviousItem / 2;
                } else {
                  availableWidth = width;
                }
              }
            }

            var labelRightMargin = 6;
            var availableWidthWithMargin = Math.max(
              0,
              availableWidth - labelRightMargin,
            );
            var finalWidth = Math.min(
              orientation === 'horizontal'
                ? labelMaxWidth
                : availableWidthWithMargin,
              availableWidthWithMargin,
            );
            return finalWidth + 'px';
          })
          .each(function (d) {
            var above = isAbove(d.index, distribution);

            var wrapper = select(this);
            wrapper.html(null);

            var element = wrapper.append('div').classed('wrapper', true);

            if (!above || orientation === 'vertical') {
              element
                .append('span')
                .classed(cssTitleClass, true)
                .text(labelFormat(aggregateFormatParse(d.key)));
              element.append('br');
            }

            d.values.map(function (v, i) {
              if (i > 0) {
                element.append('br');
              }

              var t = v[mapping.text];
              var item;
              // test if text is an image filename,
              // if so return an image tag with the filename as the source
              if (
                ['jpg', 'jpeg', 'gif', 'png'].indexOf(t.split('.').pop()) > -1
              ) {
                item = element
                  .append('img')
                  .classed('milestones-label', true)
                  .classed('milestones-image-label', true)
                  .attr('height', '100')
                  .attr('src', t);
              } else {
                item = element
                  .append('span')
                  .classed('milestones-label', true)
                  .classed('milestones-text-label', true)
                  .text(t);
              }

              item.datum({
                text: v[mapping.text],
                timestamp: v[mapping.timestamp],
                attributes: v, // original value of an object passed to the milestone
              });

              if (
                typeof callbackClick === 'function' ||
                typeof callBackMouseLeave === 'function' ||
                typeof callBackMouseOver === 'function'
              ) {
                item.classed(cssEventClass, true);
              }

              if (typeof callbackClick === 'function') {
                item.on('click', eventClick);
              }

              if (typeof callBackMouseLeave === 'function') {
                item.on('mouseleave', eventMouseLeave);
              }

              if (typeof callBackMouseOver === 'function') {
                item.on('mouseover', eventMouseOver);
              }
            });

            if (above && orientation === 'horizontal') {
              element.append('br');
              element
                .append('span')
                .classed(cssTitleClass, true)
                .text(labelFormat(aggregateFormatParse(d.key)));
            }
          });

        var textMerge = text.merge(textEnter);

        textMerge.style('padding-top', '0px').style('padding-bottom', '0px');

        if (optimizeLayout) {
          optimize(
            aggregateFormatParse,
            distribution,
            labelMaxWidth,
            mapping,
            nestedData,
            orientation,
            textMerge,
            width,
            widthAttribute,
            x,
          );
        }
      } else {
        groupMerge.selectAll('.' + cssLabelClass + '-' + orientation).remove();
      }

      // finally, adjust offset, height and width of the whole timeline
      timelineMerge.each(function (d, i, nodes) {
        var margin = 10;
        var maxAboveHeight = max(
          select(nodes[i]).selectAll('* .' + cssAboveClass + '-' + orientation)
            ._groups[0],
          function (d) {
            return d.offsetHeight;
          },
        );
        var maxBelowHeight = max(
          select(nodes[i])
            .selectAll('* :not(.' + cssAboveClass + '-' + orientation + ')')
            ._groups[0],
          function (d) {
            return d.offsetHeight;
          },
        );
        var height = max(
          select(nodes[i])
            .selectAll('* :not(.' + cssAboveClass + '-' + orientation + ')')
            ._groups[0],
          function (d) {
            return d.clientHeight;
          },
        );

        if (orientation === 'horizontal') {
          select(nodes[i])
            .style('margin-top', (maxAboveHeight || 0) - margin + 'px')
            .style('height', height - (maxAboveHeight || 0) + margin * 4 + (maxBelowHeight || 0) + 'px');
        } else {
          var percent =
            typeof mapping.category !== 'undefined'
              ? Math.round(100 / (nestedData.length + 1)) * (i + 1)
              : '50';
          select(nodes[i])
            .style('margin-top', '50px')
            .style('margin-left', percent + '%')
            .style('position', 'absolute');
        }
      });
    }

    return api({
      timeFormatDefaultLocale: setTimeFormatDefaultLocale,
      aggregateBy: setAggregateBy,
      mapping: assignMapping,
      optimize: setOptimizeLayout,
      orientation: setOrientation,
      distribution: setDistribution,
      parseTime: setParseTime,
      labelFormat: setLabelFormat,
      useLabels: setUseLabels,
      range: setRange,
      render: render,
      onEventClick: setEventClickCallback,
      onEventMouseLeave: setEventMouseLeaveCallback,
      onEventMouseOver: setEventMouseOverCallback,
    });
  }

  return milestones;

})));
//# sourceMappingURL=d3-milestones.js.map

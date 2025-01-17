!function() {
    'use strict';
    function VNode() {}
    function h(nodeName, attributes) {
        var lastSimple, child, simple, i, children = [];
        for (i = arguments.length; i-- > 2; ) stack.push(arguments[i]);
        if (attributes && null != attributes.children) {
            if (!stack.length) stack.push(attributes.children);
            delete attributes.children;
        }
        while (stack.length) if ((child = stack.pop()) && void 0 !== child.pop) for (i = child.length; i--; ) stack.push(child[i]); else {
            if ('boolean' == typeof child) child = null;
            if (simple = 'function' != typeof nodeName) if (null == child) child = ''; else if ('number' == typeof child) child = String(child); else if ('string' != typeof child) simple = !1;
            if (simple && lastSimple) children[children.length - 1] += child; else if (0 === children.length) children = [ child ]; else children.push(child);
            lastSimple = simple;
        }
        var p = new VNode();
        p.nodeName = nodeName;
        p.children = children;
        p.attributes = null == attributes ? void 0 : attributes;
        p.key = null == attributes ? void 0 : attributes.key;
        if (void 0 !== options.vnode) options.vnode(p);
        return p;
    }
    function cssToDom(css) {
        var node = document.createElement('style');
        node.textContent = css;
        return node;
    }
    function npn(str) {
        return str.replace(/-(\w)/g, function($, $1) {
            return $1.toUpperCase();
        });
    }
    function extend(obj, props) {
        for (var i in props) obj[i] = props[i];
        return obj;
    }
    function applyRef(ref, value) {
        if (null != ref) if ('function' == typeof ref) ref(value); else ref.current = value;
    }
    function isArray(obj) {
        return '[object Array]' === Object.prototype.toString.call(obj);
    }
    function nProps(props) {
        if (!props || isArray(props)) return {};
        var result = {};
        Object.keys(props).forEach(function(key) {
            result[key] = props[key].value;
        });
        return result;
    }
    function getUse(data, paths) {
        var obj = [];
        paths.forEach(function(path, index) {
            var isPath = 'string' == typeof path;
            if (isPath) obj[index] = getTargetByPath(data, path); else {
                var key = Object.keys(path)[0];
                var value = path[key];
                if ('string' == typeof value) obj[index] = getTargetByPath(data, value); else {
                    var tempPath = value[0];
                    if ('string' == typeof tempPath) {
                        var tempVal = getTargetByPath(data, tempPath);
                        obj[index] = value[1] ? value[1](tempVal) : tempVal;
                    } else {
                        var args = [];
                        tempPath.forEach(function(path) {
                            args.push(getTargetByPath(data, path));
                        });
                        obj[index] = value[1].apply(null, args);
                    }
                }
                obj[key] = obj[index];
            }
        });
        return obj;
    }
    function getTargetByPath(origin, path) {
        var arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.');
        var current = origin;
        for (var i = 0, len = arr.length; i < len; i++) current = current[arr[i]];
        return current;
    }
    function hyphenate(str) {
        return str.replace(hyphenateRE, '-$1').toLowerCase();
    }
    function isSameNodeType(node, vnode, hydrating) {
        if ('string' == typeof vnode || 'number' == typeof vnode) return void 0 !== node.splitText;
        if ('string' == typeof vnode.nodeName) return !node._componentConstructor && isNamedNode(node, vnode.nodeName); else if ('function' == typeof vnode.nodeName) return options.mapping[node.nodeName.toLowerCase()] === vnode.nodeName;
        return hydrating || node._componentConstructor === vnode.nodeName;
    }
    function isNamedNode(node, nodeName) {
        return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
    }
    function createNode(nodeName, isSvg) {
        var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
        node.normalizedNodeName = nodeName;
        return node;
    }
    function removeNode(node) {
        var parentNode = node.parentNode;
        if (parentNode) parentNode.removeChild(node);
    }
    function setAccessor(node, name, old, value, isSvg) {
        if ('className' === name) name = 'class';
        if ('key' === name) ; else if ('ref' === name) {
            applyRef(old, null);
            applyRef(value, node);
        } else if ('class' === name && !isSvg) node.className = value || ''; else if ('style' === name) {
            if (!value || 'string' == typeof value || 'string' == typeof old) node.style.cssText = value || '';
            if (value && 'object' == typeof value) {
                if ('string' != typeof old) for (var i in old) if (!(i in value)) node.style[i] = '';
                for (var i in value) node.style[i] = 'number' == typeof value[i] && !1 === IS_NON_DIMENSIONAL.test(i) ? value[i] + 'px' : value[i];
            }
        } else if ('dangerouslySetInnerHTML' === name) {
            if (value) node.innerHTML = value.__html || '';
        } else if ('o' == name[0] && 'n' == name[1]) {
            var useCapture = name !== (name = name.replace(/Capture$/, ''));
            name = name.toLowerCase().substring(2);
            if (value) {
                if (!old) {
                    node.addEventListener(name, eventProxy, useCapture);
                    if ('tap' == name) {
                        node.addEventListener('touchstart', touchStart, useCapture);
                        node.addEventListener('touchend', touchEnd, useCapture);
                    }
                }
            } else {
                node.removeEventListener(name, eventProxy, useCapture);
                if ('tap' == name) {
                    node.removeEventListener('touchstart', touchStart, useCapture);
                    node.removeEventListener('touchend', touchEnd, useCapture);
                }
            }
            (node.__l || (node.__l = {}))[name] = value;
        } else if ('list' !== name && 'type' !== name && 'css' !== name && !isSvg && name in node && '' !== value) {
            try {
                node[name] = null == value ? '' : value;
            } catch (e) {}
            if ((null == value || !1 === value) && 'spellcheck' != name) node.pureRemoveAttribute ? node.pureRemoveAttribute(name) : node.removeAttribute(name);
        } else {
            var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
            if (null == value || !1 === value) if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase()); else node.pureRemoveAttribute ? node.pureRemoveAttribute(name) : node.removeAttribute(name); else if ('function' != typeof value) if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value); else node.pureSetAttribute ? node.pureSetAttribute(name, value) : node.setAttribute(name, value);
        }
    }
    function eventProxy(e) {
        return this.__l[e.type](options.event && options.event(e) || e);
    }
    function touchStart(e) {
        this.F = e.touches[0].pageX;
        this.G = e.touches[0].pageY;
        this.H = document.body.scrollTop;
    }
    function touchEnd(e) {
        if (Math.abs(e.changedTouches[0].pageX - this.F) < 30 && Math.abs(e.changedTouches[0].pageY - this.G) < 30 && Math.abs(document.body.scrollTop - this.H) < 30) this.dispatchEvent(new CustomEvent('tap', {
            detail: e
        }));
    }
    function diff(dom, vnode, context, mountAll, parent, componentRoot) {
        var ret;
        if (!diffLevel++) {
            isSvgMode = null != parent && void 0 !== parent.ownerSVGElement;
            hydrating = null != dom && !('prevProps' in dom);
        }
        if (isArray(vnode)) if (parent) {
            var styles = parent.querySelectorAll('style');
            styles.forEach(function(s) {
                parent.removeChild(s);
            });
            innerDiffNode(parent, vnode);
            for (var i = styles.length - 1; i >= 0; i--) parent.firstChild ? parent.insertBefore(styles[i], parent.firstChild) : parent.appendChild(style[i]);
        } else {
            ret = [];
            vnode.forEach(function(item, index) {
                var ele = idiff(0 === index ? dom : null, item, context, mountAll, componentRoot);
                ret.push(ele);
                parent && parent.appendChild(ele);
            });
        } else {
            if (isArray(dom)) dom.forEach(function(one, index) {
                if (0 === index) ret = idiff(one, vnode, context, mountAll, componentRoot); else recollectNodeTree(one, !1);
            }); else ret = idiff(dom, vnode, context, mountAll, componentRoot);
            if (parent && ret.parentNode !== parent) parent.appendChild(ret);
        }
        if (!--diffLevel) hydrating = !1;
        return ret;
    }
    function idiff(dom, vnode, context, mountAll, componentRoot) {
        if (dom && vnode && dom.props) dom.props.children = vnode.children;
        var out = dom, prevSvgMode = isSvgMode;
        if (null == vnode || 'boolean' == typeof vnode) vnode = '';
        if ('string' == typeof vnode || 'number' == typeof vnode) {
            if (dom && void 0 !== dom.splitText && dom.parentNode && (!dom._component || componentRoot)) {
                if (dom.nodeValue != vnode) dom.nodeValue = vnode;
            } else {
                out = document.createTextNode(vnode);
                if (dom) {
                    if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                    recollectNodeTree(dom, !0);
                }
            }
            out.__p = !0;
            return out;
        }
        var vnodeName = vnode.nodeName;
        if ('function' == typeof vnodeName) for (var key in options.mapping) if (options.mapping[key] === vnodeName) {
            vnodeName = key;
            vnode.nodeName = key;
            break;
        }
        isSvgMode = 'svg' === vnodeName ? !0 : 'foreignObject' === vnodeName ? !1 : isSvgMode;
        vnodeName = String(vnodeName);
        if (!dom || !isNamedNode(dom, vnodeName)) {
            out = createNode(vnodeName, isSvgMode);
            if (dom) {
                while (dom.firstChild) out.appendChild(dom.firstChild);
                if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                recollectNodeTree(dom, !0);
            }
        }
        var fc = out.firstChild, props = out.__p, vchildren = vnode.children;
        if (null == props) {
            props = out.__p = {};
            for (var a = out.attributes, i = a.length; i--; ) props[a[i].name] = a[i].value;
        }
        if (!hydrating && vchildren && 1 === vchildren.length && 'string' == typeof vchildren[0] && null != fc && void 0 !== fc.splitText && null == fc.nextSibling) {
            if (fc.nodeValue != vchildren[0]) fc.nodeValue = vchildren[0];
        } else if (vchildren && vchildren.length || null != fc) if ('WeElement' != out.constructor.is || !out.constructor.noSlot) innerDiffNode(out, vchildren, context, mountAll, hydrating || null != props.dangerouslySetInnerHTML);
        diffAttributes(out, vnode.attributes, props);
        if (out.props) out.props.children = vnode.children;
        isSvgMode = prevSvgMode;
        return out;
    }
    function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
        var j, c, f, vchild, child, originalChildren = dom.childNodes, children = [], keyed = {}, keyedLen = 0, min = 0, len = originalChildren.length, childrenLen = 0, vlen = vchildren ? vchildren.length : 0;
        if (0 !== len) for (var i = 0; i < len; i++) {
            var _child = originalChildren[i], props = _child.__p, key = vlen && props ? _child._component ? _child._component.__k : props.key : null;
            if (null != key) {
                keyedLen++;
                keyed[key] = _child;
            } else if (props || (void 0 !== _child.splitText ? isHydrating ? _child.nodeValue.trim() : !0 : isHydrating)) children[childrenLen++] = _child;
        }
        if (0 !== vlen) for (var i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            var key = vchild.key;
            if (null != key) {
                if (keyedLen && void 0 !== keyed[key]) {
                    child = keyed[key];
                    keyed[key] = void 0;
                    keyedLen--;
                }
            } else if (!child && min < childrenLen) for (j = min; j < childrenLen; j++) if (void 0 !== children[j] && isSameNodeType(c = children[j], vchild, isHydrating)) {
                child = c;
                children[j] = void 0;
                if (j === childrenLen - 1) childrenLen--;
                if (j === min) min++;
                break;
            }
            child = idiff(child, vchild, context, mountAll);
            f = originalChildren[i];
            if (child && child !== dom && child !== f) if (null == f) dom.appendChild(child); else if (child === f.nextSibling) removeNode(f); else dom.insertBefore(child, f);
        }
        if (keyedLen) for (var i in keyed) if (void 0 !== keyed[i]) recollectNodeTree(keyed[i], !1);
        while (min <= childrenLen) if (void 0 !== (child = children[childrenLen--])) recollectNodeTree(child, !1);
    }
    function recollectNodeTree(node, unmountOnly) {
        if (null != node.__p && node.__p.ref) if ('function' == typeof node.__p.ref) node.__p.ref(null); else if (node.__p.ref.current) node.__p.ref.current = null;
        if (!1 === unmountOnly || null == node.__p) removeNode(node);
        removeChildren(node);
    }
    function removeChildren(node) {
        node = node.lastChild;
        while (node) {
            var next = node.previousSibling;
            recollectNodeTree(node, !0);
            node = next;
        }
    }
    function diffAttributes(dom, attrs, old) {
        var name;
        var update = !1;
        var isWeElement = dom.update;
        var oldClone;
        if (dom.receiveProps) oldClone = Object.assign({}, old);
        for (name in old) if ((!attrs || null == attrs[name]) && null != old[name]) {
            setAccessor(dom, name, old[name], old[name] = void 0, isSvgMode);
            if (isWeElement) {
                delete dom.props[name];
                update = !0;
            }
        }
        for (name in attrs) if (isWeElement && 'object' == typeof attrs[name] && 'ref' !== name) {
            if ('style' === name) setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
            dom.props[npn(name)] = attrs[name];
            update = !0;
        } else if (!('children' === name || 'innerHTML' === name || name in old && attrs[name] === ('value' === name || 'checked' === name ? dom[name] : old[name]))) {
            setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
            if (isWeElement) {
                dom.props[npn(name)] = attrs[name];
                update = !0;
            }
        }
        if (isWeElement && dom.parentNode) if (update || dom.P || dom.children.length > 0 || dom.store && !dom.store.data) if (!1 !== dom.receiveProps(dom.props, oldClone)) dom.update();
    }
    function tick(fn, scope) {
        callbacks.push({
            fn: fn,
            scope: scope
        });
    }
    function fireTick() {
        callbacks.forEach(function(item) {
            item.fn.call(item.scope);
        });
        nextTickCallback.forEach(function(nextItem) {
            nextItem.fn.call(nextItem.scope);
        });
        nextTickCallback.length = 0;
    }
    function nextTick(fn, scope) {
        nextTickCallback.push({
            fn: fn,
            scope: scope
        });
    }
    function observe(target) {
        target.observe = !0;
    }
    function proxyUpdate(ele) {
        var timeout = null;
        ele.data = new JSONPatcherProxy(ele.data).observe(!1, function() {
            if (!ele.J) if (ele.constructor.mergeUpdate) {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    ele.update();
                    fireTick();
                }, 0);
            } else {
                ele.update();
                fireTick();
            }
        });
    }
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }
    function _possibleConstructorReturn(self, call) {
        if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return call && ("object" == typeof call || "function" == typeof call) ? call : self;
    }
    function _inherits(subClass, superClass) {
        if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: !1,
                writable: !0,
                configurable: !0
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    function define(name, ctor) {
        if ('WeElement' === ctor.is) {
            if (options.mapping[name]) return;
            customElements.define(name, ctor);
            options.mapping[name] = ctor;
            if (ctor.use) ctor.updatePath = getPath(ctor.use); else if (ctor.data) ctor.updatePath = getUpdatePath(ctor.data);
        } else {
            var Element = function(_WeElement) {
                function Element() {
                    var _temp, _this, _ret;
                    _classCallCheck(this, Element);
                    for (var _len = arguments.length, args = Array(_len), key = 0; key < _len; key++) args[key] = arguments[key];
                    return _ret = (_temp = _this = _possibleConstructorReturn(this, _WeElement.call.apply(_WeElement, [ this ].concat(args))), 
                    _this.C = 0, _this.D = {}, _this.K = null, _temp), _possibleConstructorReturn(_this, _ret);
                }
                _inherits(Element, _WeElement);
                Element.prototype.render = function(props, data) {
                    return ctor.call(this, props, data);
                };
                Element.prototype.beforeRender = function() {
                    this.C = 0;
                };
                Element.prototype.useCss = function(css) {
                    if (css !== this.K) {
                        this.K = css;
                        var style = this.shadowRoot.querySelector('style');
                        style && this.shadowRoot.removeChild(style);
                        this.shadowRoot.appendChild(cssToDom(css));
                    }
                };
                Element.prototype.useData = function(data) {
                    return this.use({
                        data: data
                    });
                };
                Element.prototype.use = function(option) {
                    var _this2 = this;
                    this.C++;
                    var updater = function updater(newValue) {
                        var item = _this2.D[updater.id];
                        item.data = newValue;
                        _this2.update();
                        item.effect && item.effect();
                    };
                    updater.id = this.C;
                    if (!this.B) {
                        this.D[this.C] = option;
                        return [ option.data, updater ];
                    }
                    return [ this.D[this.C].data, updater ];
                };
                Element.prototype.installed = function() {
                    this.B = !0;
                };
                return Element;
            }(WeElement);
            customElements.define(name, Element);
        }
    }
    function getPath(obj) {
        if ('[object Array]' === Object.prototype.toString.call(obj)) {
            var result = {};
            obj.forEach(function(item) {
                if ('string' == typeof item) result[item] = !0; else {
                    var tempPath = item[Object.keys(item)[0]];
                    if ('string' == typeof tempPath) result[tempPath] = !0; else if ('string' == typeof tempPath[0]) result[tempPath[0]] = !0; else tempPath[0].forEach(function(path) {
                        return result[path] = !0;
                    });
                }
            });
            return result;
        } else return getUpdatePath(obj);
    }
    function getUpdatePath(data) {
        var result = {};
        dataToPath(data, result);
        return result;
    }
    function dataToPath(data, result) {
        Object.keys(data).forEach(function(key) {
            result[key] = !0;
            var type = Object.prototype.toString.call(data[key]);
            if ('[object Object]' === type) _objToPath(data[key], key, result); else if ('[object Array]' === type) _arrayToPath(data[key], key, result);
        });
    }
    function _objToPath(data, path, result) {
        Object.keys(data).forEach(function(key) {
            result[path + '.' + key] = !0;
            delete result[path];
            var type = Object.prototype.toString.call(data[key]);
            if ('[object Object]' === type) _objToPath(data[key], path + '.' + key, result); else if ('[object Array]' === type) _arrayToPath(data[key], path + '.' + key, result);
        });
    }
    function _arrayToPath(data, path, result) {
        data.forEach(function(item, index) {
            result[path + '[' + index + ']'] = !0;
            delete result[path];
            var type = Object.prototype.toString.call(item);
            if ('[object Object]' === type) _objToPath(item, path + '[' + index + ']', result); else if ('[object Array]' === type) _arrayToPath(item, path + '[' + index + ']', result);
        });
    }
    function _classCallCheck$1(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }
    function _possibleConstructorReturn$1(self, call) {
        if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return call && ("object" == typeof call || "function" == typeof call) ? call : self;
    }
    function _inherits$1(subClass, superClass) {
        if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: !1,
                writable: !0,
                configurable: !0
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    function render(vnode, parent, store) {
        parent = 'string' == typeof parent ? document.querySelector(parent) : parent;
        if (store) {
            store.instances = [];
            extendStoreUpate(store);
            store.data = new JSONPatcherProxy(store.data).observe(!1, function(patch) {
                var patchs = {};
                if ('remove' === patch.op) {
                    var kv = getArrayPatch(patch.path, store);
                    patchs[kv.k] = kv.v;
                    update(patchs, store);
                } else {
                    var key = fixPath(patch.path);
                    patchs[key] = patch.value;
                    update(patchs, store);
                }
            });
            parent.store = store;
        }
        return diff(null, vnode, {}, !1, parent, !1);
    }
    function update(patch, store) {
        store.update(patch);
    }
    function extendStoreUpate(store) {
        store.update = function(patch) {
            var _this = this;
            var updateAll = matchGlobalData(this.globalData, patch);
            if (Object.keys(patch).length > 0) {
                this.instances.forEach(function(instance) {
                    if (updateAll || _this.updateAll || instance.constructor.updatePath && needUpdate(patch, instance.constructor.updatePath) || instance.M && needUpdate(patch, instance.M)) {
                        if (instance.constructor.use) instance.use = getUse(store.data, instance.constructor.use); else if (instance.initUse) instance.use = getUse(store.data, instance.initUse());
                        instance.update();
                    }
                });
                this.onChange && this.onChange(patch);
            }
        };
    }
    function matchGlobalData(globalData, diffResult) {
        if (!globalData) return !1;
        for (var keyA in diffResult) {
            if (globalData.indexOf(keyA) > -1) return !0;
            for (var i = 0, len = globalData.length; i < len; i++) if (includePath(keyA, globalData[i])) return !0;
        }
        return !1;
    }
    function needUpdate(diffResult, updatePath) {
        for (var keyA in diffResult) {
            if (updatePath[keyA]) return !0;
            for (var keyB in updatePath) if (includePath(keyA, keyB)) return !0;
        }
        return !1;
    }
    function includePath(pathA, pathB) {
        if (0 === pathA.indexOf(pathB)) {
            var next = pathA.substr(pathB.length, 1);
            if ('[' === next || '.' === next) return !0;
        }
        return !1;
    }
    function fixPath(path) {
        var mpPath = '';
        var arr = path.replace('/', '').split('/');
        arr.forEach(function(item, index) {
            if (index) if (isNaN(Number(item))) mpPath += '.' + item; else mpPath += '[' + item + ']'; else mpPath += item;
        });
        return mpPath;
    }
    function getArrayPatch(path, store) {
        var arr = path.replace('/', '').split('/');
        var current = store.data[arr[0]];
        for (var i = 1, len = arr.length; i < len - 1; i++) current = current[arr[i]];
        return {
            k: fixArrPath(path),
            v: current
        };
    }
    function fixArrPath(path) {
        var mpPath = '';
        var arr = path.replace('/', '').split('/');
        var len = arr.length;
        arr.forEach(function(item, index) {
            if (index < len - 1) if (index) if (isNaN(Number(item))) mpPath += '.' + item; else mpPath += '[' + item + ']'; else mpPath += item;
        });
        return mpPath;
    }
    function tag(name, pure) {
        return function(target) {
            target.pure = pure;
            define(name, target);
        };
    }
    function cloneElement(vnode, props) {
        return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
    }
    function getHost(ele) {
        var p = ele.parentNode;
        while (p) if (p.host) return p.host; else if (p.shadowRoot && p.shadowRoot.host) return p.shadowRoot.host; else p = p.parentNode;
    }
    function rpx(str) {
        return str.replace(/([1-9]\d*|0)(\.\d*)*rpx/g, function(a, b) {
            return window.innerWidth * Number(b) / 750 + 'px';
        });
    }
    function _classCallCheck$2(instance, Constructor) {
        if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
    }
    function _possibleConstructorReturn$2(self, call) {
        if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return call && ("object" == typeof call || "function" == typeof call) ? call : self;
    }
    function _inherits$2(subClass, superClass) {
        if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: !1,
                writable: !0,
                configurable: !0
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    function classNames() {
        var classes = [];
        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg) {
                var argType = typeof arg;
                if ('string' === argType || 'number' === argType) classes.push(arg); else if (Array.isArray(arg) && arg.length) {
                    var inner = classNames.apply(null, arg);
                    if (inner) classes.push(inner);
                } else if ('object' === argType) for (var key in arg) if (hasOwn.call(arg, key) && arg[key]) classes.push(key);
            }
        }
        return classes.join(' ');
    }
    function extractClass() {
        var _Array$prototype$slic = Array.prototype.slice.call(arguments, 0), props = _Array$prototype$slic[0], args = _Array$prototype$slic.slice(1);
        if (props.class) {
            args.unshift(props.class);
            delete props.class;
        } else if (props.className) {
            args.unshift(props.className);
            delete props.className;
        }
        if (args.length > 0) return {
            class: classNames.apply(null, args)
        };
    }
    function o(obj) {
        return JSON.stringify(obj);
    }
    function htm(t) {
        var r = n(this, e(t), arguments, []);
        return r.length > 1 ? r : r[0];
    }
    function createRef() {
        return {};
    }
    var options = {
        store: null,
        root: function() {
            if ('object' != typeof global || !global || global.Math !== Math || global.Array !== Array) return self || window || global || function() {
                return this;
            }(); else return global;
        }(),
        mapping: {}
    };
    var stack = [];
    !function() {
        if (void 0 !== window.Reflect && void 0 !== window.customElements && !window.customElements.hasOwnProperty('polyfillWrapFlushCallback')) {
            var BuiltInHTMLElement = HTMLElement;
            window.HTMLElement = function() {
                return Reflect.construct(BuiltInHTMLElement, [], this.constructor);
            };
            HTMLElement.prototype = BuiltInHTMLElement.prototype;
            HTMLElement.prototype.constructor = HTMLElement;
            Object.setPrototypeOf(HTMLElement, BuiltInHTMLElement);
        }
    }();
    'function' == typeof Promise ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;
    var hyphenateRE = /\B([A-Z])/g;
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
    var diffLevel = 0;
    var isSvgMode = !1;
    var hydrating = !1;
    var JSONPatcherProxy = function() {
        function deepClone(obj) {
            switch (typeof obj) {
              case 'object':
                return JSON.parse(JSON.stringify(obj));

              case 'undefined':
                return null;

              default:
                return obj;
            }
        }
        function escapePathComponent(str) {
            if (-1 == str.indexOf('/') && -1 == str.indexOf('~')) return str; else return str.replace(/~/g, '~0').replace(/\//g, '~1');
        }
        function findObjectPath(instance, obj) {
            var pathComponents = [];
            var parentAndPath = instance.parenthoodMap.get(obj);
            while (parentAndPath && parentAndPath.path) {
                pathComponents.unshift(parentAndPath.path);
                parentAndPath = instance.parenthoodMap.get(parentAndPath.parent);
            }
            if (pathComponents.length) {
                var path = pathComponents.join('/');
                return '/' + path;
            }
            return '';
        }
        function setTrap(instance, target, key, newValue) {
            var parentPath = findObjectPath(instance, target);
            var destinationPropKey = parentPath + '/' + escapePathComponent(key);
            if (instance.proxifiedObjectsMap.has(newValue)) {
                var newValueOriginalObject = instance.proxifiedObjectsMap.get(newValue);
                instance.parenthoodMap.set(newValueOriginalObject.originalObject, {
                    parent: target,
                    path: key
                });
            }
            var revokableInstance = instance.proxifiedObjectsMap.get(newValue);
            if (revokableInstance && !instance.isProxifyingTreeNow) revokableInstance.inherited = !0;
            if (newValue && 'object' == typeof newValue && !instance.proxifiedObjectsMap.has(newValue)) {
                instance.parenthoodMap.set(newValue, {
                    parent: target,
                    path: key
                });
                newValue = instance.A(target, newValue, key);
            }
            var operation = {
                op: 'remove',
                path: destinationPropKey
            };
            if (void 0 === newValue) {
                if (!Array.isArray(target) && !target.hasOwnProperty(key)) return Reflect.set(target, key, newValue);
                if (Array.isArray(target)) operation.op = 'replace', operation.value = null;
                var oldValue = instance.proxifiedObjectsMap.get(target[key]);
                if (oldValue) {
                    instance.parenthoodMap.delete(target[key]);
                    instance.disableTrapsForProxy(oldValue);
                    instance.proxifiedObjectsMap.delete(oldValue);
                }
            } else {
                if (Array.isArray(target) && !Number.isInteger(+key.toString())) {
                    if ('length' != key) console.warn('JSONPatcherProxy noticed a non-integer prop was set for an array. This will not emit a patch');
                    return Reflect.set(target, key, newValue);
                }
                operation.op = 'add';
                if (target.hasOwnProperty(key)) if (void 0 !== target[key] || Array.isArray(target)) operation.op = 'replace';
                operation.value = newValue;
            }
            operation.oldValue = target[key];
            var reflectionResult = Reflect.set(target, key, newValue);
            instance.defaultCallback(operation);
            return reflectionResult;
        }
        function deleteTrap(instance, target, key) {
            if (void 0 !== target[key]) {
                var parentPath = findObjectPath(instance, target);
                var destinationPropKey = parentPath + '/' + escapePathComponent(key);
                var revokableProxyInstance = instance.proxifiedObjectsMap.get(target[key]);
                if (revokableProxyInstance) if (revokableProxyInstance.inherited) revokableProxyInstance.inherited = !1; else {
                    instance.parenthoodMap.delete(revokableProxyInstance.originalObject);
                    instance.disableTrapsForProxy(revokableProxyInstance);
                    instance.proxifiedObjectsMap.delete(target[key]);
                }
                var reflectionResult = Reflect.deleteProperty(target, key);
                instance.defaultCallback({
                    op: 'remove',
                    path: destinationPropKey
                });
                return reflectionResult;
            }
        }
        function resume() {
            var _this = this;
            this.defaultCallback = function(operation) {
                _this.isRecording && _this.patches.push(operation);
                _this.userCallback && _this.userCallback(operation);
            };
            this.isObserving = !0;
        }
        function pause() {
            this.defaultCallback = function() {};
            this.isObserving = !1;
        }
        function JSONPatcherProxy(root, showDetachedWarning) {
            this.isProxifyingTreeNow = !1;
            this.isObserving = !1;
            this.proxifiedObjectsMap = new Map();
            this.parenthoodMap = new Map();
            if ('boolean' != typeof showDetachedWarning) showDetachedWarning = !0;
            this.showDetachedWarning = showDetachedWarning;
            this.originalObject = root;
            this.cachedProxy = null;
            this.isRecording = !1;
            this.userCallback;
            this.resume = resume.bind(this);
            this.pause = pause.bind(this);
        }
        JSONPatcherProxy.deepClone = deepClone;
        JSONPatcherProxy.escapePathComponent = escapePathComponent;
        JSONPatcherProxy.prototype.generateProxyAtPath = function(parent, obj, path) {
            var _this2 = this;
            if (!obj) return obj;
            var traps = {
                set: function(target, key, value, receiver) {
                    return setTrap(_this2, target, key, value);
                },
                deleteProperty: function(target, key) {
                    return deleteTrap(_this2, target, key);
                }
            };
            var revocableInstance = Proxy.revocable(obj, traps);
            revocableInstance.trapsInstance = traps;
            revocableInstance.originalObject = obj;
            this.parenthoodMap.set(obj, {
                parent: parent,
                path: path
            });
            this.proxifiedObjectsMap.set(revocableInstance.proxy, revocableInstance);
            return revocableInstance.proxy;
        };
        JSONPatcherProxy.prototype.A = function(parent, root, path) {
            for (var key in root) if (root.hasOwnProperty(key)) if (root[key] instanceof Object) root[key] = this.A(root, root[key], escapePathComponent(key));
            return this.generateProxyAtPath(parent, root, path);
        };
        JSONPatcherProxy.prototype.proxifyObjectTree = function(root) {
            this.pause();
            this.isProxifyingTreeNow = !0;
            var proxifiedObject = this.A(void 0, root, '');
            this.isProxifyingTreeNow = !1;
            this.resume();
            return proxifiedObject;
        };
        JSONPatcherProxy.prototype.disableTrapsForProxy = function(revokableProxyInstance) {
            if (this.showDetachedWarning) {
                var message = "You're accessing an object that is detached from the observedObject tree, see https://github.com/Palindrom/JSONPatcherProxy#detached-objects";
                revokableProxyInstance.trapsInstance.set = function(targetObject, propKey, newValue) {
                    console.warn(message);
                    return Reflect.set(targetObject, propKey, newValue);
                };
                revokableProxyInstance.trapsInstance.set = function(targetObject, propKey, newValue) {
                    console.warn(message);
                    return Reflect.set(targetObject, propKey, newValue);
                };
                revokableProxyInstance.trapsInstance.deleteProperty = function(targetObject, propKey) {
                    return Reflect.deleteProperty(targetObject, propKey);
                };
            } else {
                delete revokableProxyInstance.trapsInstance.set;
                delete revokableProxyInstance.trapsInstance.get;
                delete revokableProxyInstance.trapsInstance.deleteProperty;
            }
        };
        JSONPatcherProxy.prototype.observe = function(record, callback) {
            if (!record && !callback) throw new Error('You need to either record changes or pass a callback');
            this.isRecording = record;
            this.userCallback = callback;
            if (record) this.patches = [];
            this.cachedProxy = this.proxifyObjectTree(this.originalObject);
            return this.cachedProxy;
        };
        JSONPatcherProxy.prototype.generate = function() {
            if (!this.isRecording) throw new Error('You should set record to true to get patches later');
            return this.patches.splice(0, this.patches.length);
        };
        JSONPatcherProxy.prototype.revoke = function() {
            this.proxifiedObjectsMap.forEach(function(el) {
                el.revoke();
            });
        };
        JSONPatcherProxy.prototype.disableTraps = function() {
            this.proxifiedObjectsMap.forEach(this.disableTrapsForProxy, this);
        };
        return JSONPatcherProxy;
    }();
    var callbacks = [];
    var nextTickCallback = [];
    var id = 0;
    var WeElement = function(_HTMLElement) {
        function WeElement() {
            _classCallCheck$1(this, WeElement);
            var _this = _possibleConstructorReturn$1(this, _HTMLElement.call(this));
            _this.props = Object.assign(nProps(_this.constructor.props), _this.constructor.defaultProps);
            _this.elementId = id++;
            _this.data = {};
            return _this;
        }
        _inherits$1(WeElement, _HTMLElement);
        WeElement.prototype.connectedCallback = function() {
            var p = this.parentNode;
            while (p && !this.store) {
                this.store = p.store;
                p = p.parentNode || p.host;
            }
            if (this.store) this.store.instances.push(this);
            if (this.initUse) {
                var use = this.initUse();
                this.M = getPath(use);
                this.use = getUse(this.store.data, use);
            } else this.constructor.use && (this.use = getUse(this.store.data, this.constructor.use));
            this.attrsToProps();
            this.beforeInstall();
            this.install();
            this.afterInstall();
            var shadowRoot;
            if (!this.shadowRoot) shadowRoot = this.attachShadow({
                mode: 'open'
            }); else {
                shadowRoot = this.shadowRoot;
                var fc;
                while (fc = shadowRoot.firstChild) shadowRoot.removeChild(fc);
            }
            if (this.constructor.css) shadowRoot.appendChild(cssToDom(this.constructor.css)); else if (this.css) shadowRoot.appendChild(cssToDom('function' == typeof this.css ? this.css() : this.css));
            this.beforeRender();
            options.afterInstall && options.afterInstall(this);
            if (this.constructor.observe) {
                this.beforeObserve();
                proxyUpdate(this);
                this.observed();
            }
            var rendered = this.render(this.props, this.data, this.store);
            this.P = '[object Array]' === Object.prototype.toString.call(rendered) && rendered.length > 0;
            this.L = diff(null, rendered, {}, !1, null, !1);
            this.rendered();
            if (this.props.css) {
                this.N = cssToDom(this.props.css);
                this.O = this.props.css;
                shadowRoot.appendChild(this.N);
            }
            if (isArray(this.L)) this.L.forEach(function(item) {
                shadowRoot.appendChild(item);
            }); else shadowRoot.appendChild(this.L);
            this.installed();
            this.B = !0;
        };
        WeElement.prototype.disconnectedCallback = function() {
            this.uninstall();
            this.B = !1;
            if (this.store) for (var i = 0, len = this.store.instances.length; i < len; i++) if (this.store.instances[i] === this) {
                this.store.instances.splice(i, 1);
                break;
            }
        };
        WeElement.prototype.update = function(ignoreAttrs) {
            this.J = !0;
            this.beforeUpdate();
            this.beforeRender();
            if (this.O != this.props.css) {
                this.O = this.props.css;
                this.N.textContent = this.O;
            }
            this.attrsToProps(ignoreAttrs);
            var rendered = this.render(this.props, this.data, this.store);
            this.P = this.P || '[object Array]' === Object.prototype.toString.call(rendered) && rendered.length > 0;
            this.L = diff(this.L, rendered, null, null, this.shadowRoot);
            this.J = !1;
            this.updated();
        };
        WeElement.prototype.removeAttribute = function(key) {
            _HTMLElement.prototype.removeAttribute.call(this, key);
            this.B && this.update();
        };
        WeElement.prototype.setAttribute = function(key, val) {
            if (val && 'object' == typeof val) _HTMLElement.prototype.setAttribute.call(this, key, JSON.stringify(val)); else _HTMLElement.prototype.setAttribute.call(this, key, val);
            this.B && this.update();
        };
        WeElement.prototype.pureRemoveAttribute = function(key) {
            _HTMLElement.prototype.removeAttribute.call(this, key);
        };
        WeElement.prototype.pureSetAttribute = function(key, val) {
            _HTMLElement.prototype.setAttribute.call(this, key, val);
        };
        WeElement.prototype.attrsToProps = function(ignoreAttrs) {
            var ele = this;
            if (!ele.normalizedNodeName && !ignoreAttrs) {
                ele.props.css = ele.getAttribute('css');
                var attrs = this.constructor.propTypes;
                if (attrs) Object.keys(attrs).forEach(function(key) {
                    var type = attrs[key];
                    var val = ele.getAttribute(hyphenate(key));
                    if (null !== val) switch (type) {
                      case String:
                        ele.props[key] = val;
                        break;

                      case Number:
                        ele.props[key] = Number(val);
                        break;

                      case Boolean:
                        if ('false' === val || '0' === val) ele.props[key] = !1; else ele.props[key] = !0;
                        break;

                      case Array:
                      case Object:
                        ele.props[key] = JSON.parse(val.replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?:([^\/])/g, '"$2":$4').replace(/'([\s\S]*?)'/g, '"$1"').replace(/,(\s*})/g, '$1'));
                    } else if (ele.constructor.defaultProps && ele.constructor.defaultProps.hasOwnProperty(key)) ele.props[key] = ele.constructor.defaultProps[key]; else ele.props[key] = null;
                });
            }
        };
        WeElement.prototype.fire = function(name, data) {
            this.dispatchEvent(new CustomEvent(name.replace(/-/g, '').toLowerCase(), {
                detail: data
            }));
        };
        WeElement.prototype.beforeInstall = function() {};
        WeElement.prototype.install = function() {};
        WeElement.prototype.afterInstall = function() {};
        WeElement.prototype.installed = function() {};
        WeElement.prototype.uninstall = function() {};
        WeElement.prototype.beforeUpdate = function() {};
        WeElement.prototype.updated = function() {};
        WeElement.prototype.beforeRender = function() {};
        WeElement.prototype.rendered = function() {};
        WeElement.prototype.receiveProps = function() {};
        WeElement.prototype.beforeObserve = function() {};
        WeElement.prototype.observed = function() {};
        return WeElement;
    }(HTMLElement);
    WeElement.is = 'WeElement';
    var ModelView = function(_WeElement) {
        function ModelView() {
            _classCallCheck$2(this, ModelView);
            return _possibleConstructorReturn$2(this, _WeElement.apply(this, arguments));
        }
        _inherits$2(ModelView, _WeElement);
        ModelView.prototype.beforeInstall = function() {
            this.data = this.vm.data;
        };
        ModelView.prototype.observed = function() {
            this.vm.data = this.data;
        };
        return ModelView;
    }(WeElement);
    ModelView.observe = !0;
    ModelView.mergeUpdate = !1;
    var hasOwn = {}.hasOwnProperty;
    var n = function(t, r, u, e) {
        for (var p = 1; p < r.length; p++) {
            var s = r[p++], a = "number" == typeof s ? u[s] : s;
            1 === r[p] ? e[0] = a : 2 === r[p] ? (e[1] = e[1] || {})[r[++p]] = a : 3 === r[p] ? e[1] = Object.assign(e[1] || {}, a) : e.push(r[p] ? t.apply(null, n(t, a, u, [ "", null ])) : a);
        }
        return e;
    }, t = function(n) {
        for (var t, r, u = 1, e = "", p = "", s = [ 0 ], a = function(n) {
            1 === u && (n || (e = e.replace(/^\s*\n\s*|\s*\n\s*$/g, ""))) ? s.push(n || e, 0) : 3 === u && (n || e) ? (s.push(n || e, 1), 
            u = 2) : 2 === u && "..." === e && n ? s.push(n, 3) : 2 === u && e && !n ? s.push(!0, 2, e) : 4 === u && r && (s.push(n || e, 2, r), 
            r = ""), e = "";
        }, f = 0; f < n.length; f++) {
            f && (1 === u && a(), a(f));
            for (var h = 0; h < n[f].length; h++) t = n[f][h], 1 === u ? "<" === t ? (a(), s = [ s ], u = 3) : e += t : p ? t === p ? p = "" : e += t : '"' === t || "'" === t ? p = t : ">" === t ? (a(), 
            u = 1) : u && ("=" === t ? (u = 4, r = e, e = "") : "/" === t ? (a(), 3 === u && (s = s[0]), u = s, (s = s[0]).push(u, 4), 
            u = 0) : " " === t || "\t" === t || "\n" === t || "\r" === t ? (a(), u = 2) : e += t);
        }
        return a(), s;
    }, r = "function" == typeof Map, u = r ? new Map() : {}, e = r ? function(n) {
        var r = u.get(n);
        return r || u.set(n, r = t(n)), r;
    } : function(n) {
        for (var r = "", e = 0; e < n.length; e++) r += n[e].length + "-" + n[e];
        return u[r] || (u[r] = t(n));
    };
    var html = htm.bind(h);
    var Component = WeElement;
    var defineElement = define;
    var elements = options.mapping;
    var omi = {
        tag: tag,
        WeElement: WeElement,
        Component: Component,
        render: render,
        h: h,
        createElement: h,
        options: options,
        define: define,
        observe: observe,
        cloneElement: cloneElement,
        getHost: getHost,
        rpx: rpx,
        tick: tick,
        nextTick: nextTick,
        ModelView: ModelView,
        defineElement: defineElement,
        classNames: classNames,
        extractClass: extractClass,
        createRef: createRef,
        html: html,
        htm: htm,
        o: o,
        elements: elements
    };
    options.root.Omi = omi;
    options.root.omi = omi;
    options.root.Omi.version = '6.6.7';
    if ('undefined' != typeof module) module.exports = omi; else self.Omi = omi;
}();
//# sourceMappingURL=omi.js.map
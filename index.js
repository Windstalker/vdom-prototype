function isPrimitive(node) {
  return (
    typeof node === "number" ||
    typeof node === "string" ||
    typeof node === "boolean" ||
    node === undefined ||
    node === null
  );
}

function isDefined(node) {
  return node !== null && node !== undefined;
}

function isCustomProp(name, value) {
  return isEventProp(name, value);
}

function isEventProp(name, handler) {
  return (
    name.indexOf("on") === 0 && (!handler || typeof handler === "function")
  );
}

function getEventName(propName = "") {
  return propName.slice(2).toLowerCase();
}

function setBooleanProp($el, name, value) {
  if (value) {
    $el.setAttribute(name, value);
    $el[name] = true;
  } else {
    $el[name] = false;
  }
}

function removeBooleanProp($el, name) {
  $el.removeAttribute(name);
  $el[name] = false;
}

function addListener($el, name, handler) {
  $el.addEventListener(getEventName(name), handler, false);
}

function removeListener($el, name, handler) {
  $el.removeEventListener(getEventName(name), handler, false);
}

function setProp($el, name, value) {
  if (isCustomProp(name, value)) {
    return;
  }

  if (typeof value === "boolean") {
    return setBooleanProp($el, name, value);
  }

  if (name === "className") {
    name = "class";
  }

  $el.setAttribute(name, value);
}

function removeProp($el, name, value) {
  if (isCustomProp(name, value)) {
    return;
  }

  if (typeof value === "boolean") {
    return removeBooleanProp($el, name);
  }

  if (name === "className") {
    name = "class";
  }

  $el.removeAttribute(name);
}

function updateProp($el, name, newValue, oldValue) {
  if (!newValue) {
    if (isEventProp(name, oldValue)) {
      removeListener($el, name, oldValue);
    }

    return removeProp($el, name, oldValue);
  }

  if (!oldValue || (newValue && newValue !== oldValue)) {
    if (isEventProp(name, newValue)) {
      if (oldValue) {
        removeListener($el, name, oldValue);
      }

      addListener($el, name, newValue);
    }

    return setProp($el, name, newValue);
  }
}

function setProps($el, props = {}) {
  for (let prop of Object.keys(props)) {
    let value = props[prop];
    if (isEventProp(prop, value)) {
      addListener($el, prop, value);
    }
    setProp($el, prop, value);
  }
}

function updateProps($el, newProps = {}, oldProps = {}) {
  const mergedProps = { ...oldProps, ...newProps };

  Object.keys(mergedProps).forEach(propName => {
    updateProp($el, newProps[propName], oldProps[propName]);
  });
}

const VDOM = {
  node(tagName, props = {}, children = []) {
    return {
      tagName,
      props,
      children
    };
  },
  createElement(node) {
    if (isPrimitive(node)) {
      const text = isDefined(node) ? String(node) : "";
      return document.createTextNode(text);
    }

    const $el = document.createElement(node.tagName);

    setProps($el, node.props);

    for (let childNode of node.children) {
      $el.appendChild(this.createElement(childNode));
    }

    return $el;
  },
  hasChanged(newNode, oldNode) {
    if (
      typeof newNode !== typeof oldNode || // type changed
      (isPrimitive(newNode) && newNode !== oldNode) || // primitive changed
      newNode.tagName !== oldNode.tagName // tag name changed
    ) {
      return true;
    }

    const newNodeProps = newNode.props || {};
    const oldNodeProps = oldNode.props || {};

    return Object.keys(newNodeProps).some(
      prop => newNodeProps[prop] !== oldNodeProps[prop]
    );
  },
  render($parent, newNode, oldNode, index = 0) {
    if (!$parent || !($parent instanceof HTMLElement)) {
      throw new TypeError("$parent should be an instance HTMLElement");
    }

    if (!isDefined(oldNode)) {
      return $parent.appendChild(this.createElement(newNode));
    }

    if (!isDefined(newNode)) {
      return $parent.removeChild($parent.childNodes[index]);
    }

    if (this.hasChanged(newNode, oldNode)) {
      return $parent.replaceChild(
        this.createElement(newNode),
        $parent.childNodes[index]
      );
    }

    if (newNode.tagName) {
      updateProps($parent.childNodes[index], newNode.props, oldNode.props);

      const oldLength = oldNode.children.length;
      const newLength = newNode.children.length;

      for (let i = 0; i < oldLength || i < newLength; i++) {
        this.render(
          $parent.childNodes[index],
          newNode.children[i],
          oldNode.children[i],
          i
        );
      }
    }
  }
};

let tree = VDOM.node("ul", { className: "list" }, [
  VDOM.node("li", { className: "item" }, ["Item 1"]),
  VDOM.node(
    "li",
    { className: "item", onClick: () => alert("click handler!") },
    ["Item 2"]
  ),
  VDOM.node("button", { onClick: secondRender }, ["Click to change tree"])
]);

function secondRender() {
  // 2nd render (update)
  VDOM.render(
    rootEl,
    VDOM.node("ul", { className: "list" }, [
      VDOM.node("li", { className: "item" }, ["Item 1"]),
      VDOM.node(
        "li",
        {
          className: "item super",
          onClick: () => alert("another click handler!")
        },
        ["Item 2"]
      ),
      VDOM.node("li", { className: "item" }, [
        VDOM.node("input", { type: "checkbox", value: "Test", checked: true }),
        VDOM.node("input", { type: "text", value: "Test", disabled: true })
      ])
    ]),
    tree
  );
}

const rootEl = document.querySelector("#root");

// 1st render
VDOM.render(rootEl, tree);

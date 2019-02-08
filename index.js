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

function isCustomProp(name) {
  // stub
  return false;
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

function setProp($el, name, value) {
  if (isCustomProp(name)) {
    return;
  }

  if (name.indexOf("on") === 0 && typeof value === "function") {
    // let eventName = prop.slice(2);
    // $el.addEventListener(eventName, value, false);
  } else {
    if (typeof value === "boolean") {
      return setBooleanProp($el, name, value);
    }

    if (name === "className") {
      name = "class";
    }

    $el.setAttribute(name, value);
  }
}

function removeProp($el, name, value) {
  if (isCustomProp(name)) {
    return;
  }

  if (name.indexOf("on") === 0 && typeof value === "function") {
    // let eventName = prop.slice(2);
    // $el.removeEventListener(eventName, value, false);
  } else {
    if (typeof value === "boolean") {
      return removeBooleanProp($el, name);
    }

    if (name === "className") {
      name = "class";
    }

    $el.removeAttribute(name);
  }
}

function updateProp($el, name, newValue, oldValue) {
  if (!newValue) {
    return removeProp($el, name, oldValue);
  }

  if (!oldValue || (newValue && newValue !== oldValue)) {
    return setProp($el, name, newValue);
  }
}

function setProps($el, props = {}) {
  for (let prop of Object.keys(props)) {
    let value = props[prop];
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
  treeState: null,
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
  VDOM.node("li", { className: "item" }, ["Item 2"])
]);

const rootEl = document.querySelector("#root");

// 1st render
VDOM.render(rootEl, tree);
// 2nd render (update)
VDOM.render(
  rootEl,
  VDOM.node("ul", { className: "list" }, [
    VDOM.node("li", { className: "item" }, ["Item 1"]),
    VDOM.node("li", { className: "item super" }, ["Item 2"]),
    VDOM.node("li", { className: "item" }, [
      VDOM.node("input", { type: "checkbox", value: "Test", checked: true }),
      VDOM.node("input", { type: "text", value: "Test", disabled: true })
    ])
  ]),
  tree
);

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

    const nodeEl = document.createElement(node.tagName);

    for (let prop of Object.keys(node.props)) {
      let value = node.props[prop];

      if (prop.indexOf("on") === 0 && typeof value === "function") {
        let eventName = prop.slice(2);

        nodeEl.addEventListener(eventName, value, false);
      } else {
        if (prop === "className") {
          prop = "class";
        }

        nodeEl.setAttribute(prop, value);
      }
    }

    for (let childNode of node.children) {
      nodeEl.appendChild(this.createElement(childNode));
    }

    return nodeEl;
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
  VDOM.node("li", { className: "item" }, "Item 1"),
  VDOM.node("li", { className: "item" }, "Item 2")
]);

const rootEl = document.querySelector("#root");

// 1st render
VDOM.render(rootEl, tree);
// 2nd render (update)
VDOM.render(
  rootEl,
  VDOM.node("ul", { className: "list" }, [
    VDOM.node("li", { className: "item" }, "Item 1"),
    VDOM.node("li", { className: "item" }, "Item 2"),
    VDOM.node("li", { className: "item" }, "Item 3")
  ]),
  tree
);

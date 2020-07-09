## Install

``` sh
$ npm install --save tui-tree # Latest version
$ npm install --save tui-tree@<version> # Specific version
```

It can also be downloaded by CDN. Please refer to the [💾 Install](https://github.com/nhn/tui.tree#-install).

## Usage

### Write a wrapper element

A wrapper element should have `tui-tree-wrapper` as a class name to apply tui-tree's style.

```html
<div id="tree" class="tui-tree-wrap"></div>
```

### Import a component

```javascript
import Tree from 'tui-tree';
import 'tui-tree/dist/tui-tree.css';
```

It can also be used by namespace or CommonJS module. Please refer to the [🔨 Usage](https://github.com/nhn/tui.pagination#-usage).

### Create an instance

* Create with the selector of the container element

```js
const tree = new Tree('#tree', options);
```

* Create with a container element

```js
const container = document.getElementById('tree');
const tree = new Tree(container, options);
```

* Create with options

```js
const options = {
  data: [],
  nodeIdPrefix: 'tui-tree-node-',
  nodeDefaultState: 'closed',
  stateLabels: {
    opened: '-',
    closed: '+'
  },
  template: {
    internalNode:
      '<div class="tui-tree-btn">' +
        '<button type="button" class="tui-tree-toggle-btn tui-js-tree-toggle-btn">' +
          '<span class="tui-ico-tree"></span>' +
          '{{stateLabel}}' +
        '</button>' +
        '<span class="tui-tree-text tui-js-tree-text">' +
          '<span class="tui-tree-ico tui-ico-folder"></span>' +
          '{{text}}' +
        '</span>' +
      '</div>' +
      '<ul class="tui-tree-subtree tui-js-tree-subtree">{{children}}</ul>',
    leafNode:
      '<div class="tui-tree-btn">' +
        '<span class="tui-tree-text tui-js-tree-text">' +
          '<span class="tui-tree-ico tui-ico-file"></span>' +
          '{{text}}' +
        '</span>' +
      '</div>'
  },
  renderTemplate: (tmpl, props) => Mustache.render(tmpl, props) // Mustache template engine
};

const tree = new Tree('#tree', options);
```

## Options

Information about each option is as follows:

|Name|Type|Description|
|---|---|---|
|`data`|`{array.<object>}`|Tree data|
|`[nodeIdPrefix]`|`{string}`|Each tree node's id prefix value|
|`[nodeDefaultState]`|`{string}`|Default node's state (`opened` or `closed`)|
|`[stateLabels]`|`{object}`|Toggle button's state label|
|`[stateLabels.opened]`|`{string}`|When state is opened, setting text|
|`[stateLabels.closed]`|`{string}`|When state is closed, setting text|
|`[template]`|`{string}`|Template for rendering each tree node|
|`[template.internalNode]`|`{string}`|Template of node having children|
|`[template.leafNode]`|`{string}`|Template of leaf node|
|`[renderTemplate]`|`{function}`|Render template function|

### Tree data format: `data`

* Default : Set `text`, `children` properties.
```js
const data = [
  {
    text: 'rootA',
    children: [
      { text: 'root-1A' },
      { text: 'root-1B' },
      { text: 'root-1C' },
      {
        text: 'root-2A',
        children: [{ text: 'sub_sub_1A' }]
      },
      { text: 'sub_2A' }
    ]
  },
  {
    text: 'rootB',
    children: [{ text: 'B_sub1' }, { text: 'B_sub2' }, { text: 'b' }]
  },
  ...
];
```

* Customizing : It is possible to set other properties.

```js
const data = [
  {
    pid: '001',
    text: 'rootA',
    children: [
      {
        pid: '003',
        text: 'root-1A',
        state: 'closed'
      }
    ]
  },
  {
    pid: '002',
    text: 'rootB',
    state: 'opened'
  },
  ...
];
```

### How to use template: `template` and `renderTemplate`

You can customize each tree node's contents using `template` and `renderTemplate` options.
`template` option is override default template string.
`renderTemplate` option can process template using a template engine like [mustache.js](https://github.com/janl/mustache.js/).
tui.tree uses [tui-code-snippet's template](https://nhn.github.io/tui.code-snippet/2.2.0/domUtil#template) as default template engine.

This example show how to replace node's contents having children by a template engine.

```js
{
  ...,
  template: {
    // template for Mustache engine
    internalNode: '<button type="button">{{stateLabel}}</button>{{text}}<ul>{{{children}}}</ul>'
  },
  renderTemplate: (tmpl, props) => {
    // Mustache template engine
    return Mustache.render(tmpl, props);
  }
};
```

For more information about the API, please see [here](https://nhn.github.io/tui.tree/latest/Tree).

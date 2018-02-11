## Add dependency files

To use a tree component, you must include CSS and JavaScript files.
Main bundling files can download from a `dist` folder in this repository.
And this component has `CodeSnippet` dependency by default.

#### CSS File

```html
<link rel="stylesheet" href="tui-tree.css">
```

#### JS Files

```html
<script type="text/javascript" src="tui-code-snippet.js"></script>
<script type="text/javascript" src="tui-tree.js"></script>
```

## Create a tree component

#### Step 1. Add a container element that the pagination component will be created.

```html
<div id="tree" class="tui-tree-wrap"></div>
```

### Step 2. Create instance.

Create an instance by passing the container element and option values as parameters.
And create the tree data and pass it as an option.

* Create with the id selector of the container element
```js
var tree = new tui.Tree('tree', options);
```

* Create with a container element
```js
var container = document.getElementById('tree');
var tree = new tui.Tree(container, options);
```

* Create with options (default values)
```js
var options = {
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
    renderTemplate: function(tmpl, props) {
        // Mustache template engine
        return Mustache.render(tmpl, props);
    }
};

var tree = new tui.Tree('tree', options);
```

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

## Tree data format

* Default : Set `text`, `children` properties.
```js
var data = [
    {
        text: 'rootA',
        children: [
            {text: 'root-1A'},
            {text: 'root-1B'},
            {text: 'root-1C'},
            {
                text: 'root-2A',
                children: [
                    {text: 'sub_sub_1A'}
                ]
            },
            {text: 'sub_2A'}
       ]
   },
   {
       text: 'rootB',
       children: [
           {text: 'B_sub1'},
           {text: 'B_sub2'},
           {text: 'b'}
       ]
    },
    ...
];
```

* Customizing : It is possible to set other properties.
```js
var data = [
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

## How to use template

You can customize each tree node's contents using `template` and `renderTemplate` options.
`template` option is override default template string.
`renderTemplate` option can process template using a template engine like [mustache.js](https://github.com/janl/mustache.js/).

This example show how to replace node's contents having children by a template engine.

```js
{
    ...
    template: { // template for Mustache engine
        internalNode:
            '<button type="button">{{stateLabel}}</button>' +
            '{{text}}' +
            '<ul>{{{children}}}</ul>'
    },
    renderTemplate: function(tmpl, props) {
        // Mustache template engine
        return Mustache.render(tmpl, props);
    }
}
```

For more information, see [the example page](https://nhnent.github.io/tui.tree/latest/tutorial-example01-basic.html).

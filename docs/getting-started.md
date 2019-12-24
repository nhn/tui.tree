## Load files

```html
<html>
    <head>
        ....
        <link href="tui-tree.css" rel="stylesheet">
    </head>
    <body>
        ....
        <script type="text/javascript" src="tui-tree.js"></script>
    </body>
</html>
```

## Write a wrapper element

```html
<div id="tree" class="tui-tree-wrap"></div>
```

## Create instance

* Create with the id selector of the container element

```js
var tree = new tui.Tree('tree', options);
```

* Create with a container element

```js
var container = document.getElementById('tree');
var tree = new tui.Tree(container, options);
```

* Create with options

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

## Options

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

### How to use template: `template` and `renderTemplate`

You can customize each tree node's contents using `template` and `renderTemplate` options.
`template` option is override default template string.
`renderTemplate` option can process template using a template engine like [mustache.js](https://github.com/janl/mustache.js/).
tui.tree uses [tui-code-snippet's template](https://nhn.github.io/tui.code-snippet/latest/domUtil#template) as default template engine.

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

For more information, see [the example page](https://nhn.github.io/tui.tree/latest/tutorial-example01-basic).

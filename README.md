# Tree

TOAST UI Component: Tree

## Feature
* Default
    * Display hierarchical data by tree UI
    * Fold sub tree
    * Custom events
* Optional feature
    * Ajax: server communication
    * Checkbox: tri-state checkbox
    * ContextMenu: create context menu on node
    * Draggable: drag and drop using 2 ways
    * Editable: create and edit node
    * Selectable: select and deselect node

## Documentation
* API: [https://nhnent.github.io/tui.tree/latest](https://nhnent.github.io/tui.tree/latest)
* Tutorial: [https://github.com/nhnent/tui.tree/wiki](https://github.com/nhnent/tui.tree/wiki)
* Examples: [http://nhnent.github.io/tui.tree/latest/tutorial-example01-basic.html](http://nhnent.github.io/tui.tree/latest/tutorial-example01-basic.html)

## Dependency
* [tui-code-snippet](https://github.com/nhnent/tui.code-snippet): ^1.2.5
* [tui-context-menu](https://github.com/nhnent/tui.context-menu): ^2.0.0 (Optional, needed for using `ContextMenu` feature)
* [jQuery](https://github.com/jquery/jquery/tree/1.12-stable): ^1.11.0 (Optional, needed for using `Ajax` feature)

## Test Environment
### PC
* IE8~11
* Edge
* Chrome
* Firefox
* Safari

## Usage
### Use `npm`

Install the latest version using `npm` command:

```
$ npm install tui-tree --save
```

or want to install the each version:

```
$ npm install tui-tree@<version> --save
```

To access as module format in your code:

```javascript
var Tree = require('tui-tree');
var instance = new Tree(...);
```

### Use `bower`
Install the latest version using `bower` command:

```
$ bower install tui-tree
```

or want to install the each version:

```
$ bower install tui-tree#<tag>
```

To access as namespace format in your code:

```javascript
var instance = new tui.Tree(...);
```

### Download
* [Download bundle files from `dist` folder](https://github.com/nhnent/tui.tree/tree/production/dist)
* [Download all sources for each version](https://github.com/nhnent/tui.tree/releases)

## License
[MIT LICENSE](https://github.com/nhnent/tui.tree/blob/master/LICENSE)

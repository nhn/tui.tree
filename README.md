# TOAST UI Component : Tree

> Component that displays data hierarchically.

[![GitHub release](https://img.shields.io/github/release/nhn/tui.tree.svg)](https://github.com/nhn/tui.tree/releases/latest)
[![npm](https://img.shields.io/npm/v/tui-tree.svg)](https://www.npmjs.com/package/tui-tree)
[![GitHub license](https://img.shields.io/github/license/nhn/tui.tree.svg)](https://github.com/nhn/tui.tree/blob/master/LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](https://github.com/nhn/tui.tree/labels/Help%20Wanted%20🤝)
[![code with hearth by NHN](https://img.shields.io/badge/%3C%2F%3E%20with%20%E2%99%A5%20by-NHN-ff1414.svg)](https://github.com/nhn)

<p><a href="https://nhn.github.io/tui.tree/latest/"><img src="https://user-images.githubusercontent.com/8615506/64508620-d784ef00-d318-11e9-82b1-9cb93a2955c5.gif" /></a></p>

## 🚩 Table of Contents

- [Collect statistics on the use of open source](#collect-statistics-on-the-use-of-open-source)
- [📙 Documents](#-documents)
- [🎨 Features](#-features)
- [🐾 Examples](#-examples)
- [💾 Install](#-install)
  - [Via Package Manager](#via-package-manager)
    - [npm](#npm)
  - [Via Contents Delivery Network (CDN)](#via-contents-delivery-network-cdn)
  - [Download Source Files](#download-source-files)
- [🔨 Usage](#-usage)
  - [HTML](#html)
  - [JavaScript](#javascript)
    - [Using namespace in browser environment](#using-namespace-in-browser-environment)
    - [Using module format in node environment](#using-module-format-in-node-environment)
- [🔩 Dependency](#-dependency)
- [🌏 Browser Support](#-browser-support)
- [🔧 Pull Request Steps](#-pull-request-steps)
  - [Setup](#setup)
  - [Develop](#develop)
    - [Running dev server](#running-dev-server)
    - [Running test](#running-test)
  - [Pull Request](#pull-request)
- [💬 Contributing](#-contributing)
- [🍞 TOAST UI Family](#-toast-ui-family)
- [📜 License](#-license)

## Collect statistics on the use of open source

TOAST UI Tree applies Google Analytics (GA) to collect statistics on the use of open source, in order to identify how widely TOAST UI Tree is used throughout the world.
It also serves as important index to determine the future course of projects.
`location.hostname` (e.g. > “ui.toast.com") is to be collected and the sole purpose is nothing but to measure statistics on the usage.
To disable GA, use the following `usageStatistics` option when creating the instance.

```js
const options = {
 ...
 usageStatistics: false
}
const instance = new Tree(container, options);
```

Or, include [`tui-code-snippet`](https://github.com/nhn/tui.code-snippet)(**v2.3.0** or **later**) and then immediately write the options as follows:

```js
tui.usageStatistics = false;
```

## 📙 Documents

- [Getting Started](https://github.com/nhn/tui.tree/blob/master/docs/getting-started.md)
- [How to use Ajax feature](https://github.com/nhn/tui.tree/blob/master/docs/ajax-feature.md)
- [APIs](https://nhn.github.io/tui.tree/latest)
- [v4.0.0 Migration Guide](https://github.com/nhn/tui.tree/blob/master/docs/v4.0.0-migration-guide.md)

You can also see the older versions of API page on the [releases page](https://github.com/nhn/tui.tree/releases).

## 🎨 Features

- Creates each node hierarchically by data.
- Folds or unfolds the children of each node.
- Supports optional features.
  - `Selectable` : Each node can be selected.
  - `Draggable` : Each node can be moved.
  - `Editable` : Each node can be edited.
  - `ContextMenu` : A context menu can be created for each node. (_Not supporting IE8_)
  - `Checkbox` : A checkbox can be added to each node and a 3-state checkbox is used.
  - `Ajax` : Requests server and handles the `CRUD` for each node.
- Supports templates.
- Supports custom events.
- Provides the file of default css style.

## 🐾 Examples

- [Basic](https://nhn.github.io/tui.tree/latest/tutorial-example01-basic) : Example of using default options.
- [Using checkbox](https://nhn.github.io/tui.tree/latest/tutorial-example07-checkbox) : Example of adding checkbox on each node and handling.
- [Using Ajax](https://nhn.github.io/tui.tree/latest/tutorial-example08-ajax) : Example of using server request, `Selectable`, `Draggable`, `Editable`, `ContextMenu` features.

More examples can be found on the left sidebar of each example page, and have fun with it.

## 💾 Install

TOAST UI products can be used by using the package manager or downloading the source directly.
However, we highly recommend using the package manager.

### Via Package Manager

TOAST UI products are registered in the package manager, [npm](https://www.npmjs.com/).
You can conveniently install it using the commands provided by each package manager.
When using npm, be sure to use it in the environment [Node.js](https://nodejs.org/ko/) is installed.

#### npm

```sh
$ npm install --save tui-tree # Latest version
$ npm install --save tui-tree@<version> # Specific version
```

### Via Contents Delivery Network (CDN)

TOAST UI products are available over the CDN powered by [TOAST Cloud](https://www.toast.com).

You can use the CDN as below.

```html
<script src="https://uicdn.toast.com/tui-tree/latest/tui-tree.js"></script>
<link
  rel="stylesheet"
  type="text/css"
  href="https://uicdn.toast.com/tui-tree/latest/tui-tree.css"
/>
```

If you want to use a specific version, use the tag name instead of `latest` in the url's path.

The CDN directory has the following structure.

```
tui-tree/
├─ latest/
│  ├─ tui-tree.css
│  ├─ tui-tree.js
│  ├─ tui-tree.min.css
│  └─ tui-tree.min.js
├─ v3.3.0/
│  ├─ ...
```

### Download Source Files

- [Download bundle files and all sources for each version](https://github.com/nhn/tui.tree/releases)

## 🔨 Usage

### HTML

Add the container element to create the component. A wrapper element should have `tui-tree-wrap` as a class name to apply tui-tree's style.

```html
<div id="tree" class="tui-tree-wrap"></div>
```

### JavaScript

This can be used by creating an instance with the constructor function.
To get the constructor function, you should import the module using one of the following ways depending on your environment.

#### Using namespace in browser environment

```javascript
const Tree = tui.Tree;
```

#### Using module format in node environment

```javascript
const Tree = require('tui-tree'); /* CommonJS */
```

```javascript
import Tree from 'tui-tree'; /* ES6 */
```

You can create an instance with [options](https://nhn.github.io/tui.tree/latest/Tree) and call various APIs after creating an instance.

```javascript
const container = document.getElementById('tree');
const instance = new Tree(container, { ... });

instance.add( ... );
```

For more information about the API, please see [here](https://nhn.github.io/tui.tree/latest/Tree).

## 🔩 Dependency

- [tui-context-menu](https://github.com/nhn/tui.context-menu) >=2.1.6 (Optional, needs forusing `ContextMenu` feature, _not supporting IE8_)

## 🌏 Browser Support

| <img src="https://user-images.githubusercontent.com/1215767/34348387-a2e64588-ea4d-11e7-8267-a43365103afe.png" alt="Chrome" width="16px" height="16px" /> Chrome | <img src="https://user-images.githubusercontent.com/1215767/34348590-250b3ca2-ea4f-11e7-9efb-da953359321f.png" alt="IE" width="16px" height="16px" /> Internet Explorer | <img src="https://user-images.githubusercontent.com/1215767/34348380-93e77ae8-ea4d-11e7-8696-9a989ddbbbf5.png" alt="Edge" width="16px" height="16px" /> Edge | <img src="https://user-images.githubusercontent.com/1215767/34348394-a981f892-ea4d-11e7-9156-d128d58386b9.png" alt="Safari" width="16px" height="16px" /> Safari | <img src="https://user-images.githubusercontent.com/1215767/34348383-9e7ed492-ea4d-11e7-910c-03b39d52f496.png" alt="Firefox" width="16px" height="16px" /> Firefox |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                               Yes                                                                                |                                                                                   8+                                                                                    |                                                                             Yes                                                                              |                                                                               Yes                                                                                |                                                                                Yes                                                                                 |

- ContextMenu feature does not support IE8.

## 🔧 Pull Request Steps

TOAST UI products are open source, so you can create a pull request(PR) after you fix issues.
Run npm scripts and develop yourself with the following process.

### Setup

Fork `develop` branch into your personal repository.
Clone it to local computer. Install node modules.
Before starting development, you should check to haveany errors.

```sh
$ git clone https://github.com/{your-personal-repo}/tui.tree.git
$ cd tui.tree
$ npm install
$ npm run test
```

### Develop

Let's start development!
You can see your code is reflected as soon as you saving the codes by running a server.
Don't miss adding test cases and then make green rights.

#### Running dev server

```sh
$ npm run serve
$ npm run serve:ie8 # Run on Internet Explorer 8
```

#### Running test

```sh
$ npm run test
```

### Pull Request

Before PR, check to test lastly and then check any errors.
If it has no error, commit and then push it!

For more information on PR's step, please see links of Contributing section.

## 💬 Contributing

- [Code of Conduct](https://github.com/nhn/tui.tree/blob/master/CODE_OF_CONDUCT.md)
- [Contributing guideline](https://github.com/nhn/tui.tree/blob/master/CONTRIBUTING.md)
- [Issue guideline](https://github.com/nhn/tui.tree/blob/master/docs/ISSUE_TEMPLATE.md)
- [Commit convention](https://github.com/nhn/tui.tree/blob/master/docs/COMMIT_MESSAGE_CONVENTION.md)

## 🍞 TOAST UI Family

- [TOAST UI Editor](https://github.com/nhn/tui.editor)
- [TOAST UI Calendar](https://github.com/nhn/tui.calendar)
- [TOAST UI Chart](https://github.com/nhn/tui.chart)
- [TOAST UI Image-Editor](https://github.com/nhn/tui.image-editor)
- [TOAST UI Grid](https://github.com/nhn/tui.grid)
- [TOAST UI Components](https://github.com/nhn)

## 📜 License

This software is licensed under the [MIT](https://github.com/nhn/tui.tree/blob/master/LICENSE) © [NHN](https://github.com/nhn).

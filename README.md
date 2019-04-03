# TOAST UI Component : Tree
> Component that displays data hierarchically.

[![GitHub release](https://img.shields.io/github/release/nhnent/tui.tree.svg)](https://github.com/nhnent/tui.tree/releases/latest)
[![npm](https://img.shields.io/npm/v/tui-tree.svg)](https://www.npmjs.com/package/tui-tree)
[![GitHub license](https://img.shields.io/github/license/nhnent/tui.tree.svg)](https://github.com/nhnent/tui.tree/blob/production/LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](https://github.com/nhnent/tui.project-name/labels/help%20wanted)
[![code with hearth by NHN](https://img.shields.io/badge/%3C%2F%3E%20with%20%E2%99%A5%20by-NHN-ff1414.svg)](https://github.com/nhnent)


## 🚩 Table of Contents
* [Collect statistics on the use of open source](#Collect-statistics-on-the-use-of-open-source)
* [Browser Support](#-browser-support)
* [Features](#-features)
* [Examples](#-examples)
* [Install](#-install)
    * [Via Package Manager](#via-package-manager)
    * [Via Contents Delivery Network (CDN)](#via-contents-delivery-network-cdn)
    * [Download Source Files](#download-source-files)
* [Usage](#-usage)
    * [HTML](#html)
    * [JavaScript](#javascript)
* [Pull Request Steps](#-pull-request-steps)
    * [Setup](#setup)
    * [Develop](#develop)
    * [Pull Request](#pull-request)
* [Documents](#-documents)
* [Contributing](#-contributing)
* [Dependency](#-dependency)
* [License](#-license)

## Collect statistics on the use of open source
 TOAST UI Tree applies Google Analytics (GA) to collect statistics on the use of open source, in order to identify how widely TOAST UI Tree is used throughout the world.
It also serves as important index to determine the future course of projects.
`location.hostname` (e.g. > “ui.toast.com") is to be collected and the sole purpose is nothing but to measure statistics on the usage.
 To disable GA, use the following `usageStatistics` option when creating the instance.
 ```js
var options = {
    ...
    usageStatistics: false
}
var instance = new Tree(container, options);
```

## 🌏 Browser Support
| <img src="https://user-images.githubusercontent.com/1215767/34348387-a2e64588-ea4d-11e7-8267-a43365103afe.png" alt="Chrome" width="16px" height="16px" /> Chrome | <img src="https://user-images.githubusercontent.com/1215767/34348590-250b3ca2-ea4f-11e7-9efb-da953359321f.png" alt="IE" width="16px" height="16px" /> Internet Explorer | <img src="https://user-images.githubusercontent.com/1215767/34348380-93e77ae8-ea4d-11e7-8696-9a989ddbbbf5.png" alt="Edge" width="16px" height="16px" /> Edge | <img src="https://user-images.githubusercontent.com/1215767/34348394-a981f892-ea4d-11e7-9156-d128d58386b9.png" alt="Safari" width="16px" height="16px" /> Safari | <img src="https://user-images.githubusercontent.com/1215767/34348383-9e7ed492-ea4d-11e7-910c-03b39d52f496.png" alt="Firefox" width="16px" height="16px" /> Firefox |
| :---------: | :---------: | :---------: | :---------: | :---------: |
| Yes | 8+ | Yes | Yes | Yes |


## 🎨 Features
* Creates each node hierarchically by data.
* Folds or unfolds the children of each node.
* Supports optional features.
    * `Selectable` : Each node can be selected.
    * `Draggable` : Each node can be moved.
    * `Editable` : Each node can be edited.
    * `ContextMenu` : A context menu can be created for each node.
    * `Checkbox` : A checkbox can be added to each node and a 3-state checkbox is used.
    * `Ajax` : Requests server and handles the `CRUD` for each node.
* Supports templates.
* Supports custom events.
* Provides the file of default css style.


## 🐾 Examples
* [Basic](https://nhnent.github.io/tui.tree/latest/tutorial-example01-basic) : Example of using default options.
* [Using checkbox](https://nhnent.github.io/tui.tree/latest/tutorial-example07-checkbox) : Example of adding checkbox on each node and handling.
* [Using Ajax](https://nhnent.github.io/tui.tree/latest/tutorial-example08-ajax) : Example of using server request, `Selectable`, `Draggable`, `Editable`, `ContextMenu` features.

More examples can be found on the left sidebar of each example page, and have fun with it.


## 💾 Install

TOAST UI products can be used by using the package manager or downloading the source directly.
However, we highly recommend using the package manager.

### Via Package Manager

TOAST UI products are registered in two package managers, [npm](https://www.npmjs.com/) and [bower](https://bower.io/).
You can conveniently install it using the commands provided by each package manager.
When using npm, be sure to use it in the environment [Node.js](https://nodejs.org/ko/) is installed.

#### npm

``` sh
$ npm install --save tui-tree # Latest version
$ npm install --save tui-tree@<version> # Specific version
```

#### bower

``` sh
$ bower install tui-tree # Latest version
$ bower install tui-tree#<tag> # Specific version
```

### Via Contents Delivery Network (CDN)
TOAST UI products are available over the CDN powered by [TOAST Cloud](https://www.toast.com).

You can use the CDN as below.

```html
<script src="https://uicdn.toast.com/tui-tree/latest/tui-tree.js"></script>
<link rel="stylesheet" type="text/css" href="https://uicdn.toast.com/tui-tree/latest/tui-tree.css">
```

If you want to use a specific version, use the tag name instead of `latest` in the url's path.

The CDN directory has the following structure.

```
tui-tree/
├─ latest/
│  ├─ tui-tree.js
│  ├─ tui-tree.min.js
│  └─ tui-tree.css
├─ v3.3.0/
│  ├─ ...
```

### Download Source Files
* [Download bundle files](https://github.com/nhnent/tui.tree/tree/production/dist)
* [Download all sources for each version](https://github.com/nhnent/tui.tree/releases)


## 🔨 Usage

### HTML

Add the container element to create the component.

``` html
<div id="tui-tree-container" class="tui-tree-wrap"></div>
```

### JavaScript

This can be used by creating an instance with the constructor function.
To get the constructor function, you should import the module using one of the following ways depending on your environment.

#### Using namespace in browser environment
``` javascript
var Tree = tui.Tree;
```

#### Using module format in node environment
``` javascript
var Tree = require('tui-tree'); /* CommonJS */
```

``` javascript
import {Tree} from 'tui-tree'; /* ES6 */
```

You can create an instance with [options](https://nhnent.github.io/tui.tree/latest/Tree) and call various APIs after creating an instance.

``` javascript
var container = document.getElementById('tui-tree-container');
var instance = new Tree(container, { ... });

instance.add( ... );
```

For more information about the API, please see [here](https://nhnent.github.io/tui.tree/latest/Tree).


## 🔧 Pull Request Steps

TOAST UI products are open source, so you can create a pull request(PR) after you fix issues.
Run npm scripts and develop yourself with the following process.

### Setup

Fork `develop` branch into your personal repository.
Clone it to local computer. Install node modules.
Before starting development, you should check to haveany errors.

``` sh
$ git clone https://github.com/{your-personal-repo}/tui.tree.git
$ cd tui.tree
$ npm install
$ npm run test
```

### Develop

Let's start development!
You can see your code is reflected as soon as you saving the codes by running a server.
Don't miss adding test cases and then make green rights.

#### Run webpack-dev-server

``` sh
$ npm run serve
$ npm run serve:ie8 # Run on Internet Explorer 8
```

#### Run karma test

``` sh
$ npm run test
```

### Pull Request

Before PR, check to test lastly and then check any errors.
If it has no error, commit and then push it!

For more information on PR's step, please see links of Contributing section.


## 📙 Documents
* [Getting Started](https://github.com/nhnent/tui.tree/blob/production/docs/getting-started.md)
* [Tutorials](https://github.com/nhnent/tui.tree/tree/production/docs)
* [APIs](https://nhnent.github.io/tui.tree/latest)

You can also see the older versions of API page on the [releases page](https://github.com/nhnent/tui.tree/releases).


## 💬 Contributing
* [Code of Conduct](https://github.com/nhnent/tui.tree/blob/production/CODE_OF_CONDUCT.md)
* [Contributing guideline](https://github.com/nhnent/tui.tree/blob/production/CONTRIBUTING.md)
* [Issue guideline](https://github.com/nhnent/tui.tree/blob/production/docs/ISSUE_TEMPLATE.md)
* [Commit convention](https://github.com/nhnent/tui.tree/blob/production/docs/COMMIT_MESSAGE_CONVENTION.md)


## 🔩 Dependency
* [tui-code-snippet](https://github.com/nhnent/tui.code-snippet) >=1.5.0
* [tui-context-menu](https://github.com/nhnent/tui.context-menu) >=2.1.1 (Optional, needs forusing `ContextMenu` feature)
* [jQuery](https://github.com/jquery/jquery/tree/1.12-stable) >=1.11.0 (Optional, needs for using `Ajax` feature)


## 📜 License

This software is licensed under the [MIT](https://github.com/nhnent/tui.tree/blob/production/LICENSE) © [NHN](https://github.com/nhnent).

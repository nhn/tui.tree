## Description
- When getting data or occuring user action on tree component, this feature is request and response to server using Ajax.
- Dependency : `jQuery`

## Feature operation
- When occurring read action on tree component, server is requested by options. And server respond with success data then tree view is updated.
- If server respond with failed data or is on error, tree view is not updated and each custom event can handle current state.
- View on [the example page](https://nhnent.github.io/tui.tree/latest/tutorial-example08-ajax.html)

## How to use

### Step 1. Include dependency file.
```html
<script type="text/javascript" src="jquery.js"></script>
```

### Step 2. Enable feature with options
```js
var options = {
    command: {
        read: {
            url: 'api/read',
            type: 'get',
            dataType: 'json'
            data: {
               paramA: 'a',
               paramB: 'b'
            }
        },
        create: {
            url: 'api/create',
            type: 'post',
            data: function(params) {
                return {
                    pid: params.parentId
                };
            }
        },
        remove: {
            url: function(params) {
                return 'api/remove/' + params.nodeId;
            }
        }
        ...
    },
    parseData: function(command, response) {
        if (command === 'read') {
            return response.code === '200' ? response.tree : false;
        } else {
            return response.code === '200';
        }
    }
};

tree.enableFeature('Ajax', options);
```

Information about each option is as follows:

|Name|Type|Description|
|---|---|---|
|`command`|`{object}`|Server request data options of each action|
|`command.read`|`{object}`|Server request date of read tree nodes action|
|`command.create`|`{object}`|Server request data of create node action|
|`command.update`|`{object}`|Server request data of update node action|
|`command.remove`|`{object}`|Server request data of remove node action|
|`command.removeAllChildren`|`{object}`|Server request data of remove all children nodes action|
|`command.move`|`{object}`|Server request data of move node action|
|`parseData`|`{function}`|Callback method that remake server response data|
|`loaderClassName`|`{string}`|Class name of loader image (default `tui-tree-loader`)|
|`isLoadRoot`|`{boolean}`| Whether rerendering nodes from root after Ajax feature is enabled or not|

#### Each options of `options.command[COMMAND_NAME]`
* `command[COMMAND_NAME]` is tree action to reqeust server.

|Name|Type|Description|
|---|---|---|
|`url`| `{string} or {function}` |When setting Restful API, using callback that returns URL|
|`type`|`{string}`|Server request method type : `get` or `post` (default `get`)|
|`dataType`|`{string}`|Server response data type : `json` or `jsonp` (default `json`)|
|`jsonpCallback`|`{string}`|Name of executing callback function in terms of server response data type is `jsonp`. When this option is used, need to set `type: get` and `dataType: jsonp` options|
|`data`|`{object}` or `{function}`|Server request parameters value. When you try to remake parameters, using callback that returns replaced parameters|

#### Parameters info of `options.parseData`
* `parseData` is callback method.

|Name|Description|
|---|---|
|`command`|Each command value to `options.command` option|
|`response`|Server response data|

### Step 3. Register custom events
* There is no need to register all custom events.
* When firing custom events, each event callback can use parameters.

```js
tree.on({
    beforeAjaxRequest: function(evt) {
        // Control server request
        ...
    },
    successAjaxResponse: function(evt) {
        // Control server success response
        ...
    },
    failAjaxResponse: function(evt) {
        // Control server fail response (Server respond data, but response data is invalid)
        ...
    },
    errorAjaxResponse: function(evt) {
        // Control server error response
        ...
    }
});
```

### List of Tree API that using Ajax after feature is enabled
|API|Command Name|Parameters of `url` & `data` callback method|
|---|---|---|
|`open`|`read`|`evt.nodeId`|
|`toggle`|`read`|`evt.nodeId`|
|`resetData`|`read`|`evt.nodeId`|
|`add`|`create`|`evt.parentId`<br>`evt.data`|
|`setNodeData`|`update`|`evt.nodeId`<br>`evt.data`<br>`evt.type`|
|`removeNodeData`|`update`|`evt.nodeId`<br>`evt.data`<br>`evt.type`|
|`remove`|`remove`|`evt.nodeId`|
|`removeAllChildren`|`removeAllChildren`|`evt.parentId`|
|`move`|`move`|`evt.nodeId`<br>`evt.newParentId`<br>`evt.index`|

### Reference
- API : https://nhnent.github.io/tui.tree/latest

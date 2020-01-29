## Description
- When getting data or occuring user action on tree component, this feature is request and response to server using Ajax.

## Feature operation
- When occurring read action on tree component, server is requested by options. And server respond with success data then tree view is updated.
- If server respond with failed data or is on error, tree view is not updated and each custom event can handle current state.
- View on [the example page](https://nhn.github.io/tui.tree/latest/tutorial-example08-ajax)

## How to use

### Step 1. Enable feature with options

```js
const options = {
  command: {
    read: {
      url: 'api/read',
      method: 'get',
      contentType: 'application/json',
      params: {
        paramA: 'a',
        paramB: 'b'
      }
    },
    create: {
      url: 'api/create',
      method: 'post',
      params: function(data) {
        return {
          pid: data.parentId
        };
      }
    },
    remove: {
      url: function(data) {
        return 'api/remove/' + data.nodeId;
      }
    }
  },
  parseData: function(command, responseData) {
    if (command === 'read') {
      return responseData.tree;
    } else {
      return true;
    }
  }
};

tree.enableFeature('Ajax', options);
```

Information about each option is as follows:

|Name|Type|Description|
|---|---|---|
|`command`|`{object}`|Server request data options of each action|
|`command.read`|[`{ajaxOptions}`](#ajaxOptions-each-options-of-optionscommandcommand_name)|Server request date of read tree nodes action|
|`command.create`|[`{ajaxOptions}`](#ajaxOptions-each-options-of-optionscommandcommand_name)|Server request data of create node action|
|`command.update`|[`{ajaxOptions}`](#ajaxOptions-each-options-of-optionscommandcommand_name)|Server request data of update node action|
|`command.remove`|[`{ajaxOptions}`](#ajaxOptions-each-options-of-optionscommandcommand_name)|Server request data of remove node action|
|`command.removeAllChildren`|[`{ajaxOptions}`](#ajaxOptions-each-options-of-optionscommandcommand_name)|Server request data of remove all children nodes action|
|`command.move`|[`{ajaxOptions}`](#ajaxOptions-each-options-of-optionscommandcommand_name)|Server request data of move node action|
|`parseData`|[`{parseDataCallback}`](#parseDataCallback-parameters-of-optionsparseData)|Callback method that remake server response data|
|`loaderClassName`|`{string}`|Class name of loader image (default `tui-tree-loader`)|
|`isLoadRoot`|`{boolean}`| Whether rerendering nodes from root after Ajax feature is enabled or not|

#### `ajaxOptions`: Each options of `options.command[COMMAND_NAME]`
`command[COMMAND_NAME]` is tree action to reqeust server.

|Name|Type|Description|
|---|---|---|
|`url`| `{string\|Function}` |When setting Restful API, using callback that returns URL|
|`method`|`{string}`|Server request method type (default: `GET`)|
|`contentType`|`{string}`|Server request data type (default: `application/json`)|
|`params`|`{Object\|Function}`|Server request parameters value. When you try to remake parameters, using callback that returns replaced parameters|

Also, you can use other options provided by the Ajax module of tui-code-snippet. Please refer to [tui-code-snippet/ajax API page](https://nhn.github.io/tui.code-snippet/2.3.0/ajax).

When you pass a function as `url` or `params`, the parameters of the function are different depending on which Tree API you used. Please refer to [this](#list-of-tree-api-that-using-ajax-after-feature-is-enabled) for details.

#### `parseDataCallback`: Parameters of `options.parseData`
`parseData` is callback method.

|Name|Description|
|---|---|
|`command`|Each command value to `options.command` option|
|`responseData`|Server response data. If `contentType` is `application/json`, the parsed object will be passed.|

### Step 3. Register custom events
There is no need to register all custom events. When firing custom events, each event callback can use parameters.

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
|API|Command Name|Parameters of `url` & `params` callback method|
|---|---|---|
|`open`|`read`|`treeData.nodeId`|
|`toggle`|`read`|`treeData.nodeId`|
|`resetData`|`read`|`treeData.nodeId`|
|`add`|`create`|`treeData.parentId`<br>`treeData.data`|
|`setNodeData`|`update`|`treeData.nodeId`<br>`treeData.data`<br>`treeData.type`|
|`removeNodeData`|`update`|`treeData.nodeId`<br>`treeData.data`<br>`treeData.type`|
|`remove`|`remove`|`treeData.nodeId`|
|`removeAllChildren`|`removeAllChildren`|`treeData.parentId`|
|`move`|`move`|`treeData.nodeId`<br>`treeData.newParentId`<br>`treeData.index`|

### Reference
- API : https://nhn.github.io/tui.tree/latest

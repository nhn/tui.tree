var Tree = require('../../src/js/tree');

describe('Ajax feature', function() {
  var tree;

  beforeEach(function() {
    loadFixtures('basicFixture.html');

    jasmine.Ajax.install();

    tree = new Tree('tree', {
      rootElement: 'treeRoot'
    });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it('loader should be created in the tree when Ajax feature is enabled', function() {
    var className;

    tree.enableFeature('Ajax');

    className = tree.enabledFeatures.Ajax.loaderClassName;

    expect(document.querySelectorAll('.' + className).length).toBe(1);
  });

  it('loader should be removed from the tree when Ajax feature is disabled', function() {
    var className;

    tree.enableFeature('Ajax');

    className = tree.enabledFeatures.Ajax.loaderClassName;

    tree.disableFeature('Ajax');

    expect(document.querySelectorAll('.' + className).length).toBe(0);
  });

  describe('Options', function() {
    var treeAjax;

    beforeEach(function() {
      tree.enableFeature('Ajax', {
        command: {
          read: {
            url: function(data) {
              var path = data && data.path ? data.path : '';

              return 'api/id' + path;
            },
            params: function(data) {
              data = data || { id: 1 };

              return { someId: data.id };
            }
          }
        },
        isLoadRoot: false
      });

      treeAjax = tree.enabledFeatures.Ajax;
    });

    it('"method" should be "GET" when default command option does not have it', function() {
      expect(treeAjax._getDefaultRequestOptions('read').method).toBe('GET');
    });

    it('"contentType" should be "application/json" when default command option does not have it', function() {
      expect(treeAjax._getDefaultRequestOptions('read').contentType).toBe('application/json');
    });

    it('"url" should be the return value when "url" property of the default command option is function', function() {
      expect(treeAjax._getDefaultRequestOptions('read').url).toBe('api/id');
      expect(treeAjax._getDefaultRequestOptions('read', { path: '/tree' }).url).toBe('api/id/tree');
    });

    it('"data" should be the return value when "data" property of the default command option is function', function() {
      expect(treeAjax._getDefaultRequestOptions('read').params).toEqual({
        someId: 1
      });
      expect(treeAjax._getDefaultRequestOptions('read', { id: 5 }).params).toEqual({
        someId: 5
      });
    });

    it('should not request to a server on init when "isLoadRoot" is false', function() {
      spyOn(tree, 'resetAllData');

      tree.on('initFeature');

      expect(tree.resetAllData).not.toHaveBeenCalled();
    });
  });

  describe('loadData() Ajax request - ', function() {
    var request, treeAjax;

    beforeEach(function() {
      tree.enableFeature('Ajax', {
        command: {
          remove: {
            url: 'api/test'
          }
        }
      });

      treeAjax = tree.enabledFeatures.Ajax;
    });

    it('request should not be execute when request url is empty', function() {
      treeAjax.loadData('read');

      request = jasmine.Ajax.requests.mostRecent();

      expect(request).toBeUndefined();
    });

    it('request should be executed when request options are valid', function() {
      treeAjax.loadData('remove');

      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('api/test');
      expect(request.method).toBe('GET');
    });

    it('request url should include query strings when request is "GET" with parameters', function() {
      var expected = 'api/test?param1=a&param2=b';

      spyOn(treeAjax, '_getDefaultRequestOptions').and.returnValue({
        url: 'api/test',
        method: 'GET',
        contentType: 'application/json',
        params: {
          param1: 'a',
          param2: 'b'
        }
      });

      treeAjax.loadData('remove');

      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe(expected);
    });

    it('request property should not be null when request is "POST" with parameters', function() {
      spyOn(treeAjax, '_getDefaultRequestOptions').and.returnValue({
        url: 'api/test',
        method: 'POST',
        contentType: 'application/json',
        params: {
          param1: 'a',
          param2: 'b'
        }
      });

      treeAjax.loadData('remove');

      request = jasmine.Ajax.requests.mostRecent();

      expect(request.params).not.toBeNull();
    });
  });

  describe('loadData() Ajax response - ', function() {
    var callback, treeAjax;

    beforeEach(function() {
      tree.enableFeature('Ajax', {
        command: {
          read: {
            url: 'api/test'
          }
        }
      });

      treeAjax = tree.enabledFeatures.Ajax;
      callback = jasmine.createSpy('callback function');
    });

    it('callback function should be executed when response is success', function() {
      treeAjax.loadData('read', callback);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: '{}'
      });

      expect(callback).toHaveBeenCalled();
    });

    it('the loader should be hidden when response is success', function() {
      var className = treeAjax.loaderClassName;
      treeAjax._showLoader();
      treeAjax.loadData('read', callback);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: '{}'
      });

      expect(document.querySelector('.' + className).style.display).toBe('none');
    });

    it('the Ajax loader should be hidden when response is failed', function() {
      var className = treeAjax.loaderClassName;
      treeAjax._showLoader();
      treeAjax.loadData('read', callback);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 404
      });

      expect(document.querySelector('.' + className).style.display).toBe('none');
    });

    it('the "errorAjaxResponse" custom event should be fired when response is failed', function() {
      var handler = jasmine.createSpy('error event handler');
      tree.on('errorAjaxResponse', handler);
      treeAjax.loadData('read', callback);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 404
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('READ command - ', function() {
    var rootNodeId, newChildIds;

    beforeEach(function() {
      rootNodeId = tree.getRootNodeId();

      tree.enableFeature('Ajax', {
        command: {
          read: {
            url: 'api/test'
          }
        }
      });

      tree.on('successAjaxResponse', function(evt) {
        newChildIds = evt.data;
      });

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: '[{"text":"A","state":"opened","hasChild":true},{"text":"B"}]',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('1 depth nodes should be added when Ajax feature is enabled', function() {
      expect(tree.getChildIds(rootNodeId).length).toBe(2);
    });

    it('children nodes should be added when state label is opened', function() {
      var nodeId = tree.getChildIds(rootNodeId)[0];

      tree.close(nodeId);
      tree.toggle(nodeId);
      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: '[{"text":"A","state":"opened","hasChild":true},{"text":"B"}]',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getChildIds(nodeId)).toEqual(newChildIds);
    });
  });

  describe('CREATE command - ', function() {
    var parentId, newChildIds;

    beforeEach(function() {
      tree.enableFeature('Ajax', {
        command: {
          create: {
            url: 'api/test'
          }
        }
      });

      parentId = tree.getRootNodeId();
    });

    it('new node should be created when response data is success', function() {
      tree.on('successAjaxResponse', function(evt) {
        newChildIds = evt.data;
      });

      tree.add({ text: 'C' }, parentId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'true',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getChildIds(parentId)).toEqual(newChildIds);
    });

    it('new node should not be created when response data is error', function() {
      tree.add({ text: 'C' }, parentId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'false',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getChildIds(parentId).length).toBe(0);
    });
  });

  describe('REMOVE command - ', function() {
    var children, parentId, nodeId;

    beforeEach(function() {
      children = [{ text: 'A' }, { text: 'B' }];

      tree.add(children);
      tree.enableFeature('Ajax', {
        command: {
          remove: {
            url: 'api/test'
          }
        }
      });

      parentId = tree.getRootNodeId();
      nodeId = tree.getChildIds(parentId)[0];
    });

    it('selected node should be removed when response data is success', function() {
      tree.remove(nodeId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'true',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getChildIds(parentId).length).toBe(children.length - 1);
    });

    it('selected node should not be removed when response data is error', function() {
      tree.remove(nodeId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'false',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getChildIds(parentId).length).toBe(children.length);
    });
  });

  describe('UPDATE command - ', function() {
    var children, nodeId, changedData;

    beforeEach(function() {
      children = [{ text: 'A', propA: 'aa', propB: 'bb' }];

      tree.add(children);
      tree.enableFeature('Ajax', {
        command: {
          update: {
            url: 'api/test'
          }
        }
      });

      nodeId = tree.getChildIds(tree.getRootNodeId())[0];
      changedData = { text: 'B' };
    });

    it('selected node data should be updated when response data is success', function() {
      tree.setNodeData(nodeId, changedData);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'true',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getNodeData(nodeId).text).toBe(changedData.text);
    });

    it('selected node data should not be updated when response data is error', function() {
      tree.setNodeData(nodeId, changedData);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'false',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getNodeData(nodeId).text).not.toBe(changedData.text);
    });

    it('deleted node data should be updated when response data is success', function() {
      tree.removeNodeData(nodeId, 'propA');

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'true',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getNodeData(nodeId).propA).toBeUndefined();
    });

    it('deleted node data should not be updated when response data is error', function() {
      tree.removeNodeData(nodeId, 'propA');

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'false',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getNodeData(nodeId).propA).toBe('aa');
    });
  });

  describe('REMOVE_ALL_CHILDREN command - ', function() {
    var children, nodeId;

    beforeEach(function() {
      children = [{ text: 'A' }, { text: 'B' }, { text: 'C' }];

      tree.add(children);
      tree.enableFeature('Ajax', {
        command: {
          removeAllChildren: {
            url: 'api/test'
          }
        }
      });

      nodeId = tree.getRootNodeId();
    });

    it('all children nodes should be removed when response data is success', function() {
      tree.removeAllChildren(nodeId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'true',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getChildIds(nodeId).length).toBe(0);
    });

    it('all children nodes should not be removed when response data is faild', function() {
      tree.removeAllChildren(nodeId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'false',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getChildIds(nodeId).length).toBe(children.length);
    });
  });

  describe('MOVE command - ', function() {
    var children, rootNodeId, nodeId, newParentId;

    beforeEach(function() {
      children = [
        { text: 'A', children: [{ text: 'aa' }, { text: 'bb' }] },
        { text: 'B' },
        { text: 'C' }
      ];

      tree.add(children);
      tree.enableFeature('Ajax', {
        command: {
          move: {
            url: 'api/test'
          }
        }
      });

      rootNodeId = tree.getRootNodeId();
      nodeId = tree.getChildIds(rootNodeId)[0];
      newParentId = tree.getChildIds(rootNodeId)[1];
    });

    it('node should be moved when response data is success', function() {
      tree.move(nodeId, newParentId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'true',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getParentId(nodeId)).toBe(newParentId);
    });

    it('node should not be moved when response data is error', function() {
      tree.move(nodeId, newParentId);

      jasmine.Ajax.requests.mostRecent().respondWith({
        status: 200,
        responseText: 'false',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(tree.getParentId(nodeId)).toBe(rootNodeId);
    });
  });
});

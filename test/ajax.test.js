'use strict';
var Tree = require('../src/js/tree');

describe('Tree', function() {
    var nodeData = [];
    var tree;

    beforeEach(function() {
        loadFixtures('basicFixture.html');

        jasmine.Ajax.install();

        tree = new Tree(nodeData, {
            rootElement: 'treeRoot'
        });
    });

    afterEach(function() {
        jasmine.Ajax.uninstall();
    });

    it('When Ajax feature is enabled, the loader is created in tree.', function() {
        var className = tree.classNames.loaderClass;

        tree.enableFeature('Ajax');

        expect($('.' + className).length).toBe(1);
    });

    it('When Ajax feature is disabled, the loader is removed in tree.', function() {
        var className = tree.classNames.loaderClass;

        tree.enableFeature('Ajax')
            .disableFeature('Ajax');

        expect($('.' + className).length).toBe(0);
    });

    describe('Options test', function() {
        var defaultOptions, treeAjax;

        beforeEach(function() {
            tree.enableFeature('Ajax', {
                command: {
                    read: {
                        url: 'api/test'
                    }
                },
                dataMap: function() {
                    return {
                        param1: 'a',
                        param2: 'b'
                    };
                },
                isLoadRoot: false
            });

            treeAjax = tree.enabledFeatures.Ajax;
            defaultOptions = treeAjax._getDefaultRequestOptions('read');
        });

        it('When default command option have not "type" property, default value set to "get".', function() {
            expect(defaultOptions.type).toBe('get');
        });

        it('When default command option have not "dataType" property, default value set to "json".', function() {
            expect(defaultOptions.dataType).toBe('json');
        });

        it('When feature option have "dataMap" function, "data" value set to return value of "dataMap".', function() {
            expect(defaultOptions.data).toEqual({
                param1: 'a',
                param2: 'b'
            });
        });

        it('When "isLoadRoot" option value is false, it is not request server on init.', function() {
            spyOn(tree, 'resetAllData');

            tree.on('initFeature');

            expect(tree.resetAllData).not.toHaveBeenCalled();
        });
    });

    describe('loadData() Ajax request - ', function() {
        var request, treeAjax;

        beforeEach(function() {
            tree.enableFeature('Ajax');

            treeAjax = tree.enabledFeatures.Ajax;
        });

        it('When request url is empty, request is not executed.', function() {
            spyOn(treeAjax, '_getDefaultRequestOptions').and.returnValue({

            });

            treeAjax.loadData();

            request = jasmine.Ajax.requests.mostRecent();

            expect(request).toBeUndefined();
        });

        it('When request options are valid, request is executed.', function() {
            spyOn(treeAjax, '_getDefaultRequestOptions').and.returnValue({
                url: 'api/test',
                type: 'get'
            });

            treeAjax.loadData();

            request = jasmine.Ajax.requests.mostRecent();

            expect(request.url).toBe('api/test');
            expect(request.method).toBe('GET');
        });

        it('When request is "GET" with parameters, request url include query string.', function() {
            var expected = 'api/test?param1=a&param2=b';

            spyOn(treeAjax, '_getDefaultRequestOptions').and.returnValue({
                url: 'api/test',
                type: 'get',
                dataType: 'json',
                data: {
                    param1: 'a',
                    param2: 'b'
                }
            });

            treeAjax.loadData();

            request = jasmine.Ajax.requests.mostRecent();

            expect(request.url).toBe(expected);
        });

        it('When request is "POST" with parameters, request property is not null.', function() {
            spyOn(treeAjax, '_getDefaultRequestOptions').and.returnValue({
                url: 'api/test',
                type: 'post',
                dataType: 'json',
                data: {
                    param1: 'a',
                    param2: 'b'
                }
            });

            treeAjax.loadData();

            request = jasmine.Ajax.requests.mostRecent();

            expect(request.params).not.toBeNull();
        });
    });

    describe('loadData() Ajax response - ', function() {
        var callback, treeAjax;

        beforeEach(function() {
            tree.enableFeature('Ajax');

            treeAjax = tree.enabledFeatures.Ajax;
            callback = jasmine.createSpy('callback function');

            spyOn(treeAjax, '_getDefaultRequestOptions').and.returnValue({
                url: 'api/test'
            });
        });

        it('When response is success, callback function is executed.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success({});
            });

            treeAjax.loadData('', callback);

            expect(callback).toHaveBeenCalled();
        });

        it('When response is success, the loader is hidden.', function() {
            var className = tree.classNames.loaderClass;

            spyOn($, 'ajax').and.callFake(function(e) {
                e.success({});
            });

            treeAjax._showLoader(true);
            treeAjax.loadData('', callback);

            expect($('.' + className).css('display')).toBe('none');
        });

        it('When response is failed, the Ajax loader is hidden.', function() {
            var className = tree.classNames.loaderClass;

            spyOn($, 'ajax').and.callFake(function(e) {
                e.error({});
            });

            treeAjax._showLoader(true);
            treeAjax.loadData('', callback);

            expect($('.' + className).css('display')).toBe('none');
        });

        it('When response is failed, the "errorResponse" custom event is fired.', function() {
            var handler = jasmine.createSpy('error event handler');

            spyOn($, 'ajax').and.callFake(function(e) {
                e.error({});
            });

            tree.on('errorResponse', handler);

            treeAjax.loadData('', callback);

            expect(handler).toHaveBeenCalled();
        });
    });

    describe('READ command - ', function() {
        var response, rootNodeId, newChildIds;

        beforeEach(function() {
            rootNodeId = tree.getRootNodeId();
            response = [
                {text: 'A', state: 'opened', hasChild: true},
                {text: 'B'}
            ];

            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(response);
            });

            tree.enableFeature('Ajax', {
                command: {
                    read: {
                        url: 'api/test'
                    }
                }
            });

            tree.on('successResponse', function(type, data) {
                newChildIds = data;
            });
        });

        it('When Ajax feature is enabled, 1 depth nodes are added.', function() {
            expect(tree.getChildIds(rootNodeId).length).toBe(2);
        });

        it('When state label is opened, children nodes are added.', function() {
            var nodeId = tree.getChildIds(rootNodeId)[0];

            tree.close(nodeId);
            tree.toggle(nodeId);

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

        it('When response data is success, new node is created.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(true);
            });

            tree.on('successResponse', function(type, data) {
                newChildIds = data;
            });

            tree.add({text: 'C'}, parentId);

            expect(tree.getChildIds(parentId)).toEqual(newChildIds);
        });

        it('When response data is error, new node is not created.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(false);
            });

            tree.add({text: 'C'}, parentId);

            expect(tree.getChildIds(parentId).length).toBe(0);
        });
    });

    describe('REMOVE command - ', function() {
        var children, parentId, nodeId;

        beforeEach(function() {
            children = [
                {text: 'A'},
                {text: 'B'}
            ];

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

        it('When response data is success, selected node is removed.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(true);
            });

            tree.remove(nodeId);

            expect(tree.getChildIds(parentId).length).toBe(children.length - 1);
        });

        it('When response data is error, selected node is not removed.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(false);
            });

            tree.remove(nodeId);

            expect(tree.getChildIds(parentId).length).toBe(children.length);
        });
    });

    describe('UPDATE command - ', function() {
        var children, nodeId, changedData;

        beforeEach(function() {
            children = [
                {text: 'A', propA: 'aa', propB: 'bb'}
            ];

            tree.add(children);
            tree.enableFeature('Ajax', {
                command: {
                    update: {
                        url: 'api/test'
                    }
                }
            });

            nodeId = tree.getChildIds(tree.getRootNodeId())[0];
            changedData = {text: 'B'};
        });

        it('When response data is success, selected node data is updated.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(true);
            });

            tree.setNodeData(nodeId, changedData);

            expect(tree.getNodeData(nodeId).text).toBe(changedData.text);
        });

        it('When response data is error, selected node data is not updated.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(false);
            });

            tree.setNodeData(nodeId, changedData);

            expect(tree.getNodeData(nodeId).text).not.toBe(changedData.text);
        });

        it('When response data is success, deleted node data is updated.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(true);
            });

            tree.removeNodeData(nodeId, 'propA');

            expect(tree.getNodeData(nodeId).propA).toBeUndefined();
        });

        it('When response data is error, deleted node data is not updated.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(false);
            });

            tree.removeNodeData(nodeId, 'propA');

            expect(tree.getNodeData(nodeId).propA).toBe('aa');
        });
    });

    describe('REMOVE_ALL_CHILDREN command - ', function() {
        var children, nodeId;

        beforeEach(function() {
            children = [
                {text: 'A'},
                {text: 'B'},
                {text: 'C'}
            ];

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

        it('When response data is success, all children nodes are removed.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(true);
            });

            tree.removeAllChildren(nodeId);

            expect(tree.getChildIds(nodeId).length).toBe(0);
        });

        it('When response data is faild, all children nodes are not removed.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(false);
            });

            tree.removeAllChildren(nodeId);

            expect(tree.getChildIds(nodeId).length).toBe(children.length);
        });
    });

    describe('MOVE command - ', function() {
        var children, rootNodeId, nodeId, newParentId;

        beforeEach(function() {
            children = [
                {text: 'A', children: [
                    {text: 'aa'},
                    {text: 'bb'}
                ]},
                {text: 'B'},
                {text: 'C'}
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

        it('When response data is success, node is moved.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(true);
            });

            tree.move(nodeId, newParentId);

            expect(tree.getParentId(nodeId)).toBe(newParentId);
        });

        it('When response data is error, node is not moved.', function() {
            spyOn($, 'ajax').and.callFake(function(e) {
                e.success(false);
            });

            tree.move(nodeId, newParentId);

            expect(tree.getParentId(nodeId)).toBe(rootNodeId);
        });
    });
});


'use strict';

var TreeNode = require('../src/js/treeNode');

describe('Node', function() {
    var node,
        parentId = 0,
        data = {
            title: 'My node',
            state: 'closed'
        };

    beforeEach(function() {
        node = new TreeNode(data, parentId);
    });

    it('Set/Get/Toggle state', function() {
        expect(node.getState()).toEqual('closed');

        node.setState('opened');
        expect(node.getState()).toEqual('opened');

        node.setState('asdf');
        expect(node.getState()).toEqual('opened');

        node.toggleState();
        expect(node.getState()).toEqual('closed');
    });

    it('Add/Remove/Replace childId(s)', function() {
        expect(node.getId()).toEqual(jasmine.any(Number));

        node.addChildId(4);
        expect(node.getChildIds()).toContain(4);

        node.removeChildId(4);
        expect(node.getChildIds()).not.toContain(4);

        node.replaceChildIds([4, 5, 6]);
        expect(node.getChildIds()).toEqual([4, 5, 6]);
    });

    fit('Add/Remove node data', function() {
        expect(node.getAllData()).toEqual(jasmine.objectContaining({
            title: 'My node'
        }));

        node.addData({newData: 'data2'});
        expect(node.getAllData()).toEqual(jasmine.objectContaining({
            title: 'My node',
            newData: 'data2'
        }));

        node.removeData('title', 'newData');
        expect(node.getAllData().title).toBeUndefined();
        expect(node.getAllData().newData).toBeUndefined();
    });

    it('IsLeaf', function() {
        expect(node.isLeaf()).toBe(true);

        node.addChildId(4);
        expect(node.isLeaf()).toBe(false);
    });

    it('IsRoot', function() {
        expect(node.isRoot()).toBe(false);

        node.setParentId(null);
        expect(node.isRoot()).toBe(true);
    });
});

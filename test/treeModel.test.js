'use strict';

var TreeModel = require('../src/js/treeModel');

describe('TreeModel', function() {
    var treeModel,
        data = [
            {text: 'A', hiddenValue: 'Child of root', children: [
                {text: '1'},
                {text: '2'},
                {text: '3'},
                {text: '4'},
                {text: '5', children: [
                    {text:'가', children:[
                        {text:'*'}
                    ]},
                    {text:'나'}
                ]},
                {text: '6'},
                {text: '7'},
                {text: '8'},
                {text: '9', children: [
                    {text:'가'},
                    {text:'나'}
                ]},
                {text: '10'},
                {text: '11'},
                {text: '12'}
            ]},
            {text: 'B', state: 'opened', children: [
                {text:'1'},
                {text:'2'},
                {text:'3'}
            ]},
            {text: 'C', children: [
                {text: '1'}
            ]}
        ];

    beforeEach(function() {
        treeModel = new TreeModel(data, {
            defaultState: 'closed',
            nodeIdPrefix: 'tree-node-'
        });
    });

    it('should have the rootNode', function() {
        expect(treeModel.rootNode).toBeDefined();
    });

    it('should have the length of all nodes within rootNode', function() {
        expect(treeModel.getCount()).toEqual(25);
    });

    it('Find method should return a node', function() {
        var id = treeModel.rootNode.getChildIds()[0],
            node = treeModel.getNode(id);

        expect(node.getData('hiddenValue')).toEqual('Child of root');
        expect(node.getData('text')).toEqual('A');
        expect(node.getAllData()).toEqual({
            text: 'A',
            hiddenValue: 'Child of root'
        });
    });

    it('- Add method should append a node to a specific parent node', function() {
        var data = {
                text: 'This node will be added to the first node'
            },
            parentId = treeModel.rootNode.getChildIds()[0],
            parentNode = treeModel.getNode(parentId),
            id, node;

        treeModel.add(data, parentId);
        id = parentNode.getChildIds()[12];
        node = treeModel.getNode(id);

        expect(node.getData('text')).toEqual('This node will be added to the first node');
        expect(node.getParentId()).toEqual(parentId);
    });

    it('- Remove method should remove a node in treeModel', function() {
        var id = treeModel.rootNode.getChildIds()[0],
            childIds = treeModel.getNode(id).getChildIds(),
            searched;

        treeModel.remove(id);

        expect(treeModel.rootNode.getChildIds()).not.toContain(id);

        searched = treeModel.getNode(childIds[0]);
        expect(searched).toBeFalsy();

        searched = treeModel.getNode(childIds[11]);
        expect(searched).toBeFalsy();
    });

    it('- Each(all) method should iterate over all descendants of a (root or specific)node', function() {
        var iteratee = jasmine.createSpy(),
            firstChildIdOfRoot = treeModel.rootNode.getChildIds()[0];

        treeModel.eachAll(iteratee);
        expect(iteratee.calls.count()).toEqual(25);

        iteratee.calls.reset();
        treeModel.each(iteratee, firstChildIdOfRoot);
        expect(iteratee.calls.count()).toEqual(17);
    });

    it('- Sort method', function() {
        var childIds = treeModel.rootNode.getChildIds(),
            comparator = function(nodeA, nodeB) {
                var aValue = nodeA.getData('text'),
                    bValue = nodeB.getData('text');

                if (!bValue.localeCompare) {
                    return 0;
                }
                return bValue.localeCompare(aValue);
            };

        treeModel.sort(comparator);
        expect(childIds.reverse()).toEqual(treeModel.rootNode.getChildIds());
    });

    it('should support initial state for each node', function() {
        var openedNodeId = treeModel.rootNode.getChildIds()[1],
            node = treeModel.getNode(openedNodeId);

        expect(node.getState()).toEqual('opened');
    });

    it('should fire update event when a node added', function() {
        var handler = jasmine.createSpy('updateHandler'),
            rootId = treeModel.rootNode.getId();

        treeModel.on('update', handler);
        treeModel.add({title: 'new node'}, rootId);

        expect(handler).toHaveBeenCalledWith(rootId);
    });

    it('should fire update event when a node removed', function() {
        var handler = jasmine.createSpy('updateHandler'),
            rootId = treeModel.rootNode.getId(),
            firstChildId = treeModel.rootNode.getChildIds()[0];

        treeModel.on('update', handler);
        treeModel.remove(firstChildId);

        expect(handler).toHaveBeenCalledWith(rootId);
    });

    it('should fire update event when node data changed', function() {
        var handler = jasmine.createSpy('updateHandler'),
            firstChildId = treeModel.rootNode.getChildIds()[0];

        treeModel.on('update', handler);
        treeModel.setNodeData(firstChildId, {hiddenValue: 'new hidden'});

        expect(handler).toHaveBeenCalledWith(firstChildId);
        expect(treeModel.getNode(firstChildId).getData('hiddenValue')).toEqual('new hidden');
    });

    it('should fire move event when a node moved', function() {
        var handler = jasmine.createSpy('moveHandler'),
            rootId = treeModel.rootNode.getId(),
            firstChildId = treeModel.rootNode.getChildIds()[0],
            grandChildId = treeModel.getNode(firstChildId).getChildIds()[0];

        treeModel.on('move', handler);
        treeModel.move(grandChildId, rootId);

        expect(handler).toHaveBeenCalledWith(grandChildId, firstChildId, rootId);
        expect(treeModel.getNode(grandChildId).getParentId()).toEqual(rootId);
    });
});

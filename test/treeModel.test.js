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
            {text: 'B', children: [
                {text:'1'},
                {text:'2'},
                {text:'3'}
            ]},
            {text: 'C', id: 'customId', children: [
                {text: '1', id: 'customIdChild', state:'opened'}
            ]}
        ];

    beforeEach(function() {
        treeModel = new TreeModel(data, 'closed');
    });

    it('Should have the rootNode', function() {
        expect(treeModel.rootNode).toBeDefined();
    });

    it('Should have the length of all nodes with rootNode', function() {
        expect(treeModel.getCount()).toEqual(25);
    });

    it('Find method should return a node', function() {
        var id = treeModel.rootNode.getChildIds()[0],
            node = treeModel.getNode(id);

        expect(node.getData('hiddenVale')).toEqual('Child of root');
        expect(node.getData('text')).toEqual('A');
        expect(node.getAllData()).toEqual({
            text: 'A',
            hiddenValue: 'Child of root'
        });
    });

    it('Add method should append a node to a specific parent node', function() {
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

    it('Remove method should remove a node in treeModel', function() {
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

    it('Each method', function() {
        var iteratee = jasmine.createSpy(),
            callCount = treeModel.getCount();

        treeModel.each(iteratee);
        expect(iteratee.calls.count()).toEqual(callCount);
    });

    it('Sort method', function() {
        var childIds = treeModel.rootNode.getChildIds(),
            comparator = function() {
                return -1;
            };

        treeModel.sort(comparator);
        expect(childIds.reverse()).toEqual(treeModel.rootNode.getChildIds());
    });

    it('Should support each node a custom id and initial state', function() {
        var node = treeModel.getNode('customId');
        expect(node.getData('text')).toEqual('C');

        node = treeModel.getNode('customIdChild');
        expect(node.getState()).toEqual('opened');
    });
});

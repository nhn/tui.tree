'use strict';
var Tree = require('../src/js/tree');

describe('Tree', function() {
    var data = [
            {title: 'A', children: [
                {title: '1'},
                {title: '2'},
                {title: '3'},
                {title: '4'},
                {title: '5', children: [
                    {title:'가', children:[
                        {title:'*'}
                    ]},
                    {title:'나'}
                ]},
                {title: '6'},
                {title: '7'},
                {title: '8'},
                {title: '9', children: [
                    {title:'가'},
                    {title:'나'}
                ]},
                {title: '10'},
                {title: '11'},
                {title: '12'}
            ]},
            {title: 'B', children: [
                {title:'1'},
                {title:'2'},
                {title:'3'}
            ]}
        ],
        tree;

    beforeEach(function() {
        tree = new Tree(data);
    });

    it('should have a root element', function() {
        expect(tree.rootElement).toEqual(jasmine.any(HTMLElement));
    });

    it('should change state of a node to "opened" when open node', function() {
        var firstChild = tree.model.getChildren(tree.model.rootNode.getId())[0];

        tree.open(firstChild.getId());
        expect(firstChild.getState()).toEqual('opened');
    });

    it('should change state of a node to "closed" when close node', function() {
        var firstChild = tree.model.getChildren(tree.model.rootNode.getId())[0];

        tree.close(firstChild.getId());
        expect(firstChild.getState()).toEqual('closed');
    });

    it('should toggle state of a node when toggle node', function() {
        var firstChild = tree.model.getChildren(tree.model.rootNode.getId())[0];

        tree.open(firstChild.getId());
        tree.toggle(firstChild.getId());
        expect(firstChild.getState()).toEqual('closed');

        tree.toggle(firstChild.getId());
        expect(firstChild.getState()).toEqual('opened');
    });

    it('should fire singleClick event', function() {
        var handler = jasmine.createSpy('singleClick handler'),
            eventMock = {
                target: document.createElement('DIV')
            };

        jasmine.clock().install();

        tree.on('singleClick', handler);
        tree.clickTimer = null; // No clicked
        tree._onClick(eventMock); // Single click

        jasmine.clock().tick(401);

        expect(handler).toHaveBeenCalled();
        jasmine.clock().uninstall();
    });

    it('should fire doubleClick event', function() {
        var handler = jasmine.createSpy('doubleClick handler'),
            eventMock = {
                target: document.createElement('DIV')
            };

        tree.on('doubleClick', handler);
        tree.clickTimer = 1; // Set clicked once
        tree._onClick(eventMock); // Double click

        expect(handler).toHaveBeenCalled();
    });

    it('should redraw nodes when new nodes are added', function() {
        var firstChildId = tree.model.rootNode.getChildIds()[0],
            firstChild = tree.model.getNode(firstChildId),
            childCount = firstChild.getChildIds().length,
            subtreeElement = document.getElementById(firstChildId).lastChild,
            data = [
                {text: 'hello world'},
                {text: 'new world'}
            ];

        spyOn(tree, '_drawChildren').and.callThrough();

        tree.add(data, firstChildId);
        expect(firstChild.getChildIds().length).toEqual(childCount + 2);
        expect(subtreeElement.childNodes.length).toEqual(childCount + 2);
    });

    it('should redraw nodes when a node is removed', function() {
        var firstChildId = tree.model.rootNode.getChildIds()[0],
            firstChild = tree.model.getNode(firstChildId),
            childCount = firstChild.getChildIds().length,
            subtreeElement = document.getElementById(firstChildId).lastChild,
            idForRemoving = firstChild.getChildIds()[0];

        tree.remove(idForRemoving);
        expect(document.getElementById(idForRemoving)).toBeFalsy();
        expect(firstChild.getChildIds().length).toEqual(childCount - 1);
        expect(subtreeElement.childNodes.length).toEqual(childCount - 1);
    });

    it('should redraw nodes when nodes are moved', function() {
        var firstChildId = tree.model.rootNode.getChildIds()[0],
            lastChildId = tree.model.rootNode.getChildIds().slice(-1)[0], // slice(-1) returns a value of last index
            grandChildId = tree.model.getNode(firstChildId).getChildIds()[0],
            firstChildElement, lastChildElement, grandChildElement;

        tree.move(grandChildId, lastChildId);
        firstChildElement = document.getElementById(firstChildId);
        lastChildElement = document.getElementById(lastChildId);
        grandChildElement = document.getElementById(grandChildId);

        expect(firstChildElement.contains(grandChildElement)).toBe(false);
        expect(lastChildElement.contains(grandChildElement)).toBe(true);
    });
});

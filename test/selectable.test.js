'use strict';
var Tree = require('../src/js/tree'),
    utils = require('../src/js/util'),
    messages = require('../src/js/consts/messages');

jasmine.getFixtures().fixturesPath = 'base/test/fixtures';
describe('Tree', function() {
    var data = [
            {
                title: 'A', children: [
                {title: '1'},
                {title: '2'},
                {title: '3'},
                {title: '4'},
                {
                    title: '5', children: [
                    {
                        title: '가', children: [
                        {title: '*'}
                    ]
                    },
                    {title: '나'}
                ]
                },
                {title: '6'},
                {title: '7'},
                {title: '8'},
                {
                    title: '9', children: [
                    {title: '가'},
                    {title: '나'}
                ]
                },
                {title: '10'},
                {title: '11'},
                {title: '12'}
            ]
            },
            {
                title: 'B', children: [
                {title: '1'},
                {title: '2'},
                {title: '3'}
            ]
            }
        ],
        rootElement,
        tree,
        treeSelection;

    beforeEach(function() {
        loadFixtures('basicFixture.html');
        tree = new Tree(data, {
            rootElement: 'treeRoot'
        });

        rootElement = document.getElementById('treeRoot');
        tree.enableFeature('Selectable');

        // "tree.enabledFeatures.Selectable" is not constructor but instance.
        treeSelection = tree.enabledFeatures.Selectable;
    });

    it('should not invoke "beforeSelect" if the selected node does not exist', function() {
        var eventMock = {
                target: null
            },
            spyListener = jasmine.createSpy();

        tree.on('beforeSelect', spyListener);
        tree.fire('singleClick', eventMock);

        expect(spyListener).not.toHaveBeenCalled();
    });

    it('should invoke "beforeSelect" if the selected node exists', function() {
        var eventMock = {
                target: utils.getElementsByClassName(rootElement, 'tui-tree-node')[2]
            },
            beforeSelectListenerSpy = jasmine.createSpy();

        tree.on('beforeSelect', beforeSelectListenerSpy);
        treeSelection.onSingleClick(eventMock);

        expect(beforeSelectListenerSpy).toHaveBeenCalled();
    });

    it('should fire "select" event if the "beforeSelect"-listener does not return false', function() {
        var eventMock = {
                target: utils.getElementsByClassName(rootElement, 'tui-tree-node')[2]
            },
            selectListenerSpy = jasmine.createSpy();

        tree.on('beforeSelect', function() {
            return;
        });
        tree.on('select', selectListenerSpy);
        treeSelection.onSingleClick(eventMock);

        expect(selectListenerSpy).toHaveBeenCalled();
    });

    it('should not fire "select" event if the "beforeSelect"-listener returns false', function() {
        var eventMock = {
                target: utils.getElementsByClassName(rootElement, 'tui-tree-node')[2]
            },
            selectListenerSpy = jasmine.createSpy();

        tree.on('beforeSelect', function() {
            return false;
        });
        tree.on('select', selectListenerSpy);
        treeSelection.onSingleClick(eventMock);

        expect(selectListenerSpy).not.toHaveBeenCalled();
    });

    it('should fire custom events with args containing "nodeId" and "prevNodeId"', function() {
        var target = utils.getElementsByClassName(rootElement, 'tui-tree-node')[2],
            eventMock = {
                target: target
            },
            beforeSelectListenerSpy = jasmine.createSpy(),
            selectListenerSpy = jasmine.createSpy(),
            curNodeId = target.id,
            prevNodeId = 'previousNodeId';

        treeSelection.prevNodeId = prevNodeId;
        tree.on('beforeSelect', beforeSelectListenerSpy);
        tree.on('select', selectListenerSpy);
        treeSelection.onSingleClick(eventMock);

        expect(beforeSelectListenerSpy).toHaveBeenCalledWith(curNodeId, prevNodeId);
        expect(selectListenerSpy).toHaveBeenCalledWith(curNodeId, prevNodeId);
    });

    it('should throw error when the feature-"Selectable" is not enabled and select a node', function() {
        tree.disableFeature('Selectable');
        expect(tree.select).toThrowError(messages.INVALID_API_SELECTABLE);
    });

    it('should not throw an error when the feature-"Selectable" is enabled', function() {
        expect(tree.select).not.toThrowError();
    });

    it('should invoke "beforeSelect" and fire "select"', function() {
        var beforeSelectListenerSpy = jasmine.createSpy(),
            selectListenerSpy = jasmine.createSpy(),
            targetId = utils.getElementsByClassName(rootElement, 'tui-tree-node')[2].id;

        tree.on({
            beforeSelect: beforeSelectListenerSpy,
            select: selectListenerSpy
        });
        tree.select(targetId);

        expect(beforeSelectListenerSpy).toHaveBeenCalled();
        expect(selectListenerSpy).toHaveBeenCalled();
    });
});

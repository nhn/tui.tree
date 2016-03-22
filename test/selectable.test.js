'use strict';
var Tree = require('../src/js/tree'),
    messages = require('../src/js/consts/messages');

jasmine.getFixtures().fixturesPath = 'base/test/fixtures';
describe('Tree', function() {
    var data = [
            {title: 'A', children: [
                {title: '1'},
                {title: '2'},
                {title: '3'},
                {title: '4'},
                {title: '5', children: [
                    {title: '가', children: [
                        {title: '*'}
                    ]},
                    {title: '나'}
                ]},
                {title: '6'},
                {title: '7'},
                {title: '8'},
                {title: '9', children: [
                    {title: '가'},
                    {title: '나'}
                ]},
                {title: '10'},
                {title: '11'},
                {title: '12'}
            ]},
            {title: 'B', children: [
                {title: '1'},
                {title: '2'},
                {title: '3'}
            ]}
        ],
        rootElement, tree, treeSelection;

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

    describe('events', function() {
        var eventMock,
            target;

        beforeEach(function() {
            target = $(rootElement).find('.tui-tree-node')[2];
            eventMock = {
                target: target
            };
        });

        it('should not invoke "beforeSelect" if the selected node does not exist', function() {
            var spyListener = jasmine.createSpy();
            eventMock = {
                target: null
            };

            tree.on('beforeSelect', spyListener);
            tree.fire('singleClick', eventMock);

            expect(spyListener).not.toHaveBeenCalled();
        });

        it('should invoke "beforeSelect" if the selected node exists', function() {
            var beforeSelectListenerSpy = jasmine.createSpy();

            tree.on('beforeSelect', beforeSelectListenerSpy);
            treeSelection.onSingleClick(eventMock);

            expect(beforeSelectListenerSpy).toHaveBeenCalled();
        });

        it('should fire "select" event if the "beforeSelect"-listener does not return false', function() {
            var selectListenerSpy = jasmine.createSpy();

            tree.on('beforeSelect', function() {
                return '';
            });
            tree.on('select', selectListenerSpy);
            treeSelection.onSingleClick(eventMock);

            expect(selectListenerSpy).toHaveBeenCalled();
        });

        it('should not fire "select" event if the "beforeSelect"-listener returns false', function() {
            var selectListenerSpy = jasmine.createSpy();

            tree.on('beforeSelect', function() {
                return false;
            });
            tree.on('select', selectListenerSpy);
            treeSelection.onSingleClick(eventMock);

            expect(selectListenerSpy).not.toHaveBeenCalled();
        });

        it('should fire custom events with args containing "nodeId" and "prevNodeId"', function() {
            var beforeSelectListenerSpy = jasmine.createSpy(),
                selectListenerSpy = jasmine.createSpy(),
                curNodeId = target.id,
                prevNodeId = 'previousNodeId';

            treeSelection.selectedNodeId = prevNodeId;
            tree.on('beforeSelect', beforeSelectListenerSpy);
            tree.on('select', selectListenerSpy);
            treeSelection.onSingleClick(eventMock);

            expect(beforeSelectListenerSpy).toHaveBeenCalledWith(curNodeId, prevNodeId, target);
            expect(selectListenerSpy).toHaveBeenCalledWith(curNodeId, prevNodeId, target);
        });
    });

    describe('API', function() {
        it('should throw error when the feature-"Selectable" is not enabled', function() {
            tree.disableFeature('Selectable');
            expect(tree.select).toThrowError(messages.INVALID_API_SELECTABLE);
            expect(tree.getSelectedNodeId).toThrowError(messages.INVALID_API_SELECTABLE);
        });

        it('should invoke "beforeSelect" and fire "select"', function() {
            var beforeSelectListenerSpy = jasmine.createSpy(),
                selectListenerSpy = jasmine.createSpy(),
                targetId = $(rootElement).find('.tui-tree-node')[2].id;

            tree.on({
                beforeSelect: beforeSelectListenerSpy,
                select: selectListenerSpy
            });
            tree.select(targetId);

            expect(beforeSelectListenerSpy).toHaveBeenCalled();
            expect(selectListenerSpy).toHaveBeenCalled();
        });

        it('should have "getSelectedNodeId" api', function() {
            var targetId = $(rootElement).find('.tui-tree-node')[2].id;

            tree.select(targetId);
            expect(tree.getSelectedNodeId()).toEqual(targetId);
        });
    });
});

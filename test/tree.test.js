'use strict';
var Tree = require('../src/js/tree'),
    util = require('../src/js/util'),
    messages = require('../src/js/consts/messages');

jasmine.getFixtures().fixturesPath = 'base/test/fixtures';
describe('Tree', function() {
    var nodeData = [
            {text: 'A', children: [
                {text: '1'},
                {text: '2'},
                {text: '3'},
                {text: '4'},
                {text: '5', children: [
                    {text: '가', children: [
                        {text: '*'}
                    ]},
                    {text: '나'}
                ]},
                {text: '6'},
                {text: '7'},
                {text: '8'},
                {text: '9', children: [
                    {text: '가'},
                    {text: '나'}
                ]},
                {text: '10'},
                {text: '11'},
                {text: '12'}
            ]},
            {text: 'B', children: [
                {text: '1'},
                {text: '2'},
                {text: '3'},
                {text: '4'},
                {text: '5'}
            ]}
        ],
        rootElement,
        tree,
        firstChildId, lastChildId, grandChildId,
        firstChild;

    beforeEach(function() {
        loadFixtures('basicFixture.html');
        rootElement = $('#treeRoot');
        tree = new Tree(nodeData, {
            rootElement: 'treeRoot',
            template: {
                leafNode:
                '<span class="tui-tree-leaf-label"></span>' +
                '<span class="{{textClass}}">{{text}}</span>'
            }
        });
        firstChildId = tree.model.rootNode.getChildIds()[0];
        firstChild = tree.model.getNode(firstChildId);
        lastChildId = tree.model.rootNode.getChildIds().slice(-1)[0]; // slice(-1) returns a value of last index
        grandChildId = tree.model.getNode(firstChildId).getChildIds()[0];
    });

    it('should throw an error if has invalid root element', function() {
        expect(function() {
            return new Tree(nodeData);
        }).toThrowError(messages.INVALID_ROOT_ELEMENT);
    });

    it('should have a root element', function() {
        // Node.ELEMENT_NODE === 1
        // in IE8,
        // element instanceof HTMLElement --> error
        // element.nodeType === Node.ELEMENT_NODE --> error
        expect(tree.rootElement.nodeType).toEqual(1);
    });

    it('should make correct DOM', function() {
        var textElement = $(rootElement).find('.tui-tree-node .tui-tree-text')[0];

        expect(textElement.innerHTML).toEqual('A');
    });

    it('should make DOM from optional-template', function() {
        var $leafNodes = $(rootElement).find('.tui-tree-leaf'),
            $leafLabels = $leafNodes.find('.tui-tree-leaf-label');

        expect($leafLabels.length).toEqual($leafNodes.length);
    });

    it('should change state of a node to "opened" when open node', function() {
        tree.open(firstChildId);
        expect(firstChild.getState()).toEqual('opened');
    });

    it('should change state of a node to "closed" when close node', function() {
        tree.close(firstChildId);
        expect(firstChild.getState()).toEqual('closed');
    });

    it('should toggle state of a node when toggle node', function() {
        tree.open(firstChildId);
        tree.toggle(firstChildId);
        expect(firstChild.getState()).toEqual('closed');

        tree.toggle(firstChildId);
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

    it('should change button label when change the state of node', function() {
        var firstChildElement = document.getElementById(firstChildId),
            btnElement = $(firstChildElement).find('.tui-tree-toggleBtn')[0];

        tree.close(firstChildId);
        expect(btnElement.innerHTML).toEqual(tree.stateLabels.closed);

        tree.open(firstChildId);
        expect(btnElement.innerHTML).toEqual(tree.stateLabels.opened);
    });

    it('should fire doubleClick event', function() {
        var handler = jasmine.createSpy('doubleClick handler'),
            eventMock = {
                target: document.createElement('DIV')
            };

        tree.on('doubleClick', handler);
        tree._onDoubleClick(eventMock);

        expect(handler).toHaveBeenCalled();
    });

    it('should redraw nodes when new nodes are added', function() {
        var childCount = firstChild.getChildIds().length,
            data = [
                {text: 'hello world'},
                {text: 'new world'}
            ],
            subtreeElement;

        spyOn(tree, '_draw').and.callThrough();

        tree.add(data, firstChildId);
        subtreeElement = document.getElementById(firstChildId).lastChild;

        expect(firstChild.getChildIds().length).toEqual(childCount + 2);
        expect(subtreeElement.childNodes.length).toEqual(childCount + 2);
    });

    it('should return node ids when new nodes are added', function() {
        var data = [
                {text: 'hello world', children: [
                    {text: 'foo'},
                    {text: 'bar'}
                ]},
                {text: 'new world'}
            ],
            ids = tree.add(data, firstChildId);

        expect(ids).toEqual(jasmine.any(Array));
        expect(ids.length).toEqual(2);
    });

    it('should redraw nodes when a node is removed', function() {
        var childCount = firstChild.getChildIds().length,
            idForRemoving = firstChild.getChildIds()[0],
            subtreeElement;

        tree.remove(idForRemoving);
        subtreeElement = document.getElementById(firstChildId).lastChild;

        expect(document.getElementById(idForRemoving)).toBeFalsy();
        expect(firstChild.getChildIds().length).toEqual(childCount - 1);
        expect(subtreeElement.childNodes.length).toEqual(childCount - 1);
    });

    it('should redraw nodes when a node is moved', function() {
        var firstChildElement, lastChildElement, grandChildElement;

        tree.move(grandChildId, lastChildId);
        firstChildElement = document.getElementById(firstChildId);
        lastChildElement = document.getElementById(lastChildId);
        grandChildElement = document.getElementById(grandChildId);

        expect(firstChildElement.contains(grandChildElement)).toBe(false);
        expect(lastChildElement.contains(grandChildElement)).toBe(true);
    });

    it('should fire "move" event when a node is moved', function() {
        spyOn(tree, 'fire');

        tree.move(grandChildId, lastChildId);

        expect(tree.fire).toHaveBeenCalledWith('move', {
            nodeId: grandChildId,
            originalParentId: firstChildId,
            newParentId: lastChildId
        });
    });

    it('"Search" API should return array of node ids', function() {
        var result = tree.search({
            text: '5'
        });
        expect(result).toEqual(jasmine.any(Array));
        expect(result.length).toEqual(2);

        result = tree.search(function(node) {
            var text = node.getData('text');

            return text === '가' || text === '나';
        });
        expect(result).toEqual(jasmine.any(Array));
        expect(result.length).toEqual(4);
    });

    it('should override template renderer', function() {
        var templateRenderer = jasmine.createSpy().and.callFake(function(source, props) {
            return util.renderTemplate(source, props);
        });

        tree = new Tree(nodeData, {
            rootElement: 'treeRoot',
            template: {
                leafNode:
                '<span class="tui-tree-leaf-label"></span>' +
                '<span class="{{textClass}}">{{text}}</span>'
            },
            renderTemplate: templateRenderer
        });
        expect(templateRenderer).toHaveBeenCalled();
    });
});

'use strict';
var Tree = require('../src/js/tree'),
    utils = require('../src/js/util'),
    messages = require('../src/js/consts/messages'),
    Checkbox = require('../src/js/features/checkbox');

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
        rootElement, tree;

    beforeEach(function() {
        loadFixtures('basicFixture.html');
        tree = new Tree(data, {
            rootElement: 'treeRoot',
            template: {
                internalNode:
                    '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
                    '<input type="checkbox" class="tui-tree-checkbox">' +
                    '<span class="{{textClass}}">{{text}}</span>' +
                    '<ul class="{{subtreeClass}}">{{children}}</ul>',
                leafNode:
                    '<input type="checkbox" class="tui-tree-checkbox">' +
                    '<span class="{{textClass}}">{{text}}</span>'
            }
        });

        rootElement = document.getElementById('treeRoot');
        tree.enableFeature('Checkbox', {
            checkboxClassName: 'tui-tree-checkbox'
        });
    });

    it('should have implemented apis about checkbox if enabled', function() {
        var apiList = Checkbox.getAPIList();

        tui.util.forEach(apiList, function(name) {
            expect(tree[name]).not.toThrowError(messages.INVALID_API_CHECKBOX);
        });

        tree.disableFeature('Checkbox');
        tui.util.forEach(apiList, function(name) {
            expect(tree[name]).toThrowError(messages.INVALID_API_CHECKBOX);
        });
    });

    it('should fire "check"-event when a node is checked', function() {
        var firstChildId = tree.getChildIds(tree.getRootNodeId())[0],
            spy = jasmine.createSpy();

        tree.on('check', spy);
        tree.check(firstChildId);

        expect(spy).toHaveBeenCalledWith(firstChildId);
    });

    it('should fire "uncheck"-event when a node is unchecked', function() {
        var firstChildId = tree.getChildIds(tree.getRootNodeId())[0],
            spy = jasmine.createSpy();
        tree.on('uncheck', spy);

        tree.uncheck(firstChildId);
        expect(spy).not.toHaveBeenCalled();

        tree.check(firstChildId);
        tree.uncheck(firstChildId);
        expect(spy).toHaveBeenCalledWith(firstChildId);
    });

    it('should check with all descendants', function() {
        var firstChildId = tree.getChildIds(tree.getRootNodeId())[0];

        tree.check(firstChildId);
        tree.each(function(node, nodeId) {
            expect(tree.isChecked(nodeId)).toBe(true);
        }, firstChildId);
    });

    it('should uncheck with all descendants', function() {
        var firstChildId = tree.getChildIds(tree.getRootNodeId())[0];

        tree.check(firstChildId);
        tree.uncheck(firstChildId);
        tree.each(function(node, nodeId) {
            expect(tree.isUnchecked(nodeId)).toBe(true);
        }, firstChildId);
    });

    it('should toggle with all descendants', function() {
        var firstChildId = tree.getChildIds(tree.getRootNodeId())[0];

        tree.check(firstChildId);
        tree.toggleCheck(firstChildId);
        expect(tree.isUnchecked(firstChildId)).toBe(true);
        tree.each(function(node, nodeId) {
            expect(tree.isUnchecked(nodeId)).toBe(true);
        }, firstChildId);
    });

    it('should be indeterminate if some children are checked', function() {
        var baseNodeId = tree.getChildIds(tree.getRootNodeId())[0],
            childIds = tree.getChildIds(baseNodeId);

        tree.check(childIds[0]);
        expect(tree.isIndeterminate(baseNodeId)).toBe(true);
    });

    it('should be checked if all descendants are checked', function() {
        var baseNodeId = tree.getChildIds(tree.getRootNodeId())[0];

        tree.each(function(node, nodeId) {
            tree.check(nodeId);
        }, baseNodeId);

        expect(tree.isChecked(baseNodeId)).toBe(true);
    });

    it('should be indeterminate if some children are unchecked from all checked', function() {
        var baseNodeId = tree.getChildIds(tree.getRootNodeId())[0],
            childIds = tree.getChildIds(baseNodeId);

        tree.each(function(node, nodeId) {
            tree.check(nodeId);
        }, baseNodeId);
        tree.uncheck(childIds[0]);

        expect(tree.isIndeterminate(baseNodeId)).toBe(true);
    });

    it('should reflect states when a node is changed with children', function() {
        var rootChildIds = tree.getChildIds(tree.getRootNodeId());

        /**
         * ======== Set node states ========
         * a-1(v)
         *   a-1-1(v)
         *   a-1-2(v)
         *   a-1-3(v)
         *   ....
         * a-2(-)
         *   a-2-1(v)
         *   a-2-2( )
         *   a-2-3(v)
         */
        tree.check(rootChildIds[0]);
        tree.check(rootChildIds[1]);
        tree.uncheck(tree.getChildIds(rootChildIds[1])[1]);

        /**
         * ======== Reflect the changes ========
         * a-1(-)
         *   a-1-1(v)
         *   a-1-2(v)
         *   a-1-3(v)
         *   ....
         *   a-2-2( )  <-- moved to "a-1" from "a-2"
         * a-2(v)
         *   a-2-1(v)
         *   a-2-3(v)
         */
        tree.move(tree.getChildIds(rootChildIds[1])[1], rootChildIds[0]);

        expect(tree.isIndeterminate(rootChildIds[0])).toBe(true);
        expect(tree.isChecked(rootChildIds[1])).toBe(true);
    });
});

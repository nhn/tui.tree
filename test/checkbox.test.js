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
});

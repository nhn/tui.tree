'use strict';

var Tree = require('../src/js/tree'),
    ContextMenu = require('../src/js/features/contextMenu'),
    messages = require('../src/js/consts/messages');

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
        $rootElement, tree;

    beforeEach(function() {
        loadFixtures('basicFixture.html');
        $rootElement = $('#treeRoot');
        tree = new Tree(nodeData, {
            rootElement: 'treeRoot'
        });
        tree.enableFeature('ContextMenu', {});
    });

    it('should enable ContextMenu', function() {
        tree = new Tree(nodeData, {
            rootElement: 'treeRoot'
        });
        expect(tree.enabledFeatures.ContextMenu).toBeFalsy();

        tree.enableFeature('ContextMenu', {});
        expect(tree.enabledFeatures.ContextMenu).toBeTruthy();
    });
});

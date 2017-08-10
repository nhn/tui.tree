'use strict';
var Tree = require('../../src/js/tree');
var util = require('../../src/js/util');

describe('Tree', function() {
    var tree, treeEditable, rootNodeId;
    var firstChildId, lastChildId;
    var firstChildElement, lastChildElement;
    var data = [
        {title: 'A', state: 'closed', children: [
            {title: '1'},
            {title: '2'},
            {title: '3'}
        ]},
        {title: 'B'}
    ];
    var WRAPPER_CLASSNAME = 'tui-input-wrap';

    beforeEach(function() {
        loadFixtures('basicFixture.html');

        tree = new Tree('tree', {
            rootElement: 'treeRoot',
            data: data,
            template: {
                internalNode:
                    '<button type="button" class="{{toggleBtnClass}}">{{stateLabel}}</button>' +
                    '<span class="{{textClass}}">{{title}}</span>' +
                    '<ul>{{children}}</ul>',
                leafNode:
                    '<span class="{{textClass}}">{{title}}</span>'
            }
        });

        rootNodeId = tree.getRootNodeId();
        firstChildId = tree.getChildIds(rootNodeId)[0];
        lastChildId = tree.getChildIds(rootNodeId)[1];

        firstChildElement = document.getElementById(firstChildId);
        lastChildElement = document.getElementById(lastChildId);

        tree.enableFeature('Editable', {
            dataKey: 'text'
        });

        treeEditable = tree.enabledFeatures.Editable;
    });

    describe('createChildNode()', function() {
        it('should show children nodes when parent node is not leaf node.', function() {
            var stateLabel;
            var toggleBtnClass = tree.classNames.toggleBtnClass;
            var expected = tree.stateLabels.closed;

            tree.createChildNode(firstChildId);

            stateLabel = util.getElementsByClassName(firstChildElement, toggleBtnClass)[0];

            expect(stateLabel.innerHTML).toBe(expected);
        });

        it('should add toggle button when parent node is leaf node.', function() {
            var stateLabels;
            var toggleBtnClass = tree.classNames.toggleBtnClass;
            var expected = tree.stateLabels.closed;

            tree.createChildNode(lastChildId);

            stateLabels = util.getElementsByClassName(lastChildElement, toggleBtnClass);

            expect(stateLabels.length).toBe(1);
            expect(stateLabels[0].innerHTML).toBe(expected);
        });

        it('should fire "successResponse" when Ajax feature is enabled.', function() {
            jasmine.Ajax.install();

            spyOn(treeEditable, '_onSuccessResponse');

            tree.enableFeature('Ajax', {
                command: {
                    read: {
                        url: 'api/test'
                    }
                }
            });
            tree.createChildNode(lastChildId);
            tree.fire('successAjaxResponse');

            expect(treeEditable._onSuccessResponse).toHaveBeenCalled();

            jasmine.Ajax.uninstall();
        });
    });

    it('"editNode()" should create input element in selected node.', function() {
        var inputElements = firstChildElement.getElementsByTagName('input');

        tree.editNode(firstChildId);
        expect(inputElements.length).toBe(1);
    });

    it('"_attachInputElement" should attach the input element to selected node.', function() {
        treeEditable._attachInputElement(firstChildId);

        expect(util.getElementsByClassName(firstChildElement, WRAPPER_CLASSNAME).length).toBe(1);
    });

    it('should calculate input element\'s paddingLeft by it\'s depth when editable feature is enabled.', function() {
        /* expected padding-left: 23 * depth + 37 */

        var nodeElements = util.getElementsByClassName(tree.rootElement, 'tui-tree-node');
        var inputWrapper;

        tree.editNode(nodeElements[0].id); // depth 1
        inputWrapper = util.getChildElementByClassName(nodeElements[0], WRAPPER_CLASSNAME);
        expect(inputWrapper.style.paddingLeft).toBe((23 * 1 + 37) + 'px');

        tree.editNode(nodeElements[1].id); // depth 2
        inputWrapper = util.getChildElementByClassName(nodeElements[1], WRAPPER_CLASSNAME);
        expect(inputWrapper.style.paddingLeft).toBe((23 * 2 + 37) + 'px');
    });
});

'use strict';
var Tree = require('../src/js/tree');
var util = require('../src/js/util');

jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

describe('Tree', function() {
    var $rootElement, tree, treeDraggable;
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
    ];

    beforeEach(function() {
        loadFixtures('basicFixture.html');

        tree = new Tree('tree', {
            rootElement: 'treeRoot',
            data: data
        });

        $rootElement = $(tree.rootElement);

        tree.enableFeature('Draggable', {
            isSortable: true,
            lineBoundary: {
                top: 5,
                bottom: 5
            }
        });

        treeDraggable = tree.enabledFeatures.Draggable;
    });

    describe('when _applyMoveAction() is called,', function() {
        var currentElement, nodeId, mousePos;

        beforeEach(function() {
            currentElement = $rootElement.find('li').eq(0)[0];
            nodeId = tree.getNodeIdFromElement(currentElement);
            mousePos = {
                x: 10,
                y: 20
            };
        });

        it('mouse overed tree item is changed to hover style.', function() {
            spyOn(treeDraggable, '_isContain').and.returnValue(true);
            spyOn(treeDraggable, '_hover');

            treeDraggable._applyMoveAction(nodeId, mousePos);

            expect(treeDraggable._hover).toHaveBeenCalledWith(nodeId);
        });

        it('mouse overed tree item is changed to unhover style.', function() {
            spyOn(treeDraggable, '_isContain').and.returnValue(false);
            spyOn(treeDraggable, '_unhover');

            treeDraggable._applyMoveAction(nodeId, mousePos);

            expect(treeDraggable._unhover).toHaveBeenCalled();
        });

        it('when drag type is sortable, drawing boundary line on tree items.', function() {
            spyOn(treeDraggable, '_getBoundaryType').and.returnValue('top');
            spyOn(treeDraggable, '_drawBoundaryLine');

            treeDraggable.isSortable = true;

            treeDraggable._applyMoveAction(nodeId, mousePos);

            expect(treeDraggable._drawBoundaryLine).toHaveBeenCalled();
        });
    });

    it('Mouse position is contained tree item, _hover() add hover style.', function() {
        var currentElement = $rootElement.find('li').eq(0)[0];
        var nodeId = tree.getNodeIdFromElement(currentElement);
        var hasClass;

        spyOn(tree, 'isLeaf').and.returnValue(true);

        treeDraggable.hoveredElement = currentElement;
        treeDraggable._hover(nodeId);

        hasClass = $(currentElement).hasClass(treeDraggable.hoverClassName);

        expect(hasClass).toEqual(true);
    });

    it('Mouse position is out of tree item, _unhover() remove hover style.', function() {
        var currentElement = $rootElement.find('li').eq(0)[0];
        var nodeId = tree.getNodeIdFromElement(currentElement);
        var hasClass;

        treeDraggable._unhover(nodeId);

        hasClass = $(currentElement).hasClass(treeDraggable.hoverClassName);

        expect(hasClass).toEqual(false);
    });

    describe('_isContain method is called,', function() {
        var targetPos, mousePos, state;

        beforeEach(function() {
            targetPos = {
                left: 0,
                top: 0,
                right: 100,
                bottom: 100
            };
        });

        it('when mouse position is in enable touched area, return true state.', function() {
            mousePos = {
                x: 10,
                y: 20
            };

            state = treeDraggable._isContain(targetPos, mousePos);

            expect(state).toEqual(true);
        });

        it('when mouse position is not in enable touched area, return false state.', function() {
            mousePos = {
                x: 2,
                y: 3
            };

            state = treeDraggable._isContain(targetPos, mousePos);

            expect(state).toEqual(false);
        });
    });

    describe('_getBoundaryType method is called,', function() {
        var targetPos, mousePos, type;

        beforeEach(function() {
            targetPos = {
                left: 0,
                top: 0,
                right: 100,
                bottom: 100
            };
        });

        it('when mouse postion is above selected tree item, boundary type is "top".', function() {
            mousePos = {
                x: 3,
                y: 3
            };

            type = treeDraggable._getBoundaryType(targetPos, mousePos);

            expect(type).toEqual('top');
        });

        it('when mouse postion is above selected tree item, boundary type is "bottom".', function() {
            mousePos = {
                x: 97,
                y: 97
            };

            type = treeDraggable._getBoundaryType(targetPos, mousePos);

            expect(type).toEqual('bottom');
        });
    });

    it('when boundary type has value, _drawBoundaryLine() draw boundary line on tree.', function() {
        var targetPos = {
            left: 10,
            top: 10,
            right: 10,
            bottom: 10
        };
        var boundaryType = 'top';

        treeDraggable._initMovingLine();

        treeDraggable._drawBoundaryLine(targetPos, boundaryType);

        expect(treeDraggable.lineElement.style.display).toEqual('block');
    });

    describe('_getIndexForInserting() is called,', function() {
        var $currentElement, helperId, nodeId, index;

        beforeEach(function() {
            $currentElement = $rootElement.find('li');
        });

        it('when drag item is moving from bottom to top, index number is same.', function() {
            helperId = tree.getNodeIdFromElement($currentElement.eq(1)[0]);
            nodeId = tree.getNodeIdFromElement($currentElement.eq(3)[0]);

            treeDraggable.currentNodeId = helperId;
            treeDraggable.movingLineType = 'top';

            index = treeDraggable._getIndexToInsert(nodeId);

            expect(index).toEqual(2);
        });

        it('when drag item is moving from top to bottom, index number increase.', function() {
            helperId = tree.getNodeIdFromElement($currentElement.eq(3)[0]); // index: 2
            nodeId = tree.getNodeIdFromElement($currentElement.eq(1)[0]); // index: 0

            treeDraggable.currentNodeId = helperId;
            treeDraggable.movingLineType = 'bottom';

            index = treeDraggable._getIndexToInsert(nodeId);

            expect(index).toEqual(1);
        });
    });

    it('When invoking "beforeMove", dragging action is cancel.', function() {
        var eventMock = {
            target: null
        };

        spyOn(tree.model, 'move');

        tree.on('beforeMove', function() {
            return false;
        });

        treeDraggable._onMouseup(eventMock);

        expect(tree.model.move).not.toHaveBeenCalled();
    });

    describe('"_setClassNameOnDragItem" should', function() {
        var firstChildId, firstChildElement, eventMock;
        var className = 'tui-tree-drag';

        beforeEach(function() {
            firstChildId = tree.model.rootNode.getChildIds()[0];
            firstChildElement = document.getElementById(firstChildId);

            eventMock = {
                target: firstChildElement
            };
            spyOn(util, 'getMousePos').and.returnValue({x: 10, y: 10});
        });

        it('add class name on dragging item element while dragging.', function() {
            treeDraggable._onMousedown(eventMock);
            treeDraggable._onMousemove(eventMock);
            expect(util.hasClass(firstChildElement, className)).toBe(true);
        });
    });

    it('When the node is dragging,' +
        'the contents of the helper element same as the contents of the dragging node.', function() {
        var firstChildId, selectedElement, dragItemElement, eventMock;

        firstChildId = tree.model.rootNode.getChildIds()[0];
        selectedElement = document.getElementById(firstChildId);

        eventMock = {
            target: selectedElement
        };

        treeDraggable._onMousedown(eventMock);

        dragItemElement = util.getElementsByClassName(selectedElement, tree.classNames.textClass)[0];

        expect(treeDraggable.helperElement.innerHTML).toBe(dragItemElement.innerHTML);
    });
});

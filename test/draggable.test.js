'use strict';
var Tree = require('../src/js/tree'),
    messages = require('../src/js/consts/messages');

jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

describe('Tree', function() {
    var rootElement, tree, treeDraggable;
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

        tree = new Tree(data, {
            rootElement: 'treeRoot'
        });

        rootElement = document.getElementById('treeRoot');

        tree.enableFeature('Draggable', {
            isSortable: true,
            lineBoundary: {
                top: 5,
                bottom: 5
            }
        });

        treeDraggable = tree.enabledFeatures.Draggable;
    });

    describe('when applyMoveAction() is called,', function() {
        var currentElement, nodeId, mousePos;

        beforeEach(function() {
            currentElement = rootElement.getElementsByTagName('li')[0];
            nodeId = tree.getNodeIdFromElement(currentElement);
            mousePos = {
                x: 10,
                y: 20
            };
        });

        it('mouse overed tree item is changed to hover style.', function() {
            spyOn(treeDraggable, 'isContain').and.returnValue(true);
            spyOn(treeDraggable, 'hover');

            treeDraggable.applyMoveAction(nodeId, mousePos);

            expect(treeDraggable.hover).toHaveBeenCalledWith(nodeId);
        });

        it('mouse overed tree item is changed to unhover style.', function() {
            spyOn(treeDraggable, 'isContain').and.returnValue(false);
            spyOn(treeDraggable, 'unhover');

            treeDraggable.applyMoveAction(nodeId, mousePos);

            expect(treeDraggable.unhover).toHaveBeenCalled();
        });

        it('when drag type is sortable, drawing boundary line on tree items.', function() {
            spyOn(treeDraggable, 'getBoundaryType').and.returnValue('top');
            spyOn(treeDraggable, 'drawBoundaryLine');

            treeDraggable.isSortable = true;

            treeDraggable.applyMoveAction(nodeId, mousePos);

            expect(treeDraggable.drawBoundaryLine).toHaveBeenCalled();
        });
    });

    it('Mouse position is contained tree item, hover() add hover style.', function() {
        var currentElement = rootElement.getElementsByTagName('li')[0];
        var nodeId = tree.getNodeIdFromElement(currentElement);
        var hasClass;

        spyOn(tree, 'isLeaf').and.returnValue(true);

        treeDraggable.hoveredElement = currentElement;
        treeDraggable.hover(nodeId);

        hasClass = $(currentElement).hasClass(treeDraggable.hoverClassName);

        expect(hasClass).toEqual(true);
    });

    it('Mouse position is out of tree item, unhover() remove hover style.', function() {
        var currentElement = rootElement.getElementsByTagName('li')[0];
        var nodeId = tree.getNodeIdFromElement(currentElement);
        var hasClass;

        treeDraggable.unhover(nodeId);

        hasClass = $(currentElement).hasClass(treeDraggable.hoverClassName);

        expect(hasClass).toEqual(false);
    });

    xit('Mouse position is delayed on tree item that has sub tree, sub tree is opend.', function() {
        var currentElement = rootElement.getElementsByTagName('li')[0];
        var nodeId = tree.getNodeIdFromElement(currentElement);

        jasmine.clock().install();

        treeDraggable.hoveredElement = currentElement;
        treeDraggable.autoOpenDelay = 1500;

        spyOn(tree, 'isLeaf').and.returnValue(false);
        spyOn(tree, 'getNodeIdFromElement').and.returnValue(nodeId);
        spyOn(tree, 'open');

        treeDraggable.hover(nodeId);

        jasmine.clock().tick(1501);

        expect(tree.open).toHaveBeenCalled();

        jasmine.clock().uninstall();
    });

    describe('isContain method is called,', function() {
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

            state = treeDraggable.isContain(targetPos, mousePos);

            expect(state).toEqual(true);
        });

        it('when mouse position is not in enable touched area, return false state.', function() {
            mousePos = {
                x: 2,
                y: 3
            };

            state = treeDraggable.isContain(targetPos, mousePos);

            expect(state).toEqual(false);
        });
    });

    describe('getBoundaryType method is called,', function() {
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

            type = treeDraggable.getBoundaryType(targetPos, mousePos);

            expect(type).toEqual('top');
        });

        it('when mouse postion is above selected tree item, boundary type is "bottom".', function() {
            mousePos = {
                x: 97,
                y: 97
            };

            type = treeDraggable.getBoundaryType(targetPos, mousePos);

            expect(type).toEqual('bottom');
        });
    });

    it('when boundary type has value, drawBoundaryLine() draw boundary line on tree.', function() {
        var targetPos = {
            left: 10,
            top: 10,
            right: 10,
            bottom: 10
        };
        var boundaryType = 'top';

        treeDraggable.initMovingLine();

        treeDraggable.drawBoundaryLine(targetPos, boundaryType);

        expect(treeDraggable.lineElement.style.visibility).toEqual('visible');
    });

    describe('getIndexForInserting() is called,', function() {
        var currentElement, helperId, nodeId, index;

        beforeEach(function() {
            currentElement = rootElement.getElementsByTagName('li');
        });

        it('when drag item is moving from bottom to top, index number is same.', function() {
            helperId = tree.getNodeIdFromElement(currentElement[1]);
            nodeId = tree.getNodeIdFromElement(currentElement[3]);

            treeDraggable.currentNodeId = helperId;
            treeDraggable.movingLineType = 'top';

            index = treeDraggable.getIndexForInserting(nodeId);

            expect(index).toEqual(2);
        });

        it('when drag item is moving from top to bottom, index number increase.', function() {
            helperId = tree.getNodeIdFromElement(currentElement[3]); // index: 2
            nodeId = tree.getNodeIdFromElement(currentElement[1]); // index: 0

            treeDraggable.currentNodeId = helperId;
            treeDraggable.movingLineType = 'bottom';

            index = treeDraggable.getIndexForInserting(nodeId);

            expect(index).toEqual(1);
        });
    });

    it('When invoking "beforeMove", dragging action is cancel.', function() {
        var eventMock = {
            target: null
        };

        spyOn(tree, 'move');

        tree.on('beforeMove', function() {
            return false;
        });

        treeDraggable.onMouseup(eventMock);

        expect(tree.move).not.toHaveBeenCalled();
    });
});

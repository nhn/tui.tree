var hasClass = require('tui-code-snippet/domUtil/hasClass');

var Tree = require('../../src/js/tree');

jasmine.getFixtures().fixturesPath = 'base/test/fixtures';

describe('draggable feature', function() {
  var rootElement, tree, treeDraggable;
  var data = [
    {
      title: 'A',
      children: [
        {title: '1'},
        {title: '2'},
        {title: '3'},
        {title: '4'},
        {
          title: '5',
          children: [{title: '가', children: [{title: '*'}]}, {title: '나'}]
        },
        {title: '6'},
        {title: '7'},
        {title: '8'},
        {title: '9', children: [{title: '가'}, {title: '나'}]},
        {title: '10'},
        {title: '11'},
        {title: '12'}
      ]
    },
    {
      title: 'B',
      children: [{title: '1'}, {title: '2'}, {title: '3'}]
    }
  ];

  beforeEach(function() {
    loadFixtures('basicFixture.html');

    tree = new Tree('tree', {
      rootElement: 'treeRoot',
      data: data
    });

    rootElement = tree.rootElement;

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
      currentElement = rootElement.querySelector('li');
      nodeId = tree.getNodeIdFromElement(currentElement);
      mousePos = {
        x: 10,
        y: 20
      };
    });

    it('mouse overed tree item should be changed to hover style', function() {
      spyOn(treeDraggable, '_isContain').and.returnValue(true);
      spyOn(treeDraggable, '_hover');

      treeDraggable._applyMoveAction(nodeId, mousePos);

      expect(treeDraggable._hover).toHaveBeenCalledWith(nodeId);
    });

    it('mouse overed tree item should be changed to unhover style', function() {
      spyOn(treeDraggable, '_isContain').and.returnValue(false);
      spyOn(treeDraggable, '_unhover');

      treeDraggable._applyMoveAction(nodeId, mousePos);

      expect(treeDraggable._unhover).toHaveBeenCalled();
    });

    it('should draw boundary line on tree items when drag type is sortable', function() {
      spyOn(treeDraggable, '_getBoundaryType').and.returnValue('top');
      spyOn(treeDraggable, '_drawBoundaryLine');

      treeDraggable.isSortable = true;

      treeDraggable._applyMoveAction(nodeId, mousePos);

      expect(treeDraggable._drawBoundaryLine).toHaveBeenCalled();
    });
  });

  it('Mouse position should be contained tree item, _hover() add hover style', function() {
    var currentElement = rootElement.querySelector('li');
    var nodeId = tree.getNodeIdFromElement(currentElement);

    spyOn(tree, 'isLeaf').and.returnValue(true);

    treeDraggable.hoveredElement = currentElement;
    treeDraggable._hover(nodeId);

    expect(hasClass(currentElement, treeDraggable.hoverClassName)).toEqual(true);
  });

  it('Mouse position should be out of tree item, _unhover() remove hover style', function() {
    var currentElement = rootElement.querySelector('li');
    var nodeId = tree.getNodeIdFromElement(currentElement);

    treeDraggable._unhover(nodeId);

    expect(hasClass(currentElement, treeDraggable.hoverClassName)).toEqual(false);
  });

  describe('when _isContain method is called,', function() {
    var targetPos, mousePos, state;

    beforeEach(function() {
      targetPos = {
        left: 0,
        top: 0,
        right: 100,
        bottom: 100
      };
    });

    it('should return true state when mouse position is in enable touched area', function() {
      mousePos = {
        x: 10,
        y: 20
      };

      state = treeDraggable._isContain(targetPos, mousePos);

      expect(state).toEqual(true);
    });

    it('should return false state when mouse position is not in enable touched area', function() {
      mousePos = {
        x: 2,
        y: 3
      };

      state = treeDraggable._isContain(targetPos, mousePos);

      expect(state).toEqual(false);
    });
  });

  describe('when _getBoundaryType method is called,', function() {
    var targetPos, mousePos, type;

    beforeEach(function() {
      targetPos = {
        left: 0,
        top: 0,
        right: 100,
        bottom: 100
      };
    });

    it('boundary type should be "top" when mouse postion is above selected tree item', function() {
      mousePos = [3, 3];

      type = treeDraggable._getBoundaryType(targetPos, mousePos);

      expect(type).toEqual('top');
    });

    it('boundary type should be "bottom" when mouse postion is above selected tree item', function() {
      mousePos = [97, 97];

      type = treeDraggable._getBoundaryType(targetPos, mousePos);

      expect(type).toEqual('bottom');
    });
  });

  it('_drawBoundaryLine() should draw boundary line on tree when boundary type has value', function() {
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

  describe('when _getIndexForInserting() is called,', function() {
    var currentElements, helperId, nodeId, index;

    beforeEach(function() {
      currentElements = rootElement.querySelectorAll('li');
    });

    it('index number should be same when drag item is moving from bottom to top', function() {
      helperId = tree.getNodeIdFromElement(currentElements[1]);
      nodeId = tree.getNodeIdFromElement(currentElements[3]);

      treeDraggable.currentNodeId = helperId;
      treeDraggable.movingLineType = 'top';

      index = treeDraggable._getIndexToInsert(nodeId);

      expect(index).toEqual(2);
    });

    it('index number should increase when drag item is moving from top to bottom', function() {
      helperId = tree.getNodeIdFromElement(currentElements[3]); // index: 2
      nodeId = tree.getNodeIdFromElement(currentElements[1]); // index: 0

      treeDraggable.currentNodeId = helperId;
      treeDraggable.movingLineType = 'bottom';

      index = treeDraggable._getIndexToInsert(nodeId);

      expect(index).toEqual(1);
    });
  });

  it('dragging action should be cancel when invoking "beforeMove"', function() {
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

  describe('when "_setClassNameOnDragItem" should', function() {
    var firstChildId, firstChildElement, eventMock;
    var className = 'tui-tree-drag';

    beforeEach(function() {
      firstChildId = tree.model.rootNode.getChildIds()[0];
      firstChildElement = document.getElementById(firstChildId);

      eventMock = {
        target: firstChildElement,
        clientX: 10,
        clientY: 10
      };
    });

    it('should add class name on dragging item element while dragging', function() {
      treeDraggable._onMousedown(eventMock);
      treeDraggable._onMousemove(eventMock);
      expect(hasClass(firstChildElement, className)).toBe(true);
    });
  });

  it(
    'the contents of the helper element should be same as the contents of the dragging node when the node is dragging',
    function() {
      var firstChildId, selectedElement, dragItemElement, eventMock;

      firstChildId = tree.model.rootNode.getChildIds()[0];
      selectedElement = document.getElementById(firstChildId);

      eventMock = {
        target: selectedElement
      };

      treeDraggable._onMousedown(eventMock);

      dragItemElement = selectedElement.querySelector('.' + tree.classNames.textClass);

      expect(treeDraggable.helperElement.innerHTML).toBe(dragItemElement.innerHTML);
    }
  );
});

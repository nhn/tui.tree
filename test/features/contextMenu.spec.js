var Tree = require('../../src/js/tree');
var TuiContextMenu = require('tui-context-menu');

describe('contextMenu feature', function() {
  var rootElement, tree, contextMenu, menuData;
  var data = [
    {
      text: 'A',
      children: [
        { text: '1' },
        { text: '2' },
        { text: '3' },
        { text: '4' },
        {
          text: '5',
          children: [{ text: '가', children: [{ text: '*' }] }, { text: '나' }]
        },
        { text: '6' },
        { text: '7' },
        { text: '8' },
        { text: '9', children: [{ text: '가' }, { text: '나' }] },
        { text: '10' },
        { text: '11' },
        { text: '12' }
      ]
    },
    {
      text: 'B',
      children: [{ text: '1' }, { text: '2' }, { text: '3' }, { text: '4' }, { text: '5' }]
    }
  ];

  beforeEach(function() {
    loadFixtures('basicFixture.html');

    tree = new Tree('#tree', {
      rootElement: 'treeRoot',
      data: data
    });

    menuData = [
      { title: 'menu1' },
      { title: 'menu2' },
      {
        title: 'menu3',
        menu: [{ title: 'submenu1' }, { title: 'submenu2' }]
      }
    ];

    tree.enableFeature('ContextMenu', {
      menuData: menuData
    });

    rootElement = tree.rootElement;

    contextMenu = tree.enabledFeatures.ContextMenu;
  });

  describe('When _generateContextMenu() is called,', function() {
    it('new floating layer should be generarated', function() {
      contextMenu.flElement = null;

      spyOn(contextMenu, '_createFloatingLayer');

      contextMenu._generateContextMenu();

      expect(contextMenu._createFloatingLayer).toHaveBeenCalled();
    });

    it('should generate and return instance of ContextMenu', function() {
      var menu = contextMenu._generateContextMenu();

      expect(menu instanceof TuiContextMenu).toEqual(true);
    });
  });

  it('id of selected tree item should set value when "contextmenu" event is fired', function() {
    var target = rootElement.querySelector('li');
    var nodeId = target.getAttribute('id');

    spyOn(tree, 'getNodeIdFromElement').and.returnValue(nodeId);

    tree._onContextMenu({
      target: target
    });

    expect(contextMenu.selectedNodeId).toEqual(nodeId);
  });

  it('custom event as "selectContextMenu" should be fired when the context menu is selected', function() {
    var spyListener = jasmine.createSpy();
    var mock = {
      command: 'test',
      nodeId: null
    };

    tree.on('selectContextMenu', spyListener);

    contextMenu._onSelect({}, 'test'); // select context menu

    expect(spyListener).toHaveBeenCalledWith(mock);
  });

  describe('When context-menu feature is disabled,', function() {
    beforeEach(function() {
      spyOn(contextMenu, '_restoreTextSelection');
      tree.disableFeature('ContextMenu');
    });

    it('events should be removed', function() {
      var spyListener = jasmine.createSpy();

      tree.on('selectContextMenu', spyListener);

      expect(spyListener).not.toHaveBeenCalled();
    });

    it('text selection property should restore', function() {
      expect(contextMenu._restoreTextSelection).toHaveBeenCalled();
    });
  });
});

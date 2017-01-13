'use strict';

var Tree = require('../src/js/tree');
var util = require('../src/js//util');
var TuiContextMenu = tui && tui.component && tui.component.ContextMenu;
var styleKeys = ['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect'];
var enableProp = util.testProp(styleKeys);

describe('contextMenu.js', function() {
    var $rootElement, tree, contextMenu, menuData;
    var data = [
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
    ];

    beforeEach(function() {
        loadFixtures('basicFixture.html');

        tree = new Tree('tree', {
            rootElement: 'treeRoot',
            data: data
        });

        menuData = [
            {title: 'menu1'},
            {title: 'menu2'},
            {
                title: 'menu3',
                menu: [
                    {title: 'submenu1'},
                    {title: 'submenu2'}
                ]
            }
        ];

        tree.enableFeature('ContextMenu', {
            menuData: menuData
        });

        $rootElement = $(tree.rootElement);

        contextMenu = tree.enabledFeatures.ContextMenu;
    });

    it('When context-menu feature is enabled, element is not selected by style.', function() {
        tree.disableFeature('ContextMenu');

        tree.enableFeature('ContextMenu', {
            menuData: menuData
        });

        if (enableProp) {
            expect($rootElement[0].style[enableProp]).toEqual('none');
        }
    });

    describe('When _generateContextMenu() is called,', function() {
        it('new floating layer is generarated.', function() {
            contextMenu.flElement = null;

            spyOn(contextMenu, '_createFloatingLayer');

            contextMenu._generateContextMenu();

            expect(contextMenu._createFloatingLayer).toHaveBeenCalled();
        });

        it('generates and returns instance of ContextMenu.', function() {
            var menu = contextMenu._generateContextMenu();

            expect(menu instanceof TuiContextMenu).toEqual(true);
        });
    });

    it('When "contextmenu" event is fired, id of selected tree item set value.', function() {
        var target = $rootElement.find('li').eq(0);
        var nodeId = target.attr('id');

        spyOn(util, 'getTarget').and.returnValue(target);
        spyOn(tree, 'getNodeIdFromElement').and.returnValue(nodeId);

        tree._onContextMenu();

        expect(contextMenu.selectedNodeId).toEqual(nodeId);
    });

    it('When the context menu is selected, custom event as "selectContextMenu" is fired.', function() {
        var spyListener = jasmine.createSpy();
        var mock = {
            cmd: 'test',
            nodeId: null
        };

        tree.on('selectContextMenu', spyListener);

        contextMenu._onSelect({}, 'test'); // select context menu

        expect(spyListener).toHaveBeenCalledWith(mock);
    });

    describe('When context-menu feature is disabled,', function() {
        beforeEach(function() {
            tree.disableFeature('ContextMenu');
        });

        it('events are removed.', function() {
            var spyListener = jasmine.createSpy();

            tree.on('selectContextMenu', spyListener);

            expect(spyListener).not.toHaveBeenCalled();
        });

        it('text selection property restore.', function() {
            if (enableProp) {
                expect($rootElement[0].style[enableProp]).not.toEqual('none');
            }
        });
    });
});

'use strict';

var nodeStates = require('../src/js/states').node;

tui.util.defineNamespace('tui.component.Tree');
tui.component.Tree.TreeModel = require('../src/js/treemodel');

fdescribe('TreeModel', function() {
    var treeModel,
        data = [
            {title: 'A', children: [
                {title: '1'},
                {title: '2'},
                {title: '3'},
                {title: '4'},
                {title: '5', children: [
                    {title:'가', children:[
                        {title:'*'}
                    ]},
                    {title:'나'}
                ]},
                {title: '6'},
                {title: '7'},
                {title: '8'},
                {title: '9', children: [
                    {title:'가'},
                    {title:'나'}
                ]},
                {title: '10'},
                {title: '11'},
                {title: '12'}
            ]},
            {title: 'B', children: [
                {title:'1'},
                {title:'2'},
                {title:'3'}
            ]},
            {title:'This node has the customId', id: 'customId', children: [
                {title: 'This node is child of the node having customId', id: 'customIdChild'}
            ]}
        ];

    beforeEach(function() {
        treeModel = new tui.component.Tree.TreeModel(nodeStates.CLOSED, data);
    });

    it('Instance should have the rootNode', function() {
        expect(treeModel.rootNode).toEqual(jasmine.objectContaining({
            id: jasmine.any(Number),
            parentId: null,
            state: nodeStates.OPENED,
            depth: 0,
            childIds: jasmine.any(Array)
        }));
    });

    it('Instance should have the length of all nodes with rootNode', function() {
        expect(treeModel.getCount()).toEqual(25);
    });

    it('Find method should return a node', function() {
        var searched = treeModel.find('customId');

        expect(searched.title).toEqual('This node has the customId');
    });

    it('Add method should append a node to a specific parent node', function() {
        var data = {
                title: 'This node will be added to "customId Node"',
                id: 'addedNode'
            },
            searched;

        treeModel.add(data, 'customId');
        searched = treeModel.find('addedNode');

        expect(searched.id).toEqual('addedNode');
        expect(searched.title).toEqual('This node will be added to "customId Node"');
        expect(searched.parentId).toEqual('customId');
    });

    it('Remove method should remove a node in treeModel', function() {
        var searched;

        treeModel.remove('customId');

        searched = treeModel.find('customId');
        expect(searched).toBeFalsy();

        searched = treeModel.find('customIdChild');
        expect(searched).toBeFalsy();
    });

    it('Each method', function() {
        var iteratee = jasmine.createSpy(),
            callCount = treeModel.getCount();

        treeModel.each(iteratee);

        expect(iteratee.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
            id: jasmine.anything(),
            parentId: jasmine.anything(),
            state: jasmine.anything(),
            depth: jasmine.anything(),
            childIds: jasmine.any(Array)
        }));
        expect(iteratee.calls.count()).toEqual(callCount);
    })
});

/**
 * Legacy test cases
 */
xdescribe('TreeModel을 생성한다', function() {
    var modelOption = {defaultState: 'open'},
        model,
        data = [{
            value: 'nodevalue1',
            children: [{
                value: 'nodevalue1-1',
                children: [{
                    value: 'nodevalue1-1-1'
                }]
            }]
        }, {
            value: 'nv2',
            children: [{
                value: 'nv2-1'
            },
            {
                value: 'nv2-2'
            },
            {
                value: 'nv2-3'
            }]
        }];
    beforeEach(function() {
        // 트리 모델 생성
        model = new tui.component.Tree.TreeModel(modelOption);
        model.setData(data)
    });

    it('모델이 제대로 생성되었는가?', function() {
        expect(model).toBeDefined();
    });

    it('모델의 계층구조가, 해쉬로 생성 되었는가?', function() {
        var hash = model.treeHash,
            root = hash.root,
            ck = root.childKeys,
            second = hash[ck[0]],
            second_1 = hash[ck[1]];
        expect(ck.length).toBe(2);
        expect(second.childKeys.length).toBe(1);
        expect(second_1.childKeys.length).toBe(3);
    });


    it('키값에 맞는 노드를 찾아 오는가?', function() {
        var root = model.treeHash.root,
            ck = root.childKeys,
            node1,
            node2,
            node3;

        node1 = model.find(ck[0]);
        node2 = model.find(ck[1]),
        node3 = model.find(ck[2]);

        expect(node1.value).toBe('nodevalue1');
        expect(node2.value).toBe('nv2');
        expect(node3).toBeUndefined();
    });

    it('노드를 제거한다. 노드의 부모에서도 노드가 제거 된다.', function() {
        var root = model.treeHash.root,
            ck = root.childKeys,
            second = model.find(ck[1]),
            sck = second.childKeys,
            node1;

        node1 = model.find(sck[0]);

        model.remove(node1.id);
        expect(second.childKeys.length).toBe(2);

    });

    it('노드를 생성하여 삽입한다.', function() {

        var id = model._getId(),
            id2 = model._getId(),
            inode1 = model.makeNode(1, id, 'nv3'),
            inode2 = model.makeNode(2, id2, 'nv3-1'),
            node1,
            node2;

        model.insert(inode1);
        model.insert(inode2, id);

        node1 = model.find(id);
        node2 = model.find(id2);

        expect(node1.childKeys.length).toBe(1);
        expect(node2.value).toBe('nv3-1');

    });

    it('노드를 선택하였을 시 호출되는 setBuffer를 사용하여, 버퍼에 저장된다.', function() {
        var root = model.treeHash.root,
            ck = root.childKeys,
            second = model.find(ck[1]),
            sck = second.childKeys,
            node1,
            node2;

        node1 = model.find(sck[0]);
        node2 = model.find(sck[1]);

        model.setBuffer(node1.id);
        expect(node1).toBe(model.buffer);

        model.setBuffer(node2.id);
        expect(node2).toBe(model.buffer);

    });

    it('노드의 계층을 비교한다.', function() {
        var root = model.treeHash.root,
            ck = root.childKeys,
            first = model.find(ck[0]),
            second = model.find(ck[1]),
            secondChild = model.find(second.childKeys[0]);

        var result = model.isDisable(first, second),
            result2 = model.isDisable(secondChild, second);
        expect(result).toBeFalsy();
        expect(result2).toBeTruthy();
    });

});

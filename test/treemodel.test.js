'use strict';

var TreeModel = require('../src/js/treeModel');

describe('TreeModel', function() {
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
            ]}
        ];

    beforeEach(function() {
        treeModel = new TreeModel(data, 'closed');
    });

    it('Instance should have the rootNode', function() {
        expect(treeModel.rootNode).toBeDefined();
    });

    it('Instance should have the length of all nodes with rootNode', function() {
        expect(treeModel.getCount()).toEqual(23);
    });

    it('Find method should return a node', function() {
        var id = treeModel.rootNode.getChildIds()[0],
            node = treeModel.getNode(id);

        expect(node.getData().title).toEqual('A');
    });

    it('Add method should append a node to a specific parent node', function() {
        var data = {
                title: 'This node will be added to the first node'
            },
            parentId = treeModel.rootNode.getChildIds()[0],
            parentNode = treeModel.getNode(parentId),
            id, node;

        treeModel.add(data, parentId);
        id = parentNode.getChildIds()[12];
        node = treeModel.getNode(id);

        expect(node.getData().title).toEqual('This node will be added to the first node');
        expect(node.getParentId()).toEqual(parentId);
    });

    it('Remove method should remove a node in treeModel', function() {
        var id = treeModel.rootNode.getChildIds()[0],
            childIds = treeModel.getNode(id).getChildIds(),
            searched;

        treeModel.remove(id);

        expect(treeModel.rootNode.getChildIds()).not.toContain(id);

        searched = treeModel.getNode(childIds[0]);
        expect(searched).toBeFalsy();

        searched = treeModel.getNode(childIds[11]);
        expect(searched).toBeFalsy();
    });

    it('Each method', function() {
        var iteratee = jasmine.createSpy(),
            callCount = treeModel.getCount();

        treeModel.each(iteratee);
        expect(iteratee.calls.count()).toEqual(callCount);
    });

    it('Sort method', function() {
        var childIds = treeModel.rootNode.getChildIds(),
            comparator = function() {
                return -1;
            };

        treeModel.sort(comparator);
        expect(childIds.reverse()).toEqual(treeModel.rootNode.getChildIds());
    });
});

/**
 * Legacy test cases
 */
//xdescribe('TreeModel을 생성한다', function() {
//    var modelOption = {defaultState: 'open'},
//        model,
//        data = [{
//            value: 'nodevalue1',
//            children: [{
//                value: 'nodevalue1-1',
//                children: [{
//                    value: 'nodevalue1-1-1'
//                }]
//            }]
//        }, {
//            value: 'nv2',
//            children: [{
//                value: 'nv2-1'
//            },
//            {
//                value: 'nv2-2'
//            },
//            {
//                value: 'nv2-3'
//            }]
//        }];
//    beforeEach(function() {
//        // 트리 모델 생성
//        model = new tui.component.Tree.TreeModel(modelOption);
//        model.setData(data)
//    });
//
// ..
// ..
// ..
//    it('노드를 선택하였을 시 호출되는 setBuffer를 사용하여, 버퍼에 저장된다.', function() {
//        var root = model.treeHash.root,
//            ck = root.childKeys,
//            second = model.getNode(ck[1]),
//            sck = second.childKeys,
//            node1,
//            node2;
//
//        node1 = model.getNode(sck[0]);
//        node2 = model.getNode(sck[1]);
//
//        model.setBuffer(node1.id);
//        expect(node1).toBe(model.buffer);
//
//        model.setBuffer(node2.id);
//        expect(node2).toBe(model.buffer);
//
//    });
//
//    it('노드의 계층을 비교한다.', function() {
//        var root = model.treeHash.root,
//            ck = root.childKeys,
//            first = model.getNode(ck[0]),
//            second = model.getNode(ck[1]),
//            secondChild = model.getNode(second.childKeys[0]);
//
//        var result = model.isDisable(first, second),
//            result2 = model.isDisable(secondChild, second);
//        expect(result).toBeFalsy();
//        expect(result2).toBeTruthy();
//    });
//
//});

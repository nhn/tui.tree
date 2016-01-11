'use strict';
tui.util.defineNamespace('tui.component');
tui.component.Tree = require('../src/js/tree');

describe('Tree', function() {
    var data = [
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
                {title: 'This node is child of the node having customId', id: 'customIdChild'},
                {title: 'This node is sechod child of the node having customId', id: 'a_customIdChild'}
            ]}
        ],
        tree;

    beforeEach(function() {
        tree = new tui.component.Tree(data);
    });

    it('Tree should have a root element', function() {
        expect(tree.rootElement).toEqual(jasmine.any(HTMLElement));
    });
});

//describe('Tree를 생성한하고 동작을 테스트 한다.', function() {
//    var modelOption = {defaultState: 'open'},
//        view,
//        view2,
//        view3,
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
//                {
//                    value: 'nv2-2'
//                },
//                {
//                    value: 'nv2-3'
//                }]
//        }];
//    beforeEach(function() {
//        view = new tui.component.Tree('', data ,{
//            modelOption: modelOption
//        });
//        view2 = new tui.component.Tree('', data ,{
//            modelOption: modelOption,
//            useDrag: true,
//            useHelper: true
//        });
//        view3 = new tui.component.Tree('', data ,{
//            modelOption: modelOption,
//            useDrag: true,
//            useHelper: false
//        });
//    });
//
//    it('트리 생성, 모델과 연결 된다. 이름변경을 지원하는 input엘리먼트가 생성된다.', function() {
//        var v = view.model.tree;
//        var input = view.inputElement;
//        expect(view).toBeDefined();
//        expect(v).toBe(view);
//        expect(input).toBeDefined();
//        expect(input.getAttribute('type')).toBeDefined('text');
//    });
//
//    it('앨리먼트의 이름을 변경한다.', function() {
//        var m = view.model,
//            hash = m.treeHash,
//            root = hash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            value = document.getElementById(child.id).innerHTML,
//            nValue;
//        m.rename(child.id, 'test');
//        nValue = document.getElementById(child.id).innerHTML;
//        expect(nValue).not.toBe(value);
//        expect(nValue).toBe(child.value);
//    });
//
//    it('앨리먼트의 상태를 변경한다.', function() {
//        var hash = view.model.treeHash,
//            root = hash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            child_child = view.model.find(child.childKeys[0]),
//            leap_child = view.model.find(child_child.childKeys[0]),
//            element = document.getElementById(child.id).parentNode,
//            el_cls;
//
//        // 닫음
//        child.state = 'close';
//        // 엘리먼트정보 잘못 넘어감
//        view._changeNodeState({});
//        el_cls = element.className.split(' ')[1];
//        expect(el_cls).not.toBe(child.state);
//
//        // 엘리먼트정도 제대로 넘어감.
//        view._changeNodeState(child);
//        el_cls = element.className.split(' ')[1];
//        expect(el_cls).toBe(child.state);
//
//        // leapNode 상태 변경
//        leap_child.state = 'close';
//        view._changeNodeState(leap_child);
//        element = document.getElementById(leap_child.id).parentNode;
//        el_cls = element.className.split(' ')[1];
//        expect(el_cls).toBe(leap_child.state);
//
//    });
//
//    it('엘리먼트를 추가한다. 모델에 추가된 노드가 화면에도 그려진다.', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = m.find(keys[0]),
//            id = m._getId(),
//            node = m.makeNode(child.depth, id, 'test', child.id),
//            element;
//        m.insert(node);
//
//        element = document.getElementById(id);
//        expect(element).toBeDefined();
//    });
//
//    it('엘리먼트를 삭제한다. 모델에서 지워진 노드가 화면에서 제거된다.', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            childNodes;
//
//        m.remove(child.id);
//        childNodes = view.root.childNodes;
//        expect(childNodes.length).toBe(1);
//    });
//
//    it('노드를 선택하고, 선택 해제 한다.', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            child2 = view.model.find(keys[1]),
//            element = document.getElementById(child.id),
//            preSelectClass = element.className;
//
//        m.setBuffer(child.id);
//        expect(preSelectClass).not.toBe(element.className);
//        m.clearBuffer();
//        expect(preSelectClass).toBe(element.className);
//
//        m.setBuffer(child.id);
//        expect(preSelectClass).not.toBe(element.className);
//        // 다른 노드를 선택할 시 자동으로 clearBuffer가 이뤄진다.
//        m.setBuffer(child2.id);
//        expect(preSelectClass).toBe(element.className);
//    });
//
//    it('노드를 이동 시킨다.(선택하여 잘라내고(삭제) 저장된 노드를 다른 노드 아래로에 붙인다.)', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            k1 = keys[0],
//            k2 = keys[1],
//            child = m.find(k1),
//            dest = m.find(k2),
//            destLen = dest.childKeys.length;
//
//        // 노드 선택
//        m.move(k1, child, k2);
//
//        var resChildNodes = view.root.childNodes;
//        expect(resChildNodes.length).toBe(1);
//        expect(destLen).toBe(3);
//
//    });
//
//    it('노드를 열고 닫는다.', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            state = child.state,
//            elClass = document.getElementById(child.id).parentNode.className,
//            cls;
//
//        m.changeState(child.id);
//
//        cls = document.getElementById(child.id).parentNode.className;
//        expect(state).not.toBe(child.state);
//        expect(elClass).not.toBe(cls);
//    });
//
//    it('트리 우클릭 방지', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            state = child.state,
//            target = document.getElementById(child.id).parentNode.getElementsByTagName('button')[0];
//        var e = {
//            srcElement: target,
//            target: target,
//            which:3,
//            button:2
//        };
//        view._onClick(e);
//        expect(state).toBe(child.state);
//    });
//
//    it('노드의 여닫힘 버튼을 클릭한다.', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            state = child.state,
//            target = document.getElementById(child.id).parentNode.getElementsByTagName('button')[0];
//        var e = {
//                srcElement: target,
//                target: target,
//                cancelBubble: false
//            };
//        if($.browser.version > 8) {
//            e.stopPropagation = function() {
//
//            };
//        }
//        view._onClick(e);
//        expect(state).not.toBe(child.state);
//    });
//
//    it('클릭으로 모델 버퍼에 선택 노드를 저장시킨다.', function(done) {
//        var m = view2.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = view2.model.find(keys[0]),
//            target = document.getElementById(child.id);
//        var e = {
//            srcElement: target,
//            target: target,
//            which:1,
//            button:1
//        };
//
//        view2._onClick(e);
//        setTimeout(function() {
//            expect(child).toBe(m.buffer);
//            done();
//        }, 1000);
//    });
//
//    it('뷰의 모드로 전환한다.', function() {
//        var m = view.model,
//            root = m.treeHash.root,
//            keys = root.childKeys,
//            child = view.model.find(keys[0]),
//            state = view.state,
//            target = document.getElementById(child.id);
//
//        var e = {
//            srcElement: target,
//            target: target,
//            which:1,
//            button:1
//        };
//
//        // 더블클릭으로 전환
//        view._onClick(e);
//        view._onClick(e);
//        expect(state).not.toBe(view.state);
//
//        state = view.state;
//
//        e.target = view.inputElement;
//        e.srcElement = view.inputElement;
//        view._onBlurInput(e);
//
//        expect(state).not.toBe(view.state);
//
//    });
//
//    describe('노드를 드래그앤 드롭 한다.', function() {
//        it('같은 레벨의 노드로 드래그앤 드롭', function() {
//            var m = view2.model,
//                root = m.treeHash.root,
//                keys = root.childKeys,
//                child1 = view2.model.find(keys[1]),
//                target1 = document.getElementById(child1.id),
//                child2 = view2.model.find(keys[0]),
//                target2 = document.getElementById(child2.id);
//            var fromE = {
//                srcElement: target1,
//                target: target1,
//                preventDefault: function() {
//
//                }
//            };
//            var moveE = {
//                clientX: 100,
//                clientY: 100
//            };
//            var endE = {
//                srcElement: target2,
//                target: target2
//            };
//
//
//            view2._onMouseDown(fromE);
//            view2._onMouseMove(moveE);
//            view2._onMouseUp(target1, endE);
//
//            expect(root.childKeys.length).toBe(1);
//        });
//
//        it('자식 노드 밑으로 드래그앤 드롭', function() {
//            var m = view2.model,
//                root = m.treeHash.root,
//                keys = root.childKeys,
//                child1 = view2.model.find(keys[1]),
//                target1 = document.getElementById(child1.id),
//                child2 = view2.model.find(child1.childKeys[0]),
//                target2 = document.getElementById(child2.id);
//            var fromE = {
//                srcElement: target1,
//                target: target1,
//                preventDefault: function() {
//
//                }
//            };
//            var moveE = {
//                clientX: 100,
//                clientY: 100
//            };
//            var endE = {
//                srcElement: target2,
//                target: target2
//            };
//
//
//            view2._onMouseDown(fromE);
//            view2._onMouseMove(moveE);
//            view2._onMouseUp(target1, endE);
//            expect(root.childKeys.length).not.toBe(1);
//            expect(root.childKeys.length).toBe(2);
//        });
//
//        it('자식 노드 밑으로 드래그앤 드롭', function() {
//            var m = view2.model,
//                root = m.treeHash.root,
//                keys = root.childKeys,
//                child1 = view2.model.find(keys[1]),
//                target1 = document.getElementById(child1.id),
//                child2 = view2.model.find(child1.childKeys[0]),
//                target2 = document.getElementById(child2.id);
//            var fromE = {
//                srcElement: target1,
//                target: target1,
//                preventDefault: function() {
//
//                }
//            };
//            var moveE = {
//                clientX: 100,
//                clientY: 100
//            };
//            var endE = {
//                srcElement: target2,
//                target: target2
//            };
//
//
//            view2._onMouseDown(fromE);
//            view2._onMouseMove(moveE);
//            view2._onMouseUp(target1, endE);
//            expect(root.childKeys.length).not.toBe(1);
//            expect(root.childKeys.length).toBe(2);
//        });
//
//        it('버튼을 누르고 드래그앤 드롭 시도', function() {
//            var m = view2.model,
//                root = m.treeHash.root,
//                keys = root.childKeys,
//                child1 = view2.model.find(keys[1]),
//                target1 = document.getElementById(child1.id).previousSibling;
//            var fromE = {
//                srcElement: target1,
//                target: target1,
//                preventDefault: function() {
//
//                }
//            };
//
//            view2._onMouseDown(fromE);
//
//            expect(view2.move).not.toBeDefined();
//            expect(view2.up).not.toBeDefined();
//        });
//
//        it('Editable 상태 일때 드래그앤 드롭 시도', function() {
//            view2.state = 1;
//            var m = view2.model,
//                root = m.treeHash.root,
//                keys = root.childKeys,
//                child1 = view2.model.find(keys[1]),
//                target1 = document.getElementById(child1.id);
//
//            var fromE = {
//                srcElement: target1,
//                target: target1,
//                preventDefault: function() {
//
//                }
//            };
//
//            view2._onMouseDown(fromE);
//
//            expect(view2.move).not.toBeDefined();
//            expect(view2.up).not.toBeDefined();
//        });
//        it('drag helper 엘리먼트 사용을 하지 않을 때, 엘리면트 생성 안됨', function() {
//
//            var m = view3.model,
//                root = m.treeHash.root,
//                keys = root.childKeys,
//                child1 = view3.model.find(keys[1]),
//                target1 = document.getElementById(child1.id),
//                child2 = view3.model.find(child1.childKeys[0]),
//                target2 = document.getElementById(child2.id);
//            var fromE = {
//                srcElement: target1,
//                target: target1,
//                preventDefault: function() {
//
//                }
//            };
//
//            var moveE = {
//                clientX: 100,
//                clientY: 100
//            };
//            var endE = {
//                srcElement: target2,
//                target: target2
//            };
//
//            view3._onMouseDown(fromE);
//            view3._onMouseMove(moveE);
//            view3._onMouseUp(target1, endE);
//
//            expect(view3.helperElement).not.toBeDefined();
//
//        });
//
//
//    });
//
//});

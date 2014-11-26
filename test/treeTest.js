describe('tree 통합테스트', function() {

    jasmine.getFixtures().fixturesPath = "base/";
    beforeEach(function() {
        loadFixtures('test/fixture/tree.html');
    });

    describe('생성후 실행테스트', function() {
        var tree;
        beforeEach(function() {
            var data = [
                    {title: 'A',
                        children: [
                            {title: 'A-1'},
                            {title: 'A-2', children: [
                                {title: 'A-1-1'},
                                {title: 'A-1-2'}
                            ]}
                        ]}
                ];
            tree = new ne.component.Tree({
                data: data,
                config: {
                    viewId: 'treeRoot',
                    defaultState: 'open',
                    depthLabels: ['Area', 'Block', 'Line']
                }
            });
        });

        it('트리 생성 완료? ', function() {
            expect(tree).toBeDefined();
        });

        it('모델의 데이터를 받아온다. getModelData', function() {
            var modelData = tree.getModelData();
            expect(modelData.id).toBe('treeRoot');
            expect(modelData.childNodes[0].title).toBe('A');
        });

        it('트리가 제대로 생성되었는지 데이터 확인', function() {
            var node1,
                node2,
                node3,
                node4;
            node1 = tree.model.findNode('0');
            node2 = tree.model.findNode('0,0');
            node3 = tree.model.findNode('0,1');
            node4 = tree.model.findNode('0,1,1');
            expect(node1.title).toBe('A');
            expect(node2.title).toBe('A-1');
            expect(node3.title).toBe('A-2');
            expect(node4.title).toBe('A-1-2');
        });

        it('트리생성 후 데이터 입력, insert', function() {
            var data1,
                data2,
                data3;
            tree.insert('0,0', {title: 't1'});
            tree.insert('0,0', {title: 't2'});
            tree.insert({title: 't3'});
            data1 = tree.model.findNode('0,0,0');
            data2 = tree.model.findNode('0,0,1');
            data3 = tree.model.findNode('1');
            expect(data1.title).toBe('t1');
            expect(data2.title).toBe('t2');
            expect(data3.title).toBe('t3');
        });

        it('트리 아이템 이름변경', function() {
            var data1,
                data2;
            tree.rename('0,0', 'B-1');
            tree.rename('0,1', 'B-2');
            data1 = tree.model.findNode('0,0');
            data2 = tree.model.findNode('0,1');
            expect(data1.title).toBe('B-1');
            expect(data2.title).toBe('B-2');
        });

        it('트리 아이템 제거', function() {
            var data1,
                data2,
                data3;
            tree.remove('0,1');
            tree.remove('0,0');
            data1 = tree.model.findNode('0,1');
            data2 = tree.model.findNode('0,0');
            data3 = tree.model.findNode('0');
            expect(data1).not.toBeDefined();
            expect(data2).not.toBeDefined();
            expect(data3.childNodes.length).toBe(0);
        });

        it('단위값 추가', function() {
            var node,
                nodeText,
                firstLevel,
                em;
            tree.setDepthLabels(['A단계','B단계','C단계']);
            node = tree.model.findNode('0');
            em = document.getElementById(node.get('id')).parentNode.getElementsByTagName('em')[0];
            nodeText = em.innerHTML;

            expect(nodeText.indexOf('A단계')).not.toBe(-1);
            // 에러 발생 시킴
            try {
                tree.setDepthLabels('aaaaaa');
            } catch(e) {
                expect(e.constructor).toBe(TypeError);
            }
        });
    });

    describe('생성후, 이벤트 관련 테스트', function() {
        var tree;
        beforeEach(function() {
            var data = [
                {title: 'A',
                    children: [
                        {title: 'A-1'},
                        {title: 'A-2', children: [
                            {title: 'A-1-1'},
                            {title: 'A-1-2'}
                        ]}
                ]},
                {title: 'B',
                    children: [
                        {title: 'B-1', children: [
                            {title:'B-1-1'}
                        ]},
                        {title: 'B-2'}
                    ]
                }
            ];
            tree = new ne.component.Tree({
                data: data,
                config: {
                    viewId: 'treeRoot',
                    defaultState: 'open',
                    depthLabels: ['Area', 'Block', 'Line']
                }
            });
        });



        it('편집모드로 변경 테스트, 엘리먼트 생성이 제대로 되었는가?', function() {
            expect(tree.inputElement).toBeDefined();
        });

        it('트리 클릭시 버퍼에 저장되는지', function() {
            var node,
                buffer;
            tree._onClickEvent({
                isButton: false,
                paths: '1'
            });
            node = tree.model.findNode('1');
            buffer = tree.model.buffer;
            expect(node).toBe(buffer);
        });

        it('트리에 여닫힘 버튼 클릭시, 노드 상태 변화', function() {
            var node,
                state;
            state = tree.model.findNode('1,0').get('state');
            tree._onClickEvent({
                isButton: true,
                paths: '1,0'
            });
            node = tree.model.findNode('1,0');
            expect(state).not.toBe(node.get('state'));
        });

        it('이름 변경 enter 입력 flow', function() {
            var node = tree.model.findNode('0,1');
            tree._onDoubleClick({
                target: document.getElementById(node.get('id')),
                path: '0,1'
            });
            tree.inputElement.value = 'T-1';
            // 엔터 핸들러 수행
            tree._onKeyDownInputElement({
                keyCode: 13
            });
            expect(node.get('title')).toBe('T-1');
        });

        it('이름 변경 enter 입력 flow', function() {
            var node = tree.model.findNode('0,0');
            tree._onDoubleClick({
                target: document.getElementById(node.get('id')),
                path: '0,0'
            });
            tree.inputElement.value = 'T-2';
            // 블러 핸들러 수행
            tree._onBlurInputElement();
            expect(node.get('title')).toBe('T-2');
        });

        it('custom 이벤트 할당', function() {
            var renameCalled = false,
                removeCalled = false,
                insertCalled = false;
            tree.on('rename', function(data) {
                renameCalled = data;
            });
            tree.on('remove', function(data) {
                removeCalled = data;
            });
            tree.on('insert', function(data) {
                insertCalled = data;
            });
            tree.insert('0,1,0', {title: 't' });
            expect(insertCalled.path).toBe('0,1,0');
            expect(insertCalled.value.title).toBe('t');
            tree.rename('0,1,0', 'g');
            expect(renameCalled.path).toBe('0,1,0');
            expect(renameCalled.value).toBe('g');
            tree.remove('0,1,0');
            expect(removeCalled.path).toBe('0,1,0');
        });

        it('custom 이벤트가 실패할 경우 다음 진행 방해', function() {
            var node,
                fnc = function(data) {
                    return false;
                };
            tree.on('insert', fnc);
            tree.insert('0', {title: 't1'});
            node = tree.model.findNode('0,2');
            expect(node).not.toBeDefined();
            tree.off('insert', fnc);
            tree.insert('0', {title: 't1'});
            node = tree.model.findNode('0,2');
            expect(node).toBeDefined();
        });

    });

});
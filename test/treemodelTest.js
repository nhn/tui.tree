/**
 * Created by janeir on 10/23/14.
 */
describe('TreeModel을 생성한다', function() {
    var model = new ne.component.Tree.TreeModel({defaultState:'open'});
    it('TreeModel 객체가 생성되었다', function() {
        expect(model).toBeDefined();
    });

    // 모델에 데이터를 세팅한다.
    model.setData([
        {
            title: 'A',
            children: [
                {title: 'A-1'},
                {title: 'A-2'}
            ]
        }
    ]);

    // 모델에 등록하기 위한 뷰 객체를 생성한다
    var view = new ne.component.Tree.TreeView({defaultState:'open'}, model.getFirstChildren());
    model.listen(view);

    it('model.getData로 노드 데이터를 가져온다', function() {
        var nodes = model.nodes;
        expect(model.getData()).toBe(nodes);
    });

    it('model.findNode로 노드를 탐색한다.', function() {
        // 임의의 패스를 설정한다. 클릭 이벤트로 선택된 노드의패스로 가정한다.
        // 0,1 은 A-2노드와 같다
        var path = '0,1',
            target = model.findNode(path);
        expect(target.get('title')).toBe('A-2');
    });

    it('model.renameNode 로 노드의 이름을 변경한다.', function() {
        // 임의의 패스를 설정한다. 클릭 이벤트로 선택된 노드의패스로 가정한다.
        // 0,0 은 A-1노드와 같다
        var path = '0,0';
        model.renameNode(path, 'B-1');
        var target = model.findNode(path);

        expect(target.get('title')).toBe('B-1');
    });

    it('model.changeState 로 노드의 상태를 변경한다.', function() {
        // 임의의 패스를 설정한다. 클릭 이벤트로 선택된 노드의패스로 가정한다.
        // 0 은 A노드와 같다
        // 현재 기본값은 open이므로 close가 나오면 정상이다.
        var path = '0',
            target = model.findNode(path),
            open,
            close;
        model.changeState(path);
        open = target.get('state');
        model.changeState(path);
        close = target.get('state');

        expect(open).toBe('close');
        expect(close).toBe('open');
    });

    it('model.insertNode 로 노드를 삽입한다.', function() {
        // 임의의 패스를 설정한다. 클릭 이벤트로 선택된 노드의패스로 가정한다.
        // 0,0 은 A-1노드와 같다
        // 0,0,0이 제대로 생성 되는지 확인한다.
        var path = '0,0',
            expectPath1 = '0,0,0',
            expectPath2 = '0,0,1',
            expectTarget1,
            expectTarget2;
        model.insertNode(path, {title: 'A-1-1'});
        model.insertNode(path);
        var expectTarget1 = model.findNode(expectPath1);
        var expectTarget2 = model.findNode(expectPath2);
        expect(expectTarget1.get('title')).toBe('A-1-1');
        expect(expectTarget2.get('title')).toBe('no Title');

    });

    it('setBuffer 버퍼설정', function() {
        var path = '0,0',
            node = model.findNode('0,0'),
            nodeTitle = node.get('title'),
            bufferTitle;
        model.setBuffer('0,0');
        var bufferTitle = model.buffer.get('title');
        expect(nodeTitle).toBe(bufferTitle);
    });

    it('clearBuffer 버퍼해제', function() {
        var buffer = model.buffer;
        model.clearBuffer();

        expect(buffer).not.toBe(model.buffer);
    });

    it('sort Child ', function() {
        var arr = [{title:'a'}, {title:'c'}, {title:'b'}, {title:'c'}];
        model.sortChild(arr);

        expect(arr[1].title).toBe('b');
    });

    it('removeNode 노드 제거', function() {
        var beforeNode,
            nextNode,
            path = '0,0';
        beforeNode = model.findNode(path);
        model.removeNode(path);
        nextNode = model.findNode(path);
        expect(beforeNode).not.toBe(nextNode);
    });
});
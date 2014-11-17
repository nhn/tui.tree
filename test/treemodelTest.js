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
            target = model.findNode(path);
        model.changeState(path);

        expect(target.get('state')).toBe('close');
    });

    it('model.insertNode 로 노드를 삽입한다.', function() {
        // 임의의 패스를 설정한다. 클릭 이벤트로 선택된 노드의패스로 가정한다.
        // 0,0 은 A-1노드와 같다
        // 0,0,0이 제대로 생성 되는지 확인한다.
        var path = '0,0',
            expectPath = '0,0,0';
        model.insertNode(path, {title: 'A-1-1'});

        var expectTarget = model.findNode(expectPath);
        expect(expectTarget.get('title')).toBe('A-1-1');

    });


});
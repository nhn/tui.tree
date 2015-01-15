xdescribe('Node 를 생성한다', function() {
    var node;
    beforeEach(function() {
        node = new ne.component.Tree.TreeNode({title: 'MyTitle', state: 'open', id: 'myId'});
    });

    it('node가 정의되어 있다', function() {
        expect(node).toBeDefined();
    });

    it('node의 초기옵션이 제대로 들어가있다.', function() {
        expect(node.get('title')).toEqual('MyTitle');
        expect(node.get('state')).toEqual('open');
        expect(node.get('id')).toEqual('myId');
    });

    it('node의 속성값을 변경한다.', function() {
        node.set('state', 'close');
        expect(node.get('state')).toEqual('close');
    });
});
/**
 * @fileoverview 트리의 노드를 구성한다
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @constructor
 *
 * **/
ne.component.Tree.TreeNode = ne.defineClass(/** @lends Node.prototype */{
    /**
     *
     * 노드의 기본값및 옵션으로 받은 값들을 세팅한다
     *
     * @param {Object} options 노드 옵션
     *
     * **/
    init: function(options) {
        /**
         * 노드의 아이디값
         * @type {String}
         */
        this.id = options.id;
        /**
         * 노드의 타이틀
         * @type {String}
         */
        this.title = options.title;
        /**
         * 노드 타입(폴더인지 아닌지)
         * @type {String}
         */
        this.type = options.type || 'default';
        /**
         * 노드의 상태(닫혔는지 열렸는지)
         * @type {String}
         */
        this.state = options.state || 'close';
        /**
         * 노드의 차일드 노드
         *
         * @type {Array}
         */
        this.childNodes = null;
        /**
         * 부모 노드
         * @type {ne.component.Tree.TreeNode}
         */
        this.parent = null;
        this.siblings = null;
    },
    /**
     *
     * 노드의 상태변경
     *
     * @param {String} type 변경할 노드의 필드값
     * @param {String} value 노드 옵션
     *
     * **/
    set: function(type, value) {
        this[type] = value;
    },
    /**
     * 노드의 상태를 받아오기
     *
     * @param {String} type 값을 가져올 노드의 필드값
     * @return {String}
     */
    get: function(type) {
        return this[type];
    }
});
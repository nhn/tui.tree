/**
 * 트리의 노드를 구성한다
 *
 * @author FE개발팀 이제인(jein.yi@nhnent.com)
 * @class
 *
 * **/
var Node = Class.extend(/** @lends Node.prototype */{
    /**
     *
     * 노드의 기본값및 옵션으로 받은 값들을 세팅한다
     *
     * @param {Object} options 노드 옵션
     *
     * **/
    init: function(options) {
        this.id = options.id;
        this.title = options.title;
        this.type = options.type || 'default';
        this.state = options.state || 'close';
        this.childNodes = null;
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
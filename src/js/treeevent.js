/**
 * 트리에 이벤트를 등록한다
 *
 * @class
 */

var TreeEvent = Class.extend(/** @lends Event.prototype */{
    /**
     * 더블클릭을 판별하는 필드를 세팅한다.
     *
     * **/
    init: function() {

        this.doubleClickTimer = null;
        this.clickTerm = null;

    },
    /**
     * 이벤트를 추가한다,
     * 더블클릭의 경우 click내부에서 타이머를 돌며 체크한다.
     *
     * @param {Object} target 이벤트가 등록되고 이벤트 핸들러의 컨텍스트가 될 객체
     * @param {String} type 이벤트 명
     * @param {Function} callback 이벤트 핸들러
     *
     * **/
    add: function(target, type, callback) {

        var self = this;

        if (type === 'doubleclick') {

            utils.addEventListener(target, 'click', function(e) {

                //utils.stopEvent(e);
                var e = e || window.event,
                    eventTarget = e.target || e.srcElement,
                    path = eventTarget.getAttribute('path'),
                    text = eventTarget.innerText;

                if ((e.which && e.which == 3) || e.button && e.button == 2) {
                    self.isDoubleClick = false;
                    utils.stopEvent(e);
                    return void 0;
                }

                if (path == undefined && path !== '0') {
                    self.isDoubleClick = false;
                    return void 0;
                }

                if (!self.doubleClickTimer) {
                    self.doubleClickTimer = new Date();
                    setTimeout(function(e) {
                        if (self.isDoubleClick) {
                            callback.call(target, {
                                eventType: type,
                                target: eventTarget,
                                path: path,
                                text: text
                            });
                        }
                        self.doubleClickTimer = null;
                    }, 400);
                } else {
                    callback.call(target, {
                        eventType: type,
                        target: eventTarget,
                        path: path,
                        text: text
                    });
                    self.doubleClickTimer = null;
                }
            });

        }

        utils.addEventListener(target, type, function(e) {

            var e = e || window.event,
                eventTarget = e.target || e.srcElement,
                targetTag = eventTarget.tagName.toLowerCase(),
                paths = null;

            if ((e.which && e.which == 3) || e.button && e.button == 2) {
                utils.stopEvent(e);
                return void 0;
            }

            if (targetTag == 'button') {
                var parent = eventTarget.parentNode;
                var pathElement = parent.getElementsByTagName('span')[0];
                paths = pathElement.getAttribute('path');
            }
            else {
                paths = eventTarget.getAttribute('path');
            }

            utils.extend(e, {
                eventType: type,
                isButton: targetTag == 'button',
                target: eventTarget,
                paths: paths
            });
            callback.call(target, e);

        });
    }
});

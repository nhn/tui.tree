xdescribe('treeutil', function() {
    jasmine.getFixtures().fixturesPath = 'base/';
    beforeEach(function() {
        loadFixtures('test/fixture/treeutil.html');
    });

    describe('이벤트 수행 테스트', function() {
        var handleTestElement,
            callback;
        beforeEach(function() {
            handleTestElement = document.getElementById('treeHandle');
            callback = function(e) {
                var e = e || window.event,
                    target = e.target | e.srcElement;
                ne.component.Tree.treeUtils.stopEvent(e);
                target.style.backgroundColor = 'red';
            };
        });

        it('addEvent', function() {
            ne.component.Tree.treeUtils.addEventListener(handleTestElement, 'click', callback);
        });

        it('removeEvent', function() {
            ne.component.Tree.treeUtils.removeEventListener(handleTestElement, 'click', callback);
        });

        it('stopEvent', function() {
            ne.component.Tree.treeUtils.stopEvent({
                stopPropagation: function() {

                }
            });
            ne.component.Tree.treeUtils.stopEvent({
                preventDefault: function() {

                }
            });
        });
    });
});
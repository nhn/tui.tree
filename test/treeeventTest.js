describe('treeEvent 를 생성한다', function() {
    var event,
        div,
        button,
        span;

    jasmine.getFixtures().fixturesPath = "base/";
    beforeEach(function() {
        loadFixtures('test/fixture/treeevent.html');
    });
    var event,
        div,
        button,
        span;
    describe('check event handler', function() {
        beforeEach(function() {
            event = new ne.component.Tree.TreeEvent();
            div = document.getElementById('treeitem1');
            span = div.getElementsByTagName('span')[0];
            button = div.getElementsByTagName('button')[0];
        });

        it('event._onClick', function() {
            var num = 1;
            var callback = function(data) {
                num++;
            };
            var evt1 = {
                target: span,
                button: 1
            };
            var evt2 = {
                srcElement: button,
                which: 1
            };
            var evt3 = {
                srcElement: span,
                which: 1
            };
            var evt4 = {
                target: button,
                button: 1
            };
            var evt5 = {
                srcElement: span,
                which: 3
            };
            var evt6 = {
                target: button,
                button: 3
            };

            event._onClick(evt1, callback);
            event._onClick(evt2, callback);
            event._onClick(evt3, callback);
            event._onClick(evt4, callback);
            event._onClick(evt5, callback);
            event._onClick(evt6, callback);

            expect(num).toEqual(5);
        });

        it('event._onDoubleClck', function() {
            var num = 1;
            var callback = function(data) {
                num++;
            };
            var evt1 = {
                target: span,
                button: 1
            };
            var evt2 = {
                srcElement: span,
                which: 1
            };
            var evt3 = {
                srcElement: span,
                which: 1
            };
            var evt4 = {
                target: span,
                button: 1
            };
            // 우측 버튼
            var evt5 = {
                srcElement: span,
                which: 3
            };
            var evt6 = {
                target: span,
                button: 3
            };

            event._onDeobleClick(evt1, callback);
            event._onDeobleClick(evt2, callback); // 증가
            event._onDeobleClick(evt3, callback);
            event.doubleClickTimer = true;
            event._onDeobleClick(evt4, callback); // 증가
            event.doubleClickTimer = true;
            event._onDeobleClick(evt5, callback); // 마우스 우측버튼이라 증가 x
            event.doubleClickTimer = true;
            event._onDeobleClick(evt6, callback); // 마우스 우측버튼으로 인식 증가 x
            expect(num).toEqual(3);
        });
    });


});
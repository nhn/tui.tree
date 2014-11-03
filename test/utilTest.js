describe('utils 을 테스트 한다', function() {

    it('utils is defined', function() {
        expect(utils).toBeDefined();
    });


    describe('utils.extend를 사용해 오브젝트를 extendObject를 만든다', function() {
        var objectA = {
            title: 'titleA',
            value: 10
        };
        var objectB = {
            align: 'center',
            value: 20
        };

        var extendObject = utils.extend(objectA, objectB);

        it('extendObject 는 object가 확장된 형태로 objectA와 같은 참조값을 가진다', function() {
            expect(extendObject).toBe(objectA);
        });
        it('extendObject 에는 objectB의 속성인 align이 할당되어 있다.', function() {
            expect(extendObject.align).toEqual('center');
        });
        it('objectA에도 있고, objectB에도 있는 값의 경우 오버라이딩 된다.', function() {
            expect(extendObject.value).toEqual(20);
        });
    });

    describe('타입체크 메서드의 동작을 확인한다', function() {
        var funcA = function(a, b) {
            return a + b;
        };
        var objectA = {
            a: 1, b: 2
        };

        it('funcA 가 함수인지 체크한다.', function() {
            expect(utils.isFunction(funcA)).toBe(true);
        });

        it('objectA 가 객체인지 체크한다', function() {
            expect(utils.isObject(objectA)).toBe(true);
        });
    });





});
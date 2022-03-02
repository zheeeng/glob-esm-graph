import { getCircles } from './algo'

describe('getCircles basic tests', () => {
    test('find and prune well', () => {
        /**
         * a -> b 
         * a <- b
         */
        expect(
            getCircles([
                ['a', 'b', 'a'], ['b', 'a', 'b'],
            ])
        ).toEqual(
            [['a', 'b']]
        )

        /**
         * a -> b -> c
         * a <------ c
         */
        expect(
            getCircles([
                ['a', 'b', 'c', 'a'], ['b', 'c', 'a', 'b'], ['c', 'a', 'b', 'c'],
            ])
        ).toEqual(
            [['a', 'b', 'c']]
        )
    })
})

describe('getCircles circle combo circle tests', () => {
    test('find and prune well', () => {
        /**
         * a -> b -> c
         * a <- b
         *      b <-c
         */
        expect(
            getCircles([
                ['a', 'b', 'c', 'a'], ['a', 'b', 'a'],
                ['b', 'a', 'b'], ['b', 'c', 'b'],
                ['c', 'b', 'c'], ['c', 'b', 'a', 'b'],
            ])
        ).toEqual(
            [
                ['a', 'b', 'c'],
                ['a', 'b'],
                ['b', 'c'],
            ]
        )
    })
})

describe('getCircles big circle contains small circle tests', () => {
    test('find and prune well', () => {
        /**
         * a -> b -> c
         * a <- b
         * a <------ c
         */
        expect(
            getCircles([
                ['a', 'b', 'a'], ['a', 'b', 'c', 'a'],
                ['b', 'a', 'b'], ['b', 'c', 'a', 'b'],
            ])
        ).toEqual(
            [
                ['a', 'b'],
                ['a', 'b', 'c'],
            ]
        )
    })
})

describe('getCircles complex tests', () => {
    test('find and prune well', () => {
        /**
         * a -> b -> c
         * a <- b
         * a <------ c
         */
        expect(
            getCircles([
                ['a', 'b', 'a'], ['a', 'b', 'c', 'a'],
                ['b', 'a', 'b'], ['b', 'c', 'a', 'b'],
            ])
        ).toEqual(
            [
                ['a', 'b'],
                ['a', 'b', 'c'],
            ]
        )
    })
})
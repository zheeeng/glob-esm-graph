import { globMatch, analyze, buildGraph } from '../src/index'

describe('test suite organized well', () => {
    const foo1Dependencies = require(`./third/foo1/package.json`).dependencies
    const foo2Dependencies = require(`./third/foo2/package.json`).dependencies
    const foo3Dependencies = require(`./third/foo3/package.json`).dependencies
    const foo4Dependencies = require(`./third/foo4/package.json`).dependencies
    const foo5Dependencies = require(`./third/foo5/package.json`).dependencies
    const foo6Dependencies = require(`./third/foo6/package.json`).dependencies
    const foo7Dependencies = require(`./third/foo7/package.json`).dependencies

    test('foo1 doesn\'t dependent on any modules, but is dependency of foo2', () => {
        expect(Object.keys(foo1Dependencies)).toHaveLength(0)

        expect(foo2Dependencies).toHaveProperty('foo1')
        expect(foo3Dependencies).not.toHaveProperty('foo1')
        expect(foo4Dependencies).not.toHaveProperty('foo1')
        expect(foo5Dependencies).not.toHaveProperty('foo1')
        expect(foo6Dependencies).not.toHaveProperty('foo1')
        expect(foo7Dependencies).not.toHaveProperty('foo1')
    })

    test('foo2 dependent on foo1, and is dependency of foo3', () => {
        expect(Object.keys(foo2Dependencies)).toHaveLength(1)
        expect(foo2Dependencies).toHaveProperty('foo1')

        expect(foo1Dependencies).not.toHaveProperty('foo2')
        expect(foo3Dependencies).toHaveProperty('foo2')
        expect(foo4Dependencies).not.toHaveProperty('foo2')
        expect(foo5Dependencies).not.toHaveProperty('foo2')
        expect(foo6Dependencies).not.toHaveProperty('foo2')
        expect(foo7Dependencies).not.toHaveProperty('foo2')
    })

    test('foo3 dependent on foo2, nor any dependencies of others', () => {
        expect(Object.keys(foo3Dependencies)).toHaveLength(1)
        expect(foo3Dependencies).toHaveProperty('foo2')

        expect(foo1Dependencies).not.toHaveProperty('foo3')
        expect(foo2Dependencies).not.toHaveProperty('foo3')
        expect(foo4Dependencies).not.toHaveProperty('foo3')
        expect(foo5Dependencies).not.toHaveProperty('foo3')
        expect(foo6Dependencies).not.toHaveProperty('foo3')
        expect(foo7Dependencies).not.toHaveProperty('foo3')
    })

    test('foo4 either dependent on any modules nor as dependency of any modules', () => {
        expect(Object.keys(foo4Dependencies)).toHaveLength(0)

        expect(foo1Dependencies).not.toHaveProperty('foo4')
        expect(foo2Dependencies).not.toHaveProperty('foo4')
        expect(foo3Dependencies).not.toHaveProperty('foo4')
        expect(foo5Dependencies).not.toHaveProperty('foo4')
        expect(foo6Dependencies).not.toHaveProperty('foo4')
        expect(foo7Dependencies).not.toHaveProperty('foo4')
    })

    test('foo5 dependent on foo6, and is dependency of foo6', () => {
        expect(Object.keys(foo5Dependencies)).toHaveLength(1)
        expect(foo5Dependencies).toHaveProperty('foo6')

        expect(foo1Dependencies).not.toHaveProperty('foo5')
        expect(foo2Dependencies).not.toHaveProperty('foo5')
        expect(foo3Dependencies).not.toHaveProperty('foo5')
        expect(foo4Dependencies).not.toHaveProperty('foo5')
        expect(foo6Dependencies).toHaveProperty('foo5')
        expect(foo7Dependencies).not.toHaveProperty('foo5')
    })

    test('foo6 dependent on foo5, and is dependency of foo5', () => {
        expect(Object.keys(foo6Dependencies)).toHaveLength(1)
        expect(foo6Dependencies).toHaveProperty('foo5')

        expect(foo1Dependencies).not.toHaveProperty('foo6')
        expect(foo2Dependencies).not.toHaveProperty('foo6')
        expect(foo3Dependencies).not.toHaveProperty('foo6')
        expect(foo4Dependencies).not.toHaveProperty('foo6')
        expect(foo5Dependencies).toHaveProperty('foo6')
        expect(foo7Dependencies).not.toHaveProperty('foo6')
    })

    test('foo7 either dependent on any modules nor as dependency of any modules', () => {
        expect(Object.keys(foo7Dependencies)).toHaveLength(0)

        expect(foo1Dependencies).not.toHaveProperty('foo7')
        expect(foo2Dependencies).not.toHaveProperty('foo7')
        expect(foo3Dependencies).not.toHaveProperty('foo7')
        expect(foo5Dependencies).not.toHaveProperty('foo7')
        expect(foo6Dependencies).not.toHaveProperty('foo7')
        expect(foo7Dependencies).not.toHaveProperty('foo7')
    })
})


describe('glob match non-exist entry', () => {
    const cwd = `${__dirname}/foo-test-non-exist`
    const pattern = '**/*.module.ts'

    test('non-exist entry  throw error', () => {
        expect(
            () => globMatch({ cwd, pattern })
        ).toThrow('There is no package.json file here')

    })
})

const setupTestContext = <T extends Record<string, any>>(run: () => Promise<T>): T => {
    let context = {} as T

    beforeAll(async () => {
        const runResult = await run()
        Object.assign(context, runResult)
    })

    return context
}

describe('glob match irrelevant modules', () => {
    const testContext = setupTestContext(async () => {
        const cwd = `${__dirname}/foo-test`
        const pattern = '**/*.module.ts'

        const matched = globMatch({ cwd, pattern })
        const dependenciesAnalysis = await analyze(matched, cwd)
        const graph = buildGraph(dependenciesAnalysis)

        return { cwd, matched, dependenciesAnalysis, graph }
    })

    test('the dependencies of the required modules match specification', () => {
        const dependencies = require(`${testContext.cwd}/package.json`).dependencies

        expect(Object.keys(dependencies)).toHaveLength(2)
        expect(dependencies).toHaveProperty('foo3')
        expect(dependencies).toHaveProperty('foo4')
    })

    test('list matched modules', () => {
        expect(
            testContext.matched
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts', '../third/foo4/foo4.module.ts',
            ]
        )
    })

    test('list module and module\'s dependencies', () => {
        expect(
            testContext.dependenciesAnalysis
        ).toEqual(
            [
                {
                    module: '../third/foo3/foo3.module.ts',
                    dependencies: [],
                },
                {
                    module: '../third/foo4/foo4.module.ts',
                    dependencies: [],
                },
            ]
        )
    })

    test('list dependencies graph', () => {
        expect(
            testContext.graph.getNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ]
        )

        expect(
            testContext.graph.getEdges()
        ).toEqual(
            []
        )

        expect(
            testContext.graph.getEntryNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getEndNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getPaths()
        ).toEqual(
            [
                ['../third/foo3/foo3.module.ts'],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getSortedByDependencies()
        ).toEqual(
            [
                ['../third/foo3/foo3.module.ts'],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getCircular()
        ).toEqual(
            [],
        )
    })
})

describe('glob match the modules which share common modules', () => {
    const testContext = setupTestContext(async () => {
        const cwd = `${__dirname}/foo-test-with-common`
        const pattern = '**/*.module.ts'

        const matched = globMatch({ cwd, pattern })
        const dependenciesAnalysis = await analyze(matched, cwd)
        const graph = buildGraph(dependenciesAnalysis)

        return { cwd, matched, dependenciesAnalysis, graph }
    })

    test('the dependencies of the required modules match specification', () => {
        const dependencies = require(`${testContext.cwd}/package.json`).dependencies

        expect(Object.keys(dependencies)).toHaveLength(3)
        expect(dependencies).toHaveProperty('foo2')
        expect(dependencies).toHaveProperty('foo3')
        expect(dependencies).toHaveProperty('foo4')
    })

    test('list matched modules', () => {
        expect(
            testContext.matched
        ).toEqual(
            [
                '../third/foo2/foo2.module.ts', '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ]
        )
    })

    test('list module and module\'s dependencies', () => {
        expect(
            testContext.dependenciesAnalysis
        ).toEqual(
            [
                {
                    module: '../third/foo2/foo2.module.ts',
                    dependencies: [],
                },
                {
                    module: '../third/foo3/foo3.module.ts',
                    dependencies: [
                        '../third/foo2/foo2.module.ts',
                    ],
                },
                {
                    module: '../third/foo4/foo4.module.ts',
                    dependencies: [],
                }
            ]
        )
    })

    test('list dependencies graph', () => {
        expect(
            testContext.graph.getNodes()
        ).toEqual(
            [
                '../third/foo2/foo2.module.ts',
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ]
        )

        expect(
            testContext.graph.getEdges()
        ).toEqual(
            [
                ['../third/foo3/foo3.module.ts', '../third/foo2/foo2.module.ts'],
            ]
        )

        expect(
            testContext.graph.getEntryNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getEndNodes()
        ).toEqual(
            [
                '../third/foo2/foo2.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getPaths()
        ).toEqual(
            [
                ['../third/foo2/foo2.module.ts',],
                ['../third/foo3/foo3.module.ts', '../third/foo2/foo2.module.ts'],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getSortedByDependencies()
        ).toEqual(
            [
                ['../third/foo2/foo2.module.ts',],
                ['../third/foo3/foo3.module.ts', '../third/foo2/foo2.module.ts'],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getCircular()
        ).toEqual(
            [],
        )
    })
})

describe('glob match the modules which share common modules (2)', () => {
    const testContext = setupTestContext(async () => {
        const cwd = `${__dirname}/foo-test-with-common2`
        const pattern = '**/*.module.ts'

        const matched = globMatch({ cwd, pattern })
        const dependenciesAnalysis = await analyze(matched, cwd)
        const graph = buildGraph(dependenciesAnalysis)

        return { cwd, matched, dependenciesAnalysis, graph }
    })

    test('the dependencies of the required modules match specification', () => {
        const dependencies = require(`${testContext.cwd}/package.json`).dependencies

        expect(Object.keys(dependencies)).toHaveLength(4)
        expect(dependencies).toHaveProperty('foo1')
        expect(dependencies).toHaveProperty('foo2')
        expect(dependencies).toHaveProperty('foo3')
        expect(dependencies).toHaveProperty('foo4')
    })

    test('list matched modules', () => {
        expect(
            testContext.matched
        ).toEqual(
            [
                '../third/foo1/foo1.module.ts', '../third/foo2/foo2.module.ts',
                '../third/foo3/foo3.module.ts', '../third/foo4/foo4.module.ts',
            ]
        )
    })

    test('list module and module\'s dependencies', () => {
        expect(
            testContext.dependenciesAnalysis
        ).toEqual(
            [
                {
                    module: '../third/foo1/foo1.module.ts',
                    dependencies: [],
                },
                {
                    module: '../third/foo2/foo2.module.ts',
                    dependencies: [
                        '../third/foo1/foo1.module.ts',
                    ],
                },
                {
                    module: '../third/foo3/foo3.module.ts',
                    dependencies: [
                        '../third/foo2/foo2.module.ts',
                    ],
                },
                {
                    module: '../third/foo4/foo4.module.ts',
                    dependencies: [],
                }
            ]
        )
    })

    test('list dependencies graph', () => {
        expect(
            testContext.graph.getNodes()
        ).toEqual(
            [
                '../third/foo1/foo1.module.ts',
                '../third/foo2/foo2.module.ts',
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ]
        )

        expect(
            testContext.graph.getEdges()
        ).toEqual(
            [
                ['../third/foo2/foo2.module.ts', '../third/foo1/foo1.module.ts'],
                ['../third/foo3/foo3.module.ts', '../third/foo2/foo2.module.ts'],
            ]
        )

        expect(
            testContext.graph.getEntryNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getEndNodes()
        ).toEqual(
            [
                '../third/foo1/foo1.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getPaths()
        ).toEqual(
            [
                ['../third/foo1/foo1.module.ts',],
                ['../third/foo2/foo2.module.ts', '../third/foo1/foo1.module.ts'],
                ['../third/foo3/foo3.module.ts', '../third/foo2/foo2.module.ts', '../third/foo1/foo1.module.ts'],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getSortedByDependencies()
        ).toEqual(
            [
                ['../third/foo1/foo1.module.ts',],
                ['../third/foo2/foo2.module.ts', '../third/foo1/foo1.module.ts'],
                ['../third/foo3/foo3.module.ts', '../third/foo2/foo2.module.ts', '../third/foo1/foo1.module.ts'],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getCircular()
        ).toEqual(
            [],
        )
    })
})

describe('glob match the modules with circular references', () => {
    const testContext = setupTestContext(async () => {
        const cwd = `${__dirname}/foo-test-circular`
        const pattern = '**/*.module.ts'

        const matched = globMatch({ cwd, pattern })
        const dependenciesAnalysis = await analyze(matched, cwd)
        const graph = buildGraph(dependenciesAnalysis)

        return { cwd, matched, dependenciesAnalysis, graph }
    })

    test('the dependencies of the required modules match specification', () => {
        const dependencies = require(`${testContext.cwd}/package.json`).dependencies

        expect(Object.keys(dependencies)).toHaveLength(4)
        expect(dependencies).toHaveProperty('foo3')
        expect(dependencies).toHaveProperty('foo4')
        expect(dependencies).toHaveProperty('foo5')
        expect(dependencies).toHaveProperty('foo6')
    })

    test('list matched modules', () => {
        expect(
            testContext.matched
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts', '../third/foo4/foo4.module.ts',
                '../third/foo5/foo5.module.ts', '../third/foo6/foo6.module.ts',
            ]
        )
    })

    test('list module and module\'s dependencies', () => {
        expect(
            testContext.dependenciesAnalysis
        ).toEqual(
            [
                {
                    module: '../third/foo3/foo3.module.ts',
                    dependencies: [],
                },
                {
                    module: '../third/foo4/foo4.module.ts',
                    dependencies: [],
                },
                {
                    module: '../third/foo5/foo5.module.ts',
                    dependencies: [
                        '../third/foo6/foo6.module.ts',
                    ],
                },
                {
                    module: '../third/foo6/foo6.module.ts',
                    dependencies: [
                        '../third/foo5/foo5.module.ts',
                    ],
                },
            ]
        )
    })

    test('list dependencies graph', () => {
        expect(
            testContext.graph.getNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
                '../third/foo5/foo5.module.ts',
                '../third/foo6/foo6.module.ts',
            ]
        )

        expect(
            testContext.graph.getEdges()
        ).toEqual(
            [
                ['../third/foo5/foo5.module.ts', '../third/foo6/foo6.module.ts'],
                ['../third/foo6/foo6.module.ts', '../third/foo5/foo5.module.ts'],
            ]
        )

        expect(
            testContext.graph.getEntryNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getEndNodes()
        ).toEqual(
            [
                '../third/foo3/foo3.module.ts',
                '../third/foo4/foo4.module.ts',
            ],
        )

        expect(
            testContext.graph.getPaths()
        ).toEqual(
            [
                ['../third/foo3/foo3.module.ts',],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getSortedByDependencies()
        ).toEqual(
            [
                ['../third/foo3/foo3.module.ts',],
                ['../third/foo4/foo4.module.ts'],
            ],
        )

        expect(
            testContext.graph.getCircular()
        ).toEqual(
            [
                ['../third/foo5/foo5.module.ts', '../third/foo6/foo6.module.ts'],
            ],
        )
    })
})

describe('glob match the modules which contains multiple matched module', () => {
    const testContext = setupTestContext(async () => {
        const cwd = `${__dirname}/foo-test-multiple-match`
        const pattern = '**/*.module.ts'

        const matched = globMatch({ cwd, pattern })
        const dependenciesAnalysis = await analyze(matched, cwd)
        const graph = buildGraph(dependenciesAnalysis)

        return { cwd, matched, dependenciesAnalysis, graph }
    })

    test('the dependencies of the required modules match specification', () => {
        const dependencies = require(`${testContext.cwd}/package.json`).dependencies

        expect(Object.keys(dependencies)).toHaveLength(1)
        expect(dependencies).toHaveProperty('foo7')
    })


    test('list matched modules', () => {
        expect(
            testContext.matched
        ).toEqual(
            [
                '../third/foo7/bar7.module.ts', '../third/foo7/baz/baz7.module.ts',
                '../third/foo7/foo7.module.ts',
            ]
        )
    })

    test('list module and module\'s dependencies', () => {
        expect(
            testContext.dependenciesAnalysis
        ).toEqual(
            [
                {
                    module: '../third/foo7/bar7.module.ts',
                    dependencies: [],
                },
                {
                    module: '../third/foo7/baz/baz7.module.ts',
                    dependencies: [],
                },
                {
                    module: '../third/foo7/foo7.module.ts',
                    dependencies: [],
                },
            ]
        )
    })

    test('list dependencies graph', () => {
        expect(
            testContext.graph.getNodes()
        ).toEqual(
            [
                '../third/foo7/bar7.module.ts',
                '../third/foo7/baz/baz7.module.ts',
                '../third/foo7/foo7.module.ts',
            ]
        )

        expect(
            testContext.graph.getEdges()
        ).toEqual(
            []
        )

        expect(
            testContext.graph.getEntryNodes()
        ).toEqual(
            [
                '../third/foo7/bar7.module.ts',
                '../third/foo7/baz/baz7.module.ts',
                '../third/foo7/foo7.module.ts',
            ],
        )

        expect(
            testContext.graph.getEndNodes()
        ).toEqual(
            [
                '../third/foo7/bar7.module.ts',
                '../third/foo7/baz/baz7.module.ts',
                '../third/foo7/foo7.module.ts',
            ],
        )

        expect(
            testContext.graph.getPaths()
        ).toEqual(
            [
                ['../third/foo7/bar7.module.ts'],
                ['../third/foo7/baz/baz7.module.ts'],
                ['../third/foo7/foo7.module.ts'],
            ],
        )

        expect(
            testContext.graph.getSortedByDependencies()
        ).toEqual(
            [
                ['../third/foo7/bar7.module.ts'],
                ['../third/foo7/baz/baz7.module.ts'],
                ['../third/foo7/foo7.module.ts'],
            ],
        )

        expect(
            testContext.graph.getCircular()
        ).toEqual(
            [],
        )
    })
})

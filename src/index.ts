import path from 'path'
import fs from 'fs'
import fg from 'fast-glob'
import { init, parse } from 'es-module-lexer'
import { assertNotNull } from './assert'
import { getCircles } from './algo'

export type Options = {
  /**
   * The current working directory in which to search.
   */
  cwd: string,
  /**
   * Glob patterns to match against.
   */
  pattern: string | string[],
}

/**
 * Matches the given glob pattern against the given file path.
 */
export const globMatch = ({ cwd, pattern }: Options): string[] => {
  const packageJSON = (() => {
    try {
      return require(require.resolve(`./package.json`, { paths: [cwd] })) as { dependencies?: Record<string, string> }
    } catch {
      throw new Error('There is no package.json file here')
    }
  })()

  const dependencies = Object.keys(packageJSON.dependencies ?? {})

  const dependenciesEntries = dependencies
    .flatMap(
      (packageName) => {
        try {
          const packageLocation = path.dirname(require.resolve(`${packageName}/package.json`, { paths: [cwd] }))

          return fg
            .sync(pattern, { cwd: packageLocation, onlyFiles: true, absolute: true, ignore: ['node_modules'] })
            .map(filePath => path.relative(cwd, filePath))
        } catch (e) {
          return []
        }
      }
    ).sort((a, b) => a.localeCompare(b))

  return dependenciesEntries
}

type DependenciesAnalysis = {
  module: string,
  dependencies: string[],
}

/**
 * Analyzes the given file paths and returns a list of dependencies.
 */
export const analyze = async (entries: string[], cwd: string): Promise<DependenciesAnalysis[]> => {
  await init

  return entries
    .map(entry => {
      const pathContent = fs.readFileSync(require.resolve(entry, { paths: [cwd] }), { encoding: 'utf-8' })
      const [imports] = parse(pathContent)
      const moduleDependencies = imports
        .flatMap(imp => {
          if (imp.n) {
            try {
              return require.resolve(imp.n, { paths: [cwd] })
            } catch (e) {
              return []
            }
          }

          return []
        })
        .map(filePath => path.relative(cwd, filePath))
        .filter(filePath => entries.includes(filePath))
        .sort((a, b) => a.localeCompare(b))

      return {
        module: entry,
        dependencies: moduleDependencies,
      }
    })
    .sort((a, b) => a.module.localeCompare(b.module))
}

type Graph = {
  getNodes: () => string[],
  getEdges: () => [from: string, to: string][],
  getEntryNodes: () => string[],
  getEndNodes: () => string[],
  getPaths: () => string[][],
  getCircular: () => string[][],
  getSortedByDependencies: () => string[][],
}

export const buildGraph = (dependenciesAnalysis: DependenciesAnalysis[]): Graph => {
  let dependenciesReference: Map<string, string[]> | undefined
  let nodes: ReturnType<Graph['getNodes']> | undefined
  let edges: ReturnType<Graph['getEdges']> | undefined
  let entryNodes: ReturnType<Graph['getEntryNodes']> | undefined
  let endNodes: ReturnType<Graph['getEndNodes']> | undefined
  let paths: ReturnType<Graph['getPaths']> | undefined
  let circular: ReturnType<Graph['getCircular']> | undefined
  let sortedByDependencies: ReturnType<Graph['getSortedByDependencies']> | undefined

  const getDependenciesReference = (): Map<string, string[]> => {
    if (!dependenciesReference) {
      dependenciesReference = new Map(dependenciesAnalysis.map(({ module, dependencies }) => [module, dependencies]))
    }

    return dependenciesReference
  }

  const getNodes: Graph['getNodes'] = () => {
    if (!nodes) {
      nodes = dependenciesAnalysis.map(({ module }) => module).sort((a, b) => a.localeCompare(b))
    }

    return nodes
  }

  const getEdges: Graph['getEdges'] = () => {
    if (!edges) {
      const dependenciesReference = getDependenciesReference()

      edges = dependenciesAnalysis
        .flatMap(
          ({ module, dependencies }) => dependencies
            .filter(dependency => dependenciesReference.has(dependency))
            .map<[from: string, to: string]>(dependency => [module, dependency])
        )
        .sort(([moduleA, moduleB]) => moduleA.localeCompare(moduleB))
    }

    return edges
  }

  const getEntryNodes: Graph['getEntryNodes'] = () => {
    if (!entryNodes) {
      const nodes = getNodes()
      const edges = getEdges()

      entryNodes = nodes.filter(node => edges.every(([, to]) => node !== to))
    }

    return entryNodes
  }

  const getEndNodes: Graph['getEndNodes'] = () => {
    if (!endNodes) {
      const nodes = getNodes()
      const edges = getEdges()

      endNodes = nodes.filter(node => edges.every(([from]) => node !== from))
    }

    return endNodes
  }

  const getAllPaths = () => {
    if (!paths || !circular) {
      const nodes = getNodes()
      const edges = getEdges()

      type ChainNode = {
        value: string,
        next: ChainNode | null,
      }

      const lens = new Map<string, ChainNode>(nodes.map(node => [node, { value: node, next: null }]))

      edges.forEach(edge => {
        const [from, to] = edge

        const fromChainNode = lens.get(from)
        const toChainNode = lens.get(to)

        assertNotNull(fromChainNode)
        assertNotNull(toChainNode)

        fromChainNode.next = toChainNode
      })

      const allPaths = Array.from(lens.values()).map(chainNode => {
        function unfold(cn: ChainNode, visited = new Set<string>()): string[] {
          visited.add(cn.value)

          if (cn.next) {
            if (!visited.has(cn.next.value)) {
              return [cn.value, ...unfold(cn.next, visited)]
            } else {
              return [cn.value, cn.next.value]
            }
          }

          return [cn.value]
        }
        return unfold(chainNode)
      })

      paths = allPaths.filter(path => path.length === 1 || path[0] !== path[path.length - 1])
      circular = getCircles(allPaths.filter(path => path.length > 1 && path[0] === path[path.length - 1]))
    }

    return {
      paths,
      circular,
    }
  }

  const getSortedByDependencies: Graph['getSortedByDependencies'] = () => {
    if (!sortedByDependencies) {
      return getAllPaths().paths
        .slice()
        .sort((a, b) => {
          if (a.length > b.length) {
            return a.slice(-b.length).every((value, index) => value === b[index]) ? 0 : 1
          } else if (a.length < b.length) {
            return b.slice(-a.length).every((value, index) => value === a[index]) ? 1 : 0
          } else {
            return 0
          }
        })
    }

    return sortedByDependencies
  }

  return {
    getNodes,
    getEdges,
    getEntryNodes,
    getEndNodes,
    getPaths: () => getAllPaths().paths,
    getCircular: () => getAllPaths().circular,
    getSortedByDependencies,
  }
}
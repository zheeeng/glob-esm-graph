const isArrayLiteralEqual = <T>(a: T[], b: T[]): boolean => a.length === b.length && a.every((value, index) => value === b[index])

const arrayDeDuplicate = <T>(array: T[], by: (a: T, b: T) => boolean): T[] => array.filter((value, index) => array.slice(0, index).every(value2 => !by(value, value2)))

const getCircle = <T>(array: T[]) => array.slice(array.findIndex((value, index, arr) => arr.slice(index + 1).includes(value)), -1)

/**
 * find circles in graph paths, and generate a set of new paths
 * @input likes [['a', 'b', 'a'], ['b', 'a', 'b']], there are the same circle we start from different nodes.
 * @output likes [['a', 'b']], the duplicated circle path is removed, and the circular elements are trimmed.
 */
export function getCircles(paths: string[][]): string[][] {
    const circlePaths = paths.map(path => getCircle(path))
    const sortedPaths = circlePaths.map(path => {
        const sorted = path.slice().sort((a, b) => a.localeCompare(b))

        return [sorted, path] as [sortedPath: string[], originPath: string[]]
    });

    return arrayDeDuplicate(sortedPaths, (([path1], [path2]) => isArrayLiteralEqual(path1, path2)))
        .map(([_, originPath]) => originPath)
}
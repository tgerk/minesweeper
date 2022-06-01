export type GridCoord = [number, number]

// can't have a set of GridCoord tuples, identity check compares Array identity
// use Proxy to digest the GridCoord into a primitive that is compared by value
export default class GridCoordSet extends Set<GridCoord> {
  constructor(coords?: Iterable<GridCoord>) {
    super()

    function _add(this: Set<number>, [i, j]: GridCoord) {
      return this.add((j << 16) | i)
    }
    function _has(this: Set<number>, [i, j]: GridCoord) {
      return this.has((j << 16) | i)
    }
    function _delete(this: Set<number>, [i, j]: GridCoord) {
      return this.delete((j << 16) | i)
    }
    function _forEach(this: Set<number>, fn: (entry: GridCoord) => void): void {
      return this.forEach((digest: number) =>
        fn([digest >> 16, digest & 0xffff])
      )
    }
    function* _entries(this: Set<number>) {
      for (const digest of this) {
        yield[[digest >> 16, digest & 0xffff], [digest >> 16, digest & 0xffff]]
      }
    }
    function* _values(this: Set<number>) {
      for (const digest of this) {
        yield [digest >> 16, digest & 0xffff]
      }
    }

    const p = new Proxy(this as unknown as Set<number>,
    {
      get(s: Set<number>, prop: PropertyKey, ...rest: any[]) {
        switch (prop) {
          case "add":
            return _add.bind(s)
          case "has":
            return _has.bind(s)
          case "delete":
            return _delete.bind(s)
          case "forEach":
            return _forEach.bind(s)
          case "entries":
            return _entries.bind(s)
          case "values":
          case Symbol.iterator:
            return _values.bind(s)
          case "size":
            return s.size
          default:
            console.log(`accessing GridCoordSet property [${String(prop)}]`)
            return Reflect.get(s, prop, ...rest).bind(s)
        }
      },
    }) as unknown as Set<GridCoord>

    if (coords) {
      for (const coord of coords) {
        p.add(coord)
      }
    }

    return p
  }
}

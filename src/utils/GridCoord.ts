export type GridCoord = [number, number]

// reversible digest between a coordinate tuple and a primitive value
// Set<[x,y]> will not work because tuples are compared by object reference, not value (silly Javascript)
const digest = ([i, j]: GridCoord) => (i << 16) | j % 0x10000,
  coord = (digest: number): GridCoord => [digest >> 16, digest & 0xffff]

export default class GridCoordSet extends Set<GridCoord> {
  constructor(coords?: Iterable<GridCoord>) {
    super()

    function _add(this: Set<number>, coord: GridCoord) {
      return this.add(digest(coord))
    }
    function _has(this: Set<number>, coord: GridCoord) {
      return this.has(digest(coord))
    }
    function _delete(this: Set<number>, coord: GridCoord) {
      return this.delete(digest(coord))
    }
    function _forEach(this: Set<number>, fn: (entry: GridCoord) => void): void {
      return this.forEach((digest: number) => fn(coord(digest)))
    }
    function* _entries(this: Set<number>) {
      for (const digest of this) {
        yield [coord(digest), coord(digest)]
      }
    }
    function* _values(this: Set<number>) {
      for (const digest of this) {
        yield coord(digest)
      }
    }

    const p = new Proxy(this as unknown as Set<number>, {
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

    return p // constructor returns a different object! (wow, Javascript)
  }
}

export type GridCoord = [number, number]

export class GridCoordSet extends Set<GridCoord> {
  constructor(coords?: Iterable<GridCoord>) {
    super() // element type is not checked at runtime

    // reversible digest between a coordinate tuple and a primitive value, because
    //  tuples are compared by object reference, not value (silly Javascript)
    const digest = ([i, j]: GridCoord): number => (i << 16) | j % 0x10000,
      coord = (digest: number): GridCoord => [digest >> 16, digest & 0xffff]

    // create Proxy<Set<number>> which implements Set<GridCoord> (wow, Javascript)
    const p = new Proxy(this as unknown as Set<number>, {
      get(s: Set<number>, prop: PropertyKey, ...rest: any[]) {
        switch (prop) {
          case "add":
            return function add(this: Set<number>, coord: GridCoord) {
              return this.add(digest(coord))
            }.bind(s)

          case "has":
            return function has(this: Set<number>, coord: GridCoord) {
              return this.has(digest(coord))
            }.bind(s)

          case "delete":
            return function _delete(this: Set<number>, coord: GridCoord) {
              return this.delete(digest(coord))
            }.bind(s)

          case "forEach":
            return function forEach(
              this: Set<number>,
              fn: (entry: GridCoord) => void
            ): void {
              return this.forEach((digest: number) => fn(coord(digest)))
            }.bind(s)

          case "entries":
            return function* entries(this: Set<number>) {
              for (const digest of this) {
                yield [coord(digest), coord(digest)]
              }
            }.bind(s)

          case "values":
          case Symbol.iterator:
            return function* values(this: Set<number>) {
              for (const digest of this) {
                yield coord(digest)
              }
            }.bind(s)

          case "size":
            return s.size

          default:
            console.log(`accessing GridCoordSet property [${String(prop)}]`)
            return Reflect.get(s, prop, ...rest).bind(s)
        }
      },
    }) as unknown as Set<GridCoord>

    // initialize members
    if (coords) for (const coord of coords) p.add(coord)

    return p
  }
}

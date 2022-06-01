import GridCoordSet, { GridCoord } from "./GridCoord.js"

const props = { x: 22, y: 44, mines: 0.1 }

const set1 = new GridCoordSet(),
  set2 = new GridCoordSet([[1, 2] as GridCoord]),
  set3 = new GridCoordSet(
    Array(Math.floor(props.x * props.y * props.mines))
      .fill(true)
      .map(() => {
        const mine = Math.floor(Math.random() * props.x * props.y)
        return [mine % props.x, Math.floor(mine / props.x)]
      })
  )

set2.clear()
console.info(set3.size)
for (const x of set3.entries()) {
  // console.info(x)
}
for (const x of set3.values()) {
  // console.info(x)
}
for (const x of set3) {
  // console.info(x)
}

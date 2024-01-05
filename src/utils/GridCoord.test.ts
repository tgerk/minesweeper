import { GridCoordSet } from "./GridCoord.js"
import type { GridCoord } from "./GridCoord.js"

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

for (const x of set1.values()) {
  console.info(x)
}

for (const x of set2.values()) {
  console.info(x)
}
for (const [i,j] of set2) {
  console.info([i,j])
}

// set2.clear()
// for (const x of set2.values()) {
//   console.info(x)
// }
// set2.add([0,10])
// for (const x of set2.values()) {
//   console.info(x)
// }
// console.log(Array.from(set2.values()))

// console.info(set3.size)
for (const x of set3.entries()) {
  // console.info(x)
}
for (const x of set3.values()) {
  // console.info(x)
}
for (const x of set3) {
  // console.info(x)
}

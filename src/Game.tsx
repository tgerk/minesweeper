import { batch, createSignal, Show } from "solid-js"
import type { Setter } from "solid-js"

import GridCoordSet, { GridCoord } from "./utils/GridCoord"

import styles from "./Game.module.css"

export default function Game(props: {
  x: number //across
  y: number //down
  mines: number
  setFlags?: Setter<number>
}) {
  let gridRef: HTMLDivElement

  // I've used a variety of accessor methods:
  // 1) for played cells, use a double-indexed 2-d array of booleans
  //  suits the Show component
  // 2) for bombs, use a GridCoordSet utility class
  //  very typescript-y & OO
  // 3) for flagging cells, use classes on DOM elements
  //  fairly old school, performant?
  // 4) recounting neighboring mines is surely non-performant!
  const mines = new GridCoordSet(
      Array(Math.floor(props.x * props.y * props.mines) + 1)
        .fill(true)
        .map(() => {
          const mine = Math.floor(Math.random() * props.x * props.y)
          return [mine % props.y, Math.floor(mine / props.x)]
        })
    ),
    [playedCells, setCells] = createSignal<boolean[][]>(
      Array(props.y).fill(Array(props.x).fill(false))
    ),
    [gameOver, setGameOver] = createSignal<boolean>(false),
    isFlagged = ([i, j]: GridCoord) =>
      (
        gridRef.childNodes[i].childNodes[j] as HTMLDivElement
      ).classList.contains("flag"),
    isPlayed = ([i, j]: GridCoord) => playedCells()[i][j],
    getNeighbors = (coord: GridCoord): GridCoord[] =>
      Array.from(
        // look Mom, a generator!
        (function* ([i, j]: GridCoord): Generator<GridCoord, void, unknown> {
          if (j > 0) {
            if (i > 0) yield [i - 1, j - 1]
            yield [i, j - 1]
            if (i + 1 < props.x) yield [i + 1, j - 1]
          }
          if (i > 0) yield [i - 1, j]
          if (i + 1 < props.x) yield [i + 1, j]
          if (j + 1 < props.y) {
            if (i > 0) yield [i - 1, j + 1]
            yield [i, j + 1]
            if (i + 1 < props.x) yield [i + 1, j + 1]
          }
        })(coord)
      ),
    countNeighborFlags = (coord: GridCoord): number =>
      getNeighbors(coord).filter(([i, j]) =>
        (
          gridRef.childNodes[i].childNodes[j] as HTMLDivElement
        ).classList.contains("flag")
      ).length ?? 0,
    countNeighborMines = (coord: GridCoord): number =>
      getNeighbors(coord).filter((neighbor) => mines.has(neighbor)).length ?? 0,
    updateCells = (cells: Iterable<GridCoord> = []) => {
      for (const [i, j] of cells) {
        setCells((cells) =>
          cells.map((row, y) =>
            y !== j ? row : row.map((cell, x) => (x !== i ? cell : true))
          )
        )
      }
    }

  function selectCell([i, j]: GridCoord, event: MouseEvent): void {
    console.debug("selectCell", [i, j], event)
    const eventTarget = event.target as Element
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.button > 0
    ) {
      return flagCell(eventTarget)
    }

    const doPlayCell = () => batch(() => playCell([i, j], eventTarget))
    eventTarget.addEventListener("mouseup", doPlayCell)
    setTimeout(() => {
      eventTarget.removeEventListener("mouseup", doPlayCell)
    }, 800)
  }

  function flagCell(eventTarget: Element) {
    eventTarget.classList.toggle("flag")
    props.setFlags?.((count) =>
      eventTarget.classList.contains("flag") ? --count : ++count
    )
  }

  function playCell([i, j]: GridCoord, element: Element) {
    if (element.classList.contains("flag") || playedCells()[i][j]) {
      return
    }

    if (mines.has([i, j])) {
      alert("You Lose")
      setGameOver(true)
      return
    }

    if (!countNeighborMines([i, j])) {
      return updateCells(playNeighborCells([i, j])?.add([i, j]))
    }

    updateCells([[i, j]])
  }

  function selectPlayedCell([i, j]: GridCoord, event: MouseEvent): void {
    console.debug("selectPlayedCell", [i, j], event)
    if (countNeighborMines([i, j]) == countNeighborFlags([i, j])) {
      batch(() => updateCells(playNeighborCells([i, j])))
    }
  }

  // to prevent recursion, do NOT call back to playCell
  // use iteration to expand search area
  //  edgefinding?  then how to fill-in --expanding squares!
  // 1) start searching with up to eight of starting cell's neighbors
  // 1a) next search-square radius is 2
  // 2) if not flagged and not played, add to played result set
  // 3) if has zero neighbor mines, add up to five of its neighbors
  // outside the prior search to the next round of search
  // 4) continue if search not empty
  function playNeighborCells(start: GridCoord): GridCoordSet | undefined {
    const changedCells = new GridCoordSet(),
      search = [getNeighbors(start)]

    let radius = 1
    do {
      const nextSearch = new GridCoordSet() // add cells in next search radius to this set
      for (const cell of search.shift()!) {
        if (!isFlagged(cell) && !isPlayed(cell)) {
          if (mines.has(cell)) {
            alert("You Lose")
            setGameOver(true)
            return
          }

          changedCells.add(cell)

          if (!countNeighborMines(cell)) {
            getNeighbors(cell)
              .filter(
                ([i, j]) =>
                  Math.abs(i - start[0]) > radius &&
                  Math.abs(j - start[1]) > radius
              )
              .forEach((cell) => nextSearch.add(cell))
          }
        }
      }

      ++radius, search.push(Array.from(nextSearch.values()))
    } while (search[0].length)

    return changedCells
  }

  /* // show the played cells
  createEffect(() =>
    console.log(
      "played cells",
      playedCells()
        .map((row, i) =>
          row
            .map((cell, j) => cell && j)
            .filter(Boolean)
            .map((j) => [i, j])
        )
        .filter((row) => row.length)
    )
  ) */

  props.setFlags?.(mines.size)

  return (
    <div class={styles.GameGrid} ref={gridRef!}>
      {Array(props.y).fill(null).map((_, i) => (
          <div class={styles.GameRow}>
            {Array(props.x).fill(null).map((_, j) => (
                <Show
                  when={playedCells()[i][j] || gameOver()}
                  fallback={
                    <div
                      onMouseDown={[selectCell, [i, j]]}
                      class={`${styles.GameCell} ${styles.GameCellHidden}`}
                    >
                      " "
                    </div>
                  }
                >
                  <div
                    onDblClick={[selectPlayedCell, [i, j]]}
                    class={`${styles.GameCell} ${
                      styles[`${countNeighborMines([i, j])}_neighbors`]
                    }`}
                    classList={{
                      ...(gameOver() && { [styles.mine]: mines.has([i, j]) }),
                    }}
                  >
                    {countNeighborMines([i, j]) || " "}
                  </div>
                </Show>
              ))}
          </div>
        ))}
    </div>
  )
}

// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { nanoid } from "nanoid";

import { COLORS } from "./Config";

export const randomColor = () => {
  return COLORS[Math.floor(Math.random() * 5)];
};

export interface Index {
  i: number;
  j: number;
}

export class Cell {
  key = "cell=" + nanoid(8);
  type = "cell" as const;
  position = { i: 0, j: 0 };
  tile?: Tile;
  constructor(i: number, j: number) {
    this.position.i = i;
    this.position.j = j;
  }
}

export class Tile {
  key = "tile=" + nanoid(8);
  type = "tile" as const;
  position = { i: 0, j: 0 };
  color?: string;
  cell: Cell;
  _search: any;
  animateExit: boolean;
  constructor(index: Index, color?: any) {
    this.position.i = index.i;
    this.position.j = index.j;
    this.color = color;
  }
}

export class Board {
  tiles: Tile[] = [];
  cells: Cell[] = [];
  cellMap: Record<string, Cell> = {};
}

export const createBoard = (width: number, height: number) => {
  const board = new Board();
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const cell = new Cell(i, j);
      addCell(board, cell);
    }
  }
  return board;
};

export const clearTiles = (board: Board) => {
  for (let t = board.tiles.length - 1; t >= 0; t--) {
    removeTile(board, board.tiles[t]);
  }
};

export const slideBoard = (board: Board, direction: Index) => {
  let collapsed = false;
  let moved = true;
  while (moved) {
    moved = false;
    for (let b = 0; b < board.tiles.length; b++) {
      const tile = board.tiles[b];
      moved = moveTile(board, tile, direction) || moved;
    }
    collapsed = moved || collapsed;
  }
  return collapsed;
};

export const collectBoard = (board: Board) => {
  const collected: Tile[] = [];
  const matched: Tile[] = [];
  const searchid = +new Date();
  collected.length = 0;
  for (let t = 0; t < board.tiles.length; t++) {
    matched.length = 0;
    matchTile(board, board.tiles[t], searchid, matched);
    if (matched.length > 2) {
      collected.push(...matched);
    }
  }
  return collected;
};

export const matchBoard = (board: Board, animate: boolean) => {
  const collected = collectBoard(board);
  let nRemoved = 0;
  for (let c = 0; c < collected.length; c++) {
    const tile = collected[c];
    tile.animateExit = animate;
    if (removeTile(board, tile)) {
      nRemoved++;
    }
  }
  return nRemoved;
};

export const getColor = (board: Board, i: number, j: number) => {
  const tile = getTile(board, i, j);
  return tile ? tile.color : undefined;
};

export const getTile = (board: Board, i: number, j: number): Tile | undefined => {
  const cell = getCell(board, i, j);
  return cell ? cell.tile : undefined;
};

export const getCell = (board: Board, i: number, j: number) => {
  const key = i + ":" + j;
  const cell = board.cellMap[key];
  return cell;
};

export const addCell = (board: Board, cell: Cell) => {
  const key = cell.position.i + ":" + cell.position.j;
  if (board.cellMap[key]) return false;
  board.cellMap[key] = cell;
  board.cells.push(cell);
  return true;
};

export const randomEmptyCell = (board: Board) => {
  const empty: Cell[] = [];
  for (let c = board.cells.length - 1; c >= 0; c--) {
    const cell = board.cells[c];
    !cell.tile && empty.push(cell);
  }
  if (!empty.length) {
    return null;
  }
  return empty[(Math.random() * empty.length) | 0];
};

export const insertTile = (board: Board, tile: Tile) => {
  const cell = getCell(board, tile.position.i, tile.position.j);
  if (!cell) {
    return false;
  }
  placeTile(board, tile, cell);
  board.tiles.push(tile);
  return true;
};

export const moveTile = (board: Board, tile: Tile, d: Index) => {
  const cell = getCell(board, tile.position.i + d.i, tile.position.j + d.j);
  if (!cell || cell.tile) {
    return false;
  }
  placeTile(board, tile, cell);
  return true;
};

export const placeTile = (board: Board, tile: Tile, cell: Cell) => {
  if (tile.cell) {
    tile.cell.tile = null;
    tile.cell = null;
  }
  cell.tile = tile;
  tile.cell = cell;
  tile.position.i = cell.position.i;
  tile.position.j = cell.position.j;
};

export const removeTile = (board: Board, tile: Tile) => {
  const cell = tile.cell;
  if (!cell) return false;
  cell.tile = null;
  tile.cell = null;
  const i = board.tiles.indexOf(tile);
  if (i >= 0) {
    board.tiles.splice(i, 1);
    return true;
  }
  return false;
};

export const matchTile = (board: Board, tile: Tile | undefined, id: string | number, list: Tile[], color?: string) => {
  if (!tile) {
    return false;
  }
  if (tile._search == id) {
    return false;
  }
  if (typeof color === "undefined") {
    color = tile.color;
  } else if (color !== tile.color) {
    return false;
  }
  tile._search = id;
  list.push(tile);

  matchTile(board, getTile(board, tile.position.i, tile.position.j - 1), id, list, color);
  matchTile(board, getTile(board, tile.position.i, tile.position.j + 1), id, list, color);
  matchTile(board, getTile(board, tile.position.i - 1, tile.position.j), id, list, color);
  matchTile(board, getTile(board, tile.position.i + 1, tile.position.j), id, list, color);
};

export const isGameover = (board: Board) => {
  return board.cells.length <= board.tiles.length;
};

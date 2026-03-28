// Pixel Office — Office layout definition
// Defines rooms, furniture placement, and walkability

import {
  FurnitureType,
  type OfficeLayout,
  type OfficeRoom,
  type Furniture,
} from "./types";

// ─── Room definitions ──────────────────────────────────────
const ROOMS: OfficeRoom[] = [
  {
    id: "engineering",
    name: "Engineering",
    label: "ENGINEERING",
    color: "#2a2845",
    labelColor: "#8888cc",
    x: 1,
    y: 1,
    width: 8,
    height: 6,
  },
  {
    id: "product",
    name: "Product",
    label: "PRODUCT",
    color: "#2d2540",
    labelColor: "#aa88cc",
    x: 11,
    y: 1,
    width: 8,
    height: 6,
  },
  {
    id: "operations",
    name: "Operations",
    label: "OPERATIONS",
    color: "#252840",
    labelColor: "#88aacc",
    x: 1,
    y: 9,
    width: 8,
    height: 5,
  },
  {
    id: "research",
    name: "Research",
    label: "RESEARCH",
    color: "#282545",
    labelColor: "#aa88aa",
    x: 11,
    y: 9,
    width: 5,
    height: 5,
  },
  {
    id: "lounge",
    name: "Lounge",
    label: "LOUNGE",
    color: "#2a2040",
    labelColor: "#cc88aa",
    x: 17,
    y: 9,
    width: 3,
    height: 5,
  },
];

// ─── Furniture placement ──────────────────────────────────
const FURNITURE: Furniture[] = [
  // Engineering — 2 rows of desks with PCs
  { type: FurnitureType.DESK, x: 2, y: 2, facing: "down" },
  { type: FurnitureType.PC, x: 2, y: 2, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 2, y: 3, facing: "up" },
  { type: FurnitureType.DESK, x: 4, y: 2, facing: "down" },
  { type: FurnitureType.PC, x: 4, y: 2, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 4, y: 3, facing: "up" },
  { type: FurnitureType.DESK, x: 6, y: 2, facing: "down" },
  { type: FurnitureType.PC, x: 6, y: 2, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 6, y: 3, facing: "up" },

  { type: FurnitureType.DESK, x: 2, y: 5, facing: "down" },
  { type: FurnitureType.PC, x: 2, y: 5, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 2, y: 6, facing: "up" },
  { type: FurnitureType.DESK, x: 4, y: 5, facing: "down" },
  { type: FurnitureType.PC, x: 4, y: 5, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 4, y: 5, facing: "up" },
  { type: FurnitureType.DESK, x: 6, y: 5, facing: "down" },
  { type: FurnitureType.PC, x: 6, y: 5, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 6, y: 6, facing: "up" },

  { type: FurnitureType.WHITEBOARD, x: 8, y: 1, facing: "left" },
  { type: FurnitureType.PLANT, x: 1, y: 1, facing: "down" },

  // Product — 2 rows of desks
  { type: FurnitureType.DESK, x: 12, y: 2, facing: "down" },
  { type: FurnitureType.PC, x: 12, y: 2, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 12, y: 3, facing: "up" },
  { type: FurnitureType.DESK, x: 14, y: 2, facing: "down" },
  { type: FurnitureType.PC, x: 14, y: 2, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 14, y: 3, facing: "up" },
  { type: FurnitureType.DESK, x: 16, y: 2, facing: "down" },
  { type: FurnitureType.PC, x: 16, y: 2, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 16, y: 3, facing: "up" },

  { type: FurnitureType.DESK, x: 12, y: 5, facing: "down" },
  { type: FurnitureType.PC, x: 12, y: 5, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 12, y: 6, facing: "up" },
  { type: FurnitureType.DESK, x: 14, y: 5, facing: "down" },
  { type: FurnitureType.PC, x: 14, y: 5, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 14, y: 6, facing: "up" },

  { type: FurnitureType.BOOKSHELF, x: 18, y: 1, facing: "left" },
  { type: FurnitureType.PLANT, x: 11, y: 1, facing: "down" },

  // Operations — desks
  { type: FurnitureType.DESK, x: 2, y: 10, facing: "down" },
  { type: FurnitureType.PC, x: 2, y: 10, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 2, y: 11, facing: "up" },
  { type: FurnitureType.DESK, x: 4, y: 10, facing: "down" },
  { type: FurnitureType.PC, x: 4, y: 10, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 4, y: 11, facing: "up" },
  { type: FurnitureType.DESK, x: 6, y: 10, facing: "down" },
  { type: FurnitureType.PC, x: 6, y: 10, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 6, y: 11, facing: "up" },

  { type: FurnitureType.CABINET, x: 8, y: 9, facing: "left" },
  { type: FurnitureType.PLANT, x: 1, y: 13, facing: "down" },

  // Research — desks
  { type: FurnitureType.DESK, x: 12, y: 10, facing: "down" },
  { type: FurnitureType.PC, x: 12, y: 10, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 12, y: 11, facing: "up" },
  { type: FurnitureType.DESK, x: 14, y: 10, facing: "down" },
  { type: FurnitureType.PC, x: 14, y: 10, facing: "down", state: "off" },
  { type: FurnitureType.CHAIR, x: 14, y: 11, facing: "up" },

  { type: FurnitureType.BOOKSHELF, x: 11, y: 13, facing: "up" },
  { type: FurnitureType.WHITEBOARD, x: 15, y: 9, facing: "down" },

  // Lounge
  { type: FurnitureType.SOFA, x: 17, y: 10, facing: "down" },
  { type: FurnitureType.TABLE_ROUND, x: 18, y: 12, facing: "down" },
  { type: FurnitureType.PLANT_LARGE, x: 19, y: 9, facing: "down" },
  { type: FurnitureType.COFFEE, x: 18, y: 12, facing: "down" },
];

// ─── Seat assignments (chair positions for agents) ────────
export interface Seat {
  gridX: number;
  gridY: number;
  facing: "up" | "down" | "left" | "right";
  room: string;
  deskX: number;
  deskY: number;
}

export const SEATS: Seat[] = [
  // Engineering seats (at chairs, facing desk)
  { gridX: 2, gridY: 3, facing: "up", room: "engineering", deskX: 2, deskY: 2 },
  { gridX: 4, gridY: 3, facing: "up", room: "engineering", deskX: 4, deskY: 2 },
  { gridX: 6, gridY: 3, facing: "up", room: "engineering", deskX: 6, deskY: 2 },
  { gridX: 2, gridY: 6, facing: "up", room: "engineering", deskX: 2, deskY: 5 },
  { gridX: 4, gridY: 6, facing: "up", room: "engineering", deskX: 4, deskY: 5 },
  { gridX: 6, gridY: 6, facing: "up", room: "engineering", deskX: 6, deskY: 5 },
  // Product seats
  { gridX: 12, gridY: 3, facing: "up", room: "product", deskX: 12, deskY: 2 },
  { gridX: 14, gridY: 3, facing: "up", room: "product", deskX: 14, deskY: 2 },
  { gridX: 16, gridY: 3, facing: "up", room: "product", deskX: 16, deskY: 2 },
  { gridX: 12, gridY: 6, facing: "up", room: "product", deskX: 12, deskY: 5 },
  { gridX: 14, gridY: 6, facing: "up", room: "product", deskX: 14, deskY: 5 },
  // Operations seats
  {
    gridX: 2,
    gridY: 11,
    facing: "up",
    room: "operations",
    deskX: 2,
    deskY: 10,
  },
  {
    gridX: 4,
    gridY: 11,
    facing: "up",
    room: "operations",
    deskX: 4,
    deskY: 10,
  },
  {
    gridX: 6,
    gridY: 11,
    facing: "up",
    room: "operations",
    deskX: 6,
    deskY: 10,
  },
  // Research seats
  {
    gridX: 12,
    gridY: 11,
    facing: "up",
    room: "research",
    deskX: 12,
    deskY: 10,
  },
  {
    gridX: 14,
    gridY: 11,
    facing: "up",
    room: "research",
    deskX: 14,
    deskY: 10,
  },
  // Lounge seats (sofa)
  { gridX: 17, gridY: 11, facing: "up", room: "lounge", deskX: 17, deskY: 10 },
  { gridX: 18, gridY: 11, facing: "up", room: "lounge", deskX: 18, deskY: 10 },
];

// ─── Build layout ──────────────────────────────────────────

const COLS = 21;
const ROWS = 15;
const TILE_SIZE = 16; // pixels per tile (before zoom)

export function createDefaultLayout(): OfficeLayout {
  // Initialize walkable grid
  const walkable: boolean[][] = [];
  for (let y = 0; y < ROWS; y++) {
    walkable[y] = [];
    for (let x = 0; x < COLS; x++) {
      walkable[y][x] = false;
    }
  }

  // Mark room floors as walkable
  for (const room of ROOMS) {
    for (let dy = 0; dy < room.height; dy++) {
      for (let dx = 0; dx < room.width; dx++) {
        const gx = room.x + dx;
        const gy = room.y + dy;
        if (gx < COLS && gy < ROWS) {
          walkable[gy][gx] = true;
        }
      }
    }
  }

  // Corridors (horizontal between rows, vertical between columns)
  // Horizontal corridor at y=7,8
  for (let x = 0; x < COLS; x++) {
    if (x < COLS) {
      walkable[7][x] = true;
      walkable[8][x] = true;
    }
  }
  // Vertical corridor at x=9,10
  for (let y = 0; y < ROWS; y++) {
    walkable[y][9] = true;
    walkable[y][10] = true;
  }

  // Mark desk/furniture tiles as non-walkable
  for (const f of FURNITURE) {
    if (
      f.type === FurnitureType.DESK ||
      f.type === FurnitureType.BOOKSHELF ||
      f.type === FurnitureType.CABINET ||
      f.type === FurnitureType.WHITEBOARD
    ) {
      if (f.y < ROWS && f.x < COLS) {
        walkable[f.y][f.x] = false;
      }
    }
  }

  return {
    cols: COLS,
    rows: ROWS,
    tileSize: TILE_SIZE,
    rooms: ROOMS,
    furniture: FURNITURE,
    walkable,
  };
}

// ─── BFS Pathfinding ──────────────────────────────────────

export function findPath(
  walkable: boolean[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  cols: number,
  rows: number,
): [number, number][] {
  if (startX === endX && startY === endY) return [];
  if (!walkable[endY]?.[endX]) return [];

  const visited = new Set<string>();
  const queue: { x: number; y: number; path: [number, number][] }[] = [
    { x: startX, y: startY, path: [] },
  ];
  visited.add(`${startX},${startY}`);

  const dirs: [number, number][] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;

    for (const [dx, dy] of dirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      const key = `${nx},${ny}`;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (visited.has(key)) continue;
      if (!walkable[ny][nx]) continue;

      const newPath: [number, number][] = [...curr.path, [nx, ny]];
      if (nx === endX && ny === endY) return newPath;

      visited.add(key);
      queue.push({ x: nx, y: ny, path: newPath });
    }
  }

  return []; // no path found
}

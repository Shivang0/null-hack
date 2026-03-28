// Pixel Office — Canvas 2D renderer
// Draws the complete office: floor, walls, rooms, furniture, characters

import type {
  OfficeLayout,
  Camera,
  OfficeCharacter,
  TimeOfDay,
  ZDrawable,
  Furniture,
} from "./types";
import { CharacterState, FurnitureType } from "./types";
import {
  getCharFrames,
  resolveColor,
  agentPalette,
  checkerFloor,
  renderSpriteToCanvas,
  DESK_SPRITE,
  PC_ON_SPRITE,
  PC_OFF_SPRITE,
  CHAIR_SPRITE,
  PLANT_SPRITE,
  BOOKSHELF_SPRITE,
  SOFA_SPRITE,
  WHITEBOARD_SPRITE,
} from "./sprites";

// ─── Time-of-day color schemes ────────────────────────────
const TIME_COLORS: Record<
  TimeOfDay,
  {
    ambient: string;
    overlay: string;
    overlayAlpha: number;
    wallColor: string;
    voidColor: string;
  }
> = {
  dawn: {
    ambient: "#e8c8a0",
    overlay: "#ff8844",
    overlayAlpha: 0.06,
    wallColor: "#3a3658",
    voidColor: "#c8b890",
  },
  day: {
    ambient: "#f0e8d0",
    overlay: "#ffffff",
    overlayAlpha: 0.0,
    wallColor: "#3a3a5c",
    voidColor: "#d4c8a0",
  },
  dusk: {
    ambient: "#c0a080",
    overlay: "#cc6644",
    overlayAlpha: 0.08,
    wallColor: "#352848",
    voidColor: "#8a6840",
  },
  night: {
    ambient: "#181828",
    overlay: "#0808ff",
    overlayAlpha: 0.12,
    wallColor: "#1a1a30",
    voidColor: "#0a0a18",
  },
};

// ─── Sprite lookup for furniture ──────────────────────────
function getFurnitureSprite(
  f: Furniture,
  activeDesks: Set<string>,
): string[][] | null {
  const key = `${f.x},${f.y}`;
  switch (f.type) {
    case FurnitureType.DESK:
      return DESK_SPRITE;
    case FurnitureType.PC:
      return activeDesks.has(key) ? PC_ON_SPRITE : PC_OFF_SPRITE;
    case FurnitureType.CHAIR:
      return CHAIR_SPRITE;
    case FurnitureType.PLANT:
    case FurnitureType.PLANT_LARGE:
      return PLANT_SPRITE;
    case FurnitureType.BOOKSHELF:
    case FurnitureType.CABINET:
      return BOOKSHELF_SPRITE;
    case FurnitureType.SOFA:
      return SOFA_SPRITE;
    case FurnitureType.WHITEBOARD:
      return WHITEBOARD_SPRITE;
    default:
      return null;
  }
}

// ─── Main render function ─────────────────────────────────

export function renderOffice(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  layout: OfficeLayout,
  camera: Camera,
  characters: OfficeCharacter[],
  timeOfDay: TimeOfDay,
  selectedCharId: string | null,
  hoveredCharId: string | null,
  now: number,
): void {
  const { cols, rows, tileSize, rooms, furniture } = layout;
  const { zoom } = camera;
  const ts = tileSize * zoom; // scaled tile size

  ctx.imageSmoothingEnabled = false;
  const tc = TIME_COLORS[timeOfDay];

  // Clear
  ctx.fillStyle = tc.voidColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw checkered void pattern
  const voidTileSize = 16 * zoom;
  for (let vy = 0; vy < canvasHeight; vy += voidTileSize) {
    for (let vx = 0; vx < canvasWidth; vx += voidTileSize) {
      const isAlt =
        (Math.floor(vx / voidTileSize) + Math.floor(vy / voidTileSize)) % 2 ===
        0;
      if (isAlt) {
        ctx.fillStyle = adjustBrightness(tc.voidColor, 0.95);
        ctx.fillRect(vx, vy, voidTileSize, voidTileSize);
      }
    }
  }

  // Camera transform
  ctx.save();
  ctx.translate(
    -camera.x * zoom + canvasWidth / 2,
    -camera.y * zoom + canvasHeight / 2,
  );

  // ─── Draw rooms ─────────────────────────────────────────
  for (const room of rooms) {
    const rx = room.x * ts;
    const ry = room.y * ts;
    const rw = room.width * ts;
    const rh = room.height * ts;

    // Floor
    const floorTile = checkerFloor(
      room.color,
      adjustBrightness(room.color, 1.08),
    );
    const floorCanvas = renderSpriteToCanvas(
      floorTile,
      zoom,
      `floor_${room.id}`,
    );

    // Tile the floor
    for (let ty = 0; ty < room.height; ty++) {
      for (let tx = 0; tx < room.width; tx++) {
        ctx.drawImage(floorCanvas, rx + tx * ts, ry + ty * ts);
      }
    }

    // Room border (walls)
    ctx.strokeStyle = tc.wallColor;
    ctx.lineWidth = Math.max(2, 3 * zoom);
    ctx.strokeRect(rx - 1, ry - 1, rw + 2, rh + 2);

    // Room label
    const fontSize = Math.max(8, 10 * zoom);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = room.labelColor;
    ctx.globalAlpha = 0.7;
    ctx.fillText(room.label, rx + 4 * zoom, ry + fontSize + 2 * zoom);
    ctx.globalAlpha = 1.0;
  }

  // ─── Draw corridors ─────────────────────────────────────
  const corridorColor = adjustBrightness(tc.wallColor, 0.6);
  const corridorAlt = adjustBrightness(tc.wallColor, 0.55);

  // Horizontal corridor (y = 7, 8)
  for (let x = 0; x < cols; x++) {
    for (let cy = 7; cy <= 8; cy++) {
      const isAlt = (x + cy) % 2 === 0;
      ctx.fillStyle = isAlt ? corridorColor : corridorAlt;
      ctx.fillRect(x * ts, cy * ts, ts, ts);
    }
  }
  // Vertical corridor (x = 9, 10)
  for (let y = 0; y < rows; y++) {
    for (let cx = 9; cx <= 10; cx++) {
      if (y === 7 || y === 8) continue; // already drawn
      const isAlt = (cx + y) % 2 === 0;
      ctx.fillStyle = isAlt ? corridorColor : corridorAlt;
      ctx.fillRect(cx * ts, y * ts, ts, ts);
    }
  }

  // ─── Collect z-sorted drawables ─────────────────────────
  const drawables: ZDrawable[] = [];

  // Determine which desks have active agents
  const activeDesks = new Set<string>();
  for (const char of characters) {
    if (char.state === CharacterState.TYPE) {
      activeDesks.add(`${char.seatX},${Math.max(0, char.seatY - 1)}`);
    }
  }

  // Add furniture to drawables
  for (const f of furniture) {
    const sprite = getFurnitureSprite(f, activeDesks);
    if (!sprite) continue;

    const spriteCanvas = renderSpriteToCanvas(
      sprite,
      zoom,
      `furn_${f.type}_${f.x}_${f.y}_${activeDesks.has(`${f.x},${f.y}`)}`,
    );
    const fx = f.x * ts;
    const fy = f.y * ts;
    const bottomY = fy + spriteCanvas.height;

    drawables.push({
      zY: bottomY,
      draw: (c: CanvasRenderingContext2D) => {
        // Center sprite on tile
        const offX = (ts - spriteCanvas.width) / 2;
        const offY = ts - spriteCanvas.height;
        c.drawImage(spriteCanvas, fx + offX, fy + offY);
      },
    });
  }

  // Add characters to drawables
  for (const char of characters) {
    const palette = agentPalette(djb2(char.id));
    const frames = getCharFrames(char.facing, char.state);
    const frameIndex = Math.floor(char.animFrame) % frames.length;
    const frame = frames[frameIndex];

    // Resolve sprite colors
    const coloredSprite: string[][] = frame.map((row) =>
      row.map((key) => resolveColor(key, palette) ?? ""),
    );

    const spriteCanvas = renderSpriteToCanvas(
      coloredSprite,
      zoom,
      `char_${char.id}_${char.facing}_${char.state}_${frameIndex}`,
    );

    // Interpolated position
    let px: number, py: number;
    if (char.moveProgress < 1 && char.moveProgress > 0) {
      const prevX = char.gridX;
      const prevY = char.gridY;
      px =
        ((1 - char.moveProgress) * prevX + char.moveProgress * char.targetX) *
        ts;
      py =
        ((1 - char.moveProgress) * prevY + char.moveProgress * char.targetY) *
        ts;
    } else {
      px = char.gridX * ts;
      py = char.gridY * ts;
    }

    const charBottomY = py + spriteCanvas.height;
    const isSelected = selectedCharId === char.id;
    const isHovered = hoveredCharId === char.id;

    drawables.push({
      zY: charBottomY + 0.5, // characters render slightly in front of same-row furniture
      draw: (c: CanvasRenderingContext2D) => {
        const offX = (ts - spriteCanvas.width) / 2;
        const offY = ts - spriteCanvas.height;

        // Selection/hover glow
        if (isSelected || isHovered) {
          c.save();
          c.shadowColor = isSelected ? "#6366f1" : "#ffffff";
          c.shadowBlur = 8 * zoom;
          c.drawImage(spriteCanvas, px + offX, py + offY);
          c.restore();
        }

        c.drawImage(spriteCanvas, px + offX, py + offY);

        // Status dot
        const dotX = px + offX + spriteCanvas.width - 2 * zoom;
        const dotY = py + offY;
        c.fillStyle = char.statusColor;
        c.beginPath();
        c.arc(dotX, dotY, 2.5 * zoom, 0, Math.PI * 2);
        c.fill();

        // Pulse ring for active agents
        if (
          char.state === CharacterState.TYPE ||
          char.state === CharacterState.WALK
        ) {
          const pulseRadius = 3 * zoom + Math.sin(now * 0.004) * 1.5 * zoom;
          c.strokeStyle = char.statusColor;
          c.lineWidth = zoom;
          c.globalAlpha = 0.5 + Math.sin(now * 0.004) * 0.3;
          c.beginPath();
          c.arc(dotX, dotY, pulseRadius, 0, Math.PI * 2);
          c.stroke();
          c.globalAlpha = 1.0;
        }

        // Name label
        const labelFontSize = Math.max(7, 8 * zoom);
        c.font = `${labelFontSize}px monospace`;
        c.textAlign = "center";

        // Label background
        const labelText =
          char.name.length > 12 ? char.name.slice(0, 12) + ".." : char.name;
        const labelWidth = c.measureText(labelText).width + 6 * zoom;
        const labelX = px + ts / 2;
        const labelY = py + offY - 4 * zoom;

        c.fillStyle = "rgba(10, 10, 20, 0.75)";
        c.beginPath();
        c.roundRect(
          labelX - labelWidth / 2,
          labelY - labelFontSize,
          labelWidth,
          labelFontSize + 3 * zoom,
          2 * zoom,
        );
        c.fill();

        c.fillStyle = isSelected ? "#a5b4fc" : "#ccccdd";
        c.fillText(labelText, labelX, labelY - 1 * zoom);
        c.textAlign = "left";

        // Speech bubble for current task
        if (
          char.currentTask &&
          (char.state === CharacterState.TYPE || char.bubbleTimer > 0)
        ) {
          drawSpeechBubble(
            c,
            px + ts / 2,
            py + offY - 16 * zoom,
            char.currentTask.slice(0, 30),
            zoom,
          );
        }

        // ZZZ for sleeping agents
        if (char.state === CharacterState.SLEEP) {
          const zFontSize = Math.max(6, 7 * zoom);
          c.font = `bold ${zFontSize}px monospace`;
          c.fillStyle = "#8888cc";
          const zOff = Math.sin(now * 0.002) * 3 * zoom;
          c.globalAlpha = 0.6 + Math.sin(now * 0.003) * 0.3;
          c.fillText("z", px + ts - 2 * zoom, py + offY - 2 * zoom + zOff);
          c.fillText(
            "Z",
            px + ts + 2 * zoom,
            py + offY - 8 * zoom + zOff * 0.7,
          );
          c.fillText(
            "Z",
            px + ts + 5 * zoom,
            py + offY - 14 * zoom + zOff * 0.4,
          );
          c.globalAlpha = 1.0;
        }
      },
    });
  }

  // Sort by zY and draw
  drawables.sort((a, b) => a.zY - b.zY);
  for (const d of drawables) {
    d.draw(ctx);
  }

  // ─── Time-of-day overlay ────────────────────────────────
  if (tc.overlayAlpha > 0) {
    ctx.fillStyle = tc.overlay;
    ctx.globalAlpha = tc.overlayAlpha;
    ctx.fillRect(0, 0, cols * ts, rows * ts);
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}

// ─── Minimap renderer ─────────────────────────────────────

export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  layout: OfficeLayout,
  characters: OfficeCharacter[],
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  minimapWidth: number,
  minimapHeight: number,
): void {
  const { cols, rows, rooms } = layout;
  const scale = Math.min(minimapWidth / cols, minimapHeight / rows);

  // Background
  ctx.fillStyle = "rgba(10, 10, 20, 0.85)";
  ctx.fillRect(0, 0, minimapWidth, minimapHeight);

  // Rooms
  for (const room of rooms) {
    ctx.fillStyle = room.color;
    ctx.fillRect(
      room.x * scale,
      room.y * scale,
      room.width * scale,
      room.height * scale,
    );
    ctx.strokeStyle = "#3a3a5c";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      room.x * scale,
      room.y * scale,
      room.width * scale,
      room.height * scale,
    );
  }

  // Characters as dots
  for (const char of characters) {
    ctx.fillStyle = char.statusColor;
    ctx.beginPath();
    ctx.arc(
      (char.gridX + 0.5) * scale,
      (char.gridY + 0.5) * scale,
      Math.max(2, scale * 0.4),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Camera viewport indicator
  const ts = layout.tileSize * camera.zoom;
  const vpX = (camera.x - canvasWidth / (2 * camera.zoom)) / layout.tileSize;
  const vpY = (camera.y - canvasHeight / (2 * camera.zoom)) / layout.tileSize;
  const vpW = canvasWidth / ts;
  const vpH = canvasHeight / ts;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.strokeRect(vpX * scale, vpY * scale, vpW * scale, vpH * scale);
  ctx.globalAlpha = 1.0;

  // Border
  ctx.strokeStyle = "#3a3a5c";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, minimapWidth, minimapHeight);
}

// ─── Helper functions ─────────────────────────────────────

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  zoom: number,
): void {
  const fontSize = Math.max(6, 7 * zoom);
  ctx.font = `${fontSize}px monospace`;
  const textWidth = ctx.measureText(text).width;
  const padX = 4 * zoom;
  const padY = 3 * zoom;
  const bubbleW = textWidth + padX * 2;
  const bubbleH = fontSize + padY * 2;
  const bubbleX = x - bubbleW / 2;
  const bubbleY = y - bubbleH;

  // Bubble background
  ctx.fillStyle = "rgba(15, 15, 30, 0.9)";
  ctx.beginPath();
  ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 3 * zoom);
  ctx.fill();

  // Bubble border
  ctx.strokeStyle = "#4a4270";
  ctx.lineWidth = zoom;
  ctx.beginPath();
  ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 3 * zoom);
  ctx.stroke();

  // Tail
  ctx.fillStyle = "rgba(15, 15, 30, 0.9)";
  ctx.beginPath();
  ctx.moveTo(x - 3 * zoom, bubbleY + bubbleH);
  ctx.lineTo(x, bubbleY + bubbleH + 4 * zoom);
  ctx.lineTo(x + 3 * zoom, bubbleY + bubbleH);
  ctx.fill();

  // Text
  ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
  ctx.textAlign = "center";
  ctx.fillText(text, x, bubbleY + fontSize + padY - 1);
  ctx.textAlign = "left";
}

function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r * factor));
  const ng = Math.min(255, Math.round(g * factor));
  const nb = Math.min(255, Math.round(b * factor));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// ─── Hit testing ──────────────────────────────────────────

/** Check if a canvas point hits a character */
export function hitTestCharacter(
  canvasX: number,
  canvasY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  characters: OfficeCharacter[],
  tileSize: number,
): OfficeCharacter | null {
  const { zoom } = camera;

  // Convert canvas coords to world coords
  const worldX = (canvasX - canvasWidth / 2) / zoom + camera.x;
  const worldY = (canvasY - canvasHeight / 2) / zoom + camera.y;

  // Check each character (reverse order = topmost first)
  for (let i = characters.length - 1; i >= 0; i--) {
    const char = characters[i];
    const cx = char.gridX * tileSize;
    const cy = char.gridY * tileSize;
    const charW = tileSize;
    const charH = tileSize * 1.5; // characters are taller than a tile

    if (
      worldX >= cx &&
      worldX <= cx + charW &&
      worldY >= cy - charH * 0.3 &&
      worldY <= cy + charH
    ) {
      return char;
    }
  }

  return null;
}

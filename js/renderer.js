/**
 * Game renderer
 */
class GameRenderer {
  constructor(canvas, tileSize = 32) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tileSize = tileSize;
    this.level = null;
  }

  setLevel(level) {
    this.level = level;

    // Resize canvas to fit level
    this.canvas.width = level.gridW * this.tileSize;
    this.canvas.height = level.gridH * this.tileSize;

    this.render();
  }

  render() {
    if (!this.level) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw tiles
    for (let y = 0; y < this.level.gridH; y++) {
      for (let x = 0; x < this.level.gridW; x++) {
        const tile = this.level.grid[y][x];
        const tx = x * this.tileSize;
        const ty = y * this.tileSize;

        if (tile.wall) {
          this.ctx.fillStyle = "#666";
          this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
        } else if (tile.hole) {
          this.ctx.fillStyle = "#000";
          this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
        } else {
          this.ctx.fillStyle = "#aaa";
          this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
        }

        // Draw grid lines
        this.ctx.strokeStyle = "#444";
        this.ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);
      }
    }

    // Draw exit
    this.ctx.fillStyle = "#0f0";
    this.ctx.beginPath();
    this.ctx.arc(
      this.level.exit.x * this.tileSize + this.tileSize / 2,
      this.level.exit.y * this.tileSize + this.tileSize / 2,
      this.tileSize / 4,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Draw switches
    for (const s of this.level.switches) {
      this.ctx.fillStyle = "#f00";
      this.ctx.beginPath();
      this.ctx.arc(
        s.x * this.tileSize + this.tileSize / 2,
        s.y * this.tileSize + this.tileSize / 2,
        this.tileSize / 3,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }

    // Draw boulders
    for (const b of this.level.boulders) {
      this.ctx.fillStyle = "#a50";
      this.ctx.beginPath();
      this.ctx.arc(
        b.x * this.tileSize + this.tileSize / 2,
        b.y * this.tileSize + this.tileSize / 2,
        this.tileSize / 2 - 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }

    // Draw player
    this.ctx.fillStyle = "#00f";
    this.ctx.beginPath();
    this.ctx.arc(
      this.level.player.x * this.tileSize + this.tileSize / 2,
      this.level.player.y * this.tileSize + this.tileSize / 2,
      this.tileSize / 3,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }
}

/**
 * Sokoban-style Level Generator
 * A clean JavaScript implementation of the Construct 3 level generator
 */
class LevelGenerator {
  constructor(config = {}) {
    // Grid settings
    this.tileW = config.tileW || 32;
    this.gridW = config.gridW || 10;
    this.gridH = config.gridH || 5;

    // Generation parameters
    this.chanceToKeepForward = config.chanceToKeepForward || 1.7;
    this.chanceToWalkOnFloor = config.chanceToWalkOnFloor || 3.3;
    this.chanceToGoBackwards = config.chanceToGoBackwards || 0.1;
    this.nbSteps = config.nbSteps || 70;
    this.maxNbSwitch = config.maxNbSwitch || 150;
    this.minNbSwitch = config.minNbSwitch || 3;
    this.minPull = config.minPull || 3;
    this.chanceToCreateSwitch = config.chanceToCreateSwitch || 0.7;
    this.chanceToDropBoulder = config.chanceToDropBoulder || 0.5;
    this.minNbFloorTiles = config.minNbFloorTiles || 13;
    this.maxNbFloorTiles = config.maxNbFloorTiles || 33;
    this.chanceToCarveHole = config.chanceToCarveHole || 1;
    this.minSoloBoulders = config.minSoloBoulders || 4;
    this.chanceToSpawnSoloBoulder = config.chanceToSpawnSoloBoulder || 0.3;

    // Track locked parameters that shouldn't be randomized
    this.lockedParams = config.lockedParams || {
      gridW: false,
      gridH: false,
      minPull: false,
      chanceToDropBoulder: false,
      chanceToCarveHole: false,
    };

    // State variables
    this.seed =
      config.seed || Math.floor(Math.random() * 1000000000000000).toString();
    this.random = new Random(this.seed);
    this.isGenerating = false;
    this.doRandom = true;
    this.isPullingBoulder = false;
    this.nbBoulderPulls = 0;

    // Game objects
    this.grid = [];
    this.player = null;
    this.exit = null;
    this.boulders = [];
    this.switches = [];

    // Track generation path for solution playback
    this.generationMoves = [];
    this.isPlayingSolution = false;
    this.reachedExit = false;
  }

  /**
   * Generate a random level
   */
  async generate() {
    this.isGenerating = true;
    let attempts = 0;
    const maxAttempts = 5000;

    if (this.doRandom) {
      this.randomizeParameters();
    }
    this.random = new Random(this.seed);

    while (attempts < maxAttempts) {
      attempts++;

      this.establishGrid();
      this.createExit();
      await this.generatePathways();
      this.clearMalformedSwitches();
      this.generateHoles();

      // Verify the level is valid
      if (this.isLevelValid()) {
        this.isGenerating = false;
        return {
          grid: this.grid,
          player: this.player,
          exit: this.exit,
          boulders: this.boulders,
          switches: this.switches,
          seed: this.seed,
          gridW: this.gridW,
          gridH: this.gridH,
          generationFailed: false,
        };
      }

      // Change seed slightly for next attempt
      this.seed = (parseInt(this.seed) + 1).toString();
      this.random = new Random(this.seed);

      // Every 100 attempts, slightly adjust parameters to increase chances of success
      if (attempts % 100 === 0) {
        //this.adjustParametersForDifficultGeneration();
      }
    }

    // If we get here, generation failed after max attempts
    this.isGenerating = false;
    return {
      generationFailed: true,
      attempts: maxAttempts,
      seed: this.seed,
    };
  }

  /**
   * Adjust parameters to make generation more likely to succeed
   */
  adjustParametersForDifficultGeneration() {
    // Increase minimum floor tiles slightly
    this.minNbFloorTiles = Math.max(this.minNbFloorTiles - 1, 5);

    // Decrease minimum switches requirement
    this.minNbSwitch = Math.max(this.minNbSwitch - 1, 1);

    // Increase chance to create switches
    this.chanceToCreateSwitch = Math.min(
      this.chanceToCreateSwitch + 0.05,
      0.95
    );

    // Adjust pathfinding to create more varied layouts
    this.chanceToWalkOnFloor = Math.min(this.chanceToWalkOnFloor + 0.1, 5.0);
    this.chanceToKeepForward = Math.min(this.chanceToKeepForward + 0.1, 3.0);
  }

  /**
   * Randomize the generation parameters
   */
  randomizeParameters() {
    // Only randomize unlocked parameters
    if (!this.lockedParams.chanceToCarveHole) {
      this.chanceToCarveHole = Math.floor(Math.random() * 0.6 * 100) / 100;
    }

    if (!this.lockedParams.chanceToDropBoulder) {
      this.chanceToDropBoulder =
        Math.floor((Math.random() * 0.5 + 0.2) * 100) / 100;
    }

    if (!this.lockedParams.minPull) {
      this.minPull = Math.floor(Math.random() * 3) + 1;
    }

    if (!this.lockedParams.gridH) {
      this.gridH = Math.floor(Math.random() * 4) + 5;
    }

    if (!this.lockedParams.gridW) {
      this.gridW = Math.floor(Math.random() * 7) + 10;
    }

    // Always generate a new seed
    this.seed = Math.floor(Math.random() * 1000000000000000).toString();
  }

  /**
   * Create the initial grid of walls
   */
  establishGrid() {
    // Reset all game objects
    this.grid = [];
    this.player = null;
    this.exit = null;
    this.boulders = [];
    this.switches = [];

    // Create a grid of wall tiles
    for (let y = 0; y < this.gridH; y++) {
      const row = [];
      for (let x = 0; x < this.gridW; x++) {
        row.push({
          x,
          y,
          wall: true,
          hole: false,
          lockedByGen: false,
          type: "wall",
        });
      }
      this.grid.push(row);
    }

    this.isPullingBoulder = false;
  }

  /**
   * Create the exit and player starting position
   */
  createExit() {
    // Pick a random tile for the exit
    const x = Math.floor(this.random.next() * this.gridW);
    const y = Math.floor(this.random.next() * this.gridH);

    // Create exit and player at the same position
    this.exit = { x, y };
    this.player = {
      x,
      y,
      prevX: x,
      prevY: y,
    };

    // Mark the tile as floor
    this.grid[y][x] = {
      x,
      y,
      wall: false,
      hole: false,
      lockedByGen: true,
      type: "floor",
    };
  }

  /**
   * Generate pathways by walking through the level
   */
  async generatePathways() {
    // Clear previous generation moves
    this.generationMoves = [];

    for (let i = 0; i < this.nbSteps; i++) {
      const didStep = this.doStep();

      if (didStep) {
        // Record the movement direction
        const dx = this.player.x - this.player.prevX;
        const dy = this.player.y - this.player.prevY;
        this.generationMoves.push({ x: dx, y: dy });
      }

      if (this.renderer) {
        this.renderer.setLevel({
          grid: this.grid,
          player: this.player,
          exit: this.exit,
          boulders: this.boulders,
          switches: this.switches,
        });
        this.renderer.render();
      }
    }
  }

  /**
   * Take one step in the level generation process
   */
  doStep() {
    // Get a valid tile to move to
    const tile = this.pickTile();
    if (!tile) return false;

    // Update player position
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.player.x = tile.x;
    this.player.y = tile.y;

    // Mark the tile as floor
    this.grid[tile.y][tile.x] = {
      x: tile.x,
      y: tile.y,
      wall: false,
      hole: false,
      lockedByGen: true,
      type: "floor",
    };

    // Handle boulder pulling
    if (this.isPullingBoulder) {
      const movedFromBoulder = this.getMovedAwayFromBoulder();
      if (movedFromBoulder) {
        // Move the boulder to the player's previous position
        movedFromBoulder.x = this.player.prevX;
        movedFromBoulder.y = this.player.prevY;
        movedFromBoulder.nbPulls++;
        this.nbBoulderPulls++;
      } else {
        this.isPullingBoulder = false;
      }
    } else {
      // Check if we moved away from a boulder
      const movedFromBoulder = this.getMovedAwayFromBoulder();
      if (
        movedFromBoulder &&
        (movedFromBoulder.nbPulls >= this.minPull ||
          this.random.next() < this.chanceToDropBoulder)
      ) {
        this.isPullingBoulder = true;
        this.nbBoulderPulls = 0;
      }

      // Try to create a switch and boulder
      const shouldCreateSwitch = this.random.nextWeighted([
        { value: true, weight: this.chanceToCreateSwitch },
        { value: false, weight: 1 - this.chanceToCreateSwitch },
      ]);

      if (
        shouldCreateSwitch &&
        this.switches.length < this.maxNbSwitch &&
        this.getMovedAwayFromWall()
      ) {
        // Get the direction we moved from
        const dx = this.player.prevX - this.player.x;
        const dy = this.player.prevY - this.player.y;
        const wallX = this.player.prevX + dx;
        const wallY = this.player.prevY + dy;

        // Check if the wall position is valid
        if (
          wallX >= 0 &&
          wallX < this.gridW &&
          wallY >= 0 &&
          wallY < this.gridH &&
          this.grid[wallY][wallX].wall
        ) {
          // Turn the wall into a floor
          this.grid[wallY][wallX] = {
            x: wallX,
            y: wallY,
            wall: false,
            hole: false,
            lockedByGen: true,
            type: "floor",
          };

          // Create a boulder at the player's previous position
          const boulder = {
            x: this.player.prevX,
            y: this.player.prevY,
            nbPulls: 0,
          };

          // Decide whether to create a solo boulder or a switch-boulder pair
          const createSoloBoulder =
            this.random.next() < this.chanceToSpawnSoloBoulder;
          if (!createSoloBoulder) {
            // Create a switch at the wall
            const newSwitch = {
              x: wallX,
              y: wallY,
            };
            this.switches.push(newSwitch);

            // Link the boulder to the switch
            boulder.switchUID = this.switches.length - 1;
          } else {
            // Make it a solo boulder (no linked switch)
            boulder.switchUID = -1;
          }

          this.boulders.push(boulder);
          this.isPullingBoulder = true;
          this.nbBoulderPulls = 0;
        }
      }
    }

    return true;
  }

  /**
   * Pick a valid tile to move to
   */
  pickTile() {
    const tiles = [];
    const weights = [];

    // Count floor tiles
    const floorTiles = this.grid
      .flat()
      .filter((t) => t.type === "floor").length;

    // For each adjacent tile to the player
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        // Skip diagonals and center
        if ((x === 0 && y === 0) || (x !== 0 && y !== 0)) continue;

        const nx = this.player.x + x;
        const ny = this.player.y + y;

        // Skip out of bounds
        if (nx < 0 || nx >= this.gridW || ny < 0 || ny >= this.gridH) continue;

        const tile = this.grid[ny][nx];

        // Skip tiles with boulders
        if (this.boulders.some((b) => b.x === nx && b.y === ny)) continue;

        // Skip the exit
        if (this.exit.x === nx && this.exit.y === ny) continue;

        // Calculate probability for this tile
        let probability = 1;

        // Going back to previous position
        if (nx === this.player.prevX && ny === this.player.prevY) {
          probability *= this.chanceToGoBackwards;
        }

        // Going forward in the same direction
        if (
          nx === this.player.x + (this.player.x - this.player.prevX) &&
          ny === this.player.y + (this.player.y - this.player.prevY)
        ) {
          probability *= this.chanceToKeepForward;
        }

        // Walking on existing floor
        if (tile.type === "floor") {
          probability *= this.chanceToWalkOnFloor;
        }

        // Don't exceed max floor tiles
        if (tile.type !== "floor" && floorTiles >= this.maxNbFloorTiles) {
          probability = 0;
        }

        // Add to options if probability > 0
        if (probability > 0) {
          tiles.push(tile);
          weights.push(probability);
        }
      }
    }

    // Return a weighted random tile
    if (tiles.length === 0) return null;
    return this.random.nextWeightedFromArrays(tiles, weights);
  }

  /**
   * Check if the player moved away from a boulder
   */
  getMovedAwayFromBoulder() {
    const dx = this.player.prevX - this.player.x;
    const dy = this.player.prevY - this.player.y;
    const targetX = this.player.prevX + dx;
    const targetY = this.player.prevY + dy;

    return this.boulders.find((b) => b.x === targetX && b.y === targetY);
  }

  /**
   * Check if the player moved away from a wall
   */
  getMovedAwayFromWall() {
    const dx = this.player.prevX - this.player.x;
    const dy = this.player.prevY - this.player.y;
    const targetX = this.player.prevX + dx;
    const targetY = this.player.prevY + dy;

    if (
      targetX < 0 ||
      targetX >= this.gridW ||
      targetY < 0 ||
      targetY >= this.gridH
    ) {
      return false;
    }

    return this.grid[targetY][targetX].wall;
  }

  /**
   * Remove invalid switch/boulder pairs
   */
  clearMalformedSwitches() {
    for (let i = this.boulders.length - 1; i >= 0; i--) {
      const boulder = this.boulders[i];
      let malformed = false;
      let convertToSoloBoulder = false;

      // Switch and boulder at same position
      if (
        boulder.switchUID >= 0 &&
        this.switches.some((s) => s.x === boulder.x && s.y === boulder.y)
      ) {
        malformed = true;
      }

      // Boulder hasn't been pulled enough
      if (boulder.switchUID >= 0 && boulder.nbPulls < this.minPull) {
        // Instead of removing it, convert to solo boulder
        convertToSoloBoulder = true;
      }

      if (malformed) {
        // Remove the linked switch and boulder
        const switchIndex = boulder.switchUID;
        if (switchIndex >= 0 && switchIndex < this.switches.length) {
          this.switches.splice(switchIndex, 1);
        }
        this.boulders.splice(i, 1);

        // Reindex the remaining boulders' switchUIDs
        for (let j = 0; j < this.boulders.length; j++) {
          if (this.boulders[j].switchUID > switchIndex) {
            this.boulders[j].switchUID--;
          }
        }
      } else if (convertToSoloBoulder) {
        // Remove the switch but keep the boulder
        const switchIndex = boulder.switchUID;
        if (switchIndex >= 0 && switchIndex < this.switches.length) {
          this.switches.splice(switchIndex, 1);
        }

        // Mark this boulder as a solo boulder
        boulder.switchUID = -1;

        // Reindex the remaining boulders' switchUIDs
        for (let j = 0; j < this.boulders.length; j++) {
          if (this.boulders[j].switchUID > switchIndex) {
            this.boulders[j].switchUID--;
          }
        }
      }
    }
  }

  /**
   * Generate holes in the level
   */
  generateHoles() {
    for (let i = 0; i < 10; i++) {
      // The original code does this 10 times
      for (let y = 0; y < this.gridH; y++) {
        for (let x = 0; x < this.gridW; x++) {
          const tile = this.grid[y][x];

          // Skip tiles locked by generation
          if (tile.lockedByGen) continue;

          let top = false,
            bottom = false,
            left = false,
            right = false;

          // Check adjacent tiles
          if (y > 0 && !this.grid[y - 1][x].wall) top = true;
          if (y < this.gridH - 1 && !this.grid[y + 1][x].wall) bottom = true;
          if (x > 0 && !this.grid[y][x - 1].wall) left = true;
          if (x < this.gridW - 1 && !this.grid[y][x + 1].wall) right = true;

          // Can be a hole if there's a path around it
          const canBeHole = (top && bottom) || (left && right);

          if (canBeHole && this.random.next() < this.chanceToCarveHole) {
            this.grid[y][x] = {
              x,
              y,
              wall: false,
              hole: true,
              lockedByGen: false,
              type: "hole",
            };
          }
        }
      }
    }
  }

  /**
   * Check if the generated level is valid
   */
  isLevelValid() {
    // Must have minimum number of switches
    if (this.switches.length < this.minNbSwitch) {
      return false;
    }

    // Must have minimum number of floor tiles
    const floorTiles = this.grid
      .flat()
      .filter((t) => t.type === "floor").length;
    if (floorTiles < this.minNbFloorTiles) {
      return false;
    }

    // Player can't start on a boulder or switch
    if (
      this.boulders.some(
        (b) => b.x === this.player.x && b.y === this.player.y
      ) ||
      this.switches.some((s) => s.x === this.player.x && s.y === this.player.y)
    ) {
      return false;
    }

    // Count solo boulders (boulders with switchUID of -1)
    const soloBoulders = this.boulders.filter((b) => b.switchUID === -1).length;
    if (soloBoulders < this.minSoloBoulders) {
      //return false;
    }

    return true;
  }

  /**
   * Check if the level is complete (all switches covered)
   */
  isLevelComplete() {
    for (const s of this.switches) {
      if (!this.boulders.some((b) => b.x === s.x && b.y === s.y)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Move the player in a direction
   */
  movePlayer(dirX, dirY) {
    const targetX = this.player.x + dirX;
    const targetY = this.player.y + dirY;

    // Check bounds
    if (
      targetX < 0 ||
      targetX >= this.gridW ||
      targetY < 0 ||
      targetY >= this.gridH
    ) {
      return false;
    }

    const targetTile = this.grid[targetY][targetX];

    // Can't move into walls or holes
    if (targetTile.wall || targetTile.hole) {
      return false;
    }

    // Check for boulder in the way
    const boulder = this.boulders.find(
      (b) => b.x === targetX && b.y === targetTile.y
    );
    if (boulder) {
      const pushTargetX = targetX + dirX;
      const pushTargetY = targetY + dirY;

      // Check if we can push the boulder
      if (
        pushTargetX < 0 ||
        pushTargetX >= this.gridW ||
        pushTargetY < 0 ||
        pushTargetY >= this.gridH
      ) {
        return false;
      }

      const pushTargetTile = this.grid[pushTargetY][pushTargetX];

      // Can't push into wall
      if (pushTargetTile.wall) {
        return false;
      }

      // Can't push into another boulder
      if (
        this.boulders.some((b) => b.x === pushTargetX && b.y === pushTargetY)
      ) {
        return false;
      }

      // Push the boulder
      boulder.x = pushTargetX;
      boulder.y = pushTargetY;

      // Boulder falls into hole
      if (pushTargetTile.hole) {
        const idx = this.boulders.indexOf(boulder);
        if (idx !== -1) {
          this.boulders.splice(idx, 1);
        }
      }
    }

    // Move the player
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
    this.player.x = targetX;
    this.player.y = targetY;

    // Check if level is complete and player is at exit
    if (
      this.exit.x === targetX &&
      this.exit.y === targetY &&
      this.isLevelComplete()
    ) {
      if (this.isPlayingSolution) {
        // When playing solution, just record that we reached the exit but don't win yet
        this.reachedExit = true;
        return true;
      }
      return "win";
    }

    return true;
  }

  /**
   * Play back the solution (generation path in reverse)
   * @param {Function} onStep - Callback function called after each step
   * @param {Function} onComplete - Callback function called when solution playback completes
   * @param {number} speed - Delay between steps in milliseconds
   */
  async playSolution(onStep, onComplete, speed = 200) {
    if (this.generationMoves.length === 0) {
      if (onComplete) onComplete(false);
      return;
    }

    // Prepare for solution playback - reset player to starting position
    const originalPlayerX = this.player.x;
    const originalPlayerY = this.player.y;
    const originalBoulders = JSON.parse(JSON.stringify(this.boulders));

    // Reset player to exit position (where generation started)
    // this.player.x = this.exit.x;
    // this.player.y = this.exit.y;
    // this.player.prevX = this.exit.x;
    // this.player.prevY = this.exit.y;

    this.isPlayingSolution = true;
    this.reachedExit = false;

    const moves = this.generationMoves.slice().reverse();

    try {
      // Play through the solution step by step
      for (const move of moves) {
        // Make the move
        const result = this.movePlayer(-move.x, -move.y);

        // Render the step
        if (onStep) onStep();

        // Wait for specified delay
        await new Promise((resolve) => setTimeout(resolve, speed));
      }

      // Check if we've finished at the correct spot
      const finishedCorrectly =
        this.player.x === this.exit.x && this.player.y === this.exit.y;

      // Reset playback state
      this.isPlayingSolution = false;

      // Call completion callback
      if (onComplete) onComplete(finishedCorrectly);
    } catch (error) {
      console.error("Error during solution playback:", error);

      // Reset player position and state
      this.player.x = originalPlayerX;
      this.player.y = originalPlayerY;
      this.player.prevX = originalPlayerX;
      this.player.prevY = originalPlayerY;
      this.boulders = originalBoulders;
      this.isPlayingSolution = false;

      if (onComplete) onComplete(false);
    }
  }

  /**
   * Reset the player move history
   */
  resetMoves() {
    // We don't need to reset generation moves, they're set during generation
  }
}

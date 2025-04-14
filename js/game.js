/**
 * Game controller
 */
class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.renderer = new GameRenderer(this.canvas);
    this.generator = new LevelGenerator();
    this.level = null;
    this.isAnimating = false;

    // Check URL parameters before setup
    this.loadParamsFromURL();

    this.setupControls();
    this.setupButtons();
  }

  /**
   * Load level parameters from URL if present
   */
  loadParamsFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("seed")) {
      // Extract core level parameters
      this.generator.seed = params.get("seed");

      if (params.has("gridW"))
        this.generator.gridW = parseInt(params.get("gridW"));
      if (params.has("gridH"))
        this.generator.gridH = parseInt(params.get("gridH"));

      // Load pathfinding parameters
      if (params.has("nbSteps"))
        this.generator.nbSteps = parseInt(params.get("nbSteps"));
      if (params.has("chanceToKeepForward"))
        this.generator.chanceToKeepForward = parseFloat(
          params.get("chanceToKeepForward")
        );
      if (params.has("chanceToWalkOnFloor"))
        this.generator.chanceToWalkOnFloor = parseFloat(
          params.get("chanceToWalkOnFloor")
        );
      if (params.has("chanceToGoBackwards"))
        this.generator.chanceToGoBackwards = parseFloat(
          params.get("chanceToGoBackwards")
        );

      // Load switch and boulder parameters
      if (params.has("minNbSwitch"))
        this.generator.minNbSwitch = parseInt(params.get("minNbSwitch"));
      if (params.has("maxNbSwitch"))
        this.generator.maxNbSwitch = parseInt(params.get("maxNbSwitch"));
      if (params.has("chanceToCreateSwitch"))
        this.generator.chanceToCreateSwitch = parseFloat(
          params.get("chanceToCreateSwitch")
        );
      if (params.has("minPull"))
        this.generator.minPull = parseInt(params.get("minPull"));
      if (params.has("chanceToDropBoulder"))
        this.generator.chanceToDropBoulder = parseFloat(
          params.get("chanceToDropBoulder")
        );

      // Load floor and hole parameters
      if (params.has("minNbFloorTiles"))
        this.generator.minNbFloorTiles = parseInt(
          params.get("minNbFloorTiles")
        );
      if (params.has("maxNbFloorTiles"))
        this.generator.maxNbFloorTiles = parseInt(
          params.get("maxNbFloorTiles")
        );
      if (params.has("chanceToCarveHole"))
        this.generator.chanceToCarveHole = parseFloat(
          params.get("chanceToCarveHole")
        );

      // Ensure we don't randomize the loaded parameters
      this.generator.doRandom = false;
    }
  }

  /**
   * Get URL with all current parameters
   */
  getLevelURL() {
    const params = new URLSearchParams();

    // Add core level parameters
    params.set("seed", this.generator.seed);
    params.set("gridW", this.generator.gridW);
    params.set("gridH", this.generator.gridH);

    // Add pathfinding parameters
    params.set("nbSteps", this.generator.nbSteps);
    params.set("chanceToKeepForward", this.generator.chanceToKeepForward);
    params.set("chanceToWalkOnFloor", this.generator.chanceToWalkOnFloor);
    params.set("chanceToGoBackwards", this.generator.chanceToGoBackwards);

    // Add switch and boulder parameters
    params.set("minNbSwitch", this.generator.minNbSwitch);
    params.set("maxNbSwitch", this.generator.maxNbSwitch);
    params.set("chanceToCreateSwitch", this.generator.chanceToCreateSwitch);
    params.set("minPull", this.generator.minPull);
    params.set("chanceToDropBoulder", this.generator.chanceToDropBoulder);

    // Add floor and hole parameters
    params.set("minNbFloorTiles", this.generator.minNbFloorTiles);
    params.set("maxNbFloorTiles", this.generator.maxNbFloorTiles);
    params.set("chanceToCarveHole", this.generator.chanceToCarveHole);

    return `${window.location.origin}${
      window.location.pathname
    }?${params.toString()}`;
  }

  /**
   * Copy level URL to clipboard
   */
  async copyLevelURL() {
    const url = this.getLevelURL();

    try {
      await navigator.clipboard.writeText(url);
      this.showCopyNotification();
    } catch (err) {
      console.error("Failed to copy URL: ", err);
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      this.showCopyNotification();
    }
  }

  /**
   * Show the copy notification with animation
   */
  showCopyNotification() {
    const notification = document.getElementById("copyNotification");
    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 2000);
  }

  async init(fromWin = false) {
    // Show loading message
    this.showLoadingMessage();

    // Generate level
    this.generator.renderer = this.renderer;
    this.level = await this.generator.generate();

    // Check if generation failed
    if (this.level.generationFailed) {
      this.showGenerationFailedMessage(this.level.attempts, this.level.seed);
      this.showErrorNotification(
        `Level generation failed after ${this.level.attempts} attempts! Try adjusting parameters.`
      );
      return;
    }

    // Update the renderer
    this.renderer.setLevel(this.level);

    // Play the appear animation only if coming from a win
    if (fromWin) {
      await this.playAppearAnimation();
    }

    // Update stats display
    this.updateStats();

    // Update URL with current level parameters
    const newUrl = this.getLevelURL();
    window.history.replaceState({}, "", new URL(newUrl).search);

    // Update solution button state - always enabled since we have the generation path
    this.updateSolutionButtonState();
  }

  /**
   * Show error notification
   */
  showErrorNotification(message) {
    const notification = document.getElementById("errorNotification");
    notification.textContent = message;
    notification.classList.add("show");

    // Hide notification after 5 seconds
    setTimeout(() => {
      notification.classList.remove("show");
    }, 5000);
  }

  /**
   * Show message when level generation fails
   */
  showGenerationFailedMessage(attempts, seed) {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Make canvas big enough to display the message
    this.canvas.width = 500;
    this.canvas.height = 300;

    // Draw background
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw failure message
    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Level Generation Failed", this.canvas.width / 2, 80);

    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.fillText(
      `After ${attempts} attempts, no valid level could be generated`,
      this.canvas.width / 2,
      120
    );
    ctx.fillText("with the current parameters.", this.canvas.width / 2, 150);

    ctx.fillText(
      "Try adjusting the parameters or use random generation.",
      this.canvas.width / 2,
      190
    );

    ctx.font = "14px Arial";
    ctx.fillStyle = "#999";
    ctx.fillText(`Last seed tried: ${seed}`, this.canvas.width / 2, 240);
  }

  showLoadingMessage() {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Generating level...",
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  }

  updateStats() {
    // Basic level info
    document.getElementById("seedStat").textContent = this.level.seed;
    document.getElementById(
      "gridSizeStat"
    ).textContent = `${this.level.gridW} x ${this.level.gridH}`;
    document.getElementById("switchesStat").textContent =
      this.level.switches.length;

    // Pathfinding parameters
    document.getElementById("stepsStat").textContent = this.generator.nbSteps;
    document.getElementById("keepForwardStat").textContent =
      this.generator.chanceToKeepForward.toFixed(1);
    document.getElementById("walkOnFloorStat").textContent =
      this.generator.chanceToWalkOnFloor.toFixed(1);
    document.getElementById("goBackwardsStat").textContent =
      this.generator.chanceToGoBackwards.toFixed(1);

    // Switches & Boulders parameters
    document.getElementById("minSwitchStat").textContent =
      this.generator.minNbSwitch;
    document.getElementById("maxSwitchStat").textContent =
      this.generator.maxNbSwitch;
    document.getElementById("createSwitchStat").textContent =
      (this.generator.chanceToCreateSwitch * 100).toFixed(0) + "%";
    document.getElementById("minPullStat").textContent = this.generator.minPull;
    document.getElementById("dropBoulderStat").textContent =
      (this.generator.chanceToDropBoulder * 100).toFixed(0) + "%";

    // Floor & Holes parameters
    document.getElementById("minFloorStat").textContent =
      this.generator.minNbFloorTiles;
    document.getElementById("maxFloorStat").textContent =
      this.generator.maxNbFloorTiles;
    document.getElementById("carveHoleStat").textContent =
      (this.generator.chanceToCarveHole * 100).toFixed(0) + "%";
  }

  setupButtons() {
    // New game button
    document.getElementById("newGameBtn").addEventListener("click", () => {
      if (this.isAnimating || this.generator.isGenerating) return;
      this.generator.doRandom = true;
      this.init(false);

      // Update URL without parameters for a new random level
      window.history.replaceState({}, "", window.location.pathname);
    });

    // Same parameters button
    document.getElementById("sameParamsBtn").addEventListener("click", () => {
      if (this.isAnimating || this.generator.isGenerating) return;
      this.generator.doRandom = false;
      this.init(false);
    });

    // Copy level URL button
    document.getElementById("copyLevelBtn").addEventListener("click", () => {
      if (this.isAnimating || this.generator.isGenerating) return;
      this.copyLevelURL();
    });

    // Play solution button
    document.getElementById("playSolutionBtn").addEventListener("click", () => {
      if (this.isAnimating || this.generator.isGenerating) return;
      this.playSolution();
    });
  }

  async playWinAnimation() {
    this.isAnimating = true;
    this.canvas.classList.add("win-animation");

    return new Promise((resolve) => {
      setTimeout(() => {
        this.canvas.classList.remove("win-animation");
        this.isAnimating = false;
        resolve();
      }, 500);
    });
  }

  async playAppearAnimation() {
    this.isAnimating = true;
    this.canvas.classList.add("appear-animation");

    return new Promise((resolve) => {
      setTimeout(() => {
        this.canvas.classList.remove("appear-animation");
        this.isAnimating = false;
        resolve();
      }, 500);
    });
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      if (this.generator.isGenerating || this.isAnimating) return;

      let result = false;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "z":
          result = this.generator.movePlayer(0, -1);
          break;
        case "ArrowDown":
        case "s":
          result = this.generator.movePlayer(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "q":
          result = this.generator.movePlayer(-1, 0);
          break;
        case "ArrowRight":
        case "d":
          result = this.generator.movePlayer(1, 0);
          break;
        case "r":
          this.generator.doRandom = false;
          this.init(false);
          break;
        case "n":
          this.generator.doRandom = true;
          this.init(false);
          break;
        case "p":
          // Shortcut for playing solution
          if (this.generator.generationMoves.length > 0) {
            this.playSolution();
          }
          break;
      }

      if (result) {
        this.renderer.render();

        // Update solution button state whenever a move is made
        this.updateSolutionButtonState();

        if (result === "win") {
          this.playWinAnimation().then(() => {
            this.generator.doRandom = true;
            this.init(true); // Only use animation when coming from a win
          });
        }
      }
    });
  }

  /**
   * Update the state of the Play Solution button
   */
  updateSolutionButtonState() {
    const solutionButton = document.getElementById("playSolutionBtn");
    if (
      this.generator.generationMoves &&
      this.generator.generationMoves.length > 0
    ) {
      solutionButton.disabled = false;
      solutionButton.classList.remove("disabled");
    } else {
      solutionButton.disabled = true;
      solutionButton.classList.add("disabled");
    }
  }

  /**
   * Play back the solution
   */
  async playSolution() {
    if (
      !this.generator.generationMoves ||
      this.generator.generationMoves.length === 0
    )
      return;

    // reset level first
    this.generator.doRandom = false;
    this.init(false);

    this.isAnimating = true;

    // Disable buttons during playback
    const buttons = document.querySelectorAll(".controls button");
    buttons.forEach((btn) => (btn.disabled = true));

    try {
      await this.generator.playSolution(
        // Update the display after each step
        () => this.renderer.render(),
        // When complete, check if we should generate a new level
        (finishedCorrectly) => {
          this.isAnimating = false;
          buttons.forEach((btn) => (btn.disabled = false));

          if (finishedCorrectly) {
            // Generate new level without win animation
            this.generator.doRandom = false;
            this.init(false);
          }
        },
        // Playback speed in milliseconds
        50
      );
    } catch (error) {
      console.error("Error playing solution:", error);
      this.isAnimating = false;
      buttons.forEach((btn) => (btn.disabled = false));
    }
  }
}

// Initialize the game when the page loads
window.onload = () => {
  const game = new Game("gameCanvas");
  window.game = game; // Expose game instance globally for parameter dialog
  game.init();
};

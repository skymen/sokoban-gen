/**
 * Custom Dialog System
 */
class DialogManager {
  constructor() {
    this.dialogContainer = document.getElementById("customDialogContainer");
    this.dialogTitle = document.getElementById("customDialogTitle");
    this.dialogContent = document.getElementById("customDialogContent");
    this.dialogInput = document.getElementById("customDialogInput");
    this.dialogInputField = document.getElementById("customDialogInputField");
    this.dialogCancelBtn = document.getElementById("customDialogCancelBtn");
    this.dialogConfirmBtn = document.getElementById("customDialogConfirmBtn");

    this.resolvePromise = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close dialog on cancel button click
    this.dialogCancelBtn.addEventListener("click", () => {
      this.close(false);
    });

    // Confirm dialog on confirm button click
    this.dialogConfirmBtn.addEventListener("click", () => {
      this.close(true);
    });

    // Close dialog when clicking outside (optional)
    this.dialogContainer.addEventListener("click", (e) => {
      if (e.target === this.dialogContainer) {
        this.close(false);
      }
    });

    // Handle enter key in input field
    this.dialogInputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.close(true);
      }
    });
  }

  /**
   * Show an alert dialog
   * @param {string} title - The dialog title
   * @param {string} message - The dialog message
   * @returns {Promise} Resolves when dialog is closed
   */
  alert(title, message) {
    return this.showDialog({
      title,
      content: message,
      showCancel: false,
      confirmText: "OK",
    });
  }

  /**
   * Show a confirmation dialog
   * @param {string} title - The dialog title
   * @param {string} message - The dialog message
   * @param {string} confirmText - Text for confirm button
   * @returns {Promise<boolean>} Resolves with true if confirmed, false otherwise
   */
  confirm(title, message, confirmText = "OK") {
    return this.showDialog({
      title,
      content: message,
      confirmText,
      cancelText: "Cancel",
      confirmButtonClass: "danger",
    });
  }

  /**
   * Show a prompt dialog
   * @param {string} title - The dialog title
   * @param {string} message - The dialog message
   * @param {string} defaultValue - Default value for the input field
   * @returns {Promise<string|null>} Resolves with input value or null if canceled
   */
  prompt(title, message, defaultValue = "") {
    return this.showDialog({
      title,
      content: message,
      showInput: true,
      inputValue: defaultValue,
    }).then((confirmed) => {
      if (confirmed) {
        return this.dialogInputField.value;
      }
      return null;
    });
  }

  /**
   * Show dialog with custom configuration
   * @param {Object} config - Dialog configuration
   * @returns {Promise<boolean>} Resolves with true if confirmed, false otherwise
   */
  showDialog(config) {
    const {
      title = "Dialog",
      content = "",
      showCancel = true,
      showInput = false,
      inputValue = "",
      confirmText = "OK",
      cancelText = "Cancel",
      confirmButtonClass = "primary",
    } = config;

    // Set dialog content
    this.dialogTitle.textContent = title;
    this.dialogContent.textContent = content;

    // Configure buttons
    this.dialogConfirmBtn.textContent = confirmText;
    this.dialogCancelBtn.textContent = cancelText;
    this.dialogCancelBtn.style.display = showCancel ? "block" : "none";

    // Set confirm button class
    this.dialogConfirmBtn.className = `custom-dialog-btn ${confirmButtonClass}`;

    // Configure input
    this.dialogInput.style.display = showInput ? "block" : "none";
    if (showInput) {
      this.dialogInputField.value = inputValue;
      // Focus the input field after dialog is visible
      setTimeout(() => this.dialogInputField.focus(), 100);
    }

    // Show dialog
    this.dialogContainer.classList.add("show");

    // Return promise that resolves when dialog is closed
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  /**
   * Close the dialog
   * @param {boolean} result - The result to resolve the promise with
   */
  close(result) {
    this.dialogContainer.classList.remove("show");

    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }
}

// Initialize the global dialog manager
let dialogManager;
document.addEventListener("DOMContentLoaded", () => {
  dialogManager = new DialogManager();
});

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
      }

      if (result) {
        this.renderer.render();

        if (result === "win") {
          this.playWinAnimation().then(() => {
            this.generator.doRandom = true;
            this.init(true); // Only use animation when coming from a win
          });
        }
      }
    });
  }
}

/**
 * Saved levels manager
 */
class SavedLevelsManager {
  constructor() {
    this.storageKey = "sokobanSavedLevels";
    this.savedLevels = this.loadFromLocalStorage();
  }

  saveLevel(name, url) {
    this.savedLevels.push({ name, url });
    this.saveToLocalStorage();
  }

  deleteLevel(index) {
    this.savedLevels.splice(index, 1);
    this.saveToLocalStorage();
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveToLocalStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.savedLevels));
  }

  exportToFile() {
    const blob = new Blob([JSON.stringify(this.savedLevels, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sokoban_saved_levels.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (Array.isArray(data)) {
            this.savedLevels = data;
            this.saveToLocalStorage();
            resolve();
          } else {
            reject(new Error("Invalid file format"));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// Setup collapsible sections in the parameters dialog
function setupCollapsibleSections() {
  const sections = document.querySelectorAll(".params-section.collapsible");

  sections.forEach((section) => {
    const header = section.querySelector(".section-header");
    const content = section.querySelector(".section-content");

    header.addEventListener("click", () => {
      section.classList.toggle("collapsed");
    });
  });
}

// Setup saved levels manager and dialogs
document.addEventListener("DOMContentLoaded", () => {
  const savedLevelsManager = new SavedLevelsManager();
  const savedLevelsDialog = document.getElementById("savedLevelsDialog");
  const savedLevelsList = document.getElementById("savedLevelsList");

  function updateSavedLevelsList() {
    savedLevelsList.innerHTML = "";

    if (savedLevelsManager.savedLevels.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-list-message";
      emptyMessage.innerHTML = "📭 No saved levels yet";
      savedLevelsList.appendChild(emptyMessage);
      return;
    }

    savedLevelsManager.savedLevels.forEach((level, index) => {
      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.className = "level-name";
      nameSpan.textContent = level.name;
      li.appendChild(nameSpan);

      const btnActions = document.createElement("div");
      btnActions.className = "btn-actions";

      // Load button with SVG icon and tooltip
      const loadButton = document.createElement("button");
      loadButton.className = "dialog-btn load-btn";
      loadButton.setAttribute("data-tooltip", "Play Level");

      // Create play SVG icon
      fetch("play.svg")
        .then((response) => response.text())
        .then((svgContent) => {
          loadButton.innerHTML = svgContent;
        })
        .catch(() => {
          // Fallback to emoji if SVG fails to load
          loadButton.innerHTML = '<span class="icon">▶️</span>';
        });

      loadButton.addEventListener("click", () => {
        window.location.href = level.url;
      });

      // Copy button with SVG icon and tooltip
      const copyButton = document.createElement("button");
      copyButton.className = "dialog-btn copy-btn";
      copyButton.setAttribute("data-tooltip", "Copy URL");

      // Create share SVG icon
      fetch("share.svg")
        .then((response) => response.text())
        .then((svgContent) => {
          copyButton.innerHTML = svgContent;
        })
        .catch(() => {
          // Fallback to emoji if SVG fails to load
          copyButton.innerHTML = '<span class="icon">📋</span>';
        });

      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(level.url);
          // Use the copy notification instead of alert
          const notification = document.getElementById("copyNotification");
          notification.classList.add("show");
          setTimeout(() => {
            notification.classList.remove("show");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy URL: ", err);
          dialogManager.alert("Error", "Failed to copy URL.");
        }
      });

      // Delete button with SVG icon and tooltip
      const deleteButton = document.createElement("button");
      deleteButton.className = "dialog-btn delete-btn";
      deleteButton.setAttribute("data-tooltip", "Delete Level");

      // Create delete SVG icon
      fetch("delete.svg")
        .then((response) => response.text())
        .then((svgContent) => {
          deleteButton.innerHTML = svgContent;
        })
        .catch(() => {
          // Fallback to emoji if SVG fails to load
          deleteButton.innerHTML = '<span class="icon">🗑️</span>';
        });

      deleteButton.addEventListener("click", async () => {
        const confirmed = await dialogManager.confirm(
          "Delete Level",
          `Are you sure you want to delete "${level.name}"?`,
          "Delete"
        );
        if (confirmed) {
          savedLevelsManager.deleteLevel(index);
          updateSavedLevelsList();
        }
      });

      btnActions.appendChild(loadButton);
      btnActions.appendChild(copyButton);
      btnActions.appendChild(deleteButton);
      li.appendChild(btnActions);

      savedLevelsList.appendChild(li);
    });
  }

  document
    .getElementById("saveLevelBtn")
    .addEventListener("click", async () => {
      const name = await dialogManager.prompt(
        "Save Level",
        "Enter a name for this level:"
      );
      if (name) {
        const url = window.location.href;
        savedLevelsManager.saveLevel(name, url);

        // Show success notification using the copy notification system
        const notification = document.getElementById("copyNotification");
        notification.textContent = "Level Saved!";
        notification.classList.add("show");
        setTimeout(() => {
          notification.classList.remove("show");
          // Reset text back to original after animation completes
          setTimeout(() => {
            notification.textContent = "Level URL Copied!";
          }, 300);
        }, 2000);
      }
    });

  document
    .getElementById("showSavedLevelsBtn")
    .addEventListener("click", () => {
      savedLevelsDialog.classList.add("show");
      updateSavedLevelsList();
    });

  document
    .getElementById("closeSavedLevelsDialogBtn")
    .addEventListener("click", () => {
      savedLevelsDialog.classList.remove("show");
    });

  // Close dialog when clicking outside of the content
  savedLevelsDialog.addEventListener("click", (e) => {
    if (e.target === savedLevelsDialog) {
      savedLevelsDialog.classList.remove("show");
    }
  });

  document.getElementById("exportDatabaseBtn").addEventListener("click", () => {
    savedLevelsManager.exportToFile();
  });

  document.getElementById("importDatabaseBtn").addEventListener("click", () => {
    const input = document.getElementById("importDatabaseInput");
    input.click();
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file) {
        savedLevelsManager
          .importFromFile(file)
          .then(() => {
            dialogManager.alert("Success", "Database imported successfully!");
            updateSavedLevelsList();
          })
          .catch((error) => {
            dialogManager.alert(
              "Error",
              "Failed to import database: " + error.message
            );
          });
      }
    });
  });

  // Search functionality
  document.getElementById("levelSearchInput").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterSavedLevels(searchTerm);
  });

  function filterSavedLevels(searchTerm) {
    const items = savedLevelsList.querySelectorAll("li");

    if (items.length === 0) return;

    if (!searchTerm) {
      // If search is empty, show all items
      items.forEach((item) => (item.style.display = "flex"));
      return;
    }

    let hasVisibleItems = false;

    items.forEach((item) => {
      const levelName = item
        .querySelector(".level-name")
        .textContent.toLowerCase();
      if (levelName.includes(searchTerm)) {
        item.style.display = "flex";
        hasVisibleItems = true;
      } else {
        item.style.display = "none";
      }
    });

    // If no items match search, show message
    if (!hasVisibleItems) {
      if (!document.querySelector(".search-no-results")) {
        const noResultsMsg = document.createElement("div");
        noResultsMsg.className = "empty-list-message search-no-results";
        noResultsMsg.innerHTML = "🔍 No levels match your search";
        savedLevelsList.appendChild(noResultsMsg);
      }
    } else {
      // Remove no results message if it exists
      const noResultsMsg = document.querySelector(".search-no-results");
      if (noResultsMsg) {
        noResultsMsg.remove();
      }
    }
  }

  // Generation Parameters Dialog
  const generationParamsDialog = document.getElementById(
    "generationParamsDialog"
  );
  const paramsDialogBtn = document.getElementById("showParamsDialogBtn");
  const closeParamsDialogBtn = document.getElementById("closeParamsDialogBtn");
  const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");
  const applyParamsBtn = document.getElementById("applyParamsBtn");

  // Parameter slider value displays
  const sliderValueDisplays = {
    chanceToCreateSwitch: document.getElementById("chanceToCreateSwitchValue"),
    chanceToDropBoulder: document.getElementById("chanceToDropBoulderValue"),
    chanceToCarveHole: document.getElementById("chanceToCarveHoleValue"),
  };

  // Default parameter values
  const defaultParams = {
    gridW: 10,
    gridH: 5,
    nbSteps: 230,
    chanceToKeepForward: 1.7,
    chanceToWalkOnFloor: 3.3,
    chanceToGoBackwards: 0.1,
    minNbSwitch: 7,
    maxNbSwitch: 150,
    chanceToCreateSwitch: 70, // percentage for slider
    minPull: 3,
    chanceToDropBoulder: 50, // percentage for slider
    minNbFloorTiles: 13,
    maxNbFloorTiles: 47,
    chanceToCarveHole: 60, // percentage for slider
  };

  // Update sliders' value display when they change
  document
    .getElementById("chanceToCreateSwitch")
    .addEventListener("input", (e) => {
      sliderValueDisplays.chanceToCreateSwitch.textContent = `${e.target.value}%`;
    });

  document
    .getElementById("chanceToDropBoulder")
    .addEventListener("input", (e) => {
      sliderValueDisplays.chanceToDropBoulder.textContent = `${e.target.value}%`;
    });

  document
    .getElementById("chanceToCarveHole")
    .addEventListener("input", (e) => {
      sliderValueDisplays.chanceToCarveHole.textContent = `${e.target.value}%`;
    });

  // Fill form with current game parameters
  function populateParamsForm() {
    // Get current game instance
    const gameInstance = window.game;
    if (!gameInstance) return;

    const gen = gameInstance.generator;

    // Set form values from current generator configuration
    document.getElementById("gridW").value = gen.gridW;
    document.getElementById("gridH").value = gen.gridH;
    document.getElementById("nbSteps").value = gen.nbSteps;
    document.getElementById("chanceToKeepForward").value =
      gen.chanceToKeepForward;
    document.getElementById("chanceToWalkOnFloor").value =
      gen.chanceToWalkOnFloor;
    document.getElementById("chanceToGoBackwards").value =
      gen.chanceToGoBackwards;
    document.getElementById("minNbSwitch").value = gen.minNbSwitch;
    document.getElementById("maxNbSwitch").value = gen.maxNbSwitch;
    document.getElementById("chanceToCreateSwitch").value = Math.round(
      gen.chanceToCreateSwitch * 100
    );
    sliderValueDisplays.chanceToCreateSwitch.textContent = `${Math.round(
      gen.chanceToCreateSwitch * 100
    )}%`;
    document.getElementById("minPull").value = gen.minPull;
    document.getElementById("chanceToDropBoulder").value = Math.round(
      gen.chanceToDropBoulder * 100
    );
    sliderValueDisplays.chanceToDropBoulder.textContent = `${Math.round(
      gen.chanceToDropBoulder * 100
    )}%`;
    document.getElementById("minNbFloorTiles").value = gen.minNbFloorTiles;
    document.getElementById("maxNbFloorTiles").value = gen.maxNbFloorTiles;
    document.getElementById("chanceToCarveHole").value = Math.round(
      gen.chanceToCarveHole * 100
    );
    sliderValueDisplays.chanceToCarveHole.textContent = `${Math.round(
      gen.chanceToCarveHole * 100
    )}%`;
  }

  // Reset form to default values
  function resetParamsToDefaults() {
    document.getElementById("gridW").value = defaultParams.gridW;
    document.getElementById("gridH").value = defaultParams.gridH;
    document.getElementById("nbSteps").value = defaultParams.nbSteps;
    document.getElementById("chanceToKeepForward").value =
      defaultParams.chanceToKeepForward;
    document.getElementById("chanceToWalkOnFloor").value =
      defaultParams.chanceToWalkOnFloor;
    document.getElementById("chanceToGoBackwards").value =
      defaultParams.chanceToGoBackwards;
    document.getElementById("minNbSwitch").value = defaultParams.minNbSwitch;
    document.getElementById("maxNbSwitch").value = defaultParams.maxNbSwitch;
    document.getElementById("chanceToCreateSwitch").value =
      defaultParams.chanceToCreateSwitch;
    sliderValueDisplays.chanceToCreateSwitch.textContent = `${defaultParams.chanceToCreateSwitch}%`;
    document.getElementById("minPull").value = defaultParams.minPull;
    document.getElementById("chanceToDropBoulder").value =
      defaultParams.chanceToDropBoulder;
    sliderValueDisplays.chanceToDropBoulder.textContent = `${defaultParams.chanceToDropBoulder}%`;
    document.getElementById("minNbFloorTiles").value =
      defaultParams.minNbFloorTiles;
    document.getElementById("maxNbFloorTiles").value =
      defaultParams.maxNbFloorTiles;
    document.getElementById("chanceToCarveHole").value =
      defaultParams.chanceToCarveHole;
    sliderValueDisplays.chanceToCarveHole.textContent = `${defaultParams.chanceToCarveHole}%`;
  }

  // Apply form values to the game
  function applyParamsToGame() {
    const gameInstance = window.game;
    if (!gameInstance) return;

    // Get values from form
    const params = {
      gridW: parseInt(document.getElementById("gridW").value),
      gridH: parseInt(document.getElementById("gridH").value),
      nbSteps: parseInt(document.getElementById("nbSteps").value),
      chanceToKeepForward: parseFloat(
        document.getElementById("chanceToKeepForward").value
      ),
      chanceToWalkOnFloor: parseFloat(
        document.getElementById("chanceToWalkOnFloor").value
      ),
      chanceToGoBackwards: parseFloat(
        document.getElementById("chanceToGoBackwards").value
      ),
      minNbSwitch: parseInt(document.getElementById("minNbSwitch").value),
      maxNbSwitch: parseInt(document.getElementById("maxNbSwitch").value),
      chanceToCreateSwitch:
        parseInt(document.getElementById("chanceToCreateSwitch").value) / 100,
      minPull: parseInt(document.getElementById("minPull").value),
      chanceToDropBoulder:
        parseInt(document.getElementById("chanceToDropBoulder").value) / 100,
      minNbFloorTiles: parseInt(
        document.getElementById("minNbFloorTiles").value
      ),
      maxNbFloorTiles: parseInt(
        document.getElementById("maxNbFloorTiles").value
      ),
      chanceToCarveHole:
        parseInt(document.getElementById("chanceToCarveHole").value) / 100,
    };

    // Generate a new random seed but keep the parameters
    gameInstance.generator.seed = Math.floor(
      Math.random() * 1000000000000000
    ).toString();

    // Apply values to generator
    const gen = gameInstance.generator;
    Object.keys(params).forEach((key) => {
      gen[key] = params[key];
    });

    // Set to not randomize parameters but still use the new seed
    gen.doRandom = false;

    // Generate new level with custom params
    gameInstance.init(false);
  }

  // Dialog event listeners
  paramsDialogBtn.addEventListener("click", () => {
    populateParamsForm();
    generationParamsDialog.classList.add("show");
  });

  closeParamsDialogBtn.addEventListener("click", () => {
    generationParamsDialog.classList.remove("show");
  });

  // Close dialog when clicking outside of the content
  generationParamsDialog.addEventListener("click", (e) => {
    if (e.target === generationParamsDialog) {
      generationParamsDialog.classList.remove("show");
    }
  });

  applyParamsBtn.addEventListener("click", () => {
    applyParamsToGame();
    generationParamsDialog.classList.remove("show");
  });

  // Setup collapsible sections
  setupCollapsibleSections();
});

// Initialize the game when the page loads
window.onload = () => {
  const game = new Game("gameCanvas");
  window.game = game; // Expose game instance globally for parameter dialog
  game.init();
};

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

/**
 * Level history manager
 */
class LevelHistoryManager {
  constructor() {
    this.storageKey = "sokobanLevelHistory";
    this.maxHistorySize = 30;
    this.levelHistory = this.loadFromLocalStorage();
  }

  addLevel(url, timestamp = new Date().toISOString()) {
    // Create a simple timestamp in the format of MM/DD/YYYY HH:MM
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Add the new level at the beginning of the array
    this.levelHistory.unshift({
      url,
      timestamp: formattedDate,
      rawTimestamp: timestamp,
    });

    // Limit the history size to maxHistorySize
    if (this.levelHistory.length > this.maxHistorySize) {
      this.levelHistory = this.levelHistory.slice(0, this.maxHistorySize);
    }

    this.saveToLocalStorage();
  }

  clearHistory() {
    this.levelHistory = [];
    this.saveToLocalStorage();
  }

  loadFromLocalStorage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveToLocalStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.levelHistory));
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

// Setup lock icons for parameters
function setupLockIcons() {
  const lockIcons = document.querySelectorAll(".param-lock");

  // Preload SVG content
  const lockSvgPromise = fetch("../assets/lock.svg").then((response) =>
    response.text()
  );
  const unlockSvgPromise = fetch("../assets/lock-open.svg").then((response) =>
    response.text()
  );

  // Wait for both SVGs to load
  Promise.all([lockSvgPromise, unlockSvgPromise])
    .then(([lockSvg, unlockSvg]) => {
      lockIcons.forEach((icon) => {
        // Get the parameter this lock controls
        const param = icon.getAttribute("data-param");

        // Set initial state based on game instance if available
        if (window.game && window.game.generator) {
          const isLocked = window.game.generator.lockedParams[param] || false;
          if (isLocked) {
            icon.innerHTML = lockSvg;
            icon.classList.add("locked");
          } else {
            icon.innerHTML = unlockSvg;
            icon.classList.remove("locked");
          }
        } else {
          // Default to unlocked state
          icon.innerHTML = unlockSvg;
        }

        // Add click handler
        icon.addEventListener("click", () => {
          const isLocked = icon.classList.contains("locked");

          // Toggle lock state
          if (isLocked) {
            icon.innerHTML = unlockSvg;
            icon.classList.remove("locked");
            if (window.game && window.game.generator) {
              window.game.generator.lockedParams[param] = false;
            }
          } else {
            icon.innerHTML = lockSvg;
            icon.classList.add("locked");
            if (window.game && window.game.generator) {
              window.game.generator.lockedParams[param] = true;
            }
          }
        });
      });
    })
    .catch((error) => {
      console.error("Failed to load lock SVGs:", error);
      // Fallback to emojis if SVG loading fails
      setupLockIconsEmojiFallback();
    });
}

// Fallback function using emojis instead of SVGs
function setupLockIconsEmojiFallback() {
  const lockIcons = document.querySelectorAll(".param-lock");

  lockIcons.forEach((icon) => {
    const param = icon.getAttribute("data-param");

    // Set initial state
    if (window.game && window.game.generator) {
      const isLocked = window.game.generator.lockedParams[param] || false;
      if (isLocked) {
        icon.textContent = "🔒";
        icon.classList.add("locked");
      } else {
        icon.textContent = "🔓";
        icon.classList.remove("locked");
      }
    } else {
      icon.textContent = "🔓";
    }

    // Add click handler
    icon.addEventListener("click", () => {
      const isLocked = icon.classList.contains("locked");

      if (isLocked) {
        icon.textContent = "🔓";
        icon.classList.remove("locked");
        if (window.game && window.game.generator) {
          window.game.generator.lockedParams[param] = false;
        }
      } else {
        icon.textContent = "🔒";
        icon.classList.add("locked");
        if (window.game && window.game.generator) {
          window.game.generator.lockedParams[param] = true;
        }
      }
    });
  });
}

// Setup saved levels manager and dialogs
document.addEventListener("DOMContentLoaded", () => {
  const savedLevelsManager = new SavedLevelsManager();
  const savedLevelsDialog = document.getElementById("savedLevelsDialog");
  const savedLevelsList = document.getElementById("savedLevelsList");

  // Initialize the level history manager
  const levelHistoryManager = new LevelHistoryManager();
  const levelHistoryDialog = document.getElementById("levelHistoryDialog");
  const levelHistoryList = document.getElementById("levelHistoryList");

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
      fetch("../assets/play.svg")
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
      fetch("../assets/share.svg")
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
      fetch("../assets/delete.svg")
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

  function updateLevelHistoryList() {
    levelHistoryList.innerHTML = "";

    if (levelHistoryManager.levelHistory.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-list-message";
      emptyMessage.innerHTML = "🕒 No level history yet";
      levelHistoryList.appendChild(emptyMessage);
      return;
    }

    levelHistoryManager.levelHistory.forEach((level, index) => {
      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.className = "level-name";
      nameSpan.textContent = `${level.timestamp}`;
      li.appendChild(nameSpan);

      const btnActions = document.createElement("div");
      btnActions.className = "btn-actions";

      // Load button with SVG icon and tooltip
      const loadButton = document.createElement("button");
      loadButton.className = "dialog-btn load-btn";
      loadButton.setAttribute("data-tooltip", "Play Level");

      // Create play SVG icon
      fetch("../assets/play.svg")
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
      fetch("../assets/share.svg")
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

      // Save button with SVG icon and tooltip for history items
      const saveButton = document.createElement("button");
      saveButton.className = "dialog-btn save-btn";
      saveButton.setAttribute("data-tooltip", "Save Level");

      // Use a simple save icon emoji
      saveButton.innerHTML = '<span class="icon">💾</span>';

      saveButton.addEventListener("click", async () => {
        const name = await dialogManager.prompt(
          "Save Level",
          "Enter a name for this level:"
        );
        if (name) {
          savedLevelsManager.saveLevel(name, level.url);

          // Show success notification
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

      btnActions.appendChild(loadButton);
      btnActions.appendChild(copyButton);
      btnActions.appendChild(saveButton);
      li.appendChild(btnActions);

      levelHistoryList.appendChild(li);
    });
  }

  // Search functionality for history
  document
    .getElementById("historySearchInput")
    .addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      filterLevelHistory(searchTerm);
    });

  function filterLevelHistory(searchTerm) {
    const items = levelHistoryList.querySelectorAll("li");

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
      if (!document.querySelector(".history-search-no-results")) {
        const noResultsMsg = document.createElement("div");
        noResultsMsg.className = "empty-list-message history-search-no-results";
        noResultsMsg.innerHTML = "🔍 No levels match your search";
        levelHistoryList.appendChild(noResultsMsg);
      }
    } else {
      // Remove no results message if it exists
      const noResultsMsg = document.querySelector(".history-search-no-results");
      if (noResultsMsg) {
        noResultsMsg.remove();
      }
    }
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
    chanceToSpawnSoloBoulder: document.getElementById(
      "chanceToSpawnSoloBoulderValue"
    ),
    chanceToCreateWallBoulder: document.getElementById(
      "chanceToCreateWallBoulderValue"
    ),
    chanceWallToWallBoulder: document.getElementById(
      "chanceWallToWallBoulderValue"
    ),
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
    minSoloBoulders: 2,
    chanceToSpawnSoloBoulder: 30, // percentage for slider
    chanceToCreateWallBoulder: 40, // percentage for slider
    chanceWallToWallBoulder: 20, // percentage for slider
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

  document
    .getElementById("chanceToSpawnSoloBoulder")
    .addEventListener("input", (e) => {
      sliderValueDisplays.chanceToSpawnSoloBoulder.textContent = `${e.target.value}%`;
    });

  document
    .getElementById("chanceToCreateWallBoulder")
    .addEventListener("input", (e) => {
      sliderValueDisplays.chanceToCreateWallBoulder.textContent = `${e.target.value}%`;
    });

  document
    .getElementById("chanceWallToWallBoulder")
    .addEventListener("input", (e) => {
      sliderValueDisplays.chanceWallToWallBoulder.textContent = `${e.target.value}%`;
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
    document.getElementById("minSoloBoulders").value = gen.minSoloBoulders;
    document.getElementById("chanceToSpawnSoloBoulder").value = Math.round(
      gen.chanceToSpawnSoloBoulder * 100
    );
    sliderValueDisplays.chanceToSpawnSoloBoulder.textContent = `${Math.round(
      gen.chanceToSpawnSoloBoulder * 100
    )}%`;
    document.getElementById("chanceToCreateWallBoulder").value = Math.round(
      gen.chanceToCreateWallBoulder * 100
    );
    sliderValueDisplays.chanceToCreateWallBoulder.textContent = `${Math.round(
      gen.chanceToCreateWallBoulder * 100
    )}%`;
    document.getElementById("chanceWallToWallBoulder").value = Math.round(
      gen.chanceWallToWallBoulder * 100
    );
    sliderValueDisplays.chanceWallToWallBoulder.textContent = `${Math.round(
      gen.chanceWallToWallBoulder * 100
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
    document.getElementById("minSoloBoulders").value =
      defaultParams.minSoloBoulders;
    document.getElementById("chanceToSpawnSoloBoulder").value =
      defaultParams.chanceToSpawnSoloBoulder;
    sliderValueDisplays.chanceToSpawnSoloBoulder.textContent = `${defaultParams.chanceToSpawnSoloBoulder}%`;
    document.getElementById("chanceToCreateWallBoulder").value =
      defaultParams.chanceToCreateWallBoulder;
    sliderValueDisplays.chanceToCreateWallBoulder.textContent = `${defaultParams.chanceToCreateWallBoulder}%`;
    document.getElementById("chanceWallToWallBoulder").value =
      defaultParams.chanceWallToWallBoulder;
    sliderValueDisplays.chanceWallToWallBoulder.textContent = `${defaultParams.chanceWallToWallBoulder}%`;
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
      minSoloBoulders: parseInt(
        document.getElementById("minSoloBoulders").value
      ),
      chanceToSpawnSoloBoulder:
        parseInt(document.getElementById("chanceToSpawnSoloBoulder").value) /
        100,
      chanceToCreateWallBoulder:
        parseInt(document.getElementById("chanceToCreateWallBoulder").value) /
        100,
      chanceWallToWallBoulder:
        parseInt(document.getElementById("chanceWallToWallBoulder").value) /
        100,
    };

    // Generate a new random seed but keep the parameters
    gameInstance.generator.seed = Math.floor(
      Math.random() * 1000000000000000
    ).toString();

    // Keep the current locked parameters state
    const lockedParams = gameInstance.generator.lockedParams;

    // Apply values to generator
    const gen = gameInstance.generator;
    Object.keys(params).forEach((key) => {
      gen[key] = params[key];
    });

    // Re-apply the locked parameters
    gen.lockedParams = lockedParams;

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

  resetToDefaultsBtn.addEventListener("click", () => {
    resetParamsToDefaults();
  });

  // History dialog event listeners
  document.getElementById("showHistoryBtn").addEventListener("click", () => {
    levelHistoryDialog.classList.add("show");
    updateLevelHistoryList();
  });

  document
    .getElementById("closeHistoryDialogBtn")
    .addEventListener("click", () => {
      levelHistoryDialog.classList.remove("show");
    });

  // Clear history button
  document
    .getElementById("clearHistoryBtn")
    .addEventListener("click", async () => {
      const confirmed = await dialogManager.confirm(
        "Clear History",
        "Are you sure you want to clear your level history?",
        "Clear"
      );
      if (confirmed) {
        levelHistoryManager.clearHistory();
        updateLevelHistoryList();
      }
    });

  // Close history dialog when clicking outside of the content
  levelHistoryDialog.addEventListener("click", (e) => {
    if (e.target === levelHistoryDialog) {
      levelHistoryDialog.classList.remove("show");
    }
  });

  // Hook into game generation to track history
  // Monitor newGameBtn and sameParamsBtn clicks to add levels to history
  document.getElementById("newGameBtn").addEventListener("click", () => {
    // Small delay to allow the URL to update before capturing it
    setTimeout(() => {
      levelHistoryManager.addLevel(window.location.href);
    }, 100);
  });

  document.getElementById("sameParamsBtn").addEventListener("click", () => {
    // Small delay to allow the URL to update before capturing it
    setTimeout(() => {
      levelHistoryManager.addLevel(window.location.href);
    }, 100);
  });

  // Setup collapsible sections
  setupCollapsibleSections();

  // Setup lock icons
  setupLockIcons();
});

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

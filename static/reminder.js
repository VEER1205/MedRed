// User data from backend
const userData = {
  fname: "John",
  lname: "Doe",
  email: "john.doe@example.com",
};

// Reminders array
let reminders = [];

// Initialize page
function initializePage() {
  // Set user info in navbar
  const initials = userData.fname.charAt(0) + userData.lname.charAt(0);
  document.getElementById("navUserAvatar").textContent = initials.toUpperCase();
  document.getElementById(
    "navUserName"
  ).textContent = `${userData.fname} ${userData.lname}`;
  document.getElementById("navUserEmail").textContent = userData.email;

  // Load reminders from storage or backend
  loadReminders();
  updateStatistics();
}

// Load reminders
function loadReminders() {
  const reminderList = document.getElementById("reminderList");

  if (reminders.length === 0) {
    reminderList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">💊</div>
                        <h3 class="empty-title">No reminders yet</h3>
                        <p>Click "Add Reminder" to create your first medicine reminder</p>
                    </div>
                `;
    return;
  }

  reminderList.innerHTML = reminders
    .map(
      (reminder, index) => `
                <div class="reminder-card">
                    <div class="reminder-header">
                        <div>
                            <div class="reminder-name">${
                              reminder.medicineName
                            }</div>
                            <span class="reminder-dosage">💊 ${
                              reminder.dosage
                            }</span>
                        </div>
                        <button class="btn btn-delete" onclick="deleteReminder(${index})">
                            <span>🗑️</span>
                            <span>Delete</span>
                        </button>
                    </div>
                    <div class="reminder-details">
                        <div class="reminder-detail-item">
                            <div class="detail-icon">🕐</div>
                            <span><strong>Times:</strong> ${reminder.times.join(
                              ", "
                            )}</span>
                        </div>
                        <div class="reminder-detail-item">
                            <div class="detail-icon">📅</div>
                            <span><strong>Frequency:</strong> ${
                              reminder.frequency
                            }</span>
                        </div>
                        ${
                          reminder.duration
                            ? `
                        <div class="reminder-detail-item">
                            <div class="detail-icon">⏱️</div>
                            <span><strong>Duration:</strong> ${reminder.duration}</span>
                        </div>
                        `
                            : ""
                        }
                        ${
                          reminder.instructions
                            ? `
                        <div class="reminder-detail-item" style="grid-column: 1 / -1;">
                            <div class="detail-icon">ℹ️</div>
                            <span><strong>Instructions:</strong> ${reminder.instructions}</span>
                        </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            `
    )
    .join("");
}

// Update statistics
function updateStatistics() {
  document.getElementById("totalReminders").textContent = reminders.length;

  // Count by time of day
  let morning = 0,
    afternoon = 0,
    evening = 0,
    night = 0;

  reminders.forEach((reminder) => {
    reminder.times.forEach((time) => {
      const hour = parseInt(time.split(":")[0]);
      if (hour >= 5 && hour < 12) morning++;
      else if (hour >= 12 && hour < 17) afternoon++;
      else if (hour >= 17 && hour < 21) evening++;
      else night++;
    });
  });

  document.getElementById("morningCount").textContent = morning;
  document.getElementById("afternoonCount").textContent = afternoon;
  document.getElementById("eveningCount").textContent = evening;
  document.getElementById("nightCount").textContent = night;
}

// Open add modal
function openAddModal() {
  document.getElementById("addReminderModal").classList.add("show");
  updateTimeInputs();
}

// Close add modal
function closeAddModal() {
  document.getElementById("addReminderModal").classList.remove("show");
  document.getElementById("reminderForm").reset();
}

// Update time inputs based on frequency
document.getElementById("frequency").addEventListener("change", function () {
  updateTimeInputs();
});

function updateTimeInputs() {
  const frequency = document.getElementById("frequency").value;
  const timeInputsContainer = document.getElementById("timeInputs");

  let count = 1;
  if (frequency === "Twice Daily") count = 2;
  else if (frequency === "Three Times Daily") count = 3;
  else if (frequency === "Four Times Daily") count = 4;

  timeInputsContainer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.type = "time";
    input.className = "time-input";
    input.required = true;
    timeInputsContainer.appendChild(input);
  }
}

// Add reminder
function addReminder(event) {
  event.preventDefault();

  const timeInputs = document.querySelectorAll(".time-input");
  const times = Array.from(timeInputs)
    .map((input) => input.value)
    .filter((time) => time);

  const reminder = {
    medicineName: document.getElementById("medicineName").value,
    dosage: document.getElementById("dosage").value,
    frequency: document.getElementById("frequency").value,
    times: times,
    duration: document.getElementById("duration").value,
    instructions: document.getElementById("instructions").value,
    createdAt: new Date().toISOString(),
  };

  reminders.push(reminder);

  // Save to backend or localStorage
  // await saveToBackend(reminder);

  loadReminders();
  updateStatistics();
  closeAddModal();
  showSuccess("✓ Reminder added successfully!");
}

// Delete reminder
function deleteReminder(index) {
  if (confirm("Are you sure you want to delete this reminder?")) {
    reminders.splice(index, 1);

    // Delete from backend
    // await deleteFromBackend(reminderId);

    loadReminders();
    updateStatistics();
    showSuccess("✓ Reminder deleted successfully!");
  }
}

// Show success message
function showSuccess(message) {
  const successMsg = document.getElementById("successMessage");
  const successText = document.getElementById("successText");
  successText.textContent = message;
  successMsg.classList.add("show");

  setTimeout(() => {
    successMsg.classList.remove("show");
  }, 3000);
}

// Close modal on outside click
document
  .getElementById("addReminderModal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      closeAddModal();
    }
  });

// Initialize on page load
document.addEventListener("DOMContentLoaded", initializePage);

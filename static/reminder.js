// User data from backend
let userData = {};

// Fetch user data
async function getUserData() {
  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    userData = data;
    console.log("User Data:", userData);
    
    // Update UI with user data
    if (userData.fname && userData.lname) {
      const initials = userData.fname.charAt(0) + userData.lname.charAt(0);
      document.getElementById("navUserAvatar").textContent = initials.toUpperCase();
      document.getElementById("navUserName").textContent = `${userData.fname} ${userData.lname}`;
      document.getElementById("navUserEmail").textContent = userData.email;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

// Reminders array
let reminders = [];

// Fetch reminders on page load
function fetchReminders() {
  fetch('/api/reminders/user', {
    method: 'GET',
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      reminders = data.reminders || [];
      loadReminders();
      updateStatistics();
    })
    .catch(error => {
      console.error("Error fetching reminders:", error);
      reminders = [];
      loadReminders();
      updateStatistics();
    });
}

// Initialize page
async function initializePage() {
  // Get user data first
  await getUserData();
  
  // Load reminders from backend
  fetchReminders();
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
      (reminder) => {
        // Try different possible ID field names
        const reminderId = reminder._id || reminder.id || reminder.reminderId || '';
        return `
        <div class="reminder-card">
          <div class="reminder-header">
            <div>
              <div class="reminder-name">${reminder.medicineName}</div>
              <span class="reminder-dosage">💊 ${reminder.dosage}</span>
            </div>
            <button class="btn btn-delete" onclick="deleteReminder('${reminderId}')">
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
          <div class="reminder-details">
            <div class="reminder-detail-item">
              <div class="detail-icon">🕐</div>
              <span><strong>Time:</strong> ${reminder.time}</span>
            </div>
          </div>
        </div>
      `;
      }
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
    const time = reminder.time;
    if (time) {
      const hour = parseInt(time.split(":")[0]);
      if (hour >= 5 && hour < 12) morning++;
      else if (hour >= 12 && hour < 17) afternoon++;
      else if (hour >= 17 && hour < 21) evening++;
      else night++;
    }
  });

  document.getElementById("morningCount").textContent = morning;
  document.getElementById("afternoonCount").textContent = afternoon;
  document.getElementById("eveningCount").textContent = evening;
  document.getElementById("nightCount").textContent = night;
}

// Open add modal
function openAddModal() {
  document.getElementById("addReminderModal").classList.add("show");
  // Add one time input by default
  const timeInputsContainer = document.getElementById("timeInputs");
  timeInputsContainer.innerHTML = "";
  const input = document.createElement("input");
  input.type = "time";
  input.className = "time-input";
  input.required = true;
  timeInputsContainer.appendChild(input);
}

// Close add modal
function closeAddModal() {
  document.getElementById("addReminderModal").classList.remove("show");
  document.getElementById("reminderForm").reset();
}

// Add reminder
let isSubmitting = false; // Flag to prevent double submission

function addReminder(event) {
  event.preventDefault();
  event.stopPropagation();

  // Prevent double submission
  if (isSubmitting) {
    console.log("Already submitting, ignoring duplicate request");
    return;
  }

  const timeInput = document.querySelector(".time-input");
  const time = timeInput ? timeInput.value : "";

  const medicineName = document.getElementById("medicineName").value.trim();
  const dosage = document.getElementById("dosage").value.trim();

  // Check if all fields are filled
  if (!medicineName || !dosage || !time) {
    alert("Please fill in all fields");
    return;
  }

  const reminderData = {
    medicineName: medicineName,
    dosage: dosage,
    time: time,
  };

  // Set flag and disable submit button
  isSubmitting = true;
  const submitButton = event.target.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
  }

  console.log("Submitting reminder:", reminderData); // Debug log

  fetch('/api/reminders/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(reminderData),
  })
    .then(response => {
      console.log("Response status:", response.status); // Debug log
      if (!response.ok) {
        throw new Error('Failed to add reminder');
      }
      return response.json();
    })
    .then(data => {
      console.log("Reminder added successfully:", data);
      closeAddModal();
      showSuccess("✓ Reminder added successfully!");
      
      // Wait a bit before fetching to ensure backend has processed
      setTimeout(() => {
        fetchReminders();
      }, 300);
    })
    .catch(error => {
      console.error("Error adding reminder:", error);
      alert("Failed to add reminder. Please try again.");
    })
    .finally(() => {
      // Reset flag and re-enable submit button
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span>💾</span><span>Save Reminder</span>';
      }
    });
}

// Delete reminder
function deleteReminder(reminderId) {
  console.log("Deleting reminder with ID:", reminderId); // Debug log
  
  if (!reminderId) {
    console.error("No reminder ID provided");
    alert("Error: Cannot delete reminder without ID");
    return;
  }
  
  if (confirm("Are you sure you want to delete this reminder?")) {
    fetch(`/api/reminders/delete/${reminderId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete reminder');
        }
        return response.json();
      })
      .then(data => {
        console.log("Reminder deleted:", data);
        showSuccess("✓ Reminder deleted successfully!");
        fetchReminders(); // Refresh the list from backend
      })
      .catch(error => {
        console.error("Error deleting reminder:", error);
        alert("Failed to delete reminder. Please try again.");
      });
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

// Event Listeners
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM loaded, initializing page..."); // Debug log
  
  // Initialize page
  initializePage();

  // Form submit listener
  const reminderForm = document.getElementById("reminderForm");
  if (reminderForm) {
    console.log("Form found, attaching listener"); // Debug log
    reminderForm.addEventListener("submit", addReminder);
  }

  // Close modal on outside click
  const modal = document.getElementById("addReminderModal");
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeAddModal();
      }
    });
  }
});
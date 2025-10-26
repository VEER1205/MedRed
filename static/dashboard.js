// Sample data from backend (replace with actual API calls)

fetch('/api/info', {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching user info:', data.error);
            } else {
                console.log('User info fetched successfully:', data);
                userData = data.user;
                reminders = data.reminders;
                addressData = data.address;
                initializeDashboard();
            }
        })
        .catch(error => console.error('Error fetching data:', error));

// Initialize dashboard
function initializeDashboard() {
  // Set user info in navbar
  const initials = userData.fname.charAt(0) + userData.lname.charAt(0);
  document.getElementById("navUserAvatar").textContent = initials.toUpperCase();
  document.getElementById(
    "navUserName"
  ).textContent = `${userData.fname} ${userData.lname}`;
  document.getElementById("navUserEmail").textContent = userData.email;
  document.getElementById("welcomeName").textContent = userData.fname;

  // Populate personal information
  document.getElementById("mobileNumber").textContent = userData.mobileNumber;
  document.getElementById("gender").textContent = userData.gender;
  document.getElementById("birthDate").textContent = formatDate(
    userData.birthDate
  );
  document.getElementById("bloodGroup").textContent =
    userData.bloodGroup || "Not specified";

  // Populate address information
  document.getElementById("streetAddress").textContent =
    addressData.streetAddress;
  document.getElementById("city").textContent = addressData.city;
  document.getElementById("state").textContent = addressData.state;
  document.getElementById("pinCode").textContent = addressData.pinCode;
  document.getElementById("country").textContent = addressData.country;

  // Populate medical information
  document.getElementById("emergencyContact").textContent =
    userData.emergencyContactNumber || "Not specified";
  document.getElementById("allergies").textContent =
    userData.allergies || "None";
  document.getElementById("medicalConditions").textContent =
    userData.medicalConditions || "None";

  // Load reminders
  loadReminders();
}

// Format date
function formatDate(dateString) {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Load reminders
function loadReminders() {
  const reminderList = document.getElementById("reminderList");
  document.getElementById("reminderCount").textContent = reminders.length;

  if (reminders.length === 0) {
    reminderList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">💊</div>
                        <p>No reminders for today</p>
                    </div>
                `;
    return;
  }

  reminderList.innerHTML = reminders
    .map(
      (reminder) => `
                <div class="reminder-item">
                    <div class="reminder-time">
                        <div class="time-value">${reminder.time}</div>
                        <div class="time-label">Time</div>
                    </div>
                    <div class="reminder-details">
                        <div class="reminder-medicine">${reminder.medicineName}</div>
                        <div class="reminder-dosage">💊 ${reminder.dosage}</div>
                    </div>
                </div>
            `
    )
    .join("");
}

// Action functions
function editProfile() {
  alert("Redirecting to edit profile...");
  // window.location.href = '/edit-profile.html';
}

function addReminder() {
  alert("Redirecting to add reminder...");
  // window.location.href = '/reminders.html';
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initializeDashboard);

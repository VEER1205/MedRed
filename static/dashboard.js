// DATA (mock - used as fallback)
const deep = (o) => JSON.parse(JSON.stringify(o));
let userData = {
  fname: "John",
  lname: "Doe",
  email: "john@example.com",
  mobileNumber: "+91 9876543210",
  gender: "Male",
  birthDate: "1990-01-15",
  bloodGroup: "O+",
  emergencyContactNumber: "+91 9123456789",
  allergies: "Penicillin",
  medicalConditions: "Hypertension",
};
let addressData = {
  streetAddress: "123 Medical St",
  city: "Mumbai",
  state: "Maharashtra",
  pinCode: "400001",
};
let reminders = [
  {
    id: rid(),
    time: "08:00 AM",
    medicineName: "Amoxicillin",
    dosage: "500 mg",
    done: false,
  },
  {
    id: rid(),
    time: "01:00 PM",
    medicineName: "Ibuprofen",
    dosage: "200 mg",
    done: false,
  },
  {
    id: rid(),
    time: "09:00 PM",
    medicineName: "Lisinopril",
    dosage: "10 mg",
    done: false,
  },
];

let user = userData;
let addr = addressData;
let editing = false;

// Elements
const toast = document.getElementById("toast");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

// Initialize app once when page loads
initializeApp();

function initializeApp() {
  // Set up event listeners (only once)
  editBtn.addEventListener("click", () => setEdit(true));
  cancelBtn.addEventListener("click", cancelEdit);
  saveBtn.addEventListener("click", saveChanges);
  
  // Setup navbar
  setupNavbar();
  
  initDNA(); // 3D medical line
  
  // Fetch data from API
  fetchUserData();
}

function setupNavbar() {
  const avatar = document.getElementById("navUserAvatar");
  if (avatar) {
    avatar.addEventListener("click", () => {
      const menu = document.getElementById("userMenu");
      if (menu) {
        menu.classList.toggle("show");
      }
    });
  }
  
  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    const menu = document.getElementById("userMenu");
    const avatar = document.getElementById("navUserAvatar");
    if (menu && !avatar?.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove("show");
    }
  });
}

function fetchUserData() {
  fetch('/api/info', {
    method: 'GET',
    credentials: 'include',
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error('Error fetching user info:', data.error);
      // Use mock data as fallback
      refreshDashboard();
    } else {
      console.log('User info fetched successfully:', data);
      userData = data.user;
      reminders = data.reminders;
      addressData = data.address;
      refreshDashboard();
    }
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    // Use mock data as fallback
    refreshDashboard();
  });
}

function refreshDashboard() {
  user = userData;
  addr = addressData;
  populateUI();
  loadReminders();
}

function populateUI() {
  const initials = (user.fname.charAt(0) + user.lname.charAt(0)).toUpperCase();
  document.getElementById("navUserAvatar").textContent = initials;
  document.getElementById("welcomeName").textContent = user.fname;

  setField(
    "fullName",
    `${user.fname} ${user.lname}`,
    `${user.fname} ${user.lname}`
  );
  setField("mobileNumber", user.mobileNumber);
  setField("gender", user.gender);
  setField("birthDate", formatDate(user.birthDate), user.birthDate);
  setField("bloodGroup", user.bloodGroup || "N/A");

  setField("streetAddress", addr.streetAddress);
  setField("city", addr.city);
  setField("state", addr.state);
  setField("pinCode", addr.pinCode);

  setField("allergies", user.allergies || "None");
  setField("medicalConditions", user.medicalConditions || "None");
  setField("emergencyContact", user.emergencyContactNumber || "N/A");
}

function setField(key, viewVal, inputVal = viewVal) {
  const d = document.getElementById(`${key}_display`);
  const i = document.getElementById(`${key}_input`);
  if (d) d.textContent = viewVal;
  if (i) i.value = inputVal;
}

// Edit mode
function setEdit(on) {
  editing = on;
  document.body.classList.toggle("editing", on);
  editBtn.hidden = on;
  saveBtn.hidden = !on;
  cancelBtn.hidden = !on;
  
  // Clear all validation errors when entering edit mode
  if (on) {
    clearAllErrors();
    setTimeout(() => document.querySelector(".editor .input")?.focus(), 50);
  }
}

function cancelEdit() {
  user = userData;
  addr = addressData;
  populateUI();
  setEdit(false);
  clearAllErrors();
  toastMsg("Changes discarded");
}

// VALIDATION FUNCTIONS
function validateForm() {
  let isValid = true;
  clearAllErrors();

  // Full Name validation
  const fullName = val("fullName_input").trim();
  if (!fullName) {
    showError("fullName_input", "Name is required");
    isValid = false;
  } else if (fullName.length < 2) {
    showError("fullName_input", "Name must be at least 2 characters");
    isValid = false;
  } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
    showError("fullName_input", "Name can only contain letters and spaces");
    isValid = false;
  }

  // Mobile Number validation
  const mobile = val("mobileNumber_input").trim();
  if (!mobile) {
    showError("mobileNumber_input", "Mobile number is required");
    isValid = false;
  } else if (!/^\+?\d{10,15}$/.test(mobile.replace(/[\s-]/g, ''))) {
    showError("mobileNumber_input", "Enter a valid mobile number (10-15 digits)");
    isValid = false;
  }

  // Gender validation
  const gender = val("gender_input").trim();
  if (!gender) {
    showError("gender_input", "Gender is required");
    isValid = false;
  }

  // Birth Date validation
  const birthDate = val("birthDate_input");
  if (!birthDate) {
    showError("birthDate_input", "Birth date is required");
    isValid = false;
  } else {
    const date = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    if (date > today) {
      showError("birthDate_input", "Birth date cannot be in the future");
      isValid = false;
    } else if (age > 150) {
      showError("birthDate_input", "Please enter a valid birth date");
      isValid = false;
    }
  }

  // Blood Group validation
  const bloodGroup = val("bloodGroup_input").trim();
  if (bloodGroup && bloodGroup !== "N/A") {
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodGroups.includes(bloodGroup.toUpperCase())) {
      showError("bloodGroup_input", "Enter a valid blood group (e.g., O+, A-, AB+)");
      isValid = false;
    }
  }

  // Street Address validation
  const street = val("streetAddress_input").trim();
  if (!street) {
    showError("streetAddress_input", "Street address is required");
    isValid = false;
  } else if (street.length < 5) {
    showError("streetAddress_input", "Address must be at least 5 characters");
    isValid = false;
  }

  // City validation
  const city = val("city_input").trim();
  if (!city) {
    showError("city_input", "City is required");
    isValid = false;
  } else if (!/^[a-zA-Z\s]+$/.test(city)) {
    showError("city_input", "City can only contain letters");
    isValid = false;
  }

  // State validation
  const state = val("state_input").trim();
  if (!state) {
    showError("state_input", "State is required");
    isValid = false;
  } else if (!/^[a-zA-Z\s]+$/.test(state)) {
    showError("state_input", "State can only contain letters");
    isValid = false;
  }

  // PIN Code validation
  const pin = val("pinCode_input").trim();
  if (!pin) {
    showError("pinCode_input", "PIN code is required");
    isValid = false;
  } else if (!/^\d{6}$/.test(pin)) {
    showError("pinCode_input", "PIN code must be 6 digits");
    isValid = false;
  }

  // Emergency Contact validation
  const emergency = val("emergencyContact_input").trim();
  if (emergency && emergency !== "N/A") {
    if (!/^\+?\d{10,15}$/.test(emergency.replace(/[\s-]/g, ''))) {
      showError("emergencyContact_input", "Enter a valid phone number");
      isValid = false;
    }
  }

  return isValid;
}

function showError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Add error class to input
  input.classList.add("error");

  // Create error message element
  const errorEl = document.createElement("div");
  errorEl.className = "error-message";
  errorEl.textContent = message;
  errorEl.id = `${inputId}_error`;

  // Insert error message after input
  const editor = input.closest(".editor");
  if (editor && !document.getElementById(`${inputId}_error`)) {
    editor.appendChild(errorEl);
  }

  // Focus on first error
  if (!document.querySelector(".input.error:focus")) {
    input.focus();
  }
}

function clearAllErrors() {
  // Remove error classes
  document.querySelectorAll(".input.error").forEach(input => {
    input.classList.remove("error");
  });

  // Remove error messages
  document.querySelectorAll(".error-message").forEach(msg => {
    msg.remove();
  });
}

function saveChanges() {
  // Validate form before saving
  if (!validateForm()) {
    toastMsg("❌ Please fix the errors before saving");
    return;
  }

  const fullName = val("fullName_input").trim();
  if (fullName) {
    const [first, ...rest] = fullName.split(" ");
    user.fname = first || user.fname;
    user.lname = rest.join(" ") || user.lname;
  }
  user.mobileNumber = val("mobileNumber_input").trim();
  user.gender = val("gender_input").trim();
  user.birthDate = val("birthDate_input");
  user.bloodGroup = val("bloodGroup_input").trim().toUpperCase();
  user.allergies = val("allergies_input").trim() || "None";
  user.medicalConditions = val("medicalConditions_input").trim() || "None";
  user.emergencyContactNumber = val("emergencyContact_input").trim() || "N/A";

  addr.streetAddress = val("streetAddress_input").trim();
  addr.city = val("city_input").trim();
  addr.state = val("state_input").trim();
  addr.pinCode = val("pinCode_input").trim();

  userData = deep(user);
  addressData = deep(addr);

  populateUI();
  setEdit(false);
  toastMsg("✅ Profile updated successfully");

  // Send to backend
  fetch('/api/info', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({ user, address: addr }) 
  })
  .then(response => response.json())
  .then(data => {
    console.log('Profile saved to backend:', data);
  })
  .catch(error => {
    console.error('Error saving to backend:', error);
    toastMsg("⚠️ Saved locally, but server update failed");
  });
}

function val(id) {
  return document.getElementById(id)?.value ?? "";
}

// Reminders
function loadReminders() {
  reminders.sort((a, b) => toMin(a.time) - toMin(b.time));
  const list = document.getElementById("reminderList");
  document.getElementById("reminderCount").textContent = reminders.length;

  if (!reminders.length) {
    list.innerHTML = `<div class="row" style="justify-content:center;text-align:center;">No reminders for today 🎉</div>`;
    return;
  }

  list.innerHTML = reminders
    .map(
      (r) => `
        <div class="rem" data-id="${r.id}">
          <div class="time">
            <div class="big">${r.time}</div>
            <div class="small">Time</div>
          </div>
          <div class="med">
            <div class="name">${escape(r.medicineName)}</div>
            <div class="dose">Dosage: ${escape(r.dosage)}</div>
          </div>
          <div class="chips">
            <button class="chip ${r.done ? "done" : ""}" data-action="done">${
        r.done ? "✓ Done" : "Mark Done"
      }</button>
            <button class="chip" data-action="snooze">Snooze +10m</button>
          </div>
        </div>
      `
    )
    .join("");

  list.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".rem");
      const id = card?.dataset.id;
      const item = reminders.find((x) => x.id === id);
      if (!item) return;
      const action = e.currentTarget.dataset.action;
      if (action === "done") {
        item.done = !item.done;
        loadReminders();
        toastMsg(item.done ? "💊 Marked done" : "Marked pending");
      }
      if (action === "snooze") {
        toastMsg("⏱️ Snoozed 10 minutes");
      }
    });
  });
}

// 3D DNA LINE (no libraries)
function initDNA() {
  const root = document.getElementById("dnaRoot");
  if (!root) return;

  const scene = root.parentElement;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const isMobile = window.matchMedia("(max-width: 480px)").matches;

  const N = isMobile ? 36 : 52; // number of segments
  const radiusY = 18; // vertical amplitude
  const radiusZ = 70; // depth amplitude
  const turns = 2.2; // number of helix turns across width
  const speed = 0.4; // rotation speed

  // Build nodes (two strands)
  const nodesA = [];
  const nodesB = [];
  for (let i = 0; i < N; i++) {
    const a = document.createElement("span");
    a.className = "node";
    const b = document.createElement("span");
    b.className = "node";
    root.appendChild(a);
    root.appendChild(b);
    nodesA.push(a);
    nodesB.push(b);
  }

  function layout(time) {
    const w = scene.clientWidth;
    const usableW = w - 80; // padding for edges
    const phase = (time / 1000) * speed * Math.PI * 2 * 0.12;

    // center the helix group
    root.style.transform = "translate3d(-50%,-50%,0)";

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = (t - 0.5) * usableW;
      const ang = t * turns * Math.PI * 2 + phase;

      // Strand A (front when cos > 0)
      const yA = Math.sin(ang) * radiusY;
      const zA = Math.cos(ang) * radiusZ;

      // Strand B is opposite phase
      const yB = -yA;
      const zB = -zA;

      const depthA = (zA + radiusZ) / (2 * radiusZ); // 0..1
      const depthB = (zB + radiusZ) / (2 * radiusZ);

      const scaleA = 0.85 + depthA * 0.35;
      const scaleB = 0.85 + depthB * 0.35;

      const a = nodesA[i];
      const b = nodesB[i];

      a.style.transform = `translate3d(${x}px, ${yA}px, ${zA}px) scale(${scaleA})`;
      b.style.transform = `translate3d(${x}px, ${yB}px, ${zB}px) scale(${scaleB})`;

      a.classList.toggle("back", zA < 0);
      b.classList.toggle("back", zB < 0);
    }
  }

  if (!prefersReduced) {
    let raf;
    const tick = (t) => {
      layout(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Resize handling
    window.addEventListener("resize", () => layout(performance.now()));
  } else {
    layout(0);
  }
}

// Helpers
function formatDate(dstr) {
  if (!dstr) return "Not specified";
  const d = new Date(dstr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function toMin(t12) {
  const [t, mer] = t12.split(" ");
  let [h, m] = t.split(":").map(Number);
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + m;
}
function toastMsg(msg) {
  const el = document.createElement("div");
  el.className = "item";
  el.textContent = msg;
  toast.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .25s ease, transform .25s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    setTimeout(() => el.remove(), 220);
  }, 1800);
}
function escape(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}
function rid() {
  return Math.random().toString(36).slice(2);
}
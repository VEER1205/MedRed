// API Configuration - Update these with your actual backend URLs
const API_BASE_URL = "http://localhost:8000"; // Change this to your backend URL

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  clearErrors();
}

function switchModal(closeId, openId) {
  closeModal(closeId);
  openModal(openId);
}

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
    clearErrors();
  }
};

// Clear all error messages
function clearErrors() {
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((el) => {
    el.style.display = "none";
    el.textContent = "";
  });
}

// Show error message
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  clearErrors();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(
      `${API_BASE_URL}/login?email=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.ok) {
      // Successful login - redirect will be handled by backend
      window.location.href = "/";
    } else {
      const data = await response.json();
      showError(
        "loginError",
        data.detail || "Login failed. Please check your credentials."
      );
    }
  } catch (error) {
    showError(
      "loginError",
      "Unable to connect to server. Please try again later."
    );
    console.error("Login error:", error);
  }
}

// Handle Signup
async function handleSignup(event) {
  event.preventDefault();
  clearErrors();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  // Validate name has at least first and last name
  if (name.trim().split(" ").length < 2) {
    showError(
      "signupNameError",
      "Please enter your full name (first and last name)"
    );
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: name,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Account created successfully! Please log in.");
      switchModal("signupModal", "loginModal");
      // Pre-fill login email
      document.getElementById("loginEmail").value = email;
    } else {
      showError(
        "signupError",
        data.detail || "Registration failed. Please try again."
      );
    }
  } catch (error) {
    showError(
      "signupError",
      "Unable to connect to server. Please try again later."
    );
    console.error("Signup error:", error);
  }
}

// Smooth scroll to features
function scrollToFeatures() {
  document.getElementById("features").scrollIntoView({ behavior: "smooth" });
}

// Function to get cookie value by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Decode base64 URL (used in JWT)
function decodeBase64Url(base64Url) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  return atob(base64 + '='.repeat((4 - pad) % 4));
}

// Decode JWT and get payload
function getUserFromToken() {
  const token = getCookie("token");
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1]; // JWT format: header.payload.signature
    const decodedPayload = decodeBase64Url(payloadBase64);
    const payload = JSON.parse(decodedPayload);
    return payload.sub; // You embedded `sub` as the user data (name/email/userId)
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
}

// Update UI based on user info
function updateUIFromToken() {
  const user = getUserFromToken();
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const userDisplay = document.getElementById("userNameDisplay");

  if (user) {
    // Example: if sub is full user object
    const username = user.name || user.fname || "User";
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
    if (userDisplay) {
      userDisplay.textContent = `👋 Hello, ${username}`;
      userDisplay.style.display = "inline-block";
    }
  } else {
    // Not logged in
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (signupBtn) signupBtn.style.display = "inline-block";
    if (userDisplay) userDisplay.style.display = "none";
  }
}

// Call it on page load
document.addEventListener("DOMContentLoaded", updateUIFromToken);

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent default form submit

    const formData = new URLSearchParams();
    formData.append("email", emailInput.value);
    formData.append("password", passwordInput.value);

    fetch("https://medred.onrender.com/api/login", {
      method: "POST",
      credentials: "include", // Important for cookies
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })
      .then((response) => {
        if (response.redirected) {
          // ✅ Redirect from FastAPI, follow it
          window.location.href = response.url;
        } else if (response.ok) {
          // fallback in case redirect fails
          window.location.href = response.url;
        } else {
          return response.json().then((data) => {
            alert("Login failed: " + (data.detail || "Unknown error"));
          });
        }
      })
      .catch((error) => {
        console.error("Login error:", error);
        alert("Network error or server is down.");
      });
  });

  // Password toggle
  const togglePassword = document.getElementById("togglePassword");
  togglePassword.addEventListener("click", function () {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    this.textContent = type === "password" ? "👁️" : "🙈";
  });
});

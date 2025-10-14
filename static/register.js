document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirm = document.getElementById("toggleConfirmPassword");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const toast = document.getElementById("toast");
  const passwordStrength = password.parentElement.nextElementSibling;
  const passwordStrengthBar = passwordStrength.querySelector(
    ".password-strength-bar"
  );
  const passwordHint = passwordStrength.nextElementSibling;

  function showToast(message, type = "success") {
    toast.className = `toast ${type}`;
    toast.querySelector(".toast-message").textContent = message;
    toast.querySelector(".toast-icon").textContent =
      type === "success" ? "✓" : "✕";
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  function checkPasswordStrength(pwd) {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++;
    if (pwd.match(/\d/)) strength++;
    if (pwd.match(/[^a-zA-Z\d]/)) strength++;

    return strength;
  }

  password.addEventListener("input", () => {
    const strength = checkPasswordStrength(password.value);

    if (password.value.length > 0) {
      passwordStrength.classList.add("show");
      passwordHint.classList.add("show");

      passwordStrengthBar.className = "password-strength-bar";
      if (strength <= 1) {
        passwordStrengthBar.classList.add("weak");
      } else if (strength <= 2) {
        passwordStrengthBar.classList.add("medium");
      } else {
        passwordStrengthBar.classList.add("strong");
      }
    } else {
      passwordStrength.classList.remove("show");
      passwordHint.classList.remove("show");
    }
  });

  togglePassword.addEventListener("click", () => {
    if (password.type === "password") {
      password.type = "text";
      togglePassword.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      togglePassword.setAttribute("title", "Hide Password");
    } else {
      password.type = "password";
      togglePassword.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      togglePassword.setAttribute("title", "Show Password");
    }
  });

  toggleConfirm.addEventListener("click", () => {
    if (confirmPassword.type === "password") {
      confirmPassword.type = "text";
      toggleConfirm.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      toggleConfirm.setAttribute("title", "Hide Password");
    } else {
      confirmPassword.type = "password";
      toggleConfirm.innerHTML =
        '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleConfirm.setAttribute("title", "Show Password");
    }
  });

  function validateField(field, condition, errorMsg) {
    const formGroup = field.closest(".form-group");
    if (!condition) {
      formGroup.classList.add("error");
      if (errorMsg) {
        formGroup.querySelector(".error-message").textContent = errorMsg;
      }
      return false;
    } else {
      formGroup.classList.remove("error");
      return true;
    }
  }

  [nameInput, emailInput, password, confirmPassword].forEach((field) => {
    field.addEventListener("input", () => {
      field.closest(".form-group").classList.remove("error");
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;

    isValid =
      validateField(
        nameInput,
        nameInput.value.trim().length >= 2,
        "Please enter your full name"
      ) && isValid;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    isValid =
      validateField(
        emailInput,
        emailRegex.test(emailInput.value),
        "Please enter a valid email address"
      ) && isValid;

    isValid =
      validateField(
        password,
        password.value.length >= 8,
        "Password must be at least 8 characters"
      ) && isValid;

    isValid =
      validateField(
        confirmPassword,
        password.value === confirmPassword.value,
        "Passwords do not match"
      ) && isValid;

    if (!isValid) {
      return;
    }

    const submitBtn = form.querySelector(".login-btn");
    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "Creating Account...";

    const formData = new URLSearchParams();
    formData.append("email", emailInput.value);
    formData.append("password", password.value);
    formData.append("username", nameInput.value);

    fetch("http://localhost:8000/api/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })
      .then((response) => {
        if (response.ok) {
          showToast("Account created successfully!", "success");
          setTimeout(() => {
            window.location.href = response.url;
          }, 1500);
        } else {
          return response.json().then((errorData) => {
            throw new Error(errorData.detail || "Failed to create account");
          });
        }
      })
      .catch((err) => {
        console.error("Request failed", err);
        showToast(err.message || "Error connecting to the server", "error");
        submitBtn.disabled = false;
        submitBtn.querySelector("span").textContent = "Create Account";
      });
  });
});

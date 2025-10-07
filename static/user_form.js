function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const profilePic = document.querySelector(".profile-pic");
      profilePic.style.backgroundImage = `url(${e.target.result})`;
      profilePic.style.backgroundSize = "cover";
      profilePic.style.backgroundPosition = "center";
      profilePic.textContent = "";
    };
    reader.readAsDataURL(file);
  }
}

document
  .getElementById("userInfoForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    console.log("Form Data:", data);
    alert(
      "User information saved successfully!\n\nCheck console for submitted data."
    );
  });

function resetForm() {
  if (
    confirm(
      "Are you sure you want to cancel? All unsaved changes will be lost."
    )
  ) {
    document.getElementById("userInfoForm").reset();
    const profilePic = document.querySelector(".profile-pic");
    profilePic.style.backgroundImage = "";
    profilePic.textContent = "JD";
  }
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    alert("Logging out...");
  }
}

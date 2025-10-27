// Initialize user data
let userData = {
    fname: '',
    lname: '',
    email: ''
};

// Function to load user data from backend
async function loadUserData() {
    try {
        const response = await fetch('/api/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user data');
        }
        
        const data = await response.json();
        console.log('User Data from Backend:', data);

        userData = { fname: data.fname, lname: data.lname, email: data.email };
        
        // Populate form fields
        document.getElementById('fname').value = data.fname || '';
        document.getElementById('lname').value = data.lname || '';
        document.getElementById('email').value = data.email || '';
        
        // Update header and profile pic
        updateUserHeader();
        updateProfilePic();
    } catch (error) {
        console.error('Error loading user data:', error);
        showSuccessMessage('✗ Error loading user data. Please refresh the page.');
    }
}

// Update user header
function updateUserHeader() {
    if (userData.fname && userData.lname && userData.email) {
        const fullName = `${userData.fname} ${userData.lname}`;
        const initials = `${userData.fname.charAt(0)}${userData.lname.charAt(0)}`.toUpperCase();
        
        const header = document.querySelector('.header');
        const userInfoHTML = `
            <div class="user-info-header">
                <div class="user-avatar">${initials}</div>
                <div class="user-details">
                    <div class="user-name">${fullName}</div>
                    <div class="user-email">${userData.email}</div>
                </div>
            </div>
        `;
        
        const existingUserInfo = header.querySelector('.user-info-header');
        if (existingUserInfo) {
            existingUserInfo.outerHTML = userInfoHTML;
        } else {
            header.insertAdjacentHTML('beforeend', userInfoHTML);
        }
    }
}

// Update profile pic
function updateProfilePic() {
    if (userData.fname && userData.lname) {
        const initials = `${userData.fname.charAt(0)}${userData.lname.charAt(0)}`.toUpperCase();
        document.getElementById('profilePic').textContent = initials;
    }
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const profilePic = document.getElementById('profilePic');
            profilePic.style.backgroundImage = `url(${e.target.result})`;
            profilePic.style.backgroundSize = 'cover';
            profilePic.style.backgroundPosition = 'center';
            profilePic.textContent = '';
        };
        reader.readAsDataURL(file);
    }
}

// Show success message
function showSuccessMessage(message) {
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => messageDiv.classList.add('show'), 100);
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => messageDiv.remove(), 400);
    }, 3000);
}

// Validate mobile number (10 digits)
function validateMobileNumber(mobile) {
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobile);
}

// Validate PIN code (6 digits for India)
function validatePinCode(pin) {
    const pinRegex = /^\d{6}$/;
    return pinRegex.test(pin);
}

// Validate date (must be in the past)
function validateBirthDate(date) {
    if (!date) return false;
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate < today;
}

// Add error to form group
function showError(formGroup, message) {
    formGroup.classList.add('error');
    let errorDiv = formGroup.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        formGroup.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// Remove error from form group
function clearError(formGroup) {
    formGroup.classList.remove('error');
    const errorDiv = formGroup.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Validate form
function validateForm(formData) {
    let isValid = true;

    // Clear all previous errors
    document.querySelectorAll('.form-group.error').forEach(group => {
        clearError(group);
    });

    // Validate mobile number
    const mobileGroup = document.getElementById('mobileNumber').closest('.form-group');
    if (!formData.mobileNumber || !validateMobileNumber(formData.mobileNumber)) {
        showError(mobileGroup, 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }

    // Validate emergency contact if provided
    const emergencyGroup = document.getElementById('emergencyContactNumber').closest('.form-group');
    if (!formData.emergencyContactNumber) {
        showError(emergencyGroup, 'Emergency contact number is required');
        isValid = false;
    } else if (!validateMobileNumber(formData.emergencyContactNumber)) {
        showError(emergencyGroup, 'Please enter a valid 10-digit emergency contact number');
        isValid = false;
    }

    // Validate gender
    if (!formData.gender) {
        const genderGroup = document.querySelector('input[name="gender"]').closest('.form-group');
        showError(genderGroup, 'Please select a gender');
        isValid = false;
    }

    // Validate birth date
    const birthDateGroup = document.getElementById('birthDate').closest('.form-group');
    if (!formData.birthDate) {
        showError(birthDateGroup, 'Birth date is required');
        isValid = false;
    } else if (!validateBirthDate(formData.birthDate)) {
        showError(birthDateGroup, 'Please enter a valid birth date in the past');
        isValid = false;
    }

    // Validate blood group
    const bloodGroup = document.getElementById('bloodGroup').closest('.form-group');
    if (!formData.bloodGroup) {
        showError(bloodGroup, 'Blood group is required');
        isValid = false;
    }

    // Validate street address
    const streetGroup = document.getElementById('streetAddress').closest('.form-group');
    if (!formData.streetAddress || formData.streetAddress.trim().length < 5) {
        showError(streetGroup, 'Please enter a valid street address (minimum 5 characters)');
        isValid = false;
    }

    // Validate city
    const cityGroup = document.getElementById('city').closest('.form-group');
    if (!formData.city || formData.city.trim().length < 2) {
        showError(cityGroup, 'Please enter a valid city name');
        isValid = false;
    }

    // Validate state
    const stateGroup = document.getElementById('state').closest('.form-group');
    if (!formData.state || formData.state.trim().length < 2) {
        showError(stateGroup, 'Please enter a valid state name');
        isValid = false;
    }

    // Validate PIN code
    const pinGroup = document.getElementById('pinCode').closest('.form-group');
    if (!formData.pinCode || !validatePinCode(formData.pinCode)) {
        showError(pinGroup, 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    // Validate country
    const countryGroup = document.getElementById('country').closest('.form-group');
    if (!formData.country) {
        showError(countryGroup, 'Please select a country');
        isValid = false;
    }

    return isValid;
}

// Handle form submission
document.getElementById('userInfoForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Convert FormData to object for validation
    const formDataObj = new FormData(this);
    const data = Object.fromEntries(formDataObj);

    // Validate form
    if (!validateForm(data)) {
        return;
    }

    // Disable submit button
    const submitBtn = this.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
        // Create properly formatted FormData with explicit content type
        const formData = new FormData();
        
        // Add all form fields explicitly with proper validation
        formData.append('mobileNumber', data.mobileNumber || '');
        formData.append('emergencyContactNumber', data.emergencyContactNumber || '');
        
        // IMPORTANT: Ensure birthDate is properly formatted (YYYY-MM-DD)
        if (data.birthDate && data.birthDate.trim()) {
            formData.append('birthDate', data.birthDate.trim());
        } else {
            // If no birth date, don't send it or send a default
            alert('Please select a birth date');
            return;
        }
        
        formData.append('city', data.city || '');
        formData.append('gender', data.gender || '');
        formData.append('streetAddress', data.streetAddress || '');
        formData.append('state', data.state || '');
        formData.append('pinCode', data.pinCode || '');
        formData.append('country', data.country || '');
        formData.append('bloodGroup', data.bloodGroup || '');
        formData.append('medicalConditions', data.medicalConditions || '');
        formData.append('allergies', data.allergies || '');

        // Debug: Log all form data
        console.log('=== FORM DATA BEING SENT ===');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: "${value}" (type: ${typeof value}, length: ${value.length})`);
        }
        console.log('===========================');

        const response = await fetch('/api/updateUser/', {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
            let errorMessage = 'Failed to save user information';
            let rawResponse = '';
            try {
                rawResponse = await response.text();
                console.error('Raw error response:', rawResponse);
                
                const errorData = JSON.parse(rawResponse);
                console.error('Parsed error response:', errorData);
                
                // Handle validation errors
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        // FastAPI validation errors
                        console.error('Validation errors:', errorData.detail);
                        const errors = errorData.detail.map(err => {
                            const field = err.loc ? err.loc.join('.') : 'unknown';
                            const message = err.msg || 'validation error';
                            const type = err.type || '';
                            return `Field: ${field}\nMessage: ${message}\nType: ${type}`;
                        }).join('\n---\n');
                        errorMessage = `Validation errors:\n${errors}`;
                        alert(`Validation errors:\n\n${errors}`);
                    } else if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail;
                        alert(`Error: ${errorData.detail}`);
                    } else {
                        errorMessage = JSON.stringify(errorData.detail);
                        alert(`Error: ${errorMessage}`);
                    }
                }
            } catch (e) {
                console.error('Could not parse error response:', e);
                console.error('Raw response was:', rawResponse);
                errorMessage = `Server returned status ${response.status}. Raw response: ${rawResponse.substring(0, 500)}`;
                alert(errorMessage);
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Form submission successful:', result);
        showSuccessMessage('✓ User information saved successfully!');

        // Optional: Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);

    } catch (error) {
        console.error('Error saving user information:', error);
        showSuccessMessage(`✗ ${error.message}`);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Reset form
function resetForm() {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        document.getElementById('userInfoForm').reset();
        
        // Restore readonly fields
        document.getElementById('fname').value = userData.fname;
        document.getElementById('lname').value = userData.lname;
        document.getElementById('email').value = userData.email;
        
        // Clear all errors
        document.querySelectorAll('.form-group.error').forEach(group => {
            clearError(group);
        });
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/api/logout', {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            if (response.ok) {
                window.location.href = '/';
            } else {
                console.error('Logout failed:', response);
            }
        });
    }
}

// Add input event listeners for real-time validation
document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('input', function() {
        const formGroup = this.closest('.form-group');
        if (formGroup && formGroup.classList.contains('error')) {
            clearError(formGroup);
        }
    });
});

// Mobile number formatting (only digits, max 10)
document.getElementById('mobileNumber').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
});

document.getElementById('emergencyContactNumber').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
});

// PIN code formatting (only digits, max 6)
document.getElementById('pinCode').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
});

// Set max date for birth date (today)
document.getElementById('birthDate').setAttribute('max', new Date().toISOString().split('T')[0]);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    
    // Auto-resize textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
});
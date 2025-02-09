// VERY IMPORTANT: Replace this with your *ACTUAL* deployed Google Apps Script web app URL.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwCOPTB7DYA5NfzDgJUbtVBH4eFBd5VljTsl7X528dcqp0CPL1flLlZxo8carqo2Er/exec'; // !!! CHANGE THIS !!!

// Calculates age in years (or months if less than 1 year).
function calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    // If the birth date month/day is in the future, subtract 1 from the year.
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

  //අවුරුද්දට අඩු නම් මාස ගානෙන් වයස හදනවා
    if (age < 1 && age >= 0) {
        const months = (today.getMonth() - birthDate.getMonth()) + (12 * (today.getFullYear() - birthDate.getFullYear()));
        if(today.getDate() < birthDate.getDate()){
            return (months -1) + " months";
        }
        return months + " months";
    }

    return age; // Return age in years.
}

// Calculates passport expiry date (10 years from issue date).
function calculateExpiry(issueDate) {
    const date = new Date(issueDate);
    date.setFullYear(date.getFullYear() + 10);
    return date.toISOString().split('T')[0];
}

// --- Get references to key input fields (outside any function, so they're accessible globally) ---
const dateOfBirthInput = document.getElementById('dateOfBirth');
const issueDateInput = document.getElementById('issueDate');
const passportNumberInput = document.getElementById('passportNumber');

// Updates age when date of birth changes, and validates age.
dateOfBirthInput.addEventListener('change', function() {
    const age = calculateAge(this.value);
    const ageErrorDiv = document.getElementById('ageError');
    const dobErrorDiv = document.getElementById('dateOfBirthError');

    // Check for negative age.
    if (age < 0) {
        ageErrorDiv.textContent = 'Age cannot be negative.';
        dobErrorDiv.textContent = ''; // Clear any other error message
        document.getElementById('age').value = '';   // Clear age
        this.value = ''; // Clear the date of birth
    } else {
        ageErrorDiv.textContent = ''; // Clear error message
        dobErrorDiv.textContent = '';
        document.getElementById('age').value = age; // Display the calculated age.
    }
});

// Updates expiry date when issue date changes.
issueDateInput.addEventListener('change', function() {
    document.getElementById('expiryDate').value = calculateExpiry(this.value);
});

// Clears error/thank you messages (kept for potential use, although error handling is now more specific).
function closeAlert() {
    document.getElementById('thankYouMessage').style.display = 'none';
    document.getElementById('error-message').style.display = 'none'; // This is for the general error message div
}

// Validates the passport number format.
function validatePassportNumber(passportNumber) {
    const passportRegex = /^[A-Z]{1}[0-9]{7,9}$/;  // Passport Number format (e.g., N1234567)
    return passportRegex.test(passportNumber);
}

// Handles input changes in the passport number field (validation and duplicate check).
async function handlePassportInput() {
    const newPassportNumber = passportNumberInput.value;
    const isDuplicate = await checkDuplicateOnPassportChange();  // Check for duplicates (async call)
    const isValid = validatePassportNumber(newPassportNumber); // Check format

    // Get the *specific* error message div for the passport number.
    const passportErrorDiv = document.getElementById('passportNumberError');
    passportErrorDiv.textContent = ''; // Clear any previous error message
    passportNumberInput.classList.remove('validation-error-style', 'highlight-error'); // Remove error styles

    if (!isValid) {
        passportErrorDiv.textContent = "Invalid Passport Number Format!"; // English error
        passportNumberInput.classList.add('validation-error-style');
        return;  // Stop if invalid
    }

    if (isDuplicate) {
        passportErrorDiv.textContent = "Passport Number is Already exists!"; // English error
        passportNumberInput.classList.add('highlight-error');
        return; // Stop if duplicate
    }
}

// Attach the event listener to the passport number field.
passportNumberInput.addEventListener('input', handlePassportInput);

// Checks for duplicate passport numbers *asynchronously*.
async function checkDuplicateOnPassportChange() {
    const newPassportNumber = passportNumberInput.value;
    // Make the request to your Google Apps Script.
    const isDuplicate = await fetch(SCRIPT_URL + "?action=checkDuplicate&passportNumber=" + encodeURIComponent(newPassportNumber))
        .then(response => response.json())
        .then(result => result.isDuplicate);

      const passportErrorDiv = document.getElementById('passportNumberError');

    if (isDuplicate) {
        return true;
    } else {

        return false;
    }
}

// Function to search for companies (async because it uses fetch).
async function searchCompanies(searchTerm) {
    const customerCodeInput = document.getElementById('customerCode');
    const searchResultsDiv = document.getElementById('searchResults');

    // Fetch company data, including the search term.
    const companyData = await fetch(SCRIPT_URL + "?action=searchCompanies&term=" + encodeURIComponent(searchTerm))
        .then(response => response.json());

    console.log("Company Data:", companyData); // Log for debugging (optional).

    // Function to display the search results in the #searchResults div.
    function displaySearchResults(companies) {
        searchResultsDiv.innerHTML = ''; // Clear previous results.

        if (companies.length === 0) {
            searchResultsDiv.innerHTML = '<p>No matching companies found.</p>'; // English message
            searchResultsDiv.style.display = 'block'; // Show even with no results
            return;
        }

        companies.forEach(company => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('cursor-pointer', 'hover:bg-gray-100', 'p-2', 'border-b');
            resultItem.textContent = company[0]; // Display the company name.
            resultItem.addEventListener('click', function() {
                customerCodeInput.value = company[1];  // Set the customer code.
                document.getElementById('companySearch').value = company[0]; // Set the search bar text.
                searchResultsDiv.style.display = 'none'; // Hide results on click.
            });
            searchResultsDiv.appendChild(resultItem);
        });

        searchResultsDiv.style.display = 'block'; // Show the results.
    }

    displaySearchResults(companyData); // Call the function to display the results.
}

// Add an event listener to the company search input field.
document.getElementById('companySearch').addEventListener('input', function() {
    searchCompanies(this.value); // Call searchCompanies on every input change.
});

// Scrolls to the top of the page (currently unused).
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Smooth scroll.
    });
}

//Name validation
function validateNameField(inputElement, errorElementId) {
  const nameRegex = /^[a-zA-Z\s]+$/; // අකුරුයි හිස්තැනුයි විතරයි allow කරන්නේ
  const value = inputElement.value;
  const errorDiv = document.getElementById(errorElementId);

  if (!nameRegex.test(value)) {
    errorDiv.textContent = "Invalid characters in name. Please use only letters and spaces.";
    inputElement.classList.add('validation-error-style');
  } else {
    errorDiv.textContent = '';
    inputElement.classList.remove('validation-error-style');
  }
}

// Event listeners for name fields
const participantNameInput = document.getElementById('participantName');
participantNameInput.addEventListener('input', function() {
  let value = this.value;
    //මෙතන තමයි වැඩිපුර space අයින් කරන්නේ
 value = value.replace(/ +(?= )/g, ''); // Keep multiple spaces between words
  this.value = value;
  validateNameField(this, 'participantNameError');
});

const surnameInput = document.getElementById('surname');
surnameInput.addEventListener('input', function() {
    let value = this.value;
     value = value.replace(/ +(?= )/g, ''); // Keep multiple spaces
    this.value = value;
  validateNameField(this, 'surnameError');
});

const otherNamesInput = document.getElementById('otherNames');
if (otherNamesInput) {
    otherNamesInput.addEventListener('input', function() {
       let value = this.value;
       value = value.replace(/ +(?= )/g, ''); // Keep multiple spaces
        this.value = value;
        validateNameField(this, 'otherNamesError');
    });
}

// Event listener for mobile number
const mobileNumberInput = document.getElementById('mobileNumber');
mobileNumberInput.addEventListener('input', function(){
    const mobileNumber = this.value;
    const mobileNumberErrorDiv = document.getElementById('mobileNumberError');

     // Regular expression for a simple Sri Lankan mobile number format
    const mobileRegex = /^07[0-9]{8}$/;

    // Remove non-numeric characters (for extra safety)
    this.value = this.value.replace(/[^0-9]/g, '');

    if (!mobileRegex.test(mobileNumber)) {
        mobileNumberErrorDiv.textContent = "Invalid mobile number format.  Use 07XXXXXXXX.";
        this.classList.add('validation-error-style');
    }
    else if (mobileNumber.length != 10){
        mobileNumberErrorDiv.textContent = "Mobile Number must have 10 digits.";
        this.classList.add('validation-error-style');
    }
     else {
        mobileNumberErrorDiv.textContent = '';
        this.classList.remove('validation-error-style');
    }
});

// Handles form submission (async because it uses fetch).
document.getElementById('participantForm').addEventListener('submit', async e => {
    e.preventDefault(); // Prevent default form submission.

    const button = document.querySelector('button[type="submit"]');
    const spinner = document.getElementById('spinner');
    const thankYouMessage = document.getElementById('thankYouMessage');
    const form = document.getElementById('participantForm');
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData) {
        data[key] = value;
    }

    const newPassportNumber = data["passportNumber"];

    // Show loading animation.
    const loadingAnimation = document.getElementById('loading-animation');
    loadingAnimation.classList.remove('hidden');

    // Hide form elements (to show loading animation clearly).
    const formElements = form.querySelectorAll(
        '#formInputs input, #formInputs textarea, #formInputs button, #formInputs label, #formInputs select, #formInputs h2'
    );
    formElements.forEach(element => {
        element.style.display = 'none';
    });

    // Clear *all* previous error messages.  VERY IMPORTANT.
    document.querySelectorAll('.text-red-500').forEach(el => el.textContent = '');

    // Check for duplicate passport (again, before final submission).
    const isDuplicate = await fetch(SCRIPT_URL + "?action=checkDuplicate&passportNumber=" + encodeURIComponent(newPassportNumber))
    .then(response => response.json())
    .then(result => result.isDuplicate);

    // Hide loading animation.
    loadingAnimation.classList.add('hidden');

    if (isDuplicate) {
        // Display duplicate passport number error *specifically*.
        document.getElementById('passportNumberError').textContent = "Duplicate Passport Number!"; // English error
        passportNumberInput.classList.add('highlight-error');

        // Show form elements again.
        formElements.forEach(element => {
            element.style.display = '';
        });

        thankYouMessage.style.display = 'none';
        button.disabled = false;
        spinner.classList.add('hidden');

        return;  // Stop form submission.
    }

    // If no duplicate, proceed with form submission.
    const thankYouDiv = document.getElementById('thankYouMessage');
    thankYouDiv.style.display = 'block';
    const thankYouElements = thankYouDiv.querySelectorAll('*');
    thankYouElements.forEach(element => {
        element.style.display = 'block';
    });

    button.disabled = true; // Disable submit button.
    spinner.classList.remove('hidden'); // Show spinner.

    try {
        // Send the form data to your Google Apps Script.
        const response = await fetch(
            SCRIPT_URL + '?data=' + encodeURIComponent(JSON.stringify(data)),
            {
                method: 'GET',
                mode: 'cors'
            }
        );

        const result = await response.json();

        if (result.result === 'success') {
            // Success: Display thank you message.
            thankYouMessage.innerHTML = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative" role="alert">
                    <strong class="font-bold">Thank you!</strong>
                    <span class="block sm:inline"> Your application has been submitted.</span>
                </div>
                `;
            thankYouMessage.style.display = 'block';
            document.getElementById('formInputs').style.display = 'block';

        } else if (result.result === 'error') {
            // Error: Display specific error messages next to relevant fields.
            console.error('Error saving data:', result.error);

            // Check for specific error messages and display them.  This is the KEY part.
            if (result.error.includes("companyName")) {
                document.getElementById('companySearchError').textContent = "Please select a valid company.";
            } else if (result.error.includes("participantName")){
                document.getElementById('participantNameError').textContent = "Please Enter a valid name";
            }else if(result.error.includes("surname")){
                document.getElementById('surnameError').textContent = "Please Enter a valid Surname";
            }else if(result.error.includes("gender")){
                document.getElementById('genderError').textContent = "Please Select Gender";
            }else if(result.error.includes("dateOfBirth")){
                document.getElementById('dateOfBirthError').textContent = "Please Select Date Of Birth";
            }else if(result.error.includes("age")){
                document.getElementById('ageError').textContent = "Please Enter a valid Age";
            }else if(result.error.includes("mobileNumber")){
                document.getElementById('mobileNumberError').textContent = "Please Enter a valid Mobile Number";
            }else if(result.error.includes("passportNumber")){
                document.getElementById('passportNumberError').textContent = "Please Enter a valid Passport Number";
            }else if(result.error.includes("issueDate")){
                document.getElementById('issueDateError').textContent = "Please Select Passport Issue Date";
            }else if(result.error.includes("expiryDate")){
                document.getElementById('expiryDateError').textContent = "Please Enter Expiry Date";
            }else if(result.error.includes("tshirtSize")){
                document.getElementById('tshirtSizeError').textContent = "Please Select T-Shirt Size";
            }else if(result.error.includes("mealPreference")){
                document.getElementById('mealPreferenceError').textContent = "Please Select Meal Preference";
            }else if(result.error.includes("additionalParticipants")){
                document.getElementById('additionalParticipantsError').textContent = "Please Select Yes/No";
            }
            else {
                // Display a generic error message if no specific field error is found.
                const errorMessageDiv = document.getElementById('error-message');
                const errorTextSpan = document.getElementById('error-text');
                errorTextSpan.textContent = result.error;  // Show the raw error (for debugging)
                errorMessageDiv.style.display = 'block';
            }

            thankYouMessage.style.display = 'none';
            formElements.forEach(element => {
                element.style.display = '';
            });
        }
    } catch (error) {
        // Network error
        console.error('Error:', error);
        thankYouMessage.innerHTML = '<p>Oops! Something went wrong. Please try again.</p>';  // Generic error
        formElements.forEach(element => {
            element.style.display = '';
        });
    } finally {
        // Re-enable button, hide spinner
        button.disabled = false;
        spinner.classList.add('hidden');
    }
});

// Convert input fields to uppercase.
document.querySelectorAll('#formInputs input, #formInputs select').forEach(input => {
    input.addEventListener('input', function(e) {
        this.value = this.value.toUpperCase();
    });
});

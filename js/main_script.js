// Common JavaScript Functions for Subscriber Management and Utilities

// --- localStorage Helper Functions ---
const STORAGE_KEYS = {
  SUBSCRIBERS: 'subscribers',
  DEBTS: 'debts'
};

/**
 * Retrieves data from localStorage.
 * @param {string} key - The key to retrieve from localStorage.
 * @param {any} defaultValue - The default value to return if the key is not found.
 * @returns {any} The parsed data or the default value.
 */
function getFromLocalStorage(key, defaultValue = []) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  }
  catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Saves data to localStorage.
 * @param {string} key - The key to save to localStorage.
 * @param {any} value - The value to save (will be stringified).
 */
function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  }
  catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
}

/**
 * Removes an item from localStorage.
 * @param {string} key - The key to remove.
 */
function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  }
  catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error);
  }
}

// --- Subscriber Data Management ---
let subscribersData = getFromLocalStorage(STORAGE_KEYS.SUBSCRIBERS, []);

/**
 * Populates a select dropdown with subscriber names.
 * @param {string} selectElementId - The ID of the select element.
 * @param {string} phoneElementId - (Optional) The ID of the phone input element to auto-fill.
 * @param {string} phoneWrapperId - (Optional) The ID of the phone input's wrapper to hide.
 */
function populateSubscriberNames(selectElementId, phoneElementId, phoneWrapperId) {
  const nameSelect = document.getElementById(selectElementId);
  if (!nameSelect) return;

  nameSelect.innerHTML = '<option value="" disabled selected>اختر مشتركًا</option>'; // Default placeholder
  if (subscribersData.length === 0) {
    nameSelect.innerHTML = '<option value="" disabled selected>لا يوجد مشتركين</option>';
  }

  subscribersData.forEach(sub => {
    if (sub && sub.name && sub.phone) { // Ensure subscriber object is valid
        const option = document.createElement('option');
        option.value = sub.phone; // Store phone in value for easy retrieval
        option.textContent = sub.name;
        nameSelect.appendChild(option);
    }
  });

  if (phoneElementId) {
    const phoneInput = document.getElementById(phoneElementId);
    const phoneWrapper = phoneWrapperId ? document.getElementById(phoneWrapperId) : null;

    if (phoneInput) {
      nameSelect.addEventListener('change', () => {
        phoneInput.value = nameSelect.value;
        if (phoneWrapper) {
          phoneWrapper.style.display = 'none';
        }
      });
      // Initial population if there are subscribers
      if (subscribersData.length > 0 && nameSelect.options.length > 1) {
        nameSelect.selectedIndex = 1; // Select the first actual subscriber
        phoneInput.value = nameSelect.value;
        if (phoneWrapper) {
          phoneWrapper.style.display = 'none';
        }
      } else if (phoneWrapper) {
         phoneWrapper.style.display = 'block'; // Show if no subscribers or only placeholder
      }
    }
  }
}

// --- Date and Time Utilities ---

/**
 * Formats a 24-hour time string to a 12-hour format with AM/PM.
 * @param {string} time24 - The time in HH:MM format.
 * @returns {string} The formatted time string (e.g., "1:30 مساءً") or '---' if input is invalid.
 */
function formatTimeTo12Hour(time24) {
  if (!time24 || !time24.includes(':')) return '---';
  const [hourStr, minute] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  if (isNaN(hour) || isNaN(parseInt(minute, 10))) return '---';

  const ampm = hour >= 12 ? 'مساءً' : 'صباحًا';
  hour = hour % 12 || 12; // Convert hour to 12-hour format
  return `${hour}:${minute} ${ampm}`;
}

// --- UI Utilities ---

/**
 * Displays a temporary message to the user.
 * @param {string} elementId - The ID of the HTML element to display the message in.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info'} type - The type of message (for styling).
 * @param {number} duration - How long to display the message in milliseconds.
 */
function showUIMessage(elementId, message, type = 'info', duration = 3000) {
  const messageEl = document.getElementById(elementId);
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.className = `ui-message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.textContent = '';
    messageEl.style.display = 'none';
  }, duration);
}

// --- html2canvas Utilities (if html2canvas is loaded globally) ---

/**
 * Saves a given HTML element as a PNG image.
 * @param {string} elementId - The ID of the HTML element to capture.
 * @param {string} defaultFilename - The default filename if a dynamic one cannot be generated.
 * @param {string} nameSourceElementId - (Optional) ID of an element (e.g., select) to get a name for the file.
 */
function saveElementAsImage(elementId, defaultFilename = 'capture.png', nameSourceElementId) {
  const elementToCapture = document.getElementById(elementId);
  if (!elementToCapture) {
    console.error(`Element with ID "${elementId}" not found for image capture.`);
    showUIMessage('global-message', 'خطأ: لم يتم العثور على العنصر لحفظ الصورة.', 'error');
    return;
  }

  if (typeof html2canvas === 'undefined') {
    console.error('html2canvas library is not loaded.');
    showUIMessage('global-message', 'خطأ: مكتبة html2canvas غير محملة.', 'error');
    return;
  }

  let filename = defaultFilename;
  if (nameSourceElementId) {
    const nameSourceEl = document.getElementById(nameSourceElementId);
    if (nameSourceEl && nameSourceEl.selectedOptions && nameSourceEl.selectedOptions.length > 0) {
      filename = `${nameSourceEl.selectedOptions[0].textContent.trim() || defaultFilename.split('.')[0]}.png`;
    } else if (nameSourceEl && nameSourceEl.textContent) {
        filename = `${nameSourceEl.textContent.trim() || defaultFilename.split('.')[0]}.png`;
    }
  }

  html2canvas(elementToCapture, { useCORS: true, backgroundColor: '#ffffff' })
    .then(canvas => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showUIMessage('global-message', `تم حفظ الصورة كـ ${filename} بنجاح.`, 'success');
    })
    .catch(err => {
      console.error('Error capturing element with html2canvas:', err);
      showUIMessage('global-message', 'حدث خطأ أثناء حفظ الصورة.', 'error');
    });
}

/**
 * Shares an element as an image on WhatsApp, along with a message.
 * @param {string} elementIdToCapture - The ID of the HTML element to capture as an image.
 * @param {string} phoneNumberElementId - The ID of the input element containing the raw phone number.
 * @param {string} defaultFilename - Default filename for the image.
 * @param {string} nameSourceElementId - (Optional) ID of an element to get a name for the image file.
 * @param {string} whatsappMessage - The message to pre-fill in WhatsApp.
 */
function shareElementAsImageOnWhatsApp(elementIdToCapture, phoneNumberElementId, defaultFilename, nameSourceElementId, whatsappMessage = "يرجى الاطلاع على المرفق.") {
  const phoneEl = document.getElementById(phoneNumberElementId);
  if (!phoneEl || !phoneEl.value) {
    showUIMessage('global-message', 'الرجاء إدخال رقم هاتف صحيح للمشاركة.', 'error');
    return;
  }
  const rawPhone = phoneEl.value;
  // Basic formatting for Iraqi numbers, assuming it starts with 07xxxxxxxxx
  const formattedPhone = `+964${rawPhone.replace(/^0/, '')}`;

  const elementToCapture = document.getElementById(elementIdToCapture);
   if (!elementToCapture) {
    console.error(`Element with ID "${elementIdToCapture}" not found for WhatsApp share.`);
    showUIMessage('global-message', 'خطأ: لم يتم العثور على العنصر لمشاركته.', 'error');
    return;
  }

  if (typeof html2canvas === 'undefined') {
    console.error('html2canvas library is not loaded for WhatsApp share.');
    showUIMessage('global-message', 'خطأ: مكتبة html2canvas غير محملة.', 'error');
    return;
  }

  let filename = defaultFilename;
  if (nameSourceElementId) {
    const nameSourceEl = document.getElementById(nameSourceElementId);
    if (nameSourceEl && nameSourceEl.selectedOptions && nameSourceEl.selectedOptions.length > 0) {
      filename = `${nameSourceEl.selectedOptions[0].textContent.trim() || defaultFilename.split('.')[0]}.png`;
    }
  }

  html2canvas(elementToCapture, { useCORS: true, backgroundColor: '#ffffff' })
    .then(canvas => {
      // For WhatsApp, it's better to inform the user to share the image manually after saving
      // as directly sending image and text via wa.me link is unreliable across devices.
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click(); // Save the image first

      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage + ` (تم حفظ الصورة باسم: ${filename})`)}`;
      window.open(whatsappUrl, '_blank');
      showUIMessage('global-message', `تم حفظ الصورة. يمكنك الآن مشاركتها عبر واتساب مع الرسالة المجهزة.`, 'success');
    })
    .catch(err => {
      console.error('Error capturing element for WhatsApp:', err);
      showUIMessage('global-message', 'حدث خطأ أثناء تجهيز الصورة للمشاركة.', 'error');
    });
}

// --- Initialization for pages that use subscriber dropdowns ---
// Example: Call populateSubscriberNames on DOMContentLoaded if an element with ID 'nameSelect' exists.
// document.addEventListener('DOMContentLoaded', () => {
//   if (document.getElementById('nameSelect')) {
//     populateSubscriberNames('nameSelect', 'phone', 'phoneWrapper');
//   }
// });

console.log("main_script.js loaded");


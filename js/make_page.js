// Page-specific JavaScript for make.html

const makePageFunctions = {
  subscribersList: [], // Local list for this page

  initializePage: function() {
    // Attempt to load from localStorage if main_script.js has populated subscribersData
    // Otherwise, start fresh or allow user to load.
    if (typeof subscribersData !== "undefined" && subscribersData.length > 0) {
        this.subscribersList = JSON.parse(JSON.stringify(subscribersData)); // Deep copy to avoid modifying global directly unless intended
    } else {
        this.subscribersList = getFromLocalStorage(STORAGE_KEYS.SUBSCRIBERS, []);
    }
    this.renderSubscribersList();

    const addEntryForm = document.getElementById("addEntryForm");
    if (addEntryForm) {
      addEntryForm.addEventListener("submit", this.handleAddEntry.bind(this));
    }

    const phoneInput = document.getElementById("subscriberPhone");
    if (phoneInput) {
      phoneInput.addEventListener("input", this.formatPhoneNumber);
    }

    const fileInputElement = document.getElementById("fileInput");
    if (fileInputElement) {
      fileInputElement.addEventListener("change", this.handleJSONFileUpload.bind(this));
    }
  },

  formatPhoneNumber: function(event) {
    let value = event.target.value.replace(/\s+/g, 	c); // Remove spaces
    // Normalize Iraqi numbers: remove +964 or 00964, ensure it starts with 07
    value = value.replace(/^(\+964|00964)/, "0");
    if (value.startsWith("7") && !value.startsWith("07")) {
        value = "0" + value;
    }
    event.target.value = value.replace(/[^0-9]/g, ""); // Allow only numbers
  },

  handleAddEntry: function(event) {
    event.preventDefault();
    const nameInput = document.getElementById("subscriberName");
    const phoneInput = document.getElementById("subscriberPhone");
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name) {
      showUIMessage("form-message", "يرجى إدخال اسم المشترك.", "error");
      return;
    }
    if (!phone) {
      showUIMessage("form-message", "يرجى إدخال رقم هاتف المشترك.", "error");
      return;
    }
    // Basic phone validation (e.g., starts with 07 and has 11 digits for Iraq)
    if (!/^07[0-9]{9}$/.test(phone)) {
        showUIMessage("form-message", "يرجى إدخال رقم هاتف عراقي صحيح (مثال: 07xxxxxxxxx).", "error");
        return;
    }

    // Check for duplicates (by phone number)
    if (this.subscribersList.some(sub => sub.phone === phone)) {
      if (!confirm(`رقم الهاتف ${phone} موجود بالفعل. هل تريد إضافته مرة أخرى؟`)) {
        return;
      }
    }

    this.subscribersList.push({ name, phone });
    this.renderSubscribersList();
    saveToLocalStorage(STORAGE_KEYS.SUBSCRIBERS, this.subscribersList); // Save updated list
    subscribersData = JSON.parse(JSON.stringify(this.subscribersList)); // Update global if it exists

    nameInput.value = "";
    phoneInput.value = "";
    showUIMessage("form-message", `تمت إضافة المشترك ${name} بنجاح.`, "success");
  },

  renderSubscribersList: function() {
    const listElement = document.getElementById("subscribersList");
    if (!listElement) return;
    listElement.innerHTML = ""; // Clear existing list

    if (this.subscribersList.length === 0) {
      listElement.innerHTML = "<li class=\"make-list-item\">لا يوجد مشتركين حاليًا. قم بإضافة مشترك جديد أو تحميل ملف.</li>";
      return;
    }

    this.subscribersList.forEach((item, index) => {
      const listItem = document.createElement("li");
      listItem.className = "make-list-item";
      listItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="contact-name">${item.name}</div>
            <div class="contact-phone">${item.phone}</div>
          </div>
          <div>
            <button type="button" class="btn-icon btn-edit" onclick="makePageFunctions.editEntry(${index})" title="تعديل"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn-icon btn-delete" onclick="makePageFunctions.deleteEntry(${index})" title="حذف"><i class="fas fa-trash-alt"></i></button>
          </div>
        </div>
      `;
      listElement.appendChild(listItem);
    });
    // Add some CSS for btn-icon, btn-edit, btn-delete in style.css if not already present
    // e.g., .btn-icon { background:transparent; border:none; color: #007bff; cursor:pointer; padding: 5px;} .btn-delete { color: #dc3545; }
  },

  editEntry: function(index) {
    const entry = this.subscribersList[index];
    if (!entry) return;

    const newName = prompt("أدخل الاسم الجديد:", entry.name);
    if (newName === null) return; // User cancelled

    const newPhone = prompt("أدخل رقم الهاتف الجديد:", entry.phone);
    if (newPhone === null) return; // User cancelled

    if (newName.trim() && newPhone.trim()) {
        if (!/^07[0-9]{9}$/.test(newPhone.trim())) {
            showUIMessage("form-message", "رقم الهاتف المدخل غير صالح.", "error");
            return;
        }
        // Check if new phone number (if changed) already exists, excluding current entry
        if (newPhone.trim() !== entry.phone && this.subscribersList.some((sub, i) => i !== index && sub.phone === newPhone.trim())) {
            showUIMessage("form-message", `رقم الهاتف ${newPhone.trim()} موجود بالفعل لمشترك آخر.`, "error");
            return;
        }
        this.subscribersList[index] = { name: newName.trim(), phone: newPhone.trim() };
        this.renderSubscribersList();
        saveToLocalStorage(STORAGE_KEYS.SUBSCRIBERS, this.subscribersList);
        subscribersData = JSON.parse(JSON.stringify(this.subscribersList));
        showUIMessage("form-message", "تم تعديل بيانات المشترك بنجاح.", "success");
    } else {
        showUIMessage("form-message", "يجب إدخال الاسم ورقم الهاتف.", "error");
    }
  },

  deleteEntry: function(index) {
    const entry = this.subscribersList[index];
    if (!entry) return;
    if (confirm(`هل أنت متأكد أنك تريد حذف المشترك ${entry.name} (${entry.phone})؟`)) {
      this.subscribersList.splice(index, 1);
      this.renderSubscribersList();
      saveToLocalStorage(STORAGE_KEYS.SUBSCRIBERS, this.subscribersList);
      subscribersData = JSON.parse(JSON.stringify(this.subscribersList));
      showUIMessage("form-message", `تم حذف المشترك ${entry.name} بنجاح.`, "success");
    }
  },

  handleJSONFileUpload: function(event) {
    const file = event.target.files[0];
    if (!file) {
        showUIMessage("form-message", "لم يتم اختيار ملف.", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          // Simple merge: add new, non-duplicate entries
          let addedCount = 0;
          importedData.forEach(newItem => {
            if (newItem && newItem.name && newItem.phone && !this.subscribersList.some(existingItem => existingItem.phone === newItem.phone)) {
              this.subscribersList.push(newItem);
              addedCount++;
            }
          });
          this.renderSubscribersList();
          saveToLocalStorage(STORAGE_KEYS.SUBSCRIBERS, this.subscribersList);
          subscribersData = JSON.parse(JSON.stringify(this.subscribersList));
          showUIMessage("form-message", `تم تحميل البيانات من الملف. ${addedCount} مشترك جديد تمت إضافته.`, "success");
        } else {
          showUIMessage("form-message", "الملف غير صالح. تأكد أنه ملف JSON يحتوي على قائمة من الأسماء والأرقام.", "error");
        }
      } catch (err) {
        console.error("Error parsing JSON:", err);
        showUIMessage("form-message", "حدث خطأ أثناء قراءة أو تحليل ملف JSON.", "error");
      }
    };
    reader.onerror = () => {
        showUIMessage("form-message", "حدث خطأ أثناء قراءة الملف.", "error");
    };
    reader.readAsText(file);
    event.target.value = null; // Reset file input
  },

  downloadSubscribersJSON: function() {
    if (this.subscribersList.length === 0) {
      showUIMessage("form-message", "لا يوجد بيانات لتنزيلها. قم بإضافة مشتركين أولاً.", "info");
      return;
    }
    const filename = `معلومات المشتركين_${new Date().toISOString().slice(0,10)}.json`;
    const jsonStr = JSON.stringify(this.subscribersList, null, 2); // Pretty print JSON
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    saveAs(blob, filename); // saveAs from FileSaver.js
    showUIMessage("form-message", `تم تجهيز ملف ${filename} للتنزيل.`, "success");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  makePageFunctions.initializePage();
});

// Add to style.css if these are not globally defined:
/*
.btn-icon {
  background: transparent;
  border: none;
  color: #007bff;
  cursor: pointer;
  padding: 8px;
  margin: 0 5px;
  font-size: 16px;
}
.btn-icon:hover {
  opacity: 0.7;
}
.btn-edit {
  color: #28a745; 
}
.btn-delete {
  color: #dc3545;
}
.ui-message {
    padding: 10px;
    margin-top: 15px;
    border-radius: 5px;
    text-align: center;
    display: none; 
}
.ui-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}
.ui-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}
.ui-message.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}
*/

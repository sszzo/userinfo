// Global variables
let people = [];
let currentPersonId = null;
let currentDebtId = null; // جديد: لتخزين معرف الدين الحالي الذي يتم تسديده

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromStorage();
    setupEventListeners();
    renderPeopleTable();
});

// Setup event listeners
function setupEventListeners() {
    // Header buttons
    document.getElementById('addPersonBtn').addEventListener('click', openAddPersonModal);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    // File input for import
    document.getElementById('fileInput').addEventListener('change', importData);
    
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', filterAndSortPeople);
    document.getElementById('sortBy').addEventListener('change', filterAndSortPeople);
    document.getElementById('sortOrder').addEventListener('change', filterAndSortPeople);
    
    // Forms
    document.getElementById('addPersonForm').addEventListener('submit', handleAddPerson);
    document.getElementById('addDebtForm').addEventListener('submit', handleAddDebt);
    // جديد: فورم تسديد الدين
    document.getElementById('payOffDebtForm').addEventListener('submit', handlePayOffDebt); 
    
    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Data management functions
function loadDataFromStorage() {
    const storedData = localStorage.getItem('debtManagerData');
    if (storedData) {
        try {
            people = JSON.parse(storedData);
            // التأكد من أن لكل دين 'id' و 'date' إذا كانت البيانات قديمة
            people.forEach(person => {
                person.debts.forEach(debt => {
                    if (!debt.id) debt.id = generateId();
                    if (!debt.date) debt.date = new Date().toISOString();
                });
            });
        } catch (error) {
            console.error('Error loading data from storage:', error);
            people = [];
        }
    }
}

function saveDataToStorage() {
    try {
        localStorage.setItem('debtManagerData', JSON.stringify(people));
    } catch (error) {
        console.error('Error saving data to storage:', error);
        showMessage('حدث خطأ في حفظ البيانات', 'error');
    }
}

// Person management functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); // تقليل الطول قليلاً
}

function addPerson(name, debtAmount, debtNote) {
    const person = {
        id: generateId(),
        name: name.trim(),
        debts: [{
            id: generateId(),
            amount: parseFloat(debtAmount),
            note: debtNote.trim(),
            date: new Date().toISOString()
        }]
    };
    
    people.push(person);
    saveDataToStorage();
    renderPeopleTable();
    showMessage('تم إضافة الشخص بنجاح', 'success');
}

function deletePerson(personId) {
    if (confirm('هل أنت متأكد من حذف هذا الشخص وجميع ديونه؟')) {
        people = people.filter(person => person.id !== personId);
        saveDataToStorage();
        renderPeopleTable();
        showMessage('تم حذف الشخص بنجاح', 'success');
    }
}

function addDebtToPerson(personId, debtAmount, debtNote) {
    const person = people.find(p => p.id === personId);
    if (person) {
        const debt = {
            id: generateId(),
            amount: parseFloat(debtAmount),
            note: debtNote.trim(),
            date: new Date().toISOString()
        };
        
        person.debts.push(debt);
        saveDataToStorage();
        renderPersonDetails(personId); // إعادة عرض التفاصيل لتحديثها
        renderPeopleTable(); // تحديث الجدول الرئيسي
        showMessage('تم إضافة الدين بنجاح', 'success');
    }
}

function deleteDebt(personId, debtId) {
    if (confirm('هل أنت متأكد من حذف هذا الدين؟')) {
        const person = people.find(p => p.id === personId);
        if (person) {
            person.debts = person.debts.filter(debt => debt.id !== debtId);
            
            // If no debts left, remove the person
            if (person.debts.length === 0) {
                people = people.filter(p => p.id !== personId);
                closePersonDetailsModal(); // إغلاق المودال إذا تم حذف آخر دين للشخص
            }
            
            saveDataToStorage();
            renderPersonDetails(personId); // إعادة عرض التفاصيل لتحديثها
            renderPeopleTable(); // تحديث الجدول الرئيسي
            showMessage('تم حذف الدين بنجاح', 'success');
        }
    }
}

// جديد: دالة لتسديد جزء من الدين
function payOffDebt(personId, debtId, paidAmount, payNote) {
    const person = people.find(p => p.id === personId);
    if (!person) return;

    const debtIndex = person.debts.findIndex(d => d.id === debtId);
    if (debtIndex === -1) return;

    const originalDebt = person.debts[debtIndex];
    const amountToPay = parseFloat(paidAmount);

    if (amountToPay <= 0 || amountToPay > originalDebt.amount) {
        showMessage('مبلغ التسديد غير صالح.', 'error');
        return;
    }

    if (amountToPay === originalDebt.amount) {
        // تسديد الدين بالكامل
        deleteDebt(personId, debtId); // استخدام دالة الحذف الموجودة
        showMessage('تم تسديد الدين بالكامل بنجاح', 'success');
    } else {
        // تسديد جزء من الدين
        originalDebt.amount -= amountToPay; // خصم المبلغ المسدد
        // يمكن إضافة سجل للتسديد إذا أردنا تتبع الدفعات
        // مثلاً:
        // if (!originalDebt.payments) originalDebt.payments = [];
        // originalDebt.payments.push({ amount: amountToPay, note: payNote, date: new Date().toISOString() });
        
        saveDataToStorage();
        renderPersonDetails(personId); // تحديث تفاصيل الشخص
        renderPeopleTable(); // تحديث الجدول الرئيسي
        showMessage(`تم تسديد ${formatCurrency(amountToPay)} من الدين بنجاح. المبلغ المتبقي: ${formatCurrency(originalDebt.amount)}`, 'success');
    }
}


// Calculation functions
function calculateTotalDebt(person) {
    return person.debts.reduce((total, debt) => total + debt.amount, 0);
}

// تم تعديل هذه الدالة لجعل الأرقام باللغة الإنجليزية مع بقاء العملة الدينار العراقي
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { // تم تغيير الـ locale إلى 'en-US'
        style: 'currency',
        currency: 'IQD', // العملة تبقى الدينار العراقي
        minimumFractionDigits: 3
    }).format(amount);
}

// تم تعديل هذه الدالة لتنسيق التاريخ الميلادي بالأرقام الإنجليزية
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { // تغيير الـ locale إلى 'en-US' للأرقام الإنجليزية
        year: 'numeric',
        month: '2-digit', // سيظهر الشهر كرقم مكون من رقمين
        day: '2-digit',   // سيظهر اليوم كرقم مكون من رقمين
        hour: '2-digit',
        minute: '2-digit',
        calendar: 'gregory' // التأكد من استخدام التقويم الميلادي
    }).format(date);
}

// Rendering functions
function renderPeopleTable() {
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('peopleTableBody');
    
    if (people.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    // Get filtered and sorted people
    const filteredPeople = getFilteredAndSortedPeople();
    
    tableBody.innerHTML = '';
    
    filteredPeople.forEach(person => {
        const totalDebt = calculateTotalDebt(person);
        const debtCount = person.debts.length;
        
        const row = document.createElement('tr');
        // استخدام event delegation لفتح التفاصيل
        row.dataset.personId = person.id; // تخزين معرف الشخص في dataset
        row.innerHTML = `
            <td>${person.name}</td>
            <td class="debt-amount">${formatCurrency(totalDebt)}</td>
            <td>
                <span class="debt-count-badge">${debtCount}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" data-action="details" title="عرض التفاصيل">
                        <i class="fas fa-eye" data-action="details"></i>
                    </button>
                    <button class="btn-icon btn-delete" data-action="delete-person" title="حذف">
                        <i class="fas fa-trash" data-action="delete-person"></i>
                    </button>
                </div>
            </td>
        `;
        // إضافة مستمعي الأحداث للصف بأكمله وللأزرار المحددة
        row.addEventListener('click', (e) => {
            const targetAction = e.target.dataset.action || e.target.closest('button')?.dataset.action;
            if (targetAction === 'details') {
                openPersonDetails(person.id);
            } else if (targetAction === 'delete-person') {
                e.stopPropagation(); // منع فتح التفاصيل عند النقر على زر الحذف
                deletePerson(person.id);
            } else if (!targetAction) { // النقر على أي مكان آخر في الصف يفتح التفاصيل
                openPersonDetails(person.id);
            }
        });
        
        tableBody.appendChild(row);
    });
}

function renderPersonDetails(personId) {
    const person = people.find(p => p.id === personId);
    if (!person) {
        closePersonDetailsModal(); // إغلاق المودال إذا لم يتم العثور على الشخص (ربما تم حذفه)
        return;
    }
    
    const totalDebt = calculateTotalDebt(person);
    const debtCount = person.debts.length;
    
    // Update modal title and summary
    document.getElementById('personDetailsTitle').textContent = `تفاصيل ديون ${person.name}`;
    document.getElementById('totalDebtAmount').textContent = formatCurrency(totalDebt);
    document.getElementById('debtCount').textContent = debtCount;
    
    // Render debts list
    const debtsList = document.getElementById('debtsList');
    debtsList.innerHTML = '';
    
    if (person.debts.length === 0) {
        debtsList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">لا توجد ديون مسجلة</p>';
        return;
    }
    
    // Sort debts by date (newest first)
    const sortedDebts = [...person.debts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedDebts.forEach(debt => {
        const debtItem = document.createElement('div');
        debtItem.className = 'debt-item';
        debtItem.innerHTML = `
            <div class="debt-header">
                <span class="debt-amount-large">${formatCurrency(debt.amount)}</span>
                <span class="debt-date">${formatDate(debt.date)}</span>
            </div>
            ${debt.note ? `<div class="debt-note">${debt.note}</div>` : ''}
            <div class="debt-actions">
                <button class="btn-icon btn-pay" onclick="openPayOffDebtModal('${person.id}', '${debt.id}', ${debt.amount})" title="تسديد جزء أو كل الدين">
                    <i class="fas fa-hand-holding-dollar"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteDebt('${person.id}', '${debt.id}')" title="حذف الدين">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        debtsList.appendChild(debtItem);
    });
}

// Filter and sort functions
function getFilteredAndSortedPeople() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const sortBy = document.getElementById('sortBy').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    // Filter people
    let filteredPeople = people.filter(person => 
        person.name.toLowerCase().includes(searchTerm)
    );
    
    // Sort people
    filteredPeople.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'totalDebt':
                valueA = calculateTotalDebt(a);
                valueB = calculateTotalDebt(b);
                break;
            case 'debtCount':
                valueA = a.debts.length;
                valueB = b.debts.length;
                break;
            default:
                return 0;
        }
        
        if (sortOrder === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
    
    return filteredPeople;
}

function filterAndSortPeople() {
    renderPeopleTable();
}

// Modal functions
function openAddPersonModal() {
    document.getElementById('addPersonModal').classList.add('show');
    document.getElementById('personName').focus();
}

function closeAddPersonModal() {
    document.getElementById('addPersonModal').classList.remove('show');
    document.getElementById('addPersonForm').reset();
}

function openPersonDetails(personId) {
    currentPersonId = personId;
    renderPersonDetails(personId);
    document.getElementById('personDetailsModal').classList.add('show');
    
    // Setup add debt button
    document.getElementById('addDebtBtn').onclick = () => openAddDebtModal(personId);
}

function closePersonDetailsModal() {
    document.getElementById('personDetailsModal').classList.remove('show');
    currentPersonId = null;
    currentDebtId = null; // إعادة تعيين معرف الدين
}

function openAddDebtModal(personId) {
    currentPersonId = personId;
    document.getElementById('addDebtModal').classList.add('show');
    document.getElementById('newDebtAmount').focus();
}

function closeAddDebtModal() {
    document.getElementById('addDebtModal').classList.remove('show');
    document.getElementById('addDebtForm').reset();
}

// جديد: دالة لفتح مودال تسديد الدين
function openPayOffDebtModal(personId, debtId, currentAmount) {
    currentPersonId = personId;
    currentDebtId = debtId;
    
    const payOffAmountInput = document.getElementById('payOffAmount');
    const payOffDebtInfo = document.getElementById('payOffDebtInfo');
    
    payOffAmountInput.value = currentAmount; // تعيين القيمة الافتراضية للمبلغ الحالي
    payOffAmountInput.max = currentAmount; // تعيين الحد الأقصى للمبلغ
    payOffDebtInfo.textContent = `المبلغ الحالي: ${formatCurrency(currentAmount)}`; // عرض المبلغ الحالي

    document.getElementById('payOffDebtModal').classList.add('show');
    payOffAmountInput.focus();
}

// جديد: دالة لإغلاق مودال تسديد الدين
function closePayOffDebtModal() {
    document.getElementById('payOffDebtModal').classList.remove('show');
    document.getElementById('payOffDebtForm').reset();
    currentDebtId = null; // مسح معرف الدين عند الإغلاق
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    
    // Reset forms
    document.getElementById('addPersonForm').reset();
    document.getElementById('addDebtForm').reset();
    document.getElementById('payOffDebtForm').reset(); // جديد: إعادة تعيين فورم التسديد
    currentPersonId = null;
    currentDebtId = null; // جديد: مسح معرف الدين
}

// Form handlers
function handleAddPerson(e) {
    e.preventDefault();
    
    const name = document.getElementById('personName').value;
    const debtAmount = document.getElementById('debtAmount').value;
    const debtNote = document.getElementById('debtNote').value;
    
    if (!name.trim()) {
        showMessage('يرجى إدخال اسم الشخص', 'error');
        return;
    }
    
    if (!debtAmount || parseFloat(debtAmount) <= 0) {
        showMessage('يرجى إدخال مبلغ دين صحيح', 'error');
        return;
    }
    
    // Check if person already exists
    const existingPerson = people.find(p => p.name.toLowerCase() === name.toLowerCase().trim());
    if (existingPerson) {
        // Add debt to existing person
        addDebtToPerson(existingPerson.id, debtAmount, debtNote);
        showMessage(`تم إضافة دين جديد للشخص ${name}`, 'success');
    } else {
        // Add new person
        addPerson(name, debtAmount, debtNote);
    }
    
    closeAddPersonModal();
}

function handleAddDebt(e) {
    e.preventDefault();
    
    const debtAmount = document.getElementById('newDebtAmount').value;
    const debtNote = document.getElementById('newDebtNote').value;
    
    if (!debtAmount || parseFloat(debtAmount) <= 0) {
        showMessage('يرجى إدخال مبلغ دين صحيح', 'error');
        return;
    }
    
    if (currentPersonId) {
        addDebtToPerson(currentPersonId, debtAmount, debtNote);
        closeAddDebtModal();
    }
}

// جديد: معالج فورم تسديد الدين
function handlePayOffDebt(e) {
    e.preventDefault();

    const payOffAmount = document.getElementById('payOffAmount').value;
    const payOffNote = document.getElementById('payOffNote').value;

    if (!payOffAmount || parseFloat(payOffAmount) <= 0) {
        showMessage('يرجى إدخال مبلغ تسديد صحيح', 'error');
        return;
    }
    
    if (currentPersonId && currentDebtId) {
        payOffDebt(currentPersonId, currentDebtId, payOffAmount, payOffNote);
        closePayOffDebtModal();
    }
}

// Import/Export functions
function exportData() {
    try {
        const dataToExport = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            people: people
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `debt-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showMessage('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showMessage('حدث خطأ في تصدير البيانات', 'error');
    }
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Validate imported data
            if (!importedData.people || !Array.isArray(importedData.people)) {
                throw new Error('Invalid data format');
            }
            
            // Confirm import
            if (people.length > 0) {
                if (!confirm('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
                    return;
                }
            }
            
            people = importedData.people;
            // التأكد من أن لكل دين 'id' و 'date' بعد الاستيراد
            people.forEach(person => {
                person.debts.forEach(debt => {
                    if (!debt.id) debt.id = generateId();
                    if (!debt.date) debt.date = new Date().toISOString();
                });
            });

            saveDataToStorage();
            renderPeopleTable();
            showMessage('تم استيراد البيانات بنجاح', 'success');
            
        } catch (error) {
            console.error('Import error:', error);
            showMessage('حدث خطأ في استيراد البيانات. تأكد من صحة الملف.', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
}

// Utility functions
function showMessage(text, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${text}
    `;
    
    // Insert at the top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(message, mainContent.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N: Add new person
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddPersonModal();
    }
    
    // Ctrl/Cmd + E: Export data
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportData();
    }
    
    // Ctrl/Cmd + I: Import data
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        document.getElementById('fileInput').click();
    }
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

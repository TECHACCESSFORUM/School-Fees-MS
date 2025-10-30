// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully');
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
// Data Models and Storage
class DataManager {
    constructor() {
        this.classes = this.loadData('classes') || [];
        this.students = this.loadData('students') || [];
        this.teachers = this.loadData('teachers') || [];
        this.bills = this.loadData('bills') || [];
        this.payments = this.loadData('payments') || [];
        this.currentUser = null;
    }

    loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    saveAll() {
        this.saveData('classes', this.classes);
        this.saveData('students', this.students);
        this.saveData('teachers', this.teachers);
        this.saveData('bills', this.bills);
        this.saveData('payments', this.payments);
    }

    exportData() {
        return {
            classes: this.classes,
            students: this.students,
            teachers: this.teachers,
            bills: this.bills,
            payments: this.payments,
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.classes) this.classes = data.classes;
        if (data.students) this.students = data.students;
        if (data.teachers) this.teachers = data.teachers;
        if (data.bills) this.bills = data.bills;
        if (data.payments) this.payments = data.payments;
        this.saveAll();
    }

    clearAll() {
        this.classes = [];
        this.students = [];
        this.teachers = [];
        this.bills = [];
        this.payments = [];
        this.saveAll();
    }
}

// Authentication
class AuthManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.users = {
            admin: { password: 'admin123', role: 'admin' },
            cashier: { password: 'cashier123', role: 'cashier' }
        };
    }

    login(username, password) {
        const user = this.users[username];
        if (user && user.password === password) {
            this.dataManager.currentUser = { username, role: user.role };
            return true;
        }
        return false;
    }

    logout() {
        this.dataManager.currentUser = null;
    }

    isLoggedIn() {
        return this.dataManager.currentUser !== null;
    }

    isAdmin() {
        return this.dataManager.currentUser?.role === 'admin';
    }

    isCashier() {
        return this.dataManager.currentUser?.role === 'cashier';
    }
}

// UI Manager
class UIManager {
    constructor(dataManager, authManager) {
        this.dataManager = dataManager;
        this.authManager = authManager;
        this.currentTab = 'home';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showLoginScreen();
    }

    bindEvents() {
        // Login
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navigation
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Classes
        document.getElementById('class-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addClass();
        });

        // Students
        document.getElementById('student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });

        // Teachers
        document.getElementById('teacher-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTeacher();
        });

        // Billing
        document.getElementById('bill-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBill();
        });

        // Modals
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', () => {
                this.closeModals();
            });
        });

        document.getElementById('edit-student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStudent();
        });

        document.getElementById('payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordPayment();
        });

        // Reports
        document.getElementById('export-summary').addEventListener('click', () => {
            this.exportSummaryPDF();
        });

        document.getElementById('export-receipts').addEventListener('click', () => {
            this.exportReceiptsPDF();
        });

        // Settings
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                this.clearData();
            }
        });
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        this.updateUI();
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (this.authManager.login(username, password)) {
            this.showMainApp();
        } else {
            document.getElementById('login-error').textContent = 'Invalid credentials';
        }
    }

    handleLogout() {
        this.authManager.logout();
        this.showLoginScreen();
    }

    switchTab(tab) {
        // Check permissions
        if (tab === 'settings' && !this.authManager.isAdmin()) {
            alert('Access denied. Admin privileges required.');
            return;
        }

        this.currentTab = tab;
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
        });

        document.getElementById(tab + '-tab').classList.add('active');
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        this.updateTabContent(tab);
    }

    updateUI() {
        this.updateDashboard();
        this.updateClassesList();
        this.updateStudentsTable();
        this.updateTeachersTable();
        this.updateBillsTable();
        this.updateClassSelects();
        this.updateStudentSelects();
    }

    updateTabContent(tab) {
        switch (tab) {
            case 'home':
                this.updateDashboard();
                break;
            case 'classes':
                this.updateClassesList();
                break;
            case 'students':
                this.updateStudentsTable();
                break;
            case 'teachers':
                this.updateTeachersTable();
                break;
            case 'billing':
                this.updateBillsTable();
                break;
        }
    }

    updateDashboard() {
        const totalStudents = this.dataManager.students.length;
        const totalBilled = this.dataManager.bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const totalPaid = this.dataManager.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        const outstanding = totalBilled - totalPaid;

        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('total-billed').textContent = `$${totalBilled.toFixed(2)}`;
        document.getElementById('total-paid').textContent = `$${totalPaid.toFixed(2)}`;
        document.getElementById('total-outstanding').textContent = `$${outstanding.toFixed(2)}`;
    }

    addClass() {
        const name = document.getElementById('class-name').value.trim();
        if (name) {
            this.dataManager.classes.push({ id: Date.now(), name });
            this.dataManager.saveData('classes', this.dataManager.classes);
            document.getElementById('class-form').reset();
            this.updateClassesList();
            this.updateClassSelects();
        }
    }

    updateClassesList() {
        const list = document.getElementById('classes-list');
        list.innerHTML = '';
        this.dataManager.classes.forEach(cls => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${cls.name}</span>
                <button class="action-btn" onclick="uiManager.deleteClass(${cls.id})">Delete</button>
            `;
            list.appendChild(li);
        });
    }

    deleteClass(id) {
        if (confirm('Are you sure you want to delete this class?')) {
            this.dataManager.classes = this.dataManager.classes.filter(cls => cls.id !== id);
            this.dataManager.saveData('classes', this.dataManager.classes);
            this.updateClassesList();
            this.updateClassSelects();
        }
    }

    addStudent() {
        const name = document.getElementById('student-name').value.trim();
        const classId = parseInt(document.getElementById('student-class').value);
        const email = document.getElementById('student-email').value.trim();
        const phone = document.getElementById('student-phone').value.trim();

        if (name && classId) {
            const student = {
                id: Date.now(),
                name,
                classId,
                email,
                phone,
                balance: 0
            };
            this.dataManager.students.push(student);
            this.dataManager.saveData('students', this.dataManager.students);
            document.getElementById('student-form').reset();
            this.updateStudentsTable();
            this.updateStudentSelects();
            this.updateDashboard();
        }
    }

    updateStudentsTable() {
        const tbody = document.querySelector('#students-table tbody');
        tbody.innerHTML = '';

        this.dataManager.students.forEach(student => {
            const cls = this.dataManager.classes.find(c => c.id === student.classId);
            const balance = this.calculateStudentBalance(student.id);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.name}</td>
                <td>${cls ? cls.name : 'N/A'}</td>
                <td>${student.email || '-'}</td>
                <td>${student.phone || '-'}</td>
                <td>$${balance.toFixed(2)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="uiManager.editStudent(${student.id})">Edit</button>
                    <button class="action-btn pay-btn" onclick="uiManager.showPaymentModal(${student.id})">Pay</button>
                    <button class="action-btn" onclick="uiManager.deleteStudent(${student.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    calculateStudentBalance(studentId) {
        const bills = this.dataManager.bills.filter(bill => bill.studentId === studentId)
            .reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const payments = this.dataManager.payments.filter(payment => payment.studentId === studentId)
            .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        return bills - payments;
    }

    editStudent(id) {
        const student = this.dataManager.students.find(s => s.id === id);
        if (student) {
            document.getElementById('edit-student-name').value = student.name;
            document.getElementById('edit-student-email').value = student.email || '';
            document.getElementById('edit-student-phone').value = student.phone || '';
            this.updateEditClassSelect(student.classId);
            document.getElementById('edit-student-modal').classList.remove('hidden');
            this.editingStudentId = id;
        }
    }

    updateEditClassSelect(selectedClassId) {
        const select = document.getElementById('edit-student-class');
        select.innerHTML = '<option value="">Select Class</option>';
        this.dataManager.classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            if (cls.id === selectedClassId) option.selected = true;
            select.appendChild(option);
        });
    }

    updateStudent() {
        const name = document.getElementById('edit-student-name').value.trim();
        const classId = parseInt(document.getElementById('edit-student-class').value);
        const email = document.getElementById('edit-student-email').value.trim();
        const phone = document.getElementById('edit-student-phone').value.trim();

        if (name && classId && this.editingStudentId) {
            const student = this.dataManager.students.find(s => s.id === this.editingStudentId);
            if (student) {
                student.name = name;
                student.classId = classId;
                student.email = email;
                student.phone = phone;
                this.dataManager.saveData('students', this.dataManager.students);
                this.updateStudentsTable();
                this.updateStudentSelects();
                this.closeModals();
            }
        }
    }

    showPaymentModal(studentId) {
        this.paymentStudentId = studentId;
        document.getElementById('payment-modal').classList.remove('hidden');
    }

    recordPayment() {
        const amount = parseFloat(document.getElementById('payment-amount').value);
        if (amount > 0 && this.paymentStudentId) {
            const payment = {
                id: Date.now(),
                studentId: this.paymentStudentId,
                amount,
                date: new Date().toISOString()
            };
            this.dataManager.payments.push(payment);
            this.dataManager.saveData('payments', this.dataManager.payments);
            this.updateStudentsTable();
            this.updateDashboard();
            this.closeModals();
            document.getElementById('payment-form').reset();
        }
    }

    deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            this.dataManager.students = this.dataManager.students.filter(s => s.id !== id);
            this.dataManager.bills = this.dataManager.bills.filter(bill => bill.studentId !== id);
            this.dataManager.payments = this.dataManager.payments.filter(payment => payment.studentId !== id);
            this.dataManager.saveAll();
            this.updateStudentsTable();
            this.updateBillsTable();
            this.updateStudentSelects();
            this.updateDashboard();
        }
    }

    addTeacher() {
        const name = document.getElementById('teacher-name').value.trim();
        const email = document.getElementById('teacher-email').value.trim();
        const phone = document.getElementById('teacher-phone').value.trim();

        if (name) {
            this.dataManager.teachers.push({
                id: Date.now(),
                name,
                email,
                phone
            });
            this.dataManager.saveData('teachers', this.dataManager.teachers);
            document.getElementById('teacher-form').reset();
            this.updateTeachersTable();
        }
    }

    updateTeachersTable() {
        const tbody = document.querySelector('#teachers-table tbody');
        tbody.innerHTML = '';

        this.dataManager.teachers.forEach(teacher => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${teacher.name}</td>
                <td>${teacher.email || '-'}</td>
                <td>${teacher.phone || '-'}</td>
                <td>
                    <button class="action-btn" onclick="uiManager.deleteTeacher(${teacher.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    deleteTeacher(id) {
        if (confirm('Are you sure you want to delete this teacher?')) {
            this.dataManager.teachers = this.dataManager.teachers.filter(t => t.id !== id);
            this.dataManager.saveData('teachers', this.dataManager.teachers);
            this.updateTeachersTable();
        }
    }

    addBill() {
        const studentId = parseInt(document.getElementById('bill-student').value);
        const description = document.getElementById('bill-description').value.trim();
        const amount = parseFloat(document.getElementById('bill-amount').value);

        if (studentId && description && amount > 0) {
            this.dataManager.bills.push({
                id: Date.now(),
                studentId,
                description,
                amount,
                date: new Date().toISOString()
            });
            this.dataManager.saveData('bills', this.dataManager.bills);
            document.getElementById('bill-form').reset();
            this.updateBillsTable();
            this.updateStudentsTable();
            this.updateDashboard();
        }
    }

    updateBillsTable() {
        const tbody = document.querySelector('#bills-table tbody');
        tbody.innerHTML = '';

        this.dataManager.bills.forEach(bill => {
            const student = this.dataManager.students.find(s => s.id === bill.studentId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student ? student.name : 'Unknown'}</td>
                <td>${bill.description}</td>
                <td>$${parseFloat(bill.amount).toFixed(2)}</td>
                <td>${new Date(bill.date).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateClassSelects() {
        const selects = ['student-class', 'edit-student-class'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">Select Class</option>';
                this.dataManager.classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    select.appendChild(option);
                });
            }
        });
    }

    updateStudentSelects() {
        const selects = ['bill-student'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">Select Student</option>';
                this.dataManager.students.forEach(student => {
                    const option = document.createElement('option');
                    option.value = student.id;
                    option.textContent = student.name;
                    select.appendChild(option);
                });
            }
        });
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    exportSummaryPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('School Fees Management - Summary Report', 20, 30);

        const summaryData = [
            ['Total Students', this.dataManager.students.length],
            ['Total Teachers', this.dataManager.teachers.length],
            ['Total Classes', this.dataManager.classes.length],
            ['Total Billed', `$${this.dataManager.bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0).toFixed(2)}`],
            ['Total Paid', `$${this.dataManager.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}`],
            ['Outstanding', `$${this.calculateOutstanding().toFixed(2)}`]
        ];

        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryData
        });

        // Students table
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Students', 20, 30);

        const studentsData = this.dataManager.students.map(student => {
            const cls = this.dataManager.classes.find(c => c.id === student.classId);
            const balance = this.calculateStudentBalance(student.id);
            return [student.name, cls ? cls.name : 'N/A', `$${balance.toFixed(2)}`];
        });

        doc.autoTable({
            startY: 40,
            head: [['Name', 'Class', 'Balance']],
            body: studentsData
        });

        doc.save('school_fees_summary.pdf');
    }

    exportReceiptsPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        this.dataManager.payments.forEach((payment, index) => {
            if (index > 0) doc.addPage();

            const student = this.dataManager.students.find(s => s.id === payment.studentId);

            doc.setFontSize(20);
            doc.text('Payment Receipt', 20, 30);

            doc.setFontSize(12);
            doc.text(`Receipt #: ${payment.id}`, 20, 50);
            doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 20, 60);
            doc.text(`Student: ${student ? student.name : 'Unknown'}`, 20, 70);
            doc.text(`Amount Paid: $${parseFloat(payment.amount).toFixed(2)}`, 20, 80);

            const balance = this.calculateStudentBalance(payment.studentId);
            doc.text(`Outstanding Balance: $${balance.toFixed(2)}`, 20, 90);
        });

        doc.save('payment_receipts.pdf');
    }

    calculateOutstanding() {
        const totalBilled = this.dataManager.bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const totalPaid = this.dataManager.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        return totalBilled - totalPaid;
    }

    exportData() {
        const data = this.dataManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'school_fees_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.dataManager.importData(data);
                this.updateUI();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    clearData() {
        this.dataManager.clearAll();
        this.updateUI();
    }
}

// Initialize the application
const dataManager = new DataManager();
const authManager = new AuthManager(dataManager);
const uiManager = new UIManager(dataManager, authManager);
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
// Sync Manager for remote data operations
class SyncManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.remoteUrl = 'https://api.jsonbin.io/v3/b/6793e8b8acd3cb34a8c8e8e8'; // Replace with your JSONBin URL
        this.apiKey = 'YOUR_JSONBIN_API_KEY'; // Replace with your API key
        this.isSyncing = false;
        this.remoteEnabled = this.apiKey !== 'YOUR_JSONBIN_API_KEY' && this.remoteUrl !== 'https://api.jsonbin.io/v3/b/6793e8b8acd3cb34a8c8e8e8';
    }

    setSyncStatus(status) {
        const syncElement = document.getElementById('sync-status');
        if (syncElement) {
            syncElement.textContent = status;
            syncElement.classList.toggle('syncing', status === 'Syncing...');
        }
    }

    async syncToRemote() {
        if (this.isSyncing || !this.remoteEnabled) return;
        this.isSyncing = true;
        this.setSyncStatus('Syncing...');

        try {
            const data = this.dataManager.exportData();
            const response = await fetch(this.remoteUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Sync failed');

            this.setSyncStatus('Synced ✅');
        } catch (error) {
            console.error('Sync error:', error);
            this.setSyncStatus('Sync Failed ❌');
            setTimeout(() => this.setSyncStatus('Synced ✅'), 3000);
        } finally {
            this.isSyncing = false;
        }
    }

    async loadFromRemote() {
        if (!this.remoteEnabled) return false;
        try {
            const response = await fetch(this.remoteUrl, {
                headers: {
                    'X-Master-Key': this.apiKey
                }
            });

            if (!response.ok) throw new Error('Load failed');

            const result = await response.json();
            if (result.record) {
                this.dataManager.importData(result.record);
                return true;
            }
        } catch (error) {
            console.error('Load error:', error);
        }
        return false;
    }
}

// Data Models and Storage
class DataManager {
    constructor() {
        this.classes = this.loadData('classes') || [];
        this.students = this.loadData('students') || [];
        this.teachers = this.loadData('teachers') || [];
        this.billings = this.loadData('billings') || [];
        this.payments = this.loadData('payments') || [];
        this.currentUser = null;
        this.syncManager = new SyncManager(this);
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
        this.saveData('billings', this.billings);
        this.saveData('payments', this.payments);
    }

    exportData() {
        return {
            classes: this.classes,
            students: this.students,
            teachers: this.teachers,
            billings: this.billings,
            payments: this.payments,
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.classes) this.classes = data.classes;
        if (data.students) this.students = data.students;
        if (data.teachers) this.teachers = data.teachers;
        if (data.billings) this.billings = data.billings;
        if (data.payments) this.payments = data.payments;
        this.saveAll();
    }

    clearAll() {
        this.classes = [];
        this.students = [];
        this.teachers = [];
        this.billings = [];
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

    async init() {
        this.bindEvents();
        await this.dataManager.syncManager.loadFromRemote();
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

        // Radio button change events
        document.addEventListener('change', (e) => {
            if (e.target.name === 'class-select') {
                this.updateEditClassButton();
            } else if (e.target.name === 'teacher-select') {
                this.updateEditTeacherButton();
            }
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

        document.getElementById('edit-class-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateClass();
        });

        document.getElementById('edit-teacher-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTeacher();
        });

        document.getElementById('edit-class-btn').addEventListener('click', () => {
            this.editSelectedClass();
        });

        document.getElementById('edit-teacher-btn').addEventListener('click', () => {
            this.editSelectedTeacher();
        });

        document.getElementById('payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordPayment();
        });

        document.getElementById('edit-bill-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateBill();
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
        const totalBilled = this.dataManager.billings.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const totalPaid = this.dataManager.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        const outstanding = totalBilled - totalPaid;

        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('total-billed').textContent = `GH₵${totalBilled.toFixed(2)}`;
        document.getElementById('total-paid').textContent = `GH₵${totalPaid.toFixed(2)}`;
        document.getElementById('total-outstanding').textContent = `GH₵${outstanding.toFixed(2)}`;
    }

    addClass() {
        const name = document.getElementById('class-name').value.trim();
        if (name) {
            this.dataManager.classes.push({ id: Date.now(), name });
            this.dataManager.saveData('classes', this.dataManager.classes);
            document.getElementById('class-form').reset();
            this.updateClassesList();
            this.updateClassSelects();
            this.dataManager.syncManager.syncToRemote();
        }
    }

    updateClassesList() {
        const list = document.getElementById('classes-list');
        list.innerHTML = '';
        this.dataManager.classes.forEach(cls => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="radio" name="class-select" value="${cls.id}" style="margin-right: 10px;">
                <span>${cls.name}</span>
                <button class="action-btn" onclick="uiManager.deleteClass(${cls.id})">Delete</button>
            `;
            list.appendChild(li);
        });
        this.updateEditClassButton();
    }

    deleteClass(id) {
        if (confirm('Are you sure you want to delete this class?')) {
            this.dataManager.classes = this.dataManager.classes.filter(cls => cls.id !== id);
            this.dataManager.saveData('classes', this.dataManager.classes);
            this.updateClassesList();
            this.updateClassSelects();
            this.dataManager.syncManager.syncToRemote();
        }
    }

    updateEditClassButton() {
        const selected = document.querySelector('input[name="class-select"]:checked');
        const btn = document.getElementById('edit-class-btn');
        btn.style.display = selected ? 'block' : 'none';
    }

    editSelectedClass() {
        const selected = document.querySelector('input[name="class-select"]:checked');
        if (selected) {
            const classId = parseInt(selected.value);
            const cls = this.dataManager.classes.find(c => c.id === classId);
            if (cls) {
                document.getElementById('edit-class-name').value = cls.name;
                document.getElementById('edit-class-modal').classList.remove('hidden');
                this.editingClassId = classId;
            }
        }
    }

    updateClass() {
        const name = document.getElementById('edit-class-name').value.trim();
        if (name && this.editingClassId) {
            const cls = this.dataManager.classes.find(c => c.id === this.editingClassId);
            if (cls) {
                cls.name = name;
                this.dataManager.saveData('classes', this.dataManager.classes);
                this.updateClassesList();
                this.updateClassSelects();
                this.closeModals();
                this.dataManager.syncManager.syncToRemote();
            }
        }
    }

    addStudent() {
        const name = document.getElementById('student-name').value.trim();
        const classId = parseInt(document.getElementById('student-class').value);
        const studentId = document.getElementById('student-id').value.trim();
        const phone = document.getElementById('student-phone').value.trim();

        if (name && classId && studentId) {
            const student = {
                id: Date.now(),
                name,
                classId,
                studentId,
                phone,
                balance: 0
            };
            this.dataManager.students.push(student);
            this.dataManager.saveData('students', this.dataManager.students);
            document.getElementById('student-form').reset();
            this.updateStudentsTable();
            this.updateStudentSelects();
            this.updateDashboard();
            this.dataManager.syncManager.syncToRemote();
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
                <td>${student.name} <button class="action-btn print-btn" onclick="uiManager.printStudentReceipt(${student.id})" style="margin-left: 10px;">Print Receipt</button></td>
                <td>${cls ? cls.name : 'N/A'}</td>
                <td>${student.studentId || '-'}</td>
                <td>${student.phone || '-'}</td>
                <td>GH₵${balance.toFixed(2)}</td>
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
        const bills = this.dataManager.billings.filter(bill => bill.studentId === studentId)
            .reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const payments = this.dataManager.payments.filter(payment => payment.studentId === studentId)
            .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        return bills - payments;
    }

    editStudent(id) {
        const student = this.dataManager.students.find(s => s.id === id);
        if (student) {
            document.getElementById('edit-student-name').value = student.name;
            document.getElementById('edit-student-id').value = student.studentId || '';
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
        const studentId = document.getElementById('edit-student-id').value.trim();
        const phone = document.getElementById('edit-student-phone').value.trim();

        if (name && classId && studentId && this.editingStudentId) {
            const student = this.dataManager.students.find(s => s.id === this.editingStudentId);
            if (student) {
                student.name = name;
                student.classId = classId;
                student.studentId = studentId;
                student.phone = phone;
                this.dataManager.saveData('students', this.dataManager.students);
                this.updateStudentsTable();
                this.updateStudentSelects();
                this.closeModals();
                this.dataManager.syncManager.syncToRemote();
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
            this.dataManager.syncManager.syncToRemote();
        }
    }

    deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student?')) {
            this.dataManager.students = this.dataManager.students.filter(s => s.id !== id);
            this.dataManager.billings = this.dataManager.billings.filter(bill => bill.studentId !== id);
            this.dataManager.payments = this.dataManager.payments.filter(payment => payment.studentId !== id);
            this.dataManager.saveAll();
            this.updateStudentsTable();
            this.updateBillsTable();
            this.updateStudentSelects();
            this.updateDashboard();
            this.dataManager.syncManager.syncToRemote();
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
            this.dataManager.syncManager.syncToRemote();
        }
    }

    updateTeachersTable() {
        const tbody = document.querySelector('#teachers-table tbody');
        tbody.innerHTML = '';

        this.dataManager.teachers.forEach(teacher => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="radio" name="teacher-select" value="${teacher.id}" style="margin-right: 10px;">${teacher.name}</td>
                <td>${teacher.email || '-'}</td>
                <td>${teacher.phone || '-'}</td>
                <td>
                    <button class="action-btn" onclick="uiManager.deleteTeacher(${teacher.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        this.updateEditTeacherButton();
    }

    deleteTeacher(id) {
        if (confirm('Are you sure you want to delete this teacher?')) {
            this.dataManager.teachers = this.dataManager.teachers.filter(t => t.id !== id);
            this.dataManager.saveData('teachers', this.dataManager.teachers);
            this.updateTeachersTable();
            this.dataManager.syncManager.syncToRemote();
        }
    }

    updateEditTeacherButton() {
        const selected = document.querySelector('input[name="teacher-select"]:checked');
        const btn = document.getElementById('edit-teacher-btn');
        btn.style.display = selected ? 'block' : 'none';
    }

    editSelectedTeacher() {
        const selected = document.querySelector('input[name="teacher-select"]:checked');
        if (selected) {
            const teacherId = parseInt(selected.value);
            const teacher = this.dataManager.teachers.find(t => t.id === teacherId);
            if (teacher) {
                document.getElementById('edit-teacher-name').value = teacher.name;
                document.getElementById('edit-teacher-email').value = teacher.email || '';
                document.getElementById('edit-teacher-phone').value = teacher.phone || '';
                document.getElementById('edit-teacher-modal').classList.remove('hidden');
                this.editingTeacherId = teacherId;
            }
        }
    }

    updateTeacher() {
        const name = document.getElementById('edit-teacher-name').value.trim();
        const email = document.getElementById('edit-teacher-email').value.trim();
        const phone = document.getElementById('edit-teacher-phone').value.trim();

        if (name && this.editingTeacherId) {
            const teacher = this.dataManager.teachers.find(t => t.id === this.editingTeacherId);
            if (teacher) {
                teacher.name = name;
                teacher.email = email;
                teacher.phone = phone;
                this.dataManager.saveData('teachers', this.dataManager.teachers);
                this.updateTeachersTable();
                this.closeModals();
                this.dataManager.syncManager.syncToRemote();
            }
        }
    }

    addBill() {
        const studentId = parseInt(document.getElementById('bill-student').value);
        const description = document.getElementById('bill-description').value.trim();
        const amount = parseFloat(document.getElementById('bill-amount').value);

        if (studentId && description && amount > 0) {
            this.dataManager.billings.push({
                id: Date.now(),
                studentId,
                description,
                amount,
                date: new Date().toISOString()
            });
            this.dataManager.saveData('billings', this.dataManager.billings);
            document.getElementById('bill-form').reset();
            this.updateBillsTable();
            this.updateStudentsTable();
            this.updateDashboard();
            this.dataManager.syncManager.syncToRemote();
        }
    }

    updateBillsTable() {
        const tbody = document.querySelector('#bills-table tbody');
        tbody.innerHTML = '';

        this.dataManager.billings.forEach(bill => {
            const student = this.dataManager.students.find(s => s.id === bill.studentId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student ? student.name : 'Unknown'}</td>
                <td>${bill.description}</td>
                <td>GH₵${parseFloat(bill.amount).toFixed(2)}</td>
                <td>${new Date(bill.date).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="uiManager.editBill(${bill.id})">Edit</button>
                    <button class="action-btn" onclick="uiManager.deleteBill(${bill.id})">Delete</button>
                </td>
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
            ['Total Billed', `GH₵${this.dataManager.billings.reduce((sum, bill) => sum + parseFloat(bill.amount), 0).toFixed(2)}`],
            ['Total Paid', `GH₵${this.dataManager.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}`],
            ['Outstanding', `GH₵${this.calculateOutstanding().toFixed(2)}`]
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
            return [student.name, cls ? cls.name : 'N/A', `GH₵${balance.toFixed(2)}`];
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
            doc.text(`Amount Paid: GH₵${parseFloat(payment.amount).toFixed(2)}`, 20, 80);

            const balance = this.calculateStudentBalance(payment.studentId);
            doc.text(`Outstanding Balance: GH₵${balance.toFixed(2)}`, 20, 90);
        });

        doc.save('payment_receipts.pdf');
    }

    calculateOutstanding() {
        const totalBilled = this.dataManager.billings.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
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

    printStudentReceipt(studentId) {
        const student = this.dataManager.students.find(s => s.id === studentId);
        if (!student) return;

        const cls = this.dataManager.classes.find(c => c.id === student.classId);
        const bills = this.dataManager.billings.filter(bill => bill.studentId === studentId);
        const payments = this.dataManager.payments.filter(payment => payment.studentId === studentId);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('School Fees Receipt', 20, 30);

        doc.setFontSize(12);
        doc.text(`Student: ${student.name}`, 20, 50);
        doc.text(`Class: ${cls ? cls.name : 'N/A'}`, 20, 60);
        doc.text(`Student ID: ${student.studentId || 'N/A'}`, 20, 70);
        doc.text(`Phone: ${student.phone || 'N/A'}`, 20, 80);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 90);

        // Bills section
        doc.setFontSize(14);
        doc.text('Billing Records:', 20, 110);

        let yPos = 120;
        doc.setFontSize(10);
        bills.forEach(bill => {
            doc.text(`${bill.description}: GH₵${parseFloat(bill.amount).toFixed(2)} (${new Date(bill.date).toLocaleDateString()})`, 20, yPos);
            yPos += 10;
        });

        // Payments section
        yPos += 10;
        doc.setFontSize(14);
        doc.text('Payment Records:', 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        payments.forEach(payment => {
            doc.text(`Payment: GH₵${parseFloat(payment.amount).toFixed(2)} (${new Date(payment.date).toLocaleDateString()})`, 20, yPos);
            yPos += 10;
        });

        // Summary
        const totalBilled = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        const balance = totalBilled - totalPaid;

        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Total Billed: GH₵${totalBilled.toFixed(2)}`, 20, yPos);
        yPos += 10;
        doc.text(`Total Paid: GH₵${totalPaid.toFixed(2)}`, 20, yPos);
        yPos += 10;
        doc.text(`Outstanding Balance: GH₵${balance.toFixed(2)}`, 20, yPos);

        // Footer
        yPos += 20;
        doc.setFontSize(10);
        doc.text('Thank you for your payment!', 20, yPos);

        doc.save(`receipt_${student.name.replace(/\s+/g, '_')}.pdf`);
    }

    editBill(id) {
        const bill = this.dataManager.billings.find(b => b.id === id);
        if (bill) {
            document.getElementById('edit-bill-description').value = bill.description;
            document.getElementById('edit-bill-amount').value = bill.amount;
            this.updateEditBillStudentSelect(bill.studentId);
            document.getElementById('edit-bill-modal').classList.remove('hidden');
            this.editingBillId = id;
        }
    }

    updateEditBillStudentSelect(selectedStudentId) {
        const select = document.getElementById('edit-bill-student');
        select.innerHTML = '<option value="">Select Student</option>';
        this.dataManager.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            if (student.id === selectedStudentId) option.selected = true;
            select.appendChild(option);
        });
    }

    updateBill() {
        const studentId = parseInt(document.getElementById('edit-bill-student').value);
        const description = document.getElementById('edit-bill-description').value.trim();
        const amount = parseFloat(document.getElementById('edit-bill-amount').value);

        if (studentId && description && amount > 0 && this.editingBillId) {
            const bill = this.dataManager.billings.find(b => b.id === this.editingBillId);
            if (bill) {
                bill.studentId = studentId;
                bill.description = description;
                bill.amount = amount;
                this.dataManager.saveData('billings', this.dataManager.billings);
                this.updateBillsTable();
                this.updateStudentsTable();
                this.updateDashboard();
                this.closeModals();
                this.dataManager.syncManager.syncToRemote();
            }
        }
    }

    deleteBill(id) {
        if (confirm('Are you sure you want to delete this bill?')) {
            this.dataManager.billings = this.dataManager.billings.filter(bill => bill.id !== id);
            this.dataManager.saveData('billings', this.dataManager.billings);
            this.updateBillsTable();
            this.updateStudentsTable();
            this.updateDashboard();
            this.dataManager.syncManager.syncToRemote();
        }
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
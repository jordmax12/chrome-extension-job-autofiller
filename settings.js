// Settings page functionality for Auto Job Filler Chrome Extension

class SettingsManager {
    constructor() {
        this.form = document.getElementById('settingsForm');
        this.elements = {
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            resumeFile: document.getElementById('resumeFile'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            fileSize: document.getElementById('fileSize'),
            uploadSection: document.getElementById('resumeUploadSection'),
            saveBtn: document.getElementById('saveBtn'),
            clearBtn: document.getElementById('clearBtn'),
            closeBtn: document.getElementById('closeBtn'),
            successMessage: document.getElementById('successMessage'),
            errorMessage: document.getElementById('errorMessage')
        };
        
        this.init();
    }

    init() {
        // Load existing settings
        this.loadSettings();
        
        // Set up event listeners
        this.form.addEventListener('submit', (e) => this.handleSave(e));
        this.elements.clearBtn.addEventListener('click', () => this.handleClear());
        this.elements.closeBtn.addEventListener('click', () => window.close());
        this.elements.resumeFile.addEventListener('change', (e) => this.handleFileUpload(e));
        
        console.log('Settings page initialized');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'userSettings',
                'resumeData'
            ]);
            
            if (result.userSettings) {
                const settings = result.userSettings;
                this.elements.firstName.value = settings.firstName || '';
                this.elements.lastName.value = settings.lastName || '';
                this.elements.email.value = settings.email || '';
                this.elements.phone.value = settings.phone || '';
            }
            
            if (result.resumeData) {
                this.displayResumeInfo(result.resumeData);
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showMessage('Error loading settings', 'error');
        }
    }

    async handleSave(event) {
        event.preventDefault();
        
        try {
            // Collect form data
            const userSettings = {
                firstName: this.elements.firstName.value.trim(),
                lastName: this.elements.lastName.value.trim(),
                email: this.elements.email.value.trim(),
                phone: this.elements.phone.value.trim(),
                updatedAt: Date.now()
            };
            
            // Validate required fields
            if (!userSettings.firstName || !userSettings.lastName || !userSettings.email) {
                this.showMessage('Please fill in at least First Name, Last Name, and Email', 'error');
                return;
            }
            
            // Validate email format
            if (!this.isValidEmail(userSettings.email)) {
                this.showMessage('Please enter a valid email address', 'error');
                return;
            }
            
            // Save to Chrome storage
            await chrome.storage.local.set({ userSettings });
            
            this.showMessage('Settings saved successfully!', 'success');
            
            console.log('Settings saved:', userSettings);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Error saving settings. Please try again.', 'error');
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        try {
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                this.showMessage('Please upload a PDF, DOC, or DOCX file', 'error');
                return;
            }
            
            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                this.showMessage('File size must be less than 10MB', 'error');
                return;
            }
            
            // Convert file to base64 for storage
            const base64Data = await this.fileToBase64(file);
            
            const resumeData = {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                base64Data: base64Data,
                uploadedAt: Date.now()
            };
            
            // Save to Chrome storage
            await chrome.storage.local.set({ resumeData });
            
            this.displayResumeInfo(resumeData);
            this.showMessage('Resume uploaded successfully!', 'success');
            
            console.log('Resume uploaded:', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });
            
        } catch (error) {
            console.error('Error uploading resume:', error);
            this.showMessage('Error uploading resume. Please try again.', 'error');
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    displayResumeInfo(resumeData) {
        this.elements.fileName.textContent = resumeData.fileName;
        this.elements.fileSize.textContent = `Size: ${this.formatFileSize(resumeData.fileSize)}`;
        this.elements.fileInfo.style.display = 'block';
        this.elements.uploadSection.classList.add('has-file');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleClear() {
        if (!confirm('Are you sure you want to clear all settings and resume data? This cannot be undone.')) {
            return;
        }
        
        try {
            // Clear Chrome storage
            await chrome.storage.local.remove(['userSettings', 'resumeData']);
            
            // Clear form fields
            this.elements.firstName.value = '';
            this.elements.lastName.value = '';
            this.elements.email.value = '';
            this.elements.phone.value = '';
            this.elements.resumeFile.value = '';
            
            // Hide file info
            this.elements.fileInfo.style.display = 'none';
            this.elements.uploadSection.classList.remove('has-file');
            
            this.showMessage('All settings cleared successfully!', 'success');
            
            console.log('Settings cleared');
            
        } catch (error) {
            console.error('Error clearing settings:', error);
            this.showMessage('Error clearing settings. Please try again.', 'error');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showMessage(message, type) {
        // Hide all messages first
        this.elements.successMessage.style.display = 'none';
        this.elements.errorMessage.style.display = 'none';
        
        // Show appropriate message
        if (type === 'success') {
            this.elements.successMessage.textContent = '✅ ' + message;
            this.elements.successMessage.style.display = 'block';
        } else if (type === 'error') {
            this.elements.errorMessage.textContent = '❌ ' + message;
            this.elements.errorMessage.style.display = 'block';
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.elements.successMessage.style.display = 'none';
            this.elements.errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});

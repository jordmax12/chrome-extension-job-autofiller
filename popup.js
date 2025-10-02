// Job Application Detector Popup Script

class PopupController {
    constructor() {
        this.messageTimeout = null; // For managing message timeouts
        this.elements = {
            // Main view elements
            mainView: document.getElementById('mainView'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            confidenceFill: document.getElementById('confidenceFill'),
            confidenceText: document.getElementById('confidenceText'),
            detailsSection: document.getElementById('detailsSection'),
            fieldsList: document.getElementById('fieldsList'),
            refreshBtn: document.getElementById('refreshBtn'),
            autofillBtn: document.getElementById('autofillBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            closeBtn: document.getElementById('closeBtn'),
            settingsStatus: document.getElementById('settingsStatus'),
            settingsStatusText: document.getElementById('settingsStatusText'),
            
            // Settings view elements
            settingsView: document.getElementById('settingsView'),
            backBtn: document.getElementById('backBtn'),
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            resumeFile: document.getElementById('resumeFile'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            fileSize: document.getElementById('fileSize'),
            resumeUploadSection: document.getElementById('resumeUploadSection'),
            chooseFileBtn: document.getElementById('chooseFileBtn'),
            saveBtn: document.getElementById('saveBtn'),
            clearBtn: document.getElementById('clearBtn'),
            successMessage: document.getElementById('successMessage'),
            errorMessage: document.getElementById('errorMessage')
        };

        this.init();
    }

    init() {
        // Debug: Check if all elements are found
        console.log('Elements check:', {
            saveBtn: !!this.elements.saveBtn,
            firstName: !!this.elements.firstName,
            lastName: !!this.elements.lastName,
            email: !!this.elements.email,
            settingsView: !!this.elements.settingsView,
            mainView: !!this.elements.mainView
        });
        
        // Additional debug - log actual elements
        if (!this.elements.saveBtn) {
            console.error('Save button element not found! Looking for #saveBtn');
            console.log('All elements with saveBtn in id:', document.querySelectorAll('[id*="saveBtn"]'));
        }
        // Set up event listeners
        this.elements.refreshBtn.addEventListener('click', () => this.refreshDetection());
        this.elements.autofillBtn.addEventListener('click', () => this.handleAutofill());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.backBtn.addEventListener('click', () => this.showMainView());
        this.elements.closeBtn.addEventListener('click', () => window.close());
        
        // Settings event listeners
        if (this.elements.saveBtn) {
            this.elements.saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save button clicked - calling saveSettings()'); // Debug log
                this.saveSettings();
            });
            console.log('Save button event listener attached successfully'); // Debug log
        } else {
            console.error('Save button not found! Available elements:', Object.keys(this.elements).filter(key => this.elements[key])); // Debug log
        }
        this.elements.clearBtn.addEventListener('click', () => this.clearSettings());
        this.elements.chooseFileBtn.addEventListener('click', () => this.elements.resumeFile.click());
        this.elements.resumeFile.addEventListener('change', (e) => this.handleFileUpload(e));

        // Load initial detection status and settings status
        this.loadDetectionStatus();
        this.loadSettingsStatus();

        // Listen for detection updates
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'DETECTION_UPDATE') {
                this.updateUI(message.data);
            }
        });
    }

    async loadDetectionStatus() {
        try {
            // First try to get stored results
            const stored = await chrome.storage.local.get('detectionResults');
            if (stored.detectionResults) {
                this.updateUI(stored.detectionResults);
            }

            // Then get fresh results from content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { type: 'GET_DETECTION_STATUS' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Content script not ready:', chrome.runtime.lastError.message);
                    this.showNotReady();
                } else if (response) {
                    this.updateUI(response);
                }
            });
        } catch (error) {
            console.error('Error loading detection status:', error);
            this.showError();
        }
    }

    async refreshDetection() {
        this.showChecking();
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { type: 'RERUN_DETECTION' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Could not refresh:', chrome.runtime.lastError.message);
                    this.showNotReady();
                } else {
                    // Results will come via the message listener
                    setTimeout(() => this.loadDetectionStatus(), 1000);
                }
            });
        } catch (error) {
            console.error('Error refreshing detection:', error);
            this.showError();
        }
    }

    updateUI(data) {
        const { isJobApplication, confidence, detectedFields, isKnownJobApplicationDomain, hostname, isInIframe, isJobApplicationIframe } = data;

        // Update status indicator with special styling for known job application domains
        let statusClass = 'status-dot ';
        if (isKnownJobApplicationDomain) {
            statusClass += 'platform-detected';
        } else if (isJobApplication) {
            statusClass += 'detected';
        } else {
            statusClass += 'not-detected';
        }
        this.elements.statusDot.className = statusClass;
        
        // Update status text based on detection method
        if (isJobApplicationIframe) {
            this.elements.statusText.textContent = `Job application iframe detected! (${hostname})`;
        } else if (isKnownJobApplicationDomain) {
            this.elements.statusText.textContent = `Known job application domain! (${hostname})`;
        } else if (isJobApplication) {
            this.elements.statusText.textContent = 'Job application detected!';
        } else {
            this.elements.statusText.textContent = 'No job application detected';
        }

        // Update confidence bar
        this.elements.confidenceFill.style.width = `${confidence}%`;
        this.elements.confidenceText.textContent = `${confidence}%`;

        // Update autofill button state
        if (isJobApplication || isKnownJobApplicationDomain || isJobApplicationIframe) {
            this.elements.autofillBtn.disabled = false;
            if (isJobApplicationIframe) {
                this.elements.autofillBtn.textContent = 'Autofill (Iframe)';
            } else {
                this.elements.autofillBtn.textContent = 'Autofill';
            }
        } else {
            this.elements.autofillBtn.disabled = true;
            this.elements.autofillBtn.textContent = 'No Job Detected';
        }

        // Update detected fields
        if (detectedFields && detectedFields.length > 0) {
            this.elements.detailsSection.style.display = 'block';
            this.elements.fieldsList.innerHTML = '';
            
            // Group fields by type and show unique ones
            const uniqueFields = this.getUniqueFields(detectedFields);
            uniqueFields.forEach(field => {
                const li = document.createElement('li');
                li.textContent = `${this.formatFieldType(field.type)} (${field.weight} pts)`;
                this.elements.fieldsList.appendChild(li);
            });
        } else {
            this.elements.detailsSection.style.display = 'none';
        }
    }

    getUniqueFields(fields) {
        const seen = new Set();
        return fields.filter(field => {
            if (seen.has(field.type)) {
                return false;
            }
            seen.add(field.type);
            return true;
        }).sort((a, b) => b.weight - a.weight);
    }

    formatFieldType(type) {
        const typeMap = {
            firstName: 'First Name',
            lastName: 'Last Name',
            fullName: 'Full Name',
            email: 'Email',
            phone: 'Phone',
            address: 'Address',
            resume: 'Resume/CV',
            coverLetter: 'Cover Letter',
            position: 'Position/Role',
            experience: 'Experience',
            salary: 'Salary',
            availability: 'Availability',
            links: 'Links/Portfolio'
        };
        return typeMap[type] || type;
    }

    showChecking() {
        this.elements.statusDot.className = 'status-dot checking';
        this.elements.statusText.textContent = 'Checking...';
        this.elements.confidenceFill.style.width = '0%';
        this.elements.confidenceText.textContent = '0%';
        this.elements.detailsSection.style.display = 'none';
    }

    showNotReady() {
        this.elements.statusDot.className = 'status-dot';
        this.elements.statusText.textContent = 'Page not ready - try refreshing';
        this.elements.confidenceFill.style.width = '0%';
        this.elements.confidenceText.textContent = '0%';
        this.elements.detailsSection.style.display = 'none';
    }

    showError() {
        this.elements.statusDot.className = 'status-dot not-detected';
        this.elements.statusText.textContent = 'Error loading detection';
        this.elements.confidenceFill.style.width = '0%';
        this.elements.confidenceText.textContent = '0%';
        this.elements.detailsSection.style.display = 'none';
    }

    showSettings() {
        this.elements.mainView.style.display = 'none';
        this.elements.settingsView.style.display = 'block';
        this.loadSettings();
    }

    showMainView() {
        this.elements.settingsView.style.display = 'none';
        this.elements.mainView.style.display = 'block';
    }

    async loadSettings() {
        console.log('Loading settings...'); // Debug log
        
        try {
            const result = await chrome.storage.local.get(['userSettings', 'resumeData']);
            console.log('Loaded from storage:', result); // Debug log
            
            if (result.userSettings) {
                const settings = result.userSettings;
                console.log('Populating form with:', settings); // Debug log
                this.elements.firstName.value = settings.firstName || '';
                this.elements.lastName.value = settings.lastName || '';
                this.elements.email.value = settings.email || '';
                this.elements.phone.value = settings.phone || '';
            } else {
                console.log('No user settings found in storage'); // Debug log
            }
            
            if (result.resumeData) {
                console.log('Resume data found:', result.resumeData.fileName); // Debug log
                this.displayResumeInfo(result.resumeData);
            } else {
                console.log('No resume data found in storage'); // Debug log
            }
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showMessage('Error loading settings', 'error');
        }
    }

    async saveSettings() {
        console.log('=== SAVE SETTINGS FUNCTION CALLED ==='); // Debug log
        
        try {
            const userSettings = {
                firstName: this.elements.firstName.value.trim(),
                lastName: this.elements.lastName.value.trim(),
                email: this.elements.email.value.trim(),
                phone: this.elements.phone.value.trim(),
                updatedAt: Date.now()
            };
            
            console.log('User settings to save:', userSettings); // Debug log
            
            // Basic validation
            if (!userSettings.firstName && !userSettings.lastName && !userSettings.email && !userSettings.phone) {
                this.showMessage('Please fill in at least one field', 'error');
                return;
            }
            
            if (userSettings.email && !this.isValidEmail(userSettings.email)) {
                this.showMessage('Please enter a valid email address', 'error');
                return;
            }
            
            // Save to storage
            await chrome.storage.local.set({ userSettings });
            console.log('Settings successfully saved to Chrome storage'); // Debug log
            
            // Return to main view
            this.showMainView();
            
            // Update the settings status display
            this.updateSettingsStatus(userSettings.updatedAt);
            
        } catch (error) {
            console.error('Error in saveSettings:', error);
            this.showMessage('Error saving settings: ' + error.message, 'error');
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                this.showMessage('Please upload a PDF, DOC, or DOCX file', 'error');
                return;
            }
            
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                this.showMessage('File size must be less than 10MB', 'error');
                return;
            }
            
            const base64Data = await this.fileToBase64(file);
            const resumeData = {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                base64Data: base64Data,
                uploadedAt: Date.now()
            };
            
            await chrome.storage.local.set({ resumeData });
            this.displayResumeInfo(resumeData);
            this.showMessage('Resume uploaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error uploading resume:', error);
            this.showMessage('Error uploading resume', 'error');
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
        this.elements.resumeUploadSection.classList.add('has-file');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async clearSettings() {
        if (!confirm('Clear all settings and resume data?')) return;
        
        try {
            await chrome.storage.local.remove(['userSettings', 'resumeData']);
            
            this.elements.firstName.value = '';
            this.elements.lastName.value = '';
            this.elements.email.value = '';
            this.elements.phone.value = '';
            this.elements.resumeFile.value = '';
            this.elements.fileInfo.style.display = 'none';
            this.elements.resumeUploadSection.classList.remove('has-file');
            
            this.showMessage('All settings cleared!', 'success');
            
        } catch (error) {
            console.error('Error clearing settings:', error);
            this.showMessage('Error clearing settings', 'error');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showMessage(message, type) {
        console.log('Showing message:', type, message); // Debug log
        
        // Clear any existing timeouts
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        // Hide all messages first
        this.elements.successMessage.style.display = 'none';
        this.elements.errorMessage.style.display = 'none';
        
        if (type === 'success') {
            this.elements.successMessage.textContent = '✅ ' + message;
            this.elements.successMessage.style.display = 'block';
            console.log('Success message displayed'); // Debug log
        } else if (type === 'error') {
            this.elements.errorMessage.textContent = '❌ ' + message;
            this.elements.errorMessage.style.display = 'block';
            console.log('Error message displayed'); // Debug log
        }
        
        this.messageTimeout = setTimeout(() => {
            this.elements.successMessage.style.display = 'none';
            this.elements.errorMessage.style.display = 'none';
            console.log('Messages hidden after timeout'); // Debug log
        }, 3000);
    }

    async loadSettingsStatus() {
        try {
            const result = await chrome.storage.local.get(['userSettings']);
            if (result.userSettings && result.userSettings.updatedAt) {
                this.updateSettingsStatus(result.userSettings.updatedAt);
            }
        } catch (error) {
            console.error('Error loading settings status:', error);
        }
    }

    updateSettingsStatus(timestamp) {
        if (!timestamp) return;
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));
        
        let timeText;
        if (diffMinutes < 1) {
            timeText = 'just now';
        } else if (diffMinutes < 60) {
            timeText = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        } else if (diffMinutes < 1440) { // less than 24 hours
            const hours = Math.floor(diffMinutes / 60);
            timeText = `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else {
            timeText = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        
        this.elements.settingsStatusText.textContent = `Settings last updated: ${timeText}`;
        this.elements.settingsStatus.style.display = 'block';
        
        console.log('Settings status updated:', timeText);
    }

    async handleAutofill() {
        console.log('🚀 Autofill button clicked!');
        
        // Temporarily disable button and show loading state
        this.elements.autofillBtn.disabled = true;
        this.elements.autofillBtn.textContent = 'Filling...';
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Current tab:', tab.url);
            
            // First check if content script is ready
            chrome.tabs.sendMessage(tab.id, { 
                type: 'PING'
            }, (pingResponse) => {
                if (chrome.runtime.lastError) {
                    console.error('Content script not ready:', chrome.runtime.lastError.message);
                    console.log('Tab URL:', tab.url);
                    console.log('Possible causes:');
                    console.log('1. Page is still loading');
                    console.log('2. Content script blocked on this page type');
                    console.log('3. Extension needs to be reloaded');
                    
                    this.resetAutofillButton();
                    
                    // More specific error messages
                    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                        this.showAutofillResult(false, 'Cannot run on Chrome pages');
                    } else if (tab.url.startsWith('file://')) {
                        this.showAutofillResult(false, 'Cannot run on local files');
                    } else {
                        this.showAutofillResult(false, 'Page not ready - try refreshing');
                    }
                    return;
                }
                
                console.log('Content script is ready, proceeding with autofill...');
                
                // Now send the actual autofill message
                chrome.tabs.sendMessage(tab.id, { 
                    type: 'PERFORM_AUTOFILL'
                }, (response) => {
                    this.resetAutofillButton();
                    
                    if (chrome.runtime.lastError) {
                        console.error('Error during autofill:', chrome.runtime.lastError.message);
                        this.showAutofillResult(false, 'Failed to communicate with page');
                    } else if (response && response.success) {
                        console.log('✅ Autofill completed successfully:', response);
                        this.showAutofillResult(true, `Filled ${response.filledFields.length} fields`);
                    } else {
                        console.error('❌ Autofill failed:', response);
                        this.showAutofillResult(false, response?.message || 'Unknown error');
                    }
                });
            });
            
        } catch (error) {
            console.error('Error in handleAutofill:', error);
            this.resetAutofillButton();
            this.showAutofillResult(false, 'Unexpected error occurred');
        }
    }

    resetAutofillButton() {
        this.elements.autofillBtn.disabled = false;
        this.elements.autofillBtn.textContent = 'Autofill';
    }

    showAutofillResult(success, message) {
        // Temporarily change button text to show result
        const originalText = this.elements.autofillBtn.textContent;
        
        if (success) {
            this.elements.autofillBtn.textContent = '✅ ' + message;
            this.elements.autofillBtn.style.backgroundColor = '#4CAF50';
        } else {
            this.elements.autofillBtn.textContent = '❌ ' + message;
            this.elements.autofillBtn.style.backgroundColor = '#f44336';
        }
        
        // Reset after 3 seconds
        setTimeout(() => {
            this.elements.autofillBtn.textContent = originalText;
            this.elements.autofillBtn.style.backgroundColor = '';
        }, 3000);
        
        console.log(`Autofill result: ${success ? 'SUCCESS' : 'FAILED'} - ${message}`);
    }

    // Debug helper function
    async debugStorage() {
        try {
            const result = await chrome.storage.local.get(null);
            console.log('=== ALL CHROME STORAGE DATA ===');
            console.log(result);
            console.log('================================');
            return result;
        } catch (error) {
            console.error('Error reading storage:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.popupController = new PopupController(); // Make it globally accessible for debugging
});

// Debug helper - call this from console: checkStorage()
window.checkStorage = async function() {
    if (window.popupController) {
        return await window.popupController.debugStorage();
    } else {
        console.log('PopupController not available');
    }
};
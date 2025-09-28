// Job Application Detector Popup Script

class PopupController {
    constructor() {
        this.elements = {
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            confidenceFill: document.getElementById('confidenceFill'),
            confidenceText: document.getElementById('confidenceText'),
            detailsSection: document.getElementById('detailsSection'),
            fieldsList: document.getElementById('fieldsList'),
            refreshBtn: document.getElementById('refreshBtn'),
            closeBtn: document.getElementById('closeBtn')
        };

        this.init();
    }

    init() {
        // Set up event listeners
        this.elements.refreshBtn.addEventListener('click', () => this.refreshDetection());
        this.elements.closeBtn.addEventListener('click', () => window.close());

        // Load initial detection status
        this.loadDetectionStatus();

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
        const { isJobApplication, confidence, detectedFields, isKnownJobApplicationDomain, hostname } = data;

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
        if (isKnownJobApplicationDomain) {
            this.elements.statusText.textContent = `Known job application domain! (${hostname})`;
        } else if (isJobApplication) {
            this.elements.statusText.textContent = 'Job application detected!';
        } else {
            this.elements.statusText.textContent = 'No job application detected';
        }

        // Update confidence bar
        this.elements.confidenceFill.style.width = `${confidence}%`;
        this.elements.confidenceText.textContent = `${confidence}%`;

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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
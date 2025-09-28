// Job Application Form Detection Content Script

class JobApplicationDetector {
    constructor() {
        this.isJobApplication = false;
        this.detectedFields = [];
        this.confidence = 0;
        this.isKnownJobApplicationDomain = false;
        this.init();
    }

    init() {
        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.detectJobApplication());
        } else {
            this.detectJobApplication();
        }

        // Also check when new content is added dynamically
        this.observePageChanges();
    }

    detectJobApplication() {
        console.log('🔍 Scanning page for job application forms...');
        
        // Reset detection state
        this.isJobApplication = false;
        this.detectedFields = [];
        this.confidence = 0;
        this.isKnownJobApplicationDomain = false;

        // Multiple detection methods
        this.detectByURL();
        this.detectByPageContent();
        this.detectByFormFields();
        this.detectByJobSites();
        this.detectByKnownJobApplicationDomains();

        // Calculate final confidence
        this.calculateConfidence();

        // Store results and notify popup
        this.storeDetectionResults();
        
        console.log(`📊 Detection complete. Confidence: ${this.confidence}%`, {
            isJobApplication: this.isJobApplication,
            detectedFields: this.detectedFields
        });
    }

    detectByURL() {
        const url = window.location.href.toLowerCase();
        const jobKeywords = [
            'job', 'career', 'apply', 'application', 'position', 
            'employment', 'hiring', 'recruit', 'vacancy', 'opening'
        ];

        const urlMatches = jobKeywords.some(keyword => url.includes(keyword));
        if (urlMatches) {
            this.confidence += 20;
            console.log('✅ URL contains job-related keywords');
        }
    }

    detectByPageContent() {
        const pageText = document.body.innerText.toLowerCase();
        const jobPhrases = [
            'job application', 'apply now', 'submit application',
            'cover letter', 'resume', 'cv', 'work experience',
            'employment history', 'position applied for'
        ];

        const contentMatches = jobPhrases.filter(phrase => pageText.includes(phrase));
        if (contentMatches.length > 0) {
            this.confidence += Math.min(contentMatches.length * 10, 30);
            console.log('✅ Page content contains job application phrases:', contentMatches);
        }
    }

    detectByFormFields() {
        const forms = document.querySelectorAll('form');
        if (forms.length === 0) return;

        const jobFieldPatterns = [
            // Name fields
            { pattern: /first.?name|fname|given.?name/i, type: 'firstName', weight: 5 },
            { pattern: /last.?name|lname|surname|family.?name/i, type: 'lastName', weight: 5 },
            { pattern: /full.?name|name/i, type: 'fullName', weight: 3 },
            
            // Contact fields
            { pattern: /email|e-mail/i, type: 'email', weight: 3 },
            { pattern: /phone|telephone|mobile|cell/i, type: 'phone', weight: 3 },
            { pattern: /address|street|city|zip|postal/i, type: 'address', weight: 2 },
            
            // Job-specific fields
            { pattern: /resume|cv|curriculum/i, type: 'resume', weight: 15 },
            { pattern: /cover.?letter/i, type: 'coverLetter', weight: 15 },
            { pattern: /position|job.?title|role/i, type: 'position', weight: 10 },
            { pattern: /experience|work.?history/i, type: 'experience', weight: 10 },
            { pattern: /salary|compensation|expected.?pay/i, type: 'salary', weight: 8 },
            { pattern: /availability|start.?date/i, type: 'availability', weight: 5 },
            { pattern: /linkedin|portfolio|website/i, type: 'links', weight: 5 }
        ];

        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                const fieldIdentifiers = [
                    input.name,
                    input.id,
                    input.placeholder,
                    input.getAttribute('aria-label'),
                    this.getLabelText(input)
                ].filter(Boolean).join(' ').toLowerCase();

                jobFieldPatterns.forEach(({ pattern, type, weight }) => {
                    if (pattern.test(fieldIdentifiers)) {
                        this.detectedFields.push({
                            type,
                            element: input,
                            identifier: fieldIdentifiers,
                            weight
                        });
                        this.confidence += weight;
                    }
                });
            });
        });

        if (this.detectedFields.length > 0) {
            console.log('✅ Detected job application fields:', this.detectedFields.map(f => f.type));
        }
    }

    detectByJobSites() {
        const hostname = window.location.hostname.toLowerCase();
        const jobSites = [
            'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
            'ziprecruiter.com', 'careerbuilder.com', 'simplyhired.com',
            'dice.com', 'stackoverflow.com', 'angel.co', 'wellfound.com',
            'workday.com', 'greenhouse.io', 'lever.co', 'bamboohr.com'
        ];

        const isJobSite = jobSites.some(site => hostname.includes(site));
        if (isJobSite) {
            this.confidence += 25;
            console.log('✅ Detected known job site:', hostname);
        }
    }

    detectByKnownJobApplicationDomains() {
        const hostname = window.location.hostname.toLowerCase();
        
        // Domains we know for sure are job applications
        const knownJobApplicationDomains = [
            'jobs.ashbyhq.com',
            '*.myworkdayjobs.com',
            '*.smartapply.indeed.com',
            '*.greenhouse.io'
        ];

        console.log('here2!')

        const isKnownJobApplicationDomain = knownJobApplicationDomains.some(domain => {
            if (domain.startsWith('*.')) {
                // Handle wildcard domains like *.myworkdayjobs.com
                const baseDomain = domain.substring(2); // Remove '*.'
                return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
            } else {
                // Handle exact domains like jobs.ashbyhq.com
                return hostname === domain || hostname.endsWith('.' + domain);
            }
        });
        
        if (isKnownJobApplicationDomain) {
            this.confidence += 100; // Very high confidence boost
            this.isKnownJobApplicationDomain = true;
            console.log('✅ Detected known job application domain:', hostname);
        }
    }

    getLabelText(input) {
        // Try to find associated label
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return label.textContent;
        }

        // Check for parent label
        const parentLabel = input.closest('label');
        if (parentLabel) return parentLabel.textContent;

        // Check for nearby text
        const parent = input.parentElement;
        if (parent) {
            const textNodes = Array.from(parent.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(text => text.length > 0);
            
            if (textNodes.length > 0) return textNodes.join(' ');
        }

        return '';
    }

    calculateConfidence() {
        // Cap confidence at 100%
        this.confidence = Math.min(this.confidence, 100);
        
        // Consider it a job application if confidence > 40%
        this.isJobApplication = this.confidence > 40;
    }

    observePageChanges() {
        // Watch for dynamic content changes (SPAs, AJAX)
        const observer = new MutationObserver((mutations) => {
            let shouldRecheck = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new forms or inputs were added
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'FORM' || 
                                node.querySelector && node.querySelector('form, input, textarea')) {
                                shouldRecheck = true;
                            }
                        }
                    });
                }
            });

            if (shouldRecheck) {
                console.log('🔄 Page content changed, re-scanning...');
                setTimeout(() => this.detectJobApplication(), 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    storeDetectionResults() {
        const results = {
            isJobApplication: this.isJobApplication,
            confidence: this.confidence,
            detectedFields: this.detectedFields.map(field => ({
                type: field.type,
                identifier: field.identifier,
                weight: field.weight
            })),
            url: window.location.href,
            hostname: window.location.hostname.toLowerCase(),
            isKnownJobApplicationDomain: this.isKnownJobApplicationDomain,
            timestamp: Date.now()
        };

        // Store in Chrome storage for popup to access
        chrome.storage.local.set({ detectionResults: results });

        // Also send message to popup if it's open
        chrome.runtime.sendMessage({
            type: 'DETECTION_UPDATE',
            data: results
        }).catch(() => {
            // Popup might not be open, that's okay
        });
    }
}

// Initialize the detector
const detector = new JobApplicationDetector();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_DETECTION_STATUS') {
        sendResponse({
            isJobApplication: detector.isJobApplication,
            confidence: detector.confidence,
            detectedFields: detector.detectedFields.map(field => ({
                type: field.type,
                identifier: field.identifier,
                weight: field.weight
            }))
        });
    } else if (request.type === 'RERUN_DETECTION') {
        detector.detectJobApplication();
        sendResponse({ success: true });
    }
});

console.log('🚀 Job Application Detector loaded');

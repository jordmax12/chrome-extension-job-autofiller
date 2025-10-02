// Job Application Form Detection Content Script

// Detect if we're in an iframe
const isInIframe = window !== window.top;
const isJobApplicationIframe = isInIframe && (
    window.location.href.includes('greenhouse.io') ||
    window.location.href.includes('lever.co') ||
    window.location.href.includes('workday.com') ||
    window.location.href.includes('smartrecruiters.com') ||
    window.location.href.includes('bamboohr.com') ||
    window.location.href.includes('jobvite.com') ||
    window.location.href.includes('icims.com')
);

console.log('🔍 Content script loaded:', {
    isInIframe,
    isJobApplicationIframe,
    url: window.location.href
});

class JobApplicationDetector {
    constructor() {
        this.isJobApplication = false;
        this.detectedFields = [];
        this.confidence = 0;
        this.isKnownJobApplicationDomain = false;
        this.isInIframe = isInIframe;
        this.isJobApplicationIframe = isJobApplicationIframe;
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
        console.log('🔍 Scanning page for job application forms...', {
            isInIframe: this.isInIframe,
            isJobApplicationIframe: this.isJobApplicationIframe,
            url: window.location.href
        });
        
        // Reset detection state
        this.isJobApplication = false;
        this.detectedFields = [];
        this.confidence = 0;
        this.isKnownJobApplicationDomain = false;

        // If we're in a known job application iframe, start with high confidence
        if (this.isJobApplicationIframe) {
            console.log('✅ Detected job application iframe!');
            this.confidence += 95; // Very high confidence for job application iframes
            this.isKnownJobApplicationDomain = true;
        }

        // Multiple detection methods
        this.detectByURL();
        this.detectByPageContent();
        this.detectByFormFields();
        this.detectByJobSites();
        
        // Only check for known domains if we're not already in an iframe
        if (!this.isInIframe) {
            this.detectByKnownJobApplicationDomains();
        }

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
        console.log('🔍 Starting field detection...');
        
        // First, let's directly check for the specific fields we know exist
        const directFieldCheck = {
            firstName: document.getElementById('first_name'),
            lastName: document.getElementById('last_name'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone')
        };
        
        console.log('🎯 Direct field check results:', directFieldCheck);
        
        // Add directly found fields
        Object.entries(directFieldCheck).forEach(([type, element]) => {
            if (element) {
                console.log(`✅ Found ${type} directly by ID:`, element);
                this.detectedFields.push({
                    type,
                    element,
                    identifier: `direct-${element.id}`,
                    weight: 15
                });
                this.confidence += 15;
            }
        });
        
        // Also scan ALL input fields on the page (not just in forms)
        const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"], textarea');
        console.log(`🔍 Found ${allInputs.length} total input fields on page:`);
        allInputs.forEach((input, index) => {
            console.log(`  Input ${index + 1}:`, {
                id: input.id,
                name: input.name,
                type: input.type,
                placeholder: input.placeholder,
                'aria-label': input.getAttribute('aria-label'),
                className: input.className,
                tagName: input.tagName
            });
        });
        
        const jobFieldPatterns = [
            // High-weight personal info fields (strong indicators) - more comprehensive patterns
            { 
                pattern: /first.?name|fname|given.?name|first_name|first$/i, 
                type: 'firstName', 
                weight: 12,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            { 
                pattern: /last.?name|lname|surname|family.?name|last_name|last$/i, 
                type: 'lastName', 
                weight: 12,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            { 
                pattern: /^email$|e-mail|email.?address|mail$|email_address/i, 
                type: 'email', 
                weight: 10,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'type', 'class']
            },
            { 
                pattern: /^phone$|telephone|mobile|cell|phone.?number|tel$|phone_number/i, 
                type: 'phone', 
                weight: 10,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'type', 'class']
            },
            
            // Medium-weight personal fields
            { 
                pattern: /full.?name|^name$|applicant.?name|your.?name/i, 
                type: 'fullName', 
                weight: 8,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            { 
                pattern: /address|street|city|zip|postal/i, 
                type: 'address', 
                weight: 6,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            
            // High-weight job-specific fields
            { 
                pattern: /resume|cv|curriculum/i, 
                type: 'resume', 
                weight: 15,
                checkAttributes: ['id', 'name', 'data-testid', 'aria-label', 'class']
            },
            { 
                pattern: /cover.?letter/i, 
                type: 'coverLetter', 
                weight: 15,
                checkAttributes: ['id', 'name', 'data-testid', 'aria-label', 'class']
            },
            
            // Medium-weight job fields
            { 
                pattern: /position|job.?title|role/i, 
                type: 'position', 
                weight: 8,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            { 
                pattern: /experience|work.?history/i, 
                type: 'experience', 
                weight: 8,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            { 
                pattern: /salary|compensation|expected.?pay/i, 
                type: 'salary', 
                weight: 6,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            { 
                pattern: /availability|start.?date/i, 
                type: 'availability', 
                weight: 5,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            },
            { 
                pattern: /linkedin|portfolio|website/i, 
                type: 'links', 
                weight: 4,
                checkAttributes: ['id', 'name', 'placeholder', 'aria-label', 'data-testid', 'class']
            }
        ];

        const forms = document.querySelectorAll('form');
        console.log(`📋 Found ${forms.length} forms on page`);
        if (forms.length === 0) {
            console.log('⚠️ No forms found, but continuing with all inputs...');
            // If no forms, process all inputs directly
            this.processInputs(allInputs, jobFieldPatterns);
            return;
        }

        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            this.processInputs(inputs, jobFieldPatterns);
        });

        if (this.detectedFields.length > 0) {
            console.log('✅ Detected job application fields:', this.detectedFields.map(f => f.type));
            
            // Bonus scoring for personal info field combinations
            this.applyPersonalInfoBonus();
        }
    }

    processInputs(inputs, jobFieldPatterns) {
        inputs.forEach(input => {
            console.log(`\n🔍 Analyzing input element:`, {
                tagName: input.tagName,
                type: input.type,
                id: input.id,
                name: input.name,
                placeholder: input.placeholder,
                'aria-label': input.getAttribute('aria-label'),
                class: input.className
            });

            jobFieldPatterns.forEach(({ pattern, type, weight, checkAttributes }) => {
                // Build field identifiers from specified attributes
                const fieldIdentifiers = [];
                
                checkAttributes.forEach(attr => {
                    let value = '';
                    switch(attr) {
                        case 'id':
                            value = input.id;
                            break;
                        case 'name':
                            value = input.name;
                            break;
                        case 'placeholder':
                            value = input.placeholder;
                            break;
                        case 'aria-label':
                            value = input.getAttribute('aria-label');
                            break;
                        case 'data-testid':
                            value = input.getAttribute('data-testid');
                            break;
                        case 'type':
                            value = input.type;
                            break;
                        case 'class':
                            value = input.className;
                            break;
                        default:
                            value = input.getAttribute(attr);
                    }
                    if (value) {
                        fieldIdentifiers.push(value);
                    }
                });
                
                // Also include label text
                const labelText = this.getLabelText(input);
                if (labelText) {
                    fieldIdentifiers.push(labelText);
                }
                
                const combinedIdentifiers = fieldIdentifiers.join(' ').toLowerCase();
                console.log(`  Testing ${type} pattern against: "${combinedIdentifiers}"`);
                
                if (pattern.test(combinedIdentifiers)) {
                    console.log(`  ✅ MATCH! Found ${type} field`);
                    this.detectedFields.push({
                        type,
                        element: input,
                        identifier: combinedIdentifiers,
                        weight
                    });
                    this.confidence += weight;
                }
            });
        });
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

    applyPersonalInfoBonus() {
        const detectedTypes = this.detectedFields.map(field => field.type);
        const personalFields = {
            firstName: detectedTypes.includes('firstName'),
            lastName: detectedTypes.includes('lastName'),
            email: detectedTypes.includes('email'),
            phone: detectedTypes.includes('phone'),
            fullName: detectedTypes.includes('fullName')
        };

        let bonusPoints = 0;
        let bonusReason = '';

        // Check for strong personal info combinations
        if (personalFields.firstName && personalFields.lastName && personalFields.email) {
            bonusPoints = 25;
            bonusReason = 'First Name + Last Name + Email combination';
        } else if (personalFields.fullName && personalFields.email) {
            bonusPoints = 20;
            bonusReason = 'Full Name + Email combination';
        } else if (personalFields.firstName && personalFields.lastName) {
            bonusPoints = 15;
            bonusReason = 'First Name + Last Name combination';
        } else if (personalFields.email && personalFields.phone) {
            bonusPoints = 15;
            bonusReason = 'Email + Phone combination';
        }

        // Additional bonus for having all four main personal fields
        if (personalFields.firstName && personalFields.lastName && personalFields.email && personalFields.phone) {
            bonusPoints += 10;
            bonusReason += ' + All four personal fields bonus';
        }

        if (bonusPoints > 0) {
            this.confidence += bonusPoints;
            console.log(`🎯 Personal info bonus: +${bonusPoints} points (${bonusReason})`);
        }
    }

    detectByKnownJobApplicationDomains() {
        const hostname = window.location.hostname.toLowerCase();
        const url = window.location.href.toLowerCase();
        
        // Domains we know for sure are job applications
        const knownJobApplicationDomains = [
            'jobs.ashbyhq.com',
            '*.myworkdayjobs.com',
            '*.smartapply.indeed.com',
            '*.greenhouse.io'
        ];

        // Special cases for major companies with job pages
        const specialJobPages = [
            {
                domain: 'stripe.com',
                pathPattern: '/jobs/',
                name: 'Stripe Jobs'
            },
            {
                domain: 'careers.google.com',
                pathPattern: '/jobs/',
                name: 'Google Careers'
            },
            {
                domain: 'jobs.netflix.com',
                pathPattern: '/',
                name: 'Netflix Jobs'
            },
            {
                domain: 'careers.microsoft.com',
                pathPattern: '/',
                name: 'Microsoft Careers'
            }
        ];

        console.log('🔍 Checking known job domains and special pages...');

        // Check standard known domains
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
        
        // Check special job pages
        const matchingSpecialPage = specialJobPages.find(page => {
            const domainMatch = hostname === page.domain || hostname.endsWith('.' + page.domain);
            const pathMatch = url.includes(page.pathPattern);
            return domainMatch && pathMatch;
        });

        if (isKnownJobApplicationDomain) {
            this.confidence += 100; // Very high confidence boost
            this.isKnownJobApplicationDomain = true;
            console.log('✅ Detected known job application domain:', hostname);
        } else if (matchingSpecialPage) {
            this.confidence += 90; // High confidence for special job pages
            this.isKnownJobApplicationDomain = true;
            console.log('✅ Detected special job page:', matchingSpecialPage.name);
            
            // Check for embedded job application iframes
            this.detectJobApplicationIframes();
        }
    }

    detectJobApplicationIframes() {
        console.log('🔍 Checking for embedded job application iframes...');
        
        const iframes = document.querySelectorAll('iframe');
        const jobIframePatterns = [
            'greenhouse.io',
            'lever.co',
            'workday.com',
            'smartrecruiters.com',
            'bamboohr.com',
            'jobvite.com',
            'icims.com'
        ];

        iframes.forEach((iframe, index) => {
            const src = iframe.src?.toLowerCase() || '';
            console.log(`📋 Iframe ${index + 1}:`, {
                src: iframe.src,
                title: iframe.title,
                id: iframe.id,
                className: iframe.className
            });

            const isJobIframe = jobIframePatterns.some(pattern => src.includes(pattern));
            if (isJobIframe) {
                this.confidence += 20;
                console.log('✅ Found job application iframe:', src);
                
                // Add a detected field for iframe presence
                this.detectedFields.push({
                    type: 'iframe-job-application',
                    element: iframe,
                    identifier: `iframe-${iframe.src}`,
                    weight: 20
                });
            }
        });
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

    async performAutofill() {
        console.log('🚀 Starting enhanced autofill...');
        
        try {
            // Get user settings
            const result = await chrome.storage.local.get(['userSettings']);
            if (!result.userSettings) {
                throw new Error('No user settings found. Please configure your information in Settings first.');
            }
            
            const userSettings = result.userSettings;
            console.log('👤 User data:', {
                firstName: userSettings.firstName,
                lastName: userSettings.lastName,
                email: userSettings.email,
                phone: userSettings.phone
            });
            
            const filledFields = [];
            const skippedFields = [];
            
            // Enhanced field mapping with multiple detection strategies
            const fieldConfig = {
                firstName: {
                    value: userSettings.firstName,
                    ids: ['first_name', 'firstName', 'first-name', 'fname'],
                    labels: ['First Name', 'First name', 'first name', 'Given Name', 'Given name']
                },
                lastName: {
                    value: userSettings.lastName,
                    ids: ['last_name', 'lastName', 'last-name', 'lname', 'surname'],
                    labels: ['Last Name', 'Last name', 'last name', 'Family Name', 'Family name', 'Surname']
                },
                email: {
                    value: userSettings.email,
                    ids: ['email', 'email_address', 'emailAddress', 'email-address'],
                    labels: ['Email', 'Email Address', 'Email address', 'E-mail', 'E-mail Address']
                },
                phone: {
                    value: userSettings.phone,
                    ids: ['phone', 'phone_number', 'phoneNumber', 'phone-number', 'mobile', 'tel'],
                    labels: ['Phone', 'Phone Number', 'Phone number', 'Mobile', 'Mobile Number', 'Telephone']
                }
            };
            
            // Try to fill each field type
            Object.entries(fieldConfig).forEach(([fieldType, config]) => {
                console.log(`\n🔍 Looking for ${fieldType} field...`);
                
                if (!config.value) {
                    console.log(`⏭️ No value for ${fieldType}`);
                    skippedFields.push({ type: fieldType, reason: 'No data available' });
                    return;
                }
                
                let element = null;
                let foundMethod = '';
                
                // Strategy 1: Try direct ID lookup
                for (const id of config.ids) {
                    element = document.getElementById(id);
                    if (element) {
                        foundMethod = `ID: ${id}`;
                        console.log(`✅ Found by ID: ${id}`, element);
                        break;
                    }
                }
                
                // Strategy 2: If no ID match, try label-based lookup
                if (!element) {
                    console.log(`🏷️ No ID match, trying label-based detection...`);
                    
                    for (const labelText of config.labels) {
                        // Look for labels containing this text
                        const labels = Array.from(document.querySelectorAll('label'));
                        const matchingLabel = labels.find(label => 
                            label.textContent.trim().toLowerCase().includes(labelText.toLowerCase())
                        );
                        
                        if (matchingLabel) {
                            console.log(`🏷️ Found matching label: "${matchingLabel.textContent.trim()}"`, matchingLabel);
                            
                            // Try to find associated input
                            // Method 1: Check if label has 'for' attribute
                            if (matchingLabel.htmlFor) {
                                element = document.getElementById(matchingLabel.htmlFor);
                                if (element) {
                                    foundMethod = `Label 'for': ${labelText}`;
                                    console.log(`✅ Found input via label 'for' attribute:`, element);
                                    break;
                                }
                            }
                            
                            // Method 2: Look for input inside the label
                            if (!element) {
                                element = matchingLabel.querySelector('input');
                                if (element) {
                                    foundMethod = `Label contains input: ${labelText}`;
                                    console.log(`✅ Found input inside label:`, element);
                                    break;
                                }
                            }
                            
                            // Method 3: Look for input immediately after the label
                            if (!element) {
                                let nextSibling = matchingLabel.nextElementSibling;
                                while (nextSibling && !element) {
                                    if (nextSibling.tagName === 'INPUT' || 
                                        (nextSibling.tagName === 'DIV' && nextSibling.querySelector('input'))) {
                                        element = nextSibling.tagName === 'INPUT' ? nextSibling : nextSibling.querySelector('input');
                                        if (element) {
                                            foundMethod = `Label sibling: ${labelText}`;
                                            console.log(`✅ Found input as sibling of label:`, element);
                                            break;
                                        }
                                    }
                                    nextSibling = nextSibling.nextElementSibling;
                                }
                            }
                        }
                        
                        if (element) break; // Found via this label, stop searching
                    }
                }
                
                // If still no element found
                if (!element) {
                    console.log(`❌ No element found for ${fieldType}`);
                    skippedFields.push({ 
                        type: fieldType, 
                        reason: `Element not found (tried IDs: ${config.ids.join(', ')} and labels: ${config.labels.join(', ')})` 
                    });
                    return;
                }
                
                // Fill the found element
                try {
                    console.log(`🎯 Filling ${fieldType} (${foundMethod}):`, element);
                    
                    // Simple fill
                    element.focus();
                    element.value = config.value;
                    
                    // Trigger events
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    filledFields.push({
                        type: fieldType,
                        value: config.value,
                        element: element.tagName.toLowerCase(),
                        method: foundMethod
                    });
                    
                    console.log(`✅ Successfully filled ${fieldType}: "${config.value}"`);
                    
                } catch (error) {
                    console.error(`❌ Failed to fill ${fieldType}:`, error);
                    skippedFields.push({ type: fieldType, reason: error.message });
                }
            });
            
            const successCount = filledFields.length;
            const totalAttempted = Object.keys(fieldConfig).length;
            
            return {
                success: true,
                message: `Enhanced autofill completed: ${successCount}/${totalAttempted} fields filled`,
                filledFields: filledFields,
                skippedFields: skippedFields
            };
            
        } catch (error) {
            console.error('❌ Autofill failed:', error);
            throw error;
        }
    }


    fillField(element, value) {
        // Focus the element first
        element.focus();
        
        // Clear existing value
        element.value = '';
        
        // Set the new value
        element.value = value;
        
        // Trigger events to notify the page that the field was changed
        const events = ['input', 'change', 'keyup', 'blur'];
        events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            element.dispatchEvent(event);
        });
        
        // For React/Vue applications, also trigger a more comprehensive input event
        const inputEvent = new Event('input', { bubbles: true });
        Object.defineProperty(inputEvent, 'target', { value: element, enumerable: true });
        element.dispatchEvent(inputEvent);
        
        // Add visual feedback
        this.addVisualFeedback(element);
    }

    isFieldVisible(element) {
        if (!element) {
            console.log('Element is null/undefined');
            return false;
        }
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        console.log(`Checking visibility for ${element.tagName} (id: ${element.id}):`, {
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight,
            rect: {width: rect.width, height: rect.height, top: rect.top, left: rect.left},
            inViewport: rect.top >= 0 && rect.left >= 0
        });
        
        // VERY lenient visibility check - basically only exclude completely hidden elements
        const isDisplayed = style.display !== 'none';
        const isVisible = style.visibility !== 'hidden';
        const hasOpacity = parseFloat(style.opacity) > 0; // Any opacity > 0
        
        // Check if element has any size OR is positioned on screen
        const hasSize = element.offsetWidth > 0 && element.offsetHeight > 0;
        const hasPosition = rect.width > 0 || rect.height > 0;
        
        const visible = isDisplayed && isVisible && hasOpacity && (hasSize || hasPosition);
        console.log(`Element visibility result: ${visible}`);
        
        // If still not visible but the element clearly exists, let's be even more lenient
        if (!visible && element.id && (element.id.includes('first_name') || element.id.includes('last_name') || element.id.includes('email') || element.id.includes('phone'))) {
            console.log(`🔧 OVERRIDE: Element ${element.id} exists and is a key field, treating as visible`);
            return true;
        }
        
        return visible;
    }

    addVisualFeedback(element) {
        // Add a temporary green border to show the field was filled
        const originalBorder = element.style.border;
        element.style.border = '2px solid #4CAF50';
        element.style.transition = 'border 0.3s ease';
        
        setTimeout(() => {
            element.style.border = originalBorder;
        }, 2000);
    }
}

// Initialize the detector
const detector = new JobApplicationDetector();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PING') {
        // Simple ping/pong to check if content script is ready
        sendResponse({ 
            status: 'ready',
            isInIframe: isInIframe,
            isJobApplicationIframe: isJobApplicationIframe,
            url: window.location.href
        });
    } else if (request.type === 'GET_DETECTION_STATUS') {
        sendResponse({
            isJobApplication: detector.isJobApplication,
            confidence: detector.confidence,
            isInIframe: isInIframe,
            isJobApplicationIframe: isJobApplicationIframe,
            detectedFields: detector.detectedFields.map(field => ({
                type: field.type,
                identifier: field.identifier,
                weight: field.weight
            }))
        });
    } else if (request.type === 'RERUN_DETECTION') {
        detector.detectJobApplication();
        sendResponse({ success: true });
    } else if (request.type === 'PERFORM_AUTOFILL') {
        // Use the new simple autofill method
        detector.performAutofill().then((result) => {
            sendResponse(result);
        }).catch((error) => {
            console.error('Autofill error:', error);
            sendResponse({ 
                success: false, 
                message: 'Autofill failed: ' + error.message 
            });
        });
        
        return true; // Keep message channel open for async response
    }
});

console.log('🚀 Job Application Detector loaded');

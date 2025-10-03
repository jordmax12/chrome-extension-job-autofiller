import {
    analyzeIframes,
    analyzeJobSites,
    analyzeKnownDomains,
    analyzePageContent,
    analyzePersonalInfoBonus,
    analyzeURL,
    getDirectFields,
    getElementIdentifiers,
    getLabelText,
    isJobApplicationIframe
} from './detection-utils.js';

import { performAutofill } from './autofill-utils.js';
import { JOB_FIELD_PATTERNS } from './field-patterns.js';

/**
 * Detection state structure
 */
const createDetectionState = () => ({
    isJobApplication: false,
    detectedFields: [],
    confidence: 0,
    isKnownJobApplicationDomain: false,
    isInIframe: window !== window.top,
    isJobApplicationIframe: isJobApplicationIframe(window !== window.top, window.location.href),
    timestamp: Date.now()
});

/**
 * Pure function to process form inputs against field patterns
 * @param {NodeList} inputs - Input elements to process
 * @param {Array} patterns - Field patterns to match against
 * @param {Document} document - Document for label lookup
 * @returns {Array} Array of detected fields
 */
const processInputs = (inputs, patterns, document) => {
    const detectedFields = [];
    
    Array.from(inputs).forEach(input => {
        console.log(`\n🔍 Analyzing input element:`, {
            tagName: input.tagName,
            type: input.type,
            id: input.id,
            name: input.name,
            placeholder: input.placeholder,
            'aria-label': input.getAttribute('aria-label'),
            class: input.className
        });

        patterns.forEach(({ pattern, type, weight, checkAttributes }) => {
            // Build field identifiers from specified attributes
            const fieldIdentifiers = getElementIdentifiers(input, checkAttributes);
            
            // Also include label text
            const labelText = getLabelText(input, document);
            if (labelText) {
                fieldIdentifiers.push(labelText);
            }
            
            const combinedIdentifiers = fieldIdentifiers.join(' ').toLowerCase();
            console.log(`  Testing ${type} pattern against: "${combinedIdentifiers}"`);
            
            if (pattern.test(combinedIdentifiers)) {
                console.log(`  ✅ MATCH! Found ${type} field`);
                detectedFields.push({
                    type,
                    element: input,
                    identifier: combinedIdentifiers,
                    weight
                });
            }
        });
    });
    
    return detectedFields;
};

/**
 * Pure function to detect form fields on the page
 * @param {Document} document - Document to analyze
 * @returns {Object} Detection results with fields and confidence points
 */
const detectFormFields = (document) => {
    console.log('🔍 Starting field detection...');
    
    let detectedFields = [];
    let confidencePoints = 0;
    
    // Direct field detection
    const directFields = getDirectFields(document);
    console.log('🎯 Direct field check results:', directFields);
    
    // Add directly found fields
    Object.entries(directFields).forEach(([type, element]) => {
        console.log(`✅ Found ${type} directly by ID:`, element);
        detectedFields.push({
            type,
            element,
            identifier: `direct-${element.id}`,
            weight: 15
        });
        confidencePoints += 15;
    });
    
    // Scan all input fields
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

    // Process forms or all inputs if no forms found
    const forms = document.querySelectorAll('form');
    console.log(`📋 Found ${forms.length} forms on page`);
    
    let inputsToProcess = [];
    if (forms.length === 0) {
        console.log('⚠️ No forms found, but continuing with all inputs...');
        inputsToProcess = allInputs;
    } else {
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputsToProcess = [...inputsToProcess, ...Array.from(inputs)];
        });
    }

    // Process inputs with patterns
    const patternFields = processInputs(inputsToProcess, JOB_FIELD_PATTERNS, document);
    detectedFields = [...detectedFields, ...patternFields];
    
    // Add confidence points from pattern matches
    const patternConfidence = patternFields.reduce((sum, field) => sum + field.weight, 0);
    confidencePoints += patternConfidence;

    if (detectedFields.length > 0) {
        console.log('✅ Detected job application fields:', detectedFields.map(f => f.type));
        
        // Apply personal info bonus
        const detectedTypes = detectedFields.map(field => field.type);
        const bonus = analyzePersonalInfoBonus(detectedTypes);
        
        if (bonus.points > 0) {
            confidencePoints += bonus.points;
            console.log(`🎯 Personal info bonus: +${bonus.points} points (${bonus.reason})`);
        }
    }

    return {
        detectedFields,
        confidencePoints
    };
};

/**
 * Pure function to detect job application iframes
 * @param {Document} document - Document to analyze
 * @returns {Object} Detection results with iframe fields and confidence points
 */
const detectJobApplicationIframes = (document) => {
    console.log('🔍 Checking for embedded job application iframes...');
    
    const iframes = document.querySelectorAll('iframe');
    const result = analyzeIframes(iframes);
    const detectedFields = [];
    
    if (result.score > 0) {
        console.log(`✅ Found ${result.foundIframes.length} job application iframe(s)`);
        
        result.foundIframes.forEach(iframe => {
            console.log(`📋 Iframe ${iframe.index}:`, {
                src: iframe.src,
                title: iframe.title,
                id: iframe.id,
                className: iframe.className
            });
            
            // Add detected field for iframe presence
            detectedFields.push({
                type: 'iframe-job-application',
                element: document.querySelectorAll('iframe')[iframe.index - 1],
                identifier: `iframe-${iframe.src}`,
                weight: 20
            });
        });
    }
    
    return {
        detectedFields,
        confidencePoints: result.score
    };
};

/**
 * Main detection function - orchestrates all detection methods
 * @param {Document} document - Document to analyze
 * @param {Window} window - Window object for URL/location info
 * @returns {Object} Complete detection results
 */
export const detectJobApplication = (document, window) => {
    console.log('🔍 Scanning page for job application forms...', {
        isInIframe: window !== window.top,
        isJobApplicationIframe: isJobApplicationIframe(window !== window.top, window.location.href),
        url: window.location.href
    });
    
    // Initialize detection state
    let state = createDetectionState();
    
    // If we're in a known job application iframe, start with high confidence
    if (state.isJobApplicationIframe) {
        console.log('✅ Detected job application iframe!');
        state.confidence += 95; // Very high confidence for job application iframes
        state.isKnownJobApplicationDomain = true;
    }

    // Run all detection methods and accumulate results
    const urlResult = analyzeURL(window.location.href, window.location.hostname);
    if (urlResult.score > 0) {
        state.confidence += urlResult.score;
        console.log(`✅ URL analysis (+${urlResult.score} points):`, urlResult.reasons);
    }

    const contentResult = analyzePageContent(document.body.innerText);
    if (contentResult.score > 0) {
        state.confidence += contentResult.score;
        console.log(`✅ Page content analysis: +${contentResult.score} points`);
        
        if (contentResult.phraseMatches.length > 0) {
            console.log('✅ Job application phrases found:', contentResult.phraseMatches);
        }
        
        if (contentResult.formMatches.length > 0) {
            console.log('✅ Form indicators found:', contentResult.formMatches);
        }
    }

    const fieldResult = detectFormFields(document);
    state.detectedFields = [...state.detectedFields, ...fieldResult.detectedFields];
    state.confidence += fieldResult.confidencePoints;

    const jobSiteResult = analyzeJobSites(window.location.hostname, window.location.href);
    if (jobSiteResult.score > 0) {
        state.confidence += jobSiteResult.score;
        console.log(`✅ Job site/ATS detection (+${jobSiteResult.score} points):`, jobSiteResult.reasons);
    }

    // Only check for known domains if we're not already in an iframe
    if (!state.isInIframe) {
        const domainResult = analyzeKnownDomains(window.location.hostname, window.location.href);
        
        if (domainResult.isKnown) {
            state.confidence += domainResult.score;
            state.isKnownJobApplicationDomain = true;
            
            if (domainResult.type === 'known_domain') {
                console.log('✅ Detected known job application domain:', domainResult.hostname);
            } else if (domainResult.type === 'special_page') {
                console.log('✅ Detected special job page:', domainResult.name);
                
                // Check for embedded iframes
                const iframeResult = detectJobApplicationIframes(document);
                state.detectedFields = [...state.detectedFields, ...iframeResult.detectedFields];
                state.confidence += iframeResult.confidencePoints;
            }
        }
    }

    // Calculate final confidence and job application status
    state.confidence = Math.min(state.confidence, 100); // Cap at 100%
    state.isJobApplication = state.confidence > 40;
    
    console.log(`📊 Detection complete. Confidence: ${state.confidence}%`, {
        isJobApplication: state.isJobApplication,
        detectedFields: state.detectedFields
    });

    return state;
};

/**
 * Function to store detection results
 * @param {Object} results - Detection results to store
 */
export const storeDetectionResults = (results) => {
    const storageData = {
        isJobApplication: results.isJobApplication,
        confidence: results.confidence,
        detectedFields: results.detectedFields.map(field => ({
            type: field.type,
            identifier: field.identifier,
            weight: field.weight
        })),
        url: window.location.href,
        hostname: window.location.hostname.toLowerCase(),
        isKnownJobApplicationDomain: results.isKnownJobApplicationDomain,
        timestamp: results.timestamp
    };

    // Store in Chrome storage for popup to access
    chrome.storage.local.set({ detectionResults: storageData });

    // Also send message to popup if it's open
    chrome.runtime.sendMessage({
        type: 'DETECTION_UPDATE',
        data: storageData
    }).catch(() => {
        // Popup might not be open, that's okay
    });
};

/**
 * Function to observe page changes and trigger re-detection
 * @param {Function} onPageChange - Callback when page changes
 */
export const observePageChanges = (onPageChange) => {
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
            setTimeout(() => onPageChange(), 1000);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

/**
 * Autofill function wrapper
 * @param {Document} document - Document to fill forms in
 * @returns {Promise<Object>} Autofill results
 */
export const performJobAutofill = async (document) => {
    try {
        // Get user settings
        const result = await chrome.storage.local.get(['userSettings']);
        if (!result.userSettings) {
            throw new Error('No user settings found. Please configure your information in Settings first.');
        }
        
        return await performAutofill(document, result.userSettings);
        
    } catch (error) {
        console.error('❌ Autofill failed:', error);
        throw error;
    }
};
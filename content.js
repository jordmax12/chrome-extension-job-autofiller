import { isJobApplicationIframe } from './src/detection-utils.js';
import {
    detectJobApplication,
    observePageChanges,
    performJobAutofill,
    storeDetectionResults
} from './src/job-detector.js';

// Detect if we're in an iframe and if it's a job application iframe
const isInIframe = window !== window.top;
const isJobAppIframe = isJobApplicationIframe(isInIframe, window.location.href);

console.log('🔍 Content script loaded:', {
    isInIframe,
    isJobApplicationIframe: isJobAppIframe,
    url: window.location.href
});

// Initialize detection state
let currentDetectionState = null;

// Function to run detection
const runDetection = () => {
    currentDetectionState = detectJobApplication(document, window);
    storeDetectionResults(currentDetectionState);
};

// Initialize detection
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDetection);
} else {
    runDetection();
}

// Observe page changes
observePageChanges(runDetection);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PING') {
        // Simple ping/pong to check if content script is ready
        sendResponse({ 
            status: 'ready',
            isInIframe: isInIframe,
            isJobApplicationIframe: isJobAppIframe,
            url: window.location.href
        });
    } else if (request.type === 'GET_DETECTION_STATUS') {
        // Return current detection state or run fresh detection if none exists
        if (!currentDetectionState) {
            currentDetectionState = detectJobApplication(document, window);
        }
        
        sendResponse({
            isJobApplication: currentDetectionState.isJobApplication,
            confidence: currentDetectionState.confidence,
            isInIframe: isInIframe,
            isJobApplicationIframe: isJobAppIframe,
            detectedFields: currentDetectionState.detectedFields.map(field => ({
                type: field.type,
                identifier: field.identifier,
                weight: field.weight
            }))
        });
    } else if (request.type === 'RERUN_DETECTION') {
        runDetection();
        sendResponse({ success: true });
    } else if (request.type === 'PERFORM_AUTOFILL') {
        // Use the functional autofill method
        performJobAutofill(document).then((result) => {
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

console.log('🚀 Job Application Detector loaded (functional architecture)');

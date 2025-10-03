/**
 * Autofill field configuration
 * Pure function to generate field configuration based on user settings
 * @param {Object} userSettings - User's personal information
 * @returns {Object} Field configuration for autofill
 */
export const createFieldConfig = (userSettings) => ({
    // Full name field (common in Ashby and other ATS)
    fullName: {
        value: userSettings.firstName && userSettings.lastName ? 
               `${userSettings.firstName} ${userSettings.lastName}` : 
               (userSettings.firstName || userSettings.lastName || ''),
        ids: [
            '_systemfield_name', 'name', 'full_name', 'fullName', 'full-name',
            'applicant_name', 'candidate_name', 'user_name', 'userName'
        ],
        labels: ['Name', 'Full Name', 'Full name', 'Your Name', 'Applicant Name', 'Candidate Name']
    },
    firstName: {
        value: userSettings.firstName,
        ids: [
            'first_name', 'firstName', 'first-name', 'fname', 'given_name',
            '_systemfield_first_name', 'applicant_first_name'
        ],
        labels: ['First Name', 'First name', 'first name', 'Given Name', 'Given name']
    },
    lastName: {
        value: userSettings.lastName,
        ids: [
            'last_name', 'lastName', 'last-name', 'lname', 'surname', 'family_name',
            '_systemfield_last_name', 'applicant_last_name'
        ],
        labels: ['Last Name', 'Last name', 'last name', 'Family Name', 'Family name', 'Surname']
    },
    email: {
        value: userSettings.email,
        ids: [
            'email', 'email_address', 'emailAddress', 'email-address', 'e_mail',
            '_systemfield_email', 'applicant_email', 'user_email', 'contact_email'
        ],
        labels: ['Email', 'Email Address', 'Email address', 'E-mail', 'E-mail Address', 'Contact Email']
    },
    phone: {
        value: userSettings.phone,
        ids: [
            'phone', 'phone_number', 'phoneNumber', 'phone-number', 'mobile', 'tel',
            '_systemfield_phone', 'applicant_phone', 'contact_phone', 'mobile_number'
        ],
        labels: ['Phone', 'Phone Number', 'Phone number', 'Mobile', 'Mobile Number', 'Telephone', 'Contact Phone']
    }
});

/**
 * Pure function to find element by ID from a list of possible IDs
 * @param {Document} document - The document to search
 * @param {Array} ids - Array of possible IDs to try
 * @returns {Object|null} Object with element and id, or null if not found
 */
export const findElementById = (document, ids) => {
    for (const id of ids) {
        const element = document.getElementById(id);
        if (element) {
            return { element, id };
        }
    }
    return null;
};

/**
 * Pure function to find element by label text
 * @param {Document} document - The document to search
 * @param {Array} labelTexts - Array of label texts to search for
 * @returns {Object|null} Object with element and method, or null if not found
 */
export const findElementByLabel = (document, labelTexts) => {
    for (const labelText of labelTexts) {
        // Look for labels containing this text
        const labels = Array.from(document.querySelectorAll('label'));
        const matchingLabel = labels.find(label => 
            label.textContent.trim().toLowerCase().includes(labelText.toLowerCase())
        );
        
        if (matchingLabel) {
            // Try to find associated input
            // Method 1: Check if label has 'for' attribute
            if (matchingLabel.htmlFor) {
                const element = document.getElementById(matchingLabel.htmlFor);
                if (element) {
                    return { 
                        element, 
                        method: `Label 'for': ${labelText}`,
                        label: matchingLabel 
                    };
                }
            }
            
            // Method 2: Look for input inside the label
            const nestedInput = matchingLabel.querySelector('input');
            if (nestedInput) {
                return { 
                    element: nestedInput, 
                    method: `Label contains input: ${labelText}`,
                    label: matchingLabel 
                };
            }
            
            // Method 3: Look for input immediately after the label
            let nextSibling = matchingLabel.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.tagName === 'INPUT') {
                    return { 
                        element: nextSibling, 
                        method: `Label sibling: ${labelText}`,
                        label: matchingLabel 
                    };
                }
                
                if (nextSibling.tagName === 'DIV') {
                    const divInput = nextSibling.querySelector('input');
                    if (divInput) {
                        return { 
                            element: divInput, 
                            method: `Label sibling: ${labelText}`,
                            label: matchingLabel 
                        };
                    }
                }
                
                nextSibling = nextSibling.nextElementSibling;
            }
        }
    }
    return null;
};

/**
 * Pure function to fill a form field with a value
 * @param {HTMLElement} element - The element to fill
 * @param {string} value - The value to fill
 * @returns {Object} Result of the fill operation
 */
export const fillFormField = (element, value) => {
    try {
        // Focus the element first
        element.focus();
        
        // Set the value
        element.value = value;
        
        // Trigger events to notify frameworks
        const events = [
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new Event('keyup', { bubbles: true }),
            new Event('blur', { bubbles: true })
        ];
        
        events.forEach(event => element.dispatchEvent(event));
        
        // For React/Vue applications, also trigger a more comprehensive input event
        const inputEvent = new Event('input', { bubbles: true });
        Object.defineProperty(inputEvent, 'target', { value: element, enumerable: true });
        element.dispatchEvent(inputEvent);
        
        return {
            success: true,
            element: element.tagName.toLowerCase(),
            value
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Pure function to add visual feedback to a filled field
 * @param {HTMLElement} element - The element to add feedback to
 * @param {number} duration - Duration in milliseconds (default 2000)
 */
export const addVisualFeedback = (element, duration = 2000) => {
    const originalBorder = element.style.border;
    element.style.border = '2px solid #4CAF50';
    element.style.transition = 'border 0.3s ease';
    
    setTimeout(() => {
        element.style.border = originalBorder;
    }, duration);
};

/**
 * Main autofill function - processes a single field type
 * @param {Document} document - The document to search
 * @param {string} fieldType - Type of field to fill
 * @param {Object} config - Field configuration
 * @returns {Object} Result of the autofill attempt
 */
export const autofillField = (document, fieldType, config) => {
    console.log(`\n🔍 Looking for ${fieldType} field...`);
    
    if (!config.value) {
        console.log(`⏭️ No value for ${fieldType}`);
        return {
            success: false,
            type: fieldType,
            reason: 'No data available'
        };
    }
    
    let element = null;
    let foundMethod = '';
    
    // Strategy 1: Try direct ID lookup
    const idResult = findElementById(document, config.ids);
    if (idResult) {
        element = idResult.element;
        foundMethod = `ID: ${idResult.id}`;
        console.log(`✅ Found by ID: ${idResult.id}`, element);
    }
    
    // Strategy 2: If no ID match, try label-based lookup
    if (!element) {
        console.log(`🏷️ No ID match, trying label-based detection...`);
        
        const labelResult = findElementByLabel(document, config.labels);
        if (labelResult) {
            element = labelResult.element;
            foundMethod = labelResult.method;
            console.log(`🏷️ Found matching label: "${labelResult.label.textContent.trim()}"`, labelResult.label);
            console.log(`✅ Found input via ${labelResult.method}:`, element);
        }
    }
    
    // If still no element found
    if (!element) {
        console.log(`❌ No element found for ${fieldType}`);
        return {
            success: false,
            type: fieldType,
            reason: `Element not found (tried IDs: ${config.ids.join(', ')} and labels: ${config.labels.join(', ')})`
        };
    }
    
    // Fill the found element
    console.log(`🎯 Filling ${fieldType} (${foundMethod}):`, element);
    
    const fillResult = fillFormField(element, config.value);
    
    if (fillResult.success) {
        // Add visual feedback
        addVisualFeedback(element);
        
        console.log(`✅ Successfully filled ${fieldType}: "${config.value}"`);
        
        return {
            success: true,
            type: fieldType,
            value: config.value,
            element: fillResult.element,
            method: foundMethod
        };
    } else {
        console.error(`❌ Failed to fill ${fieldType}:`, fillResult.error);
        return {
            success: false,
            type: fieldType,
            reason: fillResult.error
        };
    }
};

/**
 * Main autofill orchestrator function
 * @param {Document} document - The document to search
 * @param {Object} userSettings - User's personal information
 * @returns {Promise<Object>} Autofill results
 */
export const performAutofill = async (document, userSettings) => {
    console.log('🚀 Starting enhanced autofill...');
    console.log('👤 User data:', {
        firstName: userSettings.firstName,
        lastName: userSettings.lastName,
        email: userSettings.email,
        phone: userSettings.phone
    });
    
    const fieldConfig = createFieldConfig(userSettings);
    const filledFields = [];
    const skippedFields = [];
    
    // Process each field type
    for (const [fieldType, config] of Object.entries(fieldConfig)) {
        const result = autofillField(document, fieldType, config);
        
        if (result.success) {
            filledFields.push(result);
        } else {
            skippedFields.push(result);
        }
    }
    
    const successCount = filledFields.length;
    const totalAttempted = Object.keys(fieldConfig).length;
    
    return {
        success: true,
        message: `Enhanced autofill completed: ${successCount}/${totalAttempted} fields filled`,
        filledFields,
        skippedFields
    };
};

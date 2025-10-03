import {
    CONTENT_PATTERNS,
    DIRECT_FIELD_IDS,
    IFRAME_PATTERNS,
    JOB_SITES,
    URL_PATTERNS
} from './field-patterns.js';

/**
 * Pure function to analyze URL for job-related indicators
 * @param {string} url - The URL to analyze
 * @param {string} hostname - The hostname to analyze
 * @returns {Object} Analysis result with score and reasons
 */
export const analyzeURL = (url, hostname) => {
    const lowerUrl = url.toLowerCase();
    const lowerHostname = hostname.toLowerCase();
    
    let urlScore = 0;
    const detectionReasons = [];

    // Check for job keywords in URL
    const keywordMatches = URL_PATTERNS.jobKeywords.filter(keyword => lowerUrl.includes(keyword));
    if (keywordMatches.length > 0) {
        urlScore += keywordMatches.length * 15; // 15 points per keyword
        detectionReasons.push(`Job keywords: ${keywordMatches.join(', ')}`);
    }

    // Check for job-related URL parameters (very strong indicator)
    const paramMatches = URL_PATTERNS.jobUrlParams.filter(param => lowerUrl.includes(param));
    if (paramMatches.length > 0) {
        urlScore += paramMatches.length * 25; // 25 points per parameter
        detectionReasons.push(`Job parameters: ${paramMatches.join(', ')}`);
    }

    // Check for career-specific domains
    const domainMatches = URL_PATTERNS.careerDomains.filter(domain => lowerHostname.includes(domain));
    if (domainMatches.length > 0) {
        urlScore += domainMatches.length * 20; // 20 points per domain
        detectionReasons.push(`Career domains: ${domainMatches.join(', ')}`);
    }

    return {
        score: Math.min(urlScore, 60), // Cap at 60 points
        reasons: detectionReasons
    };
};

/**
 * Pure function to analyze page content for job-related phrases
 * @param {string} pageText - The page text content to analyze
 * @returns {Object} Analysis result with score and matches
 */
export const analyzePageContent = (pageText) => {
    const lowerPageText = pageText.toLowerCase();
    let contentScore = 0;

    // Check for job phrases
    const phraseMatches = CONTENT_PATTERNS.jobPhrases.filter(phrase => lowerPageText.includes(phrase));
    if (phraseMatches.length > 0) {
        contentScore += Math.min(phraseMatches.length * 8, 40); // 8 points per phrase, max 40
    }

    // Check for form indicators
    const formMatches = CONTENT_PATTERNS.formIndicators.filter(indicator => lowerPageText.includes(indicator));
    if (formMatches.length > 0) {
        contentScore += Math.min(formMatches.length * 5, 20); // 5 points per indicator, max 20
    }

    return {
        score: contentScore,
        phraseMatches: phraseMatches.slice(0, 5), // Show first 5
        formMatches: formMatches.slice(0, 3) // Show first 3
    };
};

/**
 * Pure function to analyze job sites and ATS providers
 * @param {string} hostname - The hostname to analyze
 * @param {string} url - The URL to analyze
 * @returns {Object} Analysis result with score and reasons
 */
export const analyzeJobSites = (hostname, url) => {
    const lowerHostname = hostname.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    let siteScore = 0;
    const detectionReasons = [];

    // Check for major job boards
    const jobSiteMatch = JOB_SITES.jobBoards.find(site => lowerHostname.includes(site));
    if (jobSiteMatch) {
        siteScore += 30;
        detectionReasons.push(`Job board: ${jobSiteMatch}`);
    }

    // Check for ATS providers
    const atsMatch = JOB_SITES.atsProviders.find(ats => lowerHostname.includes(ats));
    if (atsMatch) {
        siteScore += 35;
        detectionReasons.push(`ATS provider: ${atsMatch}`);
    }

    // Special detection for Ashby-powered sites
    if (lowerUrl.includes('ashby_jid') || lowerUrl.includes('ashby.com')) {
        siteScore += 40;
        detectionReasons.push('Ashby-powered job application');
    }

    // Check for other ATS indicators in URL
    const atsIndicatorMatch = JOB_SITES.atsIndicators.find(indicator => lowerUrl.includes(indicator));
    if (atsIndicatorMatch) {
        siteScore += 35;
        detectionReasons.push(`ATS indicator: ${atsIndicatorMatch}`);
    }

    return {
        score: Math.min(siteScore, 50), // Cap at 50 points
        reasons: detectionReasons
    };
};

/**
 * Pure function to check known job application domains
 * @param {string} hostname - The hostname to check
 * @param {string} url - The URL to check
 * @returns {Object} Analysis result
 */
export const analyzeKnownDomains = (hostname, url) => {
    const lowerHostname = hostname.toLowerCase();
    const lowerUrl = url.toLowerCase();

    // Check standard known domains
    const isKnownDomain = JOB_SITES.knownDomains.some(domain => {
        if (domain.startsWith('*.')) {
            const baseDomain = domain.substring(2); // Remove '*.'
            return lowerHostname === baseDomain || lowerHostname.endsWith('.' + baseDomain);
        } else {
            return lowerHostname === domain || lowerHostname.endsWith('.' + domain);
        }
    });

    // Check special job pages
    const matchingSpecialPage = JOB_SITES.specialJobPages.find(page => {
        const domainMatch = lowerHostname === page.domain || lowerHostname.endsWith('.' + page.domain);
        const pathMatch = lowerUrl.includes(page.pathPattern);
        return domainMatch && pathMatch;
    });

    if (isKnownDomain) {
        return {
            score: 100,
            isKnown: true,
            type: 'known_domain',
            hostname
        };
    } else if (matchingSpecialPage) {
        return {
            score: 90,
            isKnown: true,
            type: 'special_page',
            name: matchingSpecialPage.name
        };
    }

    return {
        score: 0,
        isKnown: false
    };
};

/**
 * Pure function to get direct field elements by ID
 * @param {Document} document - The document to search
 * @returns {Object} Map of field types to found elements
 */
export const getDirectFields = (document) => {
    const results = {};
    
    Object.entries(DIRECT_FIELD_IDS).forEach(([fieldType, ids]) => {
        for (const id of ids) {
            const element = document.getElementById(id);
            if (element) {
                results[fieldType] = element;
                break; // Found one, move to next field type
            }
        }
    });
    
    return results;
};

/**
 * Pure function to get element attributes for pattern matching
 * @param {HTMLElement} element - The element to analyze
 * @param {Array} checkAttributes - Attributes to check
 * @returns {Array} Array of attribute values
 */
export const getElementIdentifiers = (element, checkAttributes) => {
    const identifiers = [];
    
    checkAttributes.forEach(attr => {
        let value = '';
        switch(attr) {
            case 'id':
                value = element.id;
                break;
            case 'name':
                value = element.name;
                break;
            case 'placeholder':
                value = element.placeholder;
                break;
            case 'aria-label':
                value = element.getAttribute('aria-label');
                break;
            case 'data-testid':
                value = element.getAttribute('data-testid');
                break;
            case 'type':
                value = element.type;
                break;
            case 'class':
                value = element.className;
                break;
            default:
                value = element.getAttribute(attr);
        }
        if (value) {
            identifiers.push(value);
        }
    });
    
    return identifiers;
};

/**
 * Pure function to get label text for an input element
 * @param {HTMLElement} input - The input element
 * @param {Document} document - The document to search
 * @returns {string} Label text or empty string
 */
export const getLabelText = (input, document) => {
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
};

/**
 * Pure function to analyze personal info field combinations for bonus scoring
 * @param {Array} detectedTypes - Array of detected field types
 * @returns {Object} Bonus analysis result
 */
export const analyzePersonalInfoBonus = (detectedTypes) => {
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

    return {
        points: bonusPoints,
        reason: bonusReason
    };
};

/**
 * Pure function to analyze iframe for job application patterns
 * @param {NodeList} iframes - List of iframe elements
 * @returns {Object} Analysis result
 */
export const analyzeIframes = (iframes) => {
    let score = 0;
    const foundIframes = [];

    Array.from(iframes).forEach((iframe, index) => {
        const src = iframe.src?.toLowerCase() || '';
        
        const isJobIframe = IFRAME_PATTERNS.jobApplicationIframes.some(pattern => src.includes(pattern));
        if (isJobIframe) {
            score += 20;
            foundIframes.push({
                index: index + 1,
                src: iframe.src,
                title: iframe.title,
                id: iframe.id,
                className: iframe.className
            });
        }
    });

    return {
        score,
        foundIframes
    };
};

/**
 * Pure function to check if current context is a job application iframe
 * @param {boolean} isInIframe - Whether we're in an iframe
 * @param {string} url - Current URL
 * @returns {boolean} Whether this is a job application iframe
 */
export const isJobApplicationIframe = (isInIframe, url) => {
    return isInIframe && IFRAME_PATTERNS.jobApplicationIframes.some(pattern => 
        url.toLowerCase().includes(pattern)
    );
};

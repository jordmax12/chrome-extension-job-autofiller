/**
 * Job field patterns for detection
 * Each pattern defines how to identify specific field types
 */
export const JOB_FIELD_PATTERNS = [
    // Ashby system fields (very high weight - these are definitive)
    { 
        pattern: /^_systemfield_name$/i, 
        type: 'fullName', 
        weight: 20,
        checkAttributes: ['id', 'name']
    },
    { 
        pattern: /^_systemfield_email$/i, 
        type: 'email', 
        weight: 20,
        checkAttributes: ['id', 'name']
    },
    { 
        pattern: /^_systemfield_phone$/i, 
        type: 'phone', 
        weight: 20,
        checkAttributes: ['id', 'name']
    },
    { 
        pattern: /^_systemfield_first_name$/i, 
        type: 'firstName', 
        weight: 20,
        checkAttributes: ['id', 'name']
    },
    { 
        pattern: /^_systemfield_last_name$/i, 
        type: 'lastName', 
        weight: 20,
        checkAttributes: ['id', 'name']
    },
    
    // High-weight personal info fields (strong indicators)
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
        pattern: /^name$|full.?name|complete.?name|applicant.?name|candidate.?name/i, 
        type: 'fullName', 
        weight: 15,
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

/**
 * Direct field ID mappings for quick detection
 */
export const DIRECT_FIELD_IDS = {
    // Standard fields
    firstName: ['first_name'],
    lastName: ['last_name'],
    email: ['email'],
    phone: ['phone'],
    
    // Ashby system fields
    ashbyName: ['_systemfield_name'],
    ashbyEmail: ['_systemfield_email'],
    ashbyPhone: ['_systemfield_phone'],
    
    // Other common patterns
    fullName: ['name', 'full_name'],
    userEmail: ['user_email'],
    contactPhone: ['contact_phone']
};

/**
 * URL-based detection patterns
 */
export const URL_PATTERNS = {
    jobKeywords: [
        'job', 'career', 'apply', 'application', 'position', 
        'employment', 'hiring', 'recruit', 'vacancy', 'opening',
        'work', 'talent', 'opportunity', 'join'
    ],
    
    jobUrlParams: [
        'ashby_jid',        // Ashby job ID
        'job_id',           // Generic job ID
        'jobid',            // Job ID variations
        'position_id',      // Position ID
        'req_id',           // Requisition ID
        'application_id',   // Application ID
        'apply',            // Apply parameter
        'job-id',           // Hyphenated job ID
        'posting_id'        // Posting ID
    ],
    
    careerDomains: [
        'careers.',
        'jobs.',
        'talent.',
        'apply.',
        'hiring.',
        'work.',
        'opportunities.'
    ]
};

/**
 * Content-based detection patterns
 */
export const CONTENT_PATTERNS = {
    jobPhrases: [
        // Application-specific
        'job application', 'apply now', 'submit application', 'apply for this position',
        'application form', 'online application', 'job posting', 'position details',
        
        // Document-related
        'cover letter', 'resume', 'cv', 'curriculum vitae', 'upload resume',
        'attach resume', 'portfolio', 'work samples',
        
        // Experience-related
        'work experience', 'employment history', 'previous employment',
        'job history', 'professional experience', 'career background',
        
        // Personal info
        'first name', 'last name', 'full name', 'email address', 
        'phone number', 'contact information', 'personal details',
        
        // Job-specific
        'position applied for', 'desired position', 'role', 'department',
        'salary expectations', 'availability', 'start date',
        
        // Company-specific
        'why do you want to work', 'why are you interested', 'tell us about yourself',
        'what interests you', 'motivation', 'career goals'
    ],
    
    formIndicators: [
        'required field', 'mandatory field', '*required', 'please fill',
        'submit', 'send application', 'apply', 'next step',
        'upload file', 'browse file', 'choose file', 'drag and drop'
    ]
};

/**
 * Known job sites and ATS providers
 */
export const JOB_SITES = {
    jobBoards: [
        'linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com',
        'ziprecruiter.com', 'careerbuilder.com', 'simplyhired.com',
        'dice.com', 'stackoverflow.com', 'angel.co', 'wellfound.com',
        'hired.com', 'triplebyte.com', 'vettery.com', 'toptal.com'
    ],
    
    atsProviders: [
        'workday.com', 'greenhouse.io', 'lever.co', 'bamboohr.com',
        'smartrecruiters.com', 'jobvite.com', 'icims.com', 'taleo.com',
        'successfactors.com', 'cornerstone.com', 'ultipro.com',
        'ashbyhq.com', 'recruitee.com', 'personio.com'
    ],
    
    atsIndicators: [
        'greenhouse_jid', 'lever_jid', 'workday_rid', 
        'smartrecruiters_jid', 'jobvite_jid', 'icims_id'
    ],
    
    knownDomains: [
        'jobs.ashbyhq.com',
        '*.myworkdayjobs.com',
        '*.smartapply.indeed.com',
        '*.greenhouse.io'
    ],
    
    specialJobPages: [
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
    ]
};

/**
 * Iframe detection patterns
 */
export const IFRAME_PATTERNS = {
    jobApplicationIframes: [
        'greenhouse.io',
        'lever.co',
        'workday.com',
        'smartrecruiters.com',
        'bamboohr.com',
        'jobvite.com',
        'icims.com'
    ]
};

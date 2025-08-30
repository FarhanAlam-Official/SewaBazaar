/**
 * End-to-end tests for redesigned pages
 * Tests user interactions, animations, and responsive behavior
 */

describe('How It Works Page E2E', () => {
  beforeEach(() => {
    cy.visit('/how-it-works');
  });

  it('should load and display all key elements', () => {
    // Check hero section
    cy.contains('How It Works').should('be.visible');
    cy.contains('Simple & Effective Process').should('be.visible');
    
    // Check stats
    cy.contains('10,000+').should('be.visible');
    cy.contains('1,000+').should('be.visible');
    cy.contains('50+').should('be.visible');
    cy.contains('4.8/5').should('be.visible');
  });

  it('should display all process steps correctly', () => {
    const steps = [
      'Search for Services',
      'Book an Appointment', 
      'Get Service Delivered',
      'Rate and Review'
    ];

    steps.forEach((step, index) => {
      cy.contains(step).should('be.visible');
      // Check step numbers
      cy.get(`[data-step="${index + 1}"]`).should('exist');
    });
  });

  it('should have working CTA buttons', () => {
    cy.contains('Browse Services').should('have.attr', 'href', '/services');
    cy.contains('Learn More').should('have.attr', 'href', '/about');
  });

  it('should show hover effects on feature cards', () => {
    cy.get('[data-testid="feature-card"]').first().trigger('mouseover');
    cy.get('[data-testid="feature-card"]').first().should('have.class', 'hover:-translate-y-2');
  });

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.contains('How It Works').should('be.visible');
    cy.get('.grid').should('have.class', 'grid-cols-1');
    
    cy.viewport('ipad-2');
    cy.get('.grid').should('have.class', 'md:grid-cols-2');
  });

  it('should have proper animations', () => {
    cy.get('[class*="animate-"]').should('have.length.greaterThan', 0);
    cy.scrollTo('bottom', { duration: 2000 });
    cy.get('[class*="animate-fade-in"]').should('be.visible');
  });
});

describe('About Page E2E', () => {
  beforeEach(() => {
    cy.visit('/about');
  });

  it('should load hero section with company info', () => {
    cy.contains('About SewaBazaar').should('be.visible');
    cy.contains('revolutionizing').should('be.visible');
    cy.contains('Nepal\'s #1 Service Marketplace').should('be.visible');
  });

  it('should display company values with details', () => {
    const values = ['Community First', 'Quality Service', 'Customer Care', 'Trust & Reliability'];
    
    values.forEach(value => {
      cy.contains(value).should('be.visible');
    });
  });

  it('should show interactive team cards', () => {
    cy.contains('The Visionaries').should('be.visible');
    cy.contains('The Builders').should('be.visible');
    cy.contains('The Connectors').should('be.visible');
    
    // Test hover effects
    cy.get('[data-testid="team-card"]').first().trigger('mouseover');
    cy.get('[data-testid="team-card"]').first().within(() => {
      cy.get('[data-testid="social-links"]').should('be.visible');
    });
  });

  it('should display timeline correctly', () => {
    cy.contains('Our Journey').should('be.visible');
    cy.contains('The Beginning').should('be.visible');
    cy.contains('Market Leader').should('be.visible');
  });

  it('should have working CTA section', () => {
    cy.scrollTo('bottom');
    cy.contains('Join Our Mission').should('be.visible');
    cy.contains('Find Services').should('have.attr', 'href', '/services');
    cy.contains('Contact Us').should('have.attr', 'href', '/contact');
  });

  it('should show statistics with growth indicators', () => {
    cy.contains('+25%').should('be.visible');
    cy.contains('+40%').should('be.visible');
    cy.contains('+15%').should('be.visible');
  });
});

describe('Contact Page E2E', () => {
  beforeEach(() => {
    cy.visit('/contact');
  });

  it('should load contact information', () => {
    cy.contains('Contact Us').should('be.visible');
    cy.contains('We\'re Here to Help').should('be.visible');
    
    // Check response time stats
    cy.contains('< 1hr').should('be.visible');
    cy.contains('24/7').should('be.visible');
    cy.contains('98%').should('be.visible');
  });

  it('should display contact methods', () => {
    cy.contains('Phone').should('be.visible');
    cy.contains('Email').should('be.visible');
    cy.contains('Location').should('be.visible');
    
    cy.contains('+977-1-4XXXXXX').should('be.visible');
    cy.contains('info@sewabazaar.com').should('be.visible');
    cy.contains('New Baneshwor').should('be.visible');
  });

  it('should have functional contact form', () => {
    // Test floating labels
    cy.get('input[data-testid="name-input"]').focus();
    cy.get('label[for="name-input"]').should('have.class', 'top-0');
    
    cy.get('input[data-testid="name-input"]').blur();
    cy.get('label[for="name-input"]').should('have.class', 'top-1/2');
  });

  it('should validate form fields', () => {
    cy.get('button[type="submit"]').click();
    
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Subject is required').should('be.visible');
    cy.contains('Message is required').should('be.visible');
  });

  it('should validate email format', () => {
    cy.get('input[data-testid="email-input"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Email is invalid').should('be.visible');
  });

  it('should submit form successfully', () => {
    // Fill out form
    cy.get('input[data-testid="name-input"]').type('John Doe');
    cy.get('input[data-testid="email-input"]').type('john@example.com');
    cy.get('input[data-testid="subject-input"]').type('Test Subject');
    cy.get('textarea[data-testid="message-input"]').type('This is a test message');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Check loading state
    cy.contains('Sending...').should('be.visible');
    
    // Check success message
    cy.contains('Message sent successfully').should('be.visible');
  });

  it('should clear form when clear button is clicked', () => {
    cy.get('input[data-testid="name-input"]').type('Test Name');
    cy.get('button[data-testid="clear-form"]').click();
    
    cy.get('input[data-testid="name-input"]').should('have.value', '');
  });

  it('should show quick links and social media', () => {
    cy.contains('Live Chat').should('be.visible');
    cy.contains('Community').should('be.visible');
    cy.contains('Support Center').should('be.visible');
    
    cy.contains('Facebook').should('be.visible');
    cy.contains('Twitter').should('be.visible');
    cy.contains('Instagram').should('be.visible');
    cy.contains('LinkedIn').should('be.visible');
  });

  it('should display map section', () => {
    cy.contains('Visit Our Office').should('be.visible');
    cy.contains('Interactive Map').should('be.visible');
    cy.contains('Open Map').should('be.visible');
    
    cy.contains('Monday - Friday, 9:00 AM - 6:00 PM').should('be.visible');
  });

  it('should have newsletter signup', () => {
    cy.contains('Stay Updated').should('be.visible');
    cy.get('input[placeholder="Enter your email"]').should('be.visible');
    cy.contains('Subscribe').should('be.visible');
  });
});

describe('Cross-Page Navigation', () => {
  it('should navigate between redesigned pages correctly', () => {
    cy.visit('/how-it-works');
    cy.contains('Learn More').click();
    cy.url().should('include', '/about');
    
    cy.contains('Contact Us').click();
    cy.url().should('include', '/contact');
    
    cy.visit('/about');
    cy.contains('Find Services').click();
    cy.url().should('include', '/services');
  });
});

describe('Animation and Performance', () => {
  it('should have smooth scroll animations', () => {
    cy.visit('/how-it-works');
    
    cy.scrollTo('bottom', { duration: 2000 });
    cy.get('[class*="animate-"]').should('be.visible');
    
    // Check that animations don't cause layout shift
    cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
  });

  it('should load pages within acceptable time', () => {
    const pages = ['/how-it-works', '/about', '/contact'];
    
    pages.forEach(page => {
      const start = Date.now();
      cy.visit(page);
      cy.get('h1').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
      });
    });
  });

  it('should be accessible', () => {
    cy.visit('/contact');
    
    // Check for proper heading hierarchy
    cy.get('h1').should('exist');
    cy.get('h2').should('exist');
    
    // Check for proper labels
    cy.get('input').each($input => {
      cy.wrap($input).should('have.attr', 'aria-label').or('have.attr', 'id');
    });
    
    // Check for proper contrast (basic check)
    cy.get('body').should('have.css', 'color');
    cy.get('body').should('have.css', 'background-color');
  });
});

describe('Responsive Behavior', () => {
  const viewports = [
    { device: 'iphone-se2', width: 375, height: 667 },
    { device: 'ipad-mini', width: 768, height: 1024 },
    { device: 'macbook-13', width: 1280, height: 800 }
  ];

  viewports.forEach(viewport => {
    it(`should display correctly on ${viewport.device}`, () => {
      cy.viewport(viewport.width, viewport.height);
      
      cy.visit('/how-it-works');
      cy.contains('How It Works').should('be.visible');
      
      cy.visit('/about');
      cy.contains('About SewaBazaar').should('be.visible');
      
      cy.visit('/contact');
      cy.contains('Contact Us').should('be.visible');
    });
  });
});
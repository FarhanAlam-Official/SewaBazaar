# Archive Documentation Naming Convention

## Overview

This document establishes the naming convention and organization rules for archived documentation in the SewaBazaar project.

## Naming Convention Rules

### File Naming Format

```bash
[CATEGORY]_[FEATURE_AREA]_[TYPE]_[STATUS_DATE].md
```

**Examples:**

- `FEATURE_VOUCHER_SYSTEM_SPECIFICATION_2024_09.md`
- `BUGFIX_VOICE_MESSAGING_TROUBLESHOOTING_GUIDE.md`
- `PHASE_DEVELOPMENT_PHASE_1_COMPLETION_REPORT.md`
- `IMPLEMENTATION_CUSTOMER_MANAGEMENT_ANALYSIS_COMPLETE.md`

### Category Prefixes

- `FEATURE_` - Feature-specific documentation
- `PHASE_` - Development phase documentation
- `IMPLEMENTATION_` - Implementation guides and analysis
- `BUGFIX_` - Bug fixes and troubleshooting
- `TESTING_` - Testing documentation
- `DESIGN_` - Design and UI/UX documentation
- `DEPLOYMENT_` - Deployment and infrastructure
- `PROJECT_` - Project management and completion reports

### Area/Feature Names (UPPER_CASE)

- `VOUCHER_SYSTEM`
- `VOICE_MESSAGING`
- `CUSTOMER_MANAGEMENT`
- `PROVIDER_MANAGEMENT`
- `BOOKING_SYSTEM`
- `PAYMENT_PROCESSING`
- `USER_INTERFACE`
- `API_ENDPOINTS`

### Document Types

- `specification` - Technical specifications
- `implementation-guide` - Step-by-step implementation
- `completion-report` - Feature completion documentation
- `analysis` - Analysis and planning documents
- `troubleshooting-guide` - Debugging and issue resolution
- `improvement-plan` - Enhancement planning
- `status-report` - Progress and status updates
- `technical-specs` - Technical specifications
- `user-guide` - User-facing documentation

### Status/Date Suffixes

- `complete` - Completed implementations
- `deprecated` - No longer maintained
- `superseded` - Replaced by newer documentation
- `YYYY-MM` - Date-based archiving (e.g., `2024-09`)
- `legacy` - Historical reference

## Directory Structure

```bash
archive/
├── development-phases/         # Phase-specific development docs
├── voucher-system-legacy/      # Historical voucher system docs
├── voice-messaging/            # Voice messaging feature docs
├── testing-legacy/             # Historical testing documentation
├── implementation-legacy/      # Legacy implementation guides
├── bug-fixes/                  # Bug fix documentation
├── design-legacy/              # Deprecated design documentation
└── project-management/         # Project completion and management
```

## Folder Organization Rules

### 1. Categorize by Primary Purpose

- Group related documents in thematic folders
- Use descriptive folder names (no abbreviations)
- Maintain consistent folder naming (kebab-case)

### 2. Chronological Organization Within Folders

- Newer documents should have clear version/date indicators
- Older documents should be clearly marked as legacy/deprecated

### 3. Cross-Reference Documentation

- Include README.md in each subfolder explaining contents
- Link to current/active documentation where applicable
- Document migration paths for deprecated features

## File Content Requirements

### Header Template

Each archived file should include:

```markdown
# [Document Title]

> **Status:** ARCHIVED - [Date Archived]  
> **Reason:** [Brief reason for archiving]  
> **Superseded By:** [Link to current documentation if applicable]  
> **Original Date:** [Original creation/completion date]

---

[Original content...]
```

### Footer Template

```markdown
---

## Archive Information

- **Archived Date:** [Date]
- **Archived By:** [Person/Team]
- **Archive Reason:** [Detailed reason]
- **Current Documentation:** [Links to active docs]
```

## Migration Guidelines

### When to Archive

1. Feature is completely deprecated
2. Documentation is superseded by newer versions
3. Implementation approach has fundamentally changed
4. Content is no longer accurate or relevant

### How to Archive

1. Add archive headers and footers
2. Rename according to convention
3. Move to appropriate archive subdirectory
4. Update README.md in archive folder
5. Add redirect/reference in current documentation

## Examples of Proper Naming

### Before (Problematic Naming)

- `VOUCHER_SYSTEM_PHASE_4_ROADMAP.md`
- `VOICE_MESSAGE_TROUBLESHOOTING.md`
- `PHASE_1_FINAL_STATUS.md`
- `CUSTOMER_MANAGEMENT_SYSTEM_FLOW.md`

### After (Convention-Compliant Naming)

- `PHASE_VOUCHER_SYSTEM_PHASE_4_FUTURE_ROADMAP.md`
- `BUGFIX_VOICE_MESSAGING_TROUBLESHOOTING_GUIDE.md`
- `PHASE_DEVELOPMENT_PHASE_1_COMPLETION_REPORT.md`
- `IMPLEMENTATION_CUSTOMER_MANAGEMENT_SYSTEM_FLOW_ANALYSIS.md`

## Maintenance Rules

### Regular Review (Monthly)

1. Check for outdated documentation in main folders
2. Identify candidates for archiving
3. Update archive organization as needed
4. Verify links and references are current

### Archive Integrity

1. Ensure all archived docs have proper headers
2. Maintain accurate README files in each subfolder
3. Test links to current documentation
4. Remove truly obsolete documents (after 1+ years)

## Related Documentation

- [Current Documentation Organization](../README.md)
- [Documentation Standards](../development/documentation-standards.md)
- [File Management Guidelines](../development/file-management.md)

# Branch Form Validation - Complete Implementation

## ✅ All Backend Validations Applied to UI

### Required Fields (marked with red asterisk *)

| Field | Validation | Error Message |
|-------|------------|---------------|
| Branch Name (EN) * | Required, Max 100 chars | "Branch name in English is required" / "Maximum 100 characters allowed" |
| Branch Name (AR) * | Required, Max 100 chars | "Branch name in Arabic is required" / "Maximum 100 characters allowed" |
| Mobile * | Required, Pattern: ^05\d{8}$ | "Mobile number is required" / "Mobile must start with 05 and be 10 digits" |
| Address * | Required | "Address is required" |
| Latitude * | Required | "Latitude is required" |
| Longitude * | Required | "Longitude is required" |

### Optional Fields

| Field | Validation | Error Message |
|-------|------------|---------------|
| Email | Valid email format (if provided) | "Enter a valid email" |
| WhatsApp | None | - |
| Description (EN) | None | - |
| Description (AR) | None | - |

### Working Days Validation

#### Required
- At least one working day must be provided
- Each day must have valid data

#### Per Day Rules

**When Day is Available (toggle ON):**
- ✅ `dayEn` - Required, Max 20 chars
- ✅ `dayAr` - Required, Max 20 chars
- ✅ `workingFrom` - Required, 0-23
- ✅ `workingTo` - Required, 0-23
- ✅ `workingFrom` < `workingTo`
- ✅ `timeType` - Required, Must be AM/PM/24H

**When Day is NOT Available (toggle OFF):**
- ✅ `workingFrom` - Must be null
- ✅ `workingTo` - Must be null

## 🎨 UI Validation Features

### Visual Indicators
- ✅ Red asterisk (*) on required fields
- ✅ Red border on invalid fields
- ✅ Error messages below fields
- ✅ Specific error for each validation rule
- ✅ Disabled state for unavailable days

### Form Behavior
- ✅ Validation triggers on submit
- ✅ Prevents submission if invalid
- ✅ Shows all errors at once
- ✅ Clears errors on valid input
- ✅ Real-time validation for working days

### Mobile Number Validation
```
Valid:   0512345678 ✓
Invalid: 12345678   ✗ (doesn't start with 05)
Invalid: 05123      ✗ (not 10 digits)
Invalid: 051234567890 ✗ (more than 10 digits)
```

### Working Hours Validation
```
Valid:   From: 9, To: 17 ✓
Invalid: From: 17, To: 9 ✗ (from >= to)
Invalid: From: 25, To: 30 ✗ (out of range)
Invalid: From: null, To: 17 ✗ (when day available)
```

## 📋 Complete Validation Matrix

### Branch Details

| Field | Required | Min | Max | Pattern | Type |
|-------|----------|-----|-----|---------|------|
| branchNameEn | ✓ | - | 100 | - | text |
| branchNameAr | ✓ | - | 100 | - | text |
| email | ✗ | - | - | email | email |
| mobileNo | ✓ | 10 | 10 | ^05\d{8}$ | text |
| whatsUpNo | ✗ | - | - | - | text |
| address | ✓ | - | - | - | text |
| latitute | ✓ | - | - | - | text |
| longtute | ✓ | - | - | - | text |
| descriptionEn | ✗ | - | - | - | textarea |
| descriptionAr | ✗ | - | - | - | textarea |
| isAvailable | - | - | - | - | boolean |

### Working Days (Each Day)

| Field | Required | Min | Max | Values | Type |
|-------|----------|-----|-----|--------|------|
| dayEn | ✓ | - | 20 | - | text |
| dayAr | ✓ | - | 20 | - | text |
| isAvailable | ✓ | - | - | true/false | boolean |
| workingFrom | Conditional* | 0 | 23 | 0-23 | number |
| workingTo | Conditional* | 0 | 23 | 0-23 | number |
| timeType | Conditional* | - | - | AM/PM/24H | select |

*Required when isAvailable = true, Must be null when isAvailable = false

## 🧪 Test Cases

### Valid Submissions

#### Minimal Valid Branch
```json
{
  "branchNameEn": "Main",
  "branchNameAr": "الرئيسي",
  "mobileNo": "0512345678",
  "address": "Riyadh",
  "latitute": "24.7136",
  "longtute": "46.6753",
  "isAvailable": true,
  "createBranchWorkingDaysRequestDto": [
    {
      "dayEn": "Sunday",
      "dayAr": "الأحد",
      "isAvailable": true,
      "workingFrom": 9,
      "workingTo": 17,
      "timeType": "24H"
    }
    // ... 6 more days
  ]
}
```

#### Complete Valid Branch
```json
{
  "branchNameEn": "Main Branch",
  "branchNameAr": "الفرع الرئيسي",
  "email": "main@example.com",
  "mobileNo": "0512345678",
  "whatsUpNo": "0598765432",
  "address": "King Fahd Road, Riyadh",
  "latitute": "24.7136",
  "longtute": "46.6753",
  "descriptionEn": "Our main branch",
  "descriptionAr": "فرعنا الرئيسي",
  "isAvailable": true,
  "createBranchWorkingDaysRequestDto": [...]
}
```

### Invalid Submissions

#### Missing Required Fields
```json
{
  "branchNameEn": "",  // ✗ Required
  "branchNameAr": "",  // ✗ Required
  "mobileNo": "",      // ✗ Required
  "address": "",       // ✗ Required
  "latitute": "",      // ✗ Required
  "longtute": ""       // ✗ Required
}
```

#### Invalid Mobile Format
```json
{
  "mobileNo": "12345678"     // ✗ Must start with 05
  "mobileNo": "05123"        // ✗ Must be 10 digits
  "mobileNo": "051234567890" // ✗ Must be exactly 10 digits
}
```

#### Invalid Email
```json
{
  "email": "invalid-email"  // ✗ Invalid format
  "email": "test@"          // ✗ Invalid format
}
```

#### Invalid Working Days
```json
{
  "createBranchWorkingDaysRequestDto": [] // ✗ At least one required
}
```

```json
{
  "dayEn": "Monday",
  "isAvailable": true,
  "workingFrom": null,  // ✗ Required when available
  "workingTo": null     // ✗ Required when available
}
```

```json
{
  "dayEn": "Monday",
  "isAvailable": true,
  "workingFrom": 17,    // ✗ Must be less than workingTo
  "workingTo": 9
}
```

## 🎯 Error Messages Reference

### Form Errors
- "Branch name in English is required"
- "Branch name in Arabic is required"
- "Maximum 100 characters allowed"
- "Mobile number is required"
- "Mobile must start with 05 and be 10 digits"
- "Enter a valid email"
- "Address is required"
- "Latitude is required"
- "Longitude is required"

### Working Days Errors
- "Sunday: Working hours required when day is available"
- "Monday: Working from must be between 0 and 23"
- "Tuesday: Working to must be between 0 and 23"
- "Wednesday: Working from must be less than working to"
- "Thursday: Time type must be AM, PM, or 24H"

## 📊 Validation Summary

### Frontend Validation (Angular)
✅ Required fields
✅ Max length (100 chars for names)
✅ Email format
✅ Mobile pattern (^05\d{8}$)
✅ Working hours range (0-23)
✅ Working hours logic (from < to)
✅ Time type values (AM/PM/24H)
✅ Conditional validation (working days)

### Backend Validation (FluentValidation)
✅ All frontend validations
✅ Additional business rules
✅ Database constraints
✅ Security checks

### Both Match 100% ✓

## 🚀 Ready to Use

The branch form now has:
- ✅ Complete validation matching backend
- ✅ Clear error messages
- ✅ Visual indicators for required fields
- ✅ Real-time validation feedback
- ✅ Working days validation
- ✅ Mobile number format validation
- ✅ Email format validation
- ✅ All required fields enforced

**Start the application and test the complete validation!**

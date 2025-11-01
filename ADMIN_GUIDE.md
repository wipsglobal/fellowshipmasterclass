# Admin Panel Guide

## Admin Login Credentials

**Email:** `admin@fellowship.com`  
**Password:** `Admin@123`

⚠️ **IMPORTANT:** Change this password after first login for security.

## Accessing the Admin Panel

1. Go to `http://localhost:3001/login` (or your deployment URL)
2. Enter the admin credentials above
3. Click "Login"
4. Navigate to `/admin` to access the admin dashboard

## Admin Panel Features

### 1. Dashboard Overview (Header Statistics)

The admin dashboard provides a comprehensive overview of all fellowship activities:

- **Total Registrants**: Total number of applicants who have registered
- **Submitted**: Number of applications that have been submitted for review
- **Approved**: Number of applications that have been approved
- **Pending Review**: Number of applications awaiting admin review
- **Total Revenue**: Sum of all application fees from applicants (₦)

### 2. Applications Management Tab

**Features:**
- **Search Functionality**: Search by name, email, phone number, or application number
- **Status Filtering**: Filter applications by admission status (Pending/Approved/Declined)
- **Cohort Filtering**: Filter applications by cohort (March, June, September, December)
- **Application Cards**: Each card displays:
  - Applicant's full name and application number
  - Current status badge (color-coded)
  - Contact information (email, phone)
  - Selected cohort and fellowship tracks
  - Application fee amount and payment status
  - Education and experience summary

**Actions:**
- Click "View" button to see full application details
- Review and approve/decline applications
- Add remarks or feedback for applicants
- Track submission and approval dates

### 3. Fee Management Tab 💰

**Purpose:** Update application fees for each cohort

**How to Update Fees:**

1. Navigate to the "Fee Management" tab
2. Select the cohort you want to update from the dropdown
3. Enter the new fee amount in Naira (₦)
4. (Optional) Add a description for the fee change
5. Click "Update Fee Configuration"

**Important Notes:**
- Fee changes only affect **new payments**
- Existing applications retain their original fee
- The fee update takes effect immediately for new applicants
- Current fees for all cohorts are displayed at the bottom of the page

**Default Fee:** ₦100,000

**Example Use Cases:**
- Increase fees for upcoming cohorts
- Offer discounted rates for special cohorts
- Adjust fees based on program costs or market conditions

### 4. Cohorts Tab 📅

**View Cohort Information:**
- Cohort name and year
- Current status (Open/Closed)
- Number of applications received
- Number of approved applications
- Total revenue generated from the cohort
- Application deadline
- Program start and end dates

**Statistics Displayed:**
- Applications per cohort
- Approval rates
- Revenue breakdown by cohort

### 5. Analytics Tab 📊

**Application Status Distribution:**
- Visual breakdown of approved, pending, and declined applications
- Color-coded cards for easy identification:
  - ✅ Green: Approved applications
  - ⏳ Yellow: Pending review
  - ❌ Red: Declined applications

**Revenue Breakdown:**
- Total revenue across all cohorts
- Revenue by individual cohort
- Quick financial overview

## Application Review Process

### Step-by-Step Review:

1. **Navigate to Applications Tab**
2. **Use filters** to find applications needing review (Status: Pending)
3. **Click "View"** on an application card
4. **Review all sections:**
   - Personal Information
   - Programme Selection
   - Academic & Professional Background
   - Statement of Purpose
   - Payment & Application Status
   - Declaration & Consent
5. **Make Decision:**
   - Select "Approve", "Decline", or "Keep Pending"
   - Add remarks (optional but recommended)
   - Click "Submit Review Decision"

### Review Criteria Checklist:

- ✅ Complete personal information
- ✅ Valid academic qualifications
- ✅ Professional experience meets requirements
- ✅ Clear and compelling statement of purpose (min 250 characters)
- ✅ Payment completed
- ✅ All required documents uploaded
- ✅ Declaration and consent accepted

## Common Admin Tasks

### Task 1: Approve an Application

```
1. Go to Applications tab
2. Filter by Status: Pending
3. Click "View" on application
4. Review all details
5. Select "Approve Application"
6. Add remarks (e.g., "Congratulations! You meet all requirements.")
7. Click "Submit Review Decision"
```

### Task 2: Decline an Application

```
1. Go to Applications tab
2. Find the application
3. Click "View"
4. Select "Decline Application"
5. Add remarks explaining the reason
6. Click "Submit Review Decision"
```

### Task 3: Update Cohort Fee

```
1. Go to Fee Management tab
2. Select cohort from dropdown
3. Enter new fee (e.g., 150000 for ₦150,000)
4. Add description (e.g., "Increased due to program enhancements")
5. Click "Update Fee Configuration"
```

### Task 4: Export Data

```
1. Click "Export Data" button in header
2. Select export format (CSV/Excel)
3. Choose data to export (All/Filtered)
4. Download file
```
*(Export functionality may need to be implemented)*

### Task 5: Monitor Revenue

```
1. Go to Analytics tab
2. View "Revenue Breakdown" card
3. Check total revenue
4. Review revenue by cohort
5. Compare cohort performance
```

## Application Fee Management

### How Fee Changes Work:

When you update a cohort's application fee:

1. **Immediate Effect**: New fee applies to all NEW applications
2. **Existing Applications**: Keep their original fee amount
3. **Payment Processing**: Paystack uses the fee amount at time of payment initialization
4. **Database Update**: Fee configuration is updated in the database
5. **All Future Payments**: Use the new fee amount

### Fee Update Scenarios:

**Scenario 1: Before Any Applications**
- Update fee: ₦100,000 → ₦120,000
- Result: All applicants pay ₦120,000

**Scenario 2: Some Applications Exist**
- Existing applications: Keep ₦100,000
- New applications: Pay ₦120,000
- Result: Mixed fee structure

**Scenario 3: After Deadline**
- Update fee for next year's same cohort
- Current cohort applications unaffected
- Future cohort uses new fee

### Best Practices:

1. **Plan Fee Changes Early**: Update fees before opening applications
2. **Communicate Changes**: Notify potential applicants of fee changes
3. **Document Reasons**: Always add description when updating fees
4. **Review Regularly**: Check fee configurations quarterly
5. **Consider Inflation**: Adjust fees annually based on program costs

## User Roles and Permissions

### Admin Role:
- ✅ View all applications
- ✅ Approve/decline applications
- ✅ Update cohort fees
- ✅ View all cohorts and statistics
- ✅ Access analytics
- ✅ Export data
- ✅ Manage user accounts (planned feature)

### User Role:
- ✅ Create application
- ✅ View own applications
- ✅ Edit draft applications
- ✅ Submit applications
- ✅ Make payments
- ❌ Cannot access admin panel
- ❌ Cannot modify fees
- ❌ Cannot view other users' applications

## Security Notes

### Password Management:
- Default admin password should be changed immediately
- Use strong passwords (minimum 8 characters, mix of letters, numbers, symbols)
- Never share admin credentials

### Access Control:
- Only users with `role: "admin"` can access admin panel
- Regular users are redirected if they try to access `/admin`
- JWT tokens expire after 7 days

### Data Protection:
- All passwords are hashed using bcrypt (10 rounds)
- Payment information is secure through Paystack
- Personal data is protected according to regulations

## Troubleshooting

### Issue: Cannot Login as Admin
**Solution:**
- Verify email: `admin@fellowship.com`
- Verify password: `Admin@123`
- Check if account exists in database
- Clear browser cache and cookies

### Issue: Fee Update Not Working
**Solution:**
- Ensure you selected a cohort
- Enter valid number (no commas or currency symbols)
- Check console for error messages
- Verify admin permissions

### Issue: Applications Not Loading
**Solution:**
- Refresh the page
- Check internet connection
- Clear filters (set to "All")
- Check browser console for errors

### Issue: Cannot Approve Application
**Solution:**
- Ensure application has been submitted (not draft)
- Verify payment is completed
- Check all required fields are filled
- Try refreshing the page

## Support and Maintenance

### Regular Admin Tasks:
- **Daily**: Review new applications
- **Weekly**: Update application statuses
- **Monthly**: Review analytics and revenue
- **Quarterly**: Update fees if needed
- **Annually**: Plan cohort schedules

### System Monitoring:
- Check server logs regularly
- Monitor payment gateway status
- Backup database weekly
- Update dependencies monthly

### Contact:
For technical support or questions about the admin panel, contact the development team.

---

## Quick Reference Commands

### Check Server Status
```bash
pnpm dev
```

### View Database
```bash
pnpm db:studio
```

### Check Logs
```bash
# Check server logs
tail -f logs/server.log

# Check error logs
tail -f logs/error.log
```

### Database Commands
```bash
# Push schema changes
pnpm db:push

# Generate migration
pnpm db:generate

# Run migrations
pnpm db:migrate
```

---

**Last Updated:** October 30, 2025  
**Version:** 2.0  
**Admin Panel Features:** Complete ✅

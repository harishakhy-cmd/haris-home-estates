# HARIS MVP - Feature Verification Checklist

Use this checklist to verify all features are working correctly.

## ✅ Authentication & Users

### Registration
- [ ] Register as tenant with email
- [ ] Register as landlord with phone
- [ ] Password validation (required, minimum length)
- [ ] Email/phone uniqueness check
- [ ] User role assignment
- [ ] Redirect to appropriate dashboard after registration

### Login
- [ ] Login with email
- [ ] Login with phone
- [ ] Incorrect credentials error message
- [ ] Redirect to dashboard after login
- [ ] Token stored in localStorage

### Token Management
- [ ] Access token obtained on login
- [ ] Refresh token in httpOnly cookie (or localStorage)
- [ ] Token used in Authorization header
- [ ] 401 response when token expired
- [ ] Automatic token refresh
- [ ] Logout clears tokens

### User Profile
- [ ] View own profile
- [ ] Edit first name
- [ ] Edit last name
- [ ] Edit phone number
- [ ] Edit bio
- [ ] Edit location
- [ ] Upload avatar (if implemented)
- [ ] Verification badge shows (admin)

## 🏠 Properties

### Create Property (Landlord)
- [ ] Title field
- [ ] Description field (text area)
- [ ] Price field
- [ ] Property type dropdown
- [ ] Bedrooms number input
- [ ] Bathrooms number input
- [ ] Address field
- [ ] City field
- [ ] Amenities multiselect
- [ ] Image upload (URL for now)
- [ ] Form validation
- [ ] Success message
- [ ] Property appears in list

### View Properties (Public)
- [ ] List shows all active properties
- [ ] Property cards display correctly
- [ ] Images load
- [ ] Price visible
- [ ] Bedrooms/bathrooms visible
- [ ] Landlord name visible
- [ ] Click card to view details
- [ ] Pagination works

### Property Details
- [ ] Full description visible
- [ ] Image gallery works
- [ ] Image thumbnails clickable
- [ ] Amenities list shows
- [ ] Landlord profile card shows
- [ ] Landlord verified badge shows
- [ ] Similar properties section
- [ ] Inquiry form visible
- [ ] Booking form visible

### Search & Filter
- [ ] Search by keyword
- [ ] Filter by city
- [ ] Filter by price range
- [ ] Filter by bedrooms
- [ ] Filter by bathrooms
- [ ] Filter by property type
- [ ] Multiple filters together
- [ ] Results update live
- [ ] Pagination works
- [ ] Sort by newest
- [ ] Sort by price asc
- [ ] Sort by price desc

### Update Property (Landlord)
- [ ] Access own properties only
- [ ] Edit title
- [ ] Edit description
- [ ] Edit price
- [ ] Edit amenities
- [ ] Update images
- [ ] Changes saved
- [ ] Updated property reflects in search

### Delete Property (Landlord)
- [ ] Delete button visible on own properties
- [ ] Confirmation dialog shows
- [ ] Property removed from list
- [ ] Cannot access deleted property URL

## ❤️ Favorites

### Save Property
- [ ] Heart icon visible on property card
- [ ] Click saves property
- [ ] Icon fills/highlights when saved
- [ ] Property added to favorites list
- [ ] Count badge updates

### Remove Favorite
- [ ] Click filled heart removes
- [ ] Icon empties
- [ ] Property removed from favorites
- [ ] Count badge updates

### View Favorites
- [ ] /dashboard/tenant shows favorites
- [ ] List displays saved properties
- [ ] Cards same as search results
- [ ] Empty state message if no favorites
- [ ] Can click to view details

## 📅 Bookings & Inquiries

### Create Booking Request (Tenant)
- [ ] Viewing date input
- [ ] Optional notes field
- [ ] Form validation
- [ ] Booking created successfully
- [ ] Success notification

### View Bookings (Landlord)
- [ ] Landlord sees all booking requests
- [ ] Shows property name
- [ ] Shows tenant name
- [ ] Shows viewing date
- [ ] Shows status (pending/confirmed/etc.)
- [ ] Can confirm booking
- [ ] Can reject booking
- [ ] Status updates immediately

### View Bookings (Tenant)
- [ ] Tenant sees own bookings
- [ ] Shows property details
- [ ] Shows status
- [ ] Shows landlord name

### Create Inquiry
- [ ] Inquiry form on property detail
- [ ] Message field (text area)
- [ ] Form validation
- [ ] Inquiry sent successfully
- [ ] Success notification

### View Inquiries (Landlord)
- [ ] All inquiries show
- [ ] Property name visible
- [ ] Tenant name visible
- [ ] Message visible
- [ ] Date/time visible
- [ ] Can mark as responded
- [ ] Can close inquiry

## 💬 Messaging

### Send Message (Tenant to Landlord)
- [ ] Message form visible
- [ ] Text input working
- [ ] Send button works
- [ ] Message sent successfully
- [ ] Message appears in conversation

### View Inbox
- [ ] All conversations listed
- [ ] Latest message preview
- [ ] Unread count badge
- [ ] Sorted by most recent
- [ ] Click opens conversation

### View Conversation
- [ ] All messages in order
- [ ] Sender/recipient clear
- [ ] Timestamps visible
- [ ] Can reply with new message
- [ ] Messages appear immediately

### Mark as Read
- [ ] Unread messages show badge
- [ ] Click marks as read
- [ ] Badge disappears
- [ ] Inbox badge updates

## 👥 Admin Panel

### User Management
- [ ] List all users
- [ ] Filter by role
- [ ] View user details
- [ ] Ban user option
- [ ] Unban user option
- [ ] Verify user option
- [ ] Actions logged

### Property Moderation
- [ ] List pending properties
- [ ] View property details
- [ ] Approve property
- [ ] Reject property
- [ ] Flag inappropriate content
- [ ] Actions logged
- [ ] Approved properties appear in search

### Admin Dashboard
- [ ] Total users count
- [ ] Total properties count
- [ ] Total bookings count
- [ ] Total inquiries count
- [ ] Recent admin actions log
- [ ] Statistics display

## 📊 Dashboards

### Tenant Dashboard
- [ ] Tab: Saved Properties
  - [ ] Favorites list displays
  - [ ] Can remove from favorites
- [ ] Tab: Booking History
  - [ ] All bookings show
  - [ ] Status visible
- [ ] Tab: Messages
  - [ ] Inbox list shows
  - [ ] Can open conversations
- [ ] Tab: Profile
  - [ ] Profile info editable

### Landlord Dashboard
- [ ] Tab: My Properties
  - [ ] All properties listed
  - [ ] Edit button works
  - [ ] Delete button works
- [ ] Tab: Create Property
  - [ ] Form displays
  - [ ] Can create new property
- [ ] Tab: Inquiries
  - [ ] All inquiries show
  - [ ] Can respond/close
- [ ] Tab: Bookings
  - [ ] Viewing requests show
  - [ ] Can confirm/reject
- [ ] Tab: Profile
  - [ ] Profile info editable

## 🎨 UI/UX

### Responsive Design
- [ ] Mobile view (375px) - responsive
- [ ] Tablet view (768px) - responsive
- [ ] Desktop view (1024px+) - responsive
- [ ] No horizontal scroll
- [ ] Touch targets 48px+ on mobile
- [ ] Images scale appropriately

### Navigation
- [ ] Header navigation visible
- [ ] Mobile menu toggle works
- [ ] Links navigate correctly
- [ ] Active page highlighted
- [ ] Logo links to home

### Loading States
- [ ] Property list shows loading
- [ ] Property detail shows loading
- [ ] API responses feel instant
- [ ] No "flash" of content

### Empty States
- [ ] No properties message clear
- [ ] No favorites message clear
- [ ] No messages message clear
- [ ] No bookings message clear
- [ ] No inquiries message clear

### Error States
- [ ] Invalid form shows errors
- [ ] API errors show messages
- [ ] 404 page for not found
- [ ] Error messages helpful
- [ ] Recovery path obvious

### Accessibility
- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Form labels associated
- [ ] Images have alt text
- [ ] Color not only indicator
- [ ] Focus visible
- [ ] Skip links present

### Dark Mode
- [ ] Toggle in settings
- [ ] Applies to entire app
- [ ] Colors readable in dark
- [ ] Images visible in dark
- [ ] Preference persisted

## 🔒 Security

### Authorization
- [ ] Tenant can't delete other's favorites
- [ ] Tenant can't view other's messages
- [ ] Landlord can't edit other's properties
- [ ] Admin can moderate anything
- [ ] Protected routes require login

### Input Validation
- [ ] Empty fields rejected
- [ ] Invalid email rejected
- [ ] Price must be number
- [ ] Bedrooms must be positive
- [ ] Title required
- [ ] Description required

### Data Privacy
- [ ] Passwords not shown
- [ ] Tokens not exposed in UI
- [ ] Emails not shown to public
- [ ] Messages only visible to participants
- [ ] Personal data protected

## ⚡ Performance

### Page Load
- [ ] Homepage loads < 2s
- [ ] Search page loads < 2s
- [ ] Property detail < 2s
- [ ] Dashboard < 2s
- [ ] No jank/lag

### API Responses
- [ ] List endpoint < 500ms
- [ ] Single endpoint < 300ms
- [ ] Create/update < 300ms
- [ ] No timeout errors
- [ ] Pagination works

### Images
- [ ] Images load reasonably
- [ ] Thumbnails smaller than full
- [ ] No stretched images
- [ ] Proper aspect ratios

## 📝 API Documentation

### Swagger UI
- [ ] Accessible at /api
- [ ] All endpoints listed
- [ ] Request/response examples
- [ ] Can try endpoints
- [ ] Authentication shown

## 🧪 Browser Compatibility

- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile Safari
- [ ] Android Chrome

## 🚀 Production Readiness

- [ ] No console errors
- [ ] No console warnings
- [ ] No broken links
- [ ] No placeholder text
- [ ] Images compressed
- [ ] Built optimized
- [ ] Lighthouse score checked

## 📋 Test Accounts

After seeding (with password `Password123!`):
- [ ] `tenant@haris.test` - Can search, bookmark, request bookings
- [ ] `landlord@haris.test` - Can create properties, manage inquiries
- [ ] `admin@haris.test` - Can moderate, view analytics

---

## ✅ Sign-off Checklist

- [ ] All features checked above ✓
- [ ] No critical bugs found ✓
- [ ] Performance acceptable ✓
- [ ] Security verified ✓
- [ ] Mobile responsive ✓
- [ ] Documentation complete ✓
- [ ] Ready for production ✓

---

**Date Verified**: _____________  
**Verified By**: _____________  
**Status**: Ready for Deployment ✅

---

For issues found, document:
1. What feature failed
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshot/video if possible

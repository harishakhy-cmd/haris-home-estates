# Phase 7: Real-Time Dashboard Updates - Quick Reference

## Overview
Real-time dashboard updates using Socket.IO instead of polling, enabling instant property listings, payment updates, booking status changes, and statistics.

## Architecture

### Socket.IO Namespace: `/dashboard`
```typescript
connection
  └─ user joined dashboard
disconnect
  └─ user left dashboard
propertyCreated
  └─ new property added
propertyUpdated
  └─ property details changed
paymentReceived
  └─ payment completed
bookingStatusChanged
  └─ booking status updated
maintenanceUpdated
  └─ maintenance status changed
statisticsUpdated
  └─ dashboard stats refreshed
```

## Files to Create/Modify

### Backend (NestJS)
**New Files**:
- `src/dashboard/dashboard.gateway.ts` - Dashboard Socket.IO gateway
- `src/dashboard/dashboard.module.ts` - Module registration

**Modified Files**:
- `src/properties/properties.service.ts` - Emit propertyCreated event
- `src/payments/payments.service.ts` - Emit paymentReceived event
- `src/bookings/bookings.service.ts` - Emit bookingStatusChanged event
- `src/app.module.ts` - Register DashboardModule

### Frontend (React)
**New Files**:
- `src/hooks/useDashboardSubscription.ts` - Subscribe to dashboard events
- `src/contexts/DashboardContext.tsx` - Global dashboard state

**Modified Files**:
- `src/app/dashboard/page.tsx` - Use real-time updates
- `src/app/dashboard/landlord/page.tsx` - Real-time property list
- `src/app/dashboard/tenant/page.tsx` - Real-time bookings

## Implementation Steps

1. **Create Dashboard Gateway**
   - Listen for connections on `/dashboard` namespace
   - Join user to room based on role (landlord/tenant/admin)
   - Handle room-based broadcasting

2. **Update Service Methods**
   - Add event emission after successful create/update
   - Emit to correct rooms (landlords, tenants, admins)
   - Include updated data in event

3. **Create Frontend Hooks**
   - `useDashboardSubscription` - Listen to events
   - Auto-unsubscribe on unmount
   - Update local state on events

4. **Update Dashboard Pages**
   - Replace polling with Socket.IO listeners
   - Real-time list updates
   - Real-time stat updates

5. **Testing**
   - Open dashboard in multiple browser windows
   - Create property/payment in one window
   - Verify instant update in other window

## Event Flow Example

```
User 1: Creates Property
    ↓
properties.service.ts emits propertyCreated
    ↓
dashboard.gateway.ts broadcasts to landlord room
    ↓
User 2 (landlord): Receives propertyCreated event
    ↓
useDashboardSubscription updates local state
    ↓
Dashboard list updates instantly (no page refresh)
```

## Database Queries Used

```typescript
// Get user role
user.role // 'LANDLORD' | 'TENANT' | 'ADMIN'

// Get user properties
properties.where({ ownerId: user.id })

// Get user bookings
bookings.where({ tenantId: user.id })

// Get payments for landlord
payments.where({ property: { ownerId: user.id } })
```

## Estimated Time

**Total**: 4-6 hours
- Gateway setup: 1 hour
- Event emission: 1 hour
- Frontend hooks: 1 hour
- Dashboard updates: 1 hour
- Testing: 1 hour

## Quick Checklist

- [ ] Create dashboard.gateway.ts
- [ ] Create dashboard.module.ts
- [ ] Add DashboardModule to app.module.ts
- [ ] Update properties.service.ts to emit events
- [ ] Update payments.service.ts to emit events
- [ ] Update bookings.service.ts to emit events
- [ ] Create useDashboardSubscription hook
- [ ] Create DashboardContext
- [ ] Update dashboard pages
- [ ] Test with multiple windows
- [ ] Verify real-time updates
- [ ] Check both builds pass
- [ ] Document Phase 7

## Room-Based Broadcasting Strategy

```typescript
// Landlord sees:
- Own properties created/updated
- Payments received
- Booking status changes

// Tenant sees:
- New properties available
- Booking status changes
- Maintenance updates

// Admin sees:
- All activities
- All properties
- All payments
```

## Notes

- Use Socket.IO rooms for efficient broadcasting
- Only send updates to affected users
- Include only necessary data in events
- Maintain backwards compatibility
- No database schema changes needed

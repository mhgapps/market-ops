# MHG Facilities Deep Review Checklist

**Generated:** 2026-01-14
**Purpose:** Systematic review to ensure all pages, components, DAOs, and services are properly wired with no mock data and correct schema alignment.

---

## Quick Reference: Database Schema

### Core Tables & Key Columns

| Table | Key Columns (verify in code) |
|-------|------------------------------|
| `tenants` | id, name, slug, plan, status, features, branding, owner_email |
| `users` | id, tenant_id, auth_user_id, email, full_name, role, location_id, is_active |
| `locations` | id, tenant_id, name, address, city, state, zip, phone, square_footage, manager_id, status |
| `assets` | id, tenant_id, **name** (NOT asset_name), **qr_code** (NOT asset_tag), category_id, location_id, serial_number, model, manufacturer, status |
| `vendors` | id, tenant_id, name, contact_name, email, phone, service_categories, is_preferred, is_active |
| `tickets` | id, tenant_id, ticket_number, title, description, category_id, location_id, asset_id, priority, status, submitted_by, assigned_to, vendor_id |
| `ticket_categories` | id, tenant_id, name, name_es, default_priority, approval_threshold, escalation_hours |
| `compliance_documents` | id, tenant_id, name, document_type_id, location_id, location_ids, expiration_date, status, is_conditional |
| `compliance_document_types` | id, tenant_id, name, name_es, default_alert_days, is_location_specific |
| `pm_schedules` | id, tenant_id, template_id, name, description, asset_id, location_id, frequency, assigned_to, vendor_id, is_active, next_due_date |
| `pm_templates` | id, tenant_id, name, description, category, checklist, estimated_duration_hours, default_vendor_id |
| `pm_completions` | id, schedule_id, ticket_id, scheduled_date, completed_date, completed_by, checklist_results |
| `budgets` | id, tenant_id, location_id, category, fiscal_year, annual_budget, spent_amount |
| `emergency_incidents` | id, tenant_id, location_id, title, description, severity, status, reported_by |

### Enums (verify exact values)
- `user_role`: super_admin, admin, manager, staff, vendor, readonly
- `tenant_plan`: trial, free, starter, professional, enterprise
- `asset_status`: active, under_maintenance, retired, transferred, disposed
- `ticket_status`: submitted, acknowledged, needs_approval, approved, in_progress, completed, verified, closed, rejected, on_hold
- `ticket_priority`: low, medium, high, critical
- `compliance_status`: active, expiring_soon, expired, pending_renewal, conditional, failed_inspection, suspended
- `pm_frequency`: daily, weekly, biweekly, monthly, quarterly, semi_annually, annually
- `incident_severity`: high, critical
- `incident_status`: active, contained, resolved

---

## Section 1: Pages Review

### 1.1 Dashboard Pages

| Page | File | Checklist |
|------|------|-----------|
| Dashboard Home | `(dashboard)/dashboard/page.tsx` | [ ] Fetches real data via hook/API [ ] No mock stats [ ] All stat cards wired [ ] Charts connected to real data |
| Main Dashboard | `(dashboard)/page.tsx` | [ ] Redirects or renders correctly [ ] Auth check in place |

### 1.2 Tickets Module

| Page | File | Checklist |
|------|------|-----------|
| Tickets List | `(dashboard)/tickets/page.tsx` | [ ] useTickets hook wired [ ] Filters work (status, priority, location) [ ] Pagination works [ ] No hardcoded ticket data |
| Ticket Detail | `(dashboard)/tickets/[id]/page.tsx` | [ ] Fetches ticket by ID [ ] Shows all relations (location, asset, category, assignee, vendor) [ ] Comments load [ ] Attachments load [ ] Status actions work |
| New Ticket | `(dashboard)/tickets/new/page.tsx` | [ ] Form submits to API [ ] Location dropdown populated [ ] Category dropdown populated [ ] Asset dropdown populated |

### 1.3 Assets Module

| Page | File | Checklist |
|------|------|-----------|
| Assets List | `(dashboard)/assets/page.tsx` | [ ] useAssets hook wired [ ] Filters work [ ] Uses correct field: `name` (NOT asset_name) [ ] Uses correct field: `qr_code` (NOT asset_tag) |
| Asset Detail | `(dashboard)/assets/[id]/page.tsx` | [ ] Fetches asset by ID [ ] Shows location, category, vendor relations [ ] Transfer history loads [ ] Maintenance history loads |
| Asset Edit | `(dashboard)/assets/[id]/edit/page.tsx` | [ ] Pre-populates form with asset data [ ] Updates via API [ ] Field names match schema |
| New Asset | `(dashboard)/assets/new/page.tsx` | [ ] Form fields match schema [ ] Submits to API |
| QR Scanner | `(dashboard)/assets/scan/page.tsx` | [ ] Scanner component works [ ] Looks up by `qr_code` field |

### 1.4 Locations Module

| Page | File | Checklist |
|------|------|-----------|
| Locations List | `(dashboard)/locations/page.tsx` | [ ] useLocations hook wired [ ] No mock location data [ ] Status filter works |
| Location Detail | `(dashboard)/locations/[id]/page.tsx` | [ ] Fetches location by ID [ ] Shows manager relation [ ] Shows related assets/tickets |
| New Location | `(dashboard)/locations/new/page.tsx` | [ ] Form submits to API [ ] Manager dropdown populated |

### 1.5 Users Module

| Page | File | Checklist |
|------|------|-----------|
| Users List | `(dashboard)/users/page.tsx` | [ ] useUsers hook wired [ ] Role filter works [ ] Location filter works [ ] Invite modal works [ ] Edit modal works |

### 1.6 Vendors Module

| Page | File | Checklist |
|------|------|-----------|
| Vendors List | `(dashboard)/vendors/page.tsx` | [ ] useVendors hook wired [ ] Active/preferred filters work [ ] No mock vendor data |
| Vendor Detail | `(dashboard)/vendors/[id]/page.tsx` | [ ] Fetches vendor by ID [ ] Shows related tickets [ ] Shows ratings |
| Vendor Edit | `(dashboard)/vendors/[id]/edit/page.tsx` | [ ] Pre-populates form [ ] service_categories is array |
| New Vendor | `(dashboard)/vendors/new/page.tsx` | [ ] Form submits to API [ ] service_categories handled as array |

### 1.7 Compliance Module

| Page | File | Checklist |
|------|------|-----------|
| Compliance List | `(dashboard)/compliance/page.tsx` | [ ] useCompliance hook wired [ ] Status filter works [ ] Expiration sorting works |
| Compliance Detail | `(dashboard)/compliance/[id]/page.tsx` | [ ] Fetches document by ID [ ] Shows document_type relation [ ] Shows location(s) [ ] Conditional banner shows if is_conditional [ ] Failed inspection banner shows if applicable |
| Compliance Edit | `(dashboard)/compliance/[id]/edit/page.tsx` | [ ] Pre-populates form [ ] location_ids handled as array |
| New Compliance | `(dashboard)/compliance/new/page.tsx` | [ ] Form submits to API [ ] Document type dropdown populated [ ] Location multi-select works |

### 1.8 PM (Preventive Maintenance) Module

| Page | File | Checklist |
|------|------|-----------|
| PM List | `(dashboard)/pm/page.tsx` | [ ] usePM hook wired [ ] Filters work (active, frequency) [ ] No mock schedule data |
| PM Detail | `(dashboard)/pm/[id]/page.tsx` | [ ] Fetches schedule by ID [ ] Shows template, asset, location relations [ ] Shows completion history |
| PM Edit | `(dashboard)/pm/[id]/edit/page.tsx` | [ ] Pre-populates form [ ] Frequency dropdown correct values |
| New PM Schedule | `(dashboard)/pm/new/page.tsx` | [ ] Form submits to API [ ] Template dropdown populated [ ] Asset/Location dropdowns populated |
| PM Templates List | `(dashboard)/pm/templates/page.tsx` | [ ] Fetches templates [ ] No mock template data |
| PM Template Detail | `(dashboard)/pm/templates/[id]/page.tsx` | [ ] Fetches template by ID [ ] Shows checklist JSON properly |
| New PM Template | `(dashboard)/pm/templates/new/page.tsx` | [ ] Form submits to API [ ] Checklist builder works |

### 1.9 Reports Module

| Page | File | Checklist |
|------|------|-----------|
| Reports | `(dashboard)/reports/page.tsx` | [ ] Report type selector works [ ] Date range filters work [ ] Location filter works [ ] Export functions work [ ] No hardcoded report data |

### 1.10 Settings Module

| Page | File | Checklist |
|------|------|-----------|
| Profile Settings | `(dashboard)/settings/profile/page.tsx` | [ ] Fetches current user [ ] Updates user profile |
| Notifications | `(dashboard)/settings/notifications/page.tsx` | [ ] Fetches notification_preferences [ ] Updates preferences |
| Ticket Categories | `(dashboard)/settings/categories/page.tsx` | [ ] CRUD for ticket categories works [ ] approval_threshold field correct |
| Tenant Settings | `(dashboard)/settings/tenant/page.tsx` | [ ] Fetches tenant settings [ ] Updates branding/features |

### 1.11 Emergencies Module

| Page | File | Checklist |
|------|------|-----------|
| Emergencies List | `(dashboard)/emergencies/page.tsx` | [ ] useEmergencies hook wired [ ] Status filter works [ ] Severity filter works |
| Emergency Detail | `(dashboard)/emergencies/[id]/page.tsx` | [ ] Fetches incident by ID [ ] Shows location relation |
| New Emergency | `(dashboard)/emergencies/new/page.tsx` | [ ] Form submits to API [ ] Severity dropdown: high, critical only |

### 1.12 Approvals Module

| Page | File | Checklist |
|------|------|-----------|
| Approvals List | `(dashboard)/approvals/page.tsx` | [ ] Fetches pending cost approvals [ ] Approve/deny actions work |

### 1.13 Budgets Module

| Page | File | Checklist |
|------|------|-----------|
| Budgets List | `(dashboard)/budgets/page.tsx` | [ ] Fetches budgets [ ] fiscal_year filter works [ ] Location filter works |

### 1.14 Auth Pages

| Page | File | Checklist |
|------|------|-----------|
| Login | `(auth)/login/page.tsx` | [ ] Submits to Supabase Auth [ ] Error handling |
| Signup | `(auth)/signup/page.tsx` | [ ] Creates auth user + tenant [ ] Validation |
| Forgot Password | `(auth)/forgot-password/page.tsx` | [ ] Sends reset email |
| Reset Password | `(auth)/reset-password/page.tsx` | [ ] Updates password |
| Verify Email | `(auth)/verify-email/page.tsx` | [ ] Handles verification token |
| Accept Invite | `(public)/accept-invite/[token]/page.tsx` | [ ] Validates token [ ] Creates user account |

---

## Section 2: Components Review

### 2.1 Ticket Components

| Component | File | Checklist |
|-----------|------|-----------|
| TicketForm | `components/tickets/ticket-form.tsx` | [ ] All form fields match schema [ ] Validation works |
| StatusBadge | `components/tickets/status-badge.tsx` | [ ] All 10 statuses handled [ ] Colors consistent |
| StatusActions | `components/tickets/status-actions.tsx` | [ ] Valid status transitions only [ ] Calls API |
| StatusTimeline | `components/tickets/status-timeline.tsx` | [ ] Fetches from ticket_status_history |
| AssignModal | `components/tickets/assign-modal.tsx` | [ ] Users dropdown populated [ ] Submits to API |
| AssignVendorModal | `components/tickets/assign-vendor-modal.tsx` | [ ] Vendors dropdown populated [ ] Submits to API |
| CommentForm | `components/tickets/comment-form.tsx` | [ ] Submits to comments API [ ] is_internal toggle works |
| CommentList | `components/tickets/comment-list.tsx` | [ ] Fetches comments [ ] Shows user.full_name |
| AttachmentUpload | `components/tickets/attachment-upload.tsx` | [ ] Uploads to storage [ ] Creates attachment record [ ] attachment_type validated |
| AttachmentGallery | `components/tickets/attachment-gallery.tsx` | [ ] Fetches attachments [ ] Downloads work |
| CostApprovalForm | `components/tickets/cost-approval-form.tsx` | [ ] Creates cost_approval record [ ] estimated_cost required |
| ApprovalStatus | `components/tickets/approval-status.tsx` | [ ] Shows pending/approved/denied correctly |

### 2.2 Asset Components

| Component | File | Checklist |
|-----------|------|-----------|
| AssetForm | `components/assets/asset-form.tsx` | [ ] Uses `name` not `asset_name` [ ] Uses `qr_code` not `asset_tag` [ ] All fields match schema |
| QRScanner | `components/assets/qr-scanner.tsx` | [ ] Scans and looks up by `qr_code` |
| QRCodeDisplay | `components/assets/qr-code-display.tsx` | [ ] Generates QR from `qr_code` field |
| TransferModal | `components/assets/transfer-modal.tsx` | [ ] Creates asset_transfer record [ ] Location dropdowns populated |

### 2.3 Vendor Components

| Component | File | Checklist |
|-----------|------|-----------|
| VendorForm | `components/vendors/vendor-form.tsx` | [ ] service_categories as array [ ] All fields match schema |
| VendorRatingForm | `components/vendors/vendor-rating-form.tsx` | [ ] rating 1-5 [ ] Creates vendor_rating record |

### 2.4 Compliance Components

| Component | File | Checklist |
|-----------|------|-----------|
| ComplianceForm | `components/compliance/compliance-form.tsx` | [ ] location_ids as array [ ] document_type_id dropdown [ ] All fields match schema |
| ComplianceCalendar | `components/compliance/compliance-calendar.tsx` | [ ] Fetches from calendar API [ ] Shows expirations |
| StatusBadge | `components/compliance/status-badge.tsx` | [ ] All 7 statuses handled |
| ExpirationCountdown | `components/compliance/expiration-countdown.tsx` | [ ] Calculates from expiration_date |
| ConditionalBanner | `components/compliance/conditional-banner.tsx` | [ ] Shows when is_conditional=true [ ] Shows conditional_deadline |
| FailedInspectionBanner | `components/compliance/failed-inspection-banner.tsx` | [ ] Shows when status='failed_inspection' [ ] Shows reinspection_date |

### 2.5 PM Components

| Component | File | Checklist |
|-----------|------|-----------|
| PMScheduleForm | `components/pm/pm-schedule-form.tsx` | [ ] frequency dropdown has all 7 values [ ] template_id dropdown [ ] All fields match schema |
| PMCalendar | `components/pm/pm-calendar.tsx` | [ ] Fetches from calendar API [ ] Shows next_due_date |

### 2.6 Location Components

| Component | File | Checklist |
|-----------|------|-----------|
| LocationForm | `components/locations/location-form.tsx` | [ ] manager_id dropdown populated [ ] All fields match schema |

### 2.7 User Components

| Component | File | Checklist |
|-----------|------|-----------|
| InviteUserModal | `components/users/invite-user-modal.tsx` | [ ] Creates tenant_invitation [ ] role dropdown has all values |
| EditUserModal | `components/users/edit-user-modal.tsx` | [ ] Updates user record [ ] role can be changed |

### 2.8 Dashboard Components

| Component | File | Checklist |
|-----------|------|-----------|
| StatCard | `components/dashboard/stat-card.tsx` | [ ] Receives props, no hardcoded values |
| ActivityFeed | `components/dashboard/activity-feed.tsx` | [ ] Fetches from activity API [ ] No mock activities |
| DashboardCharts | `components/dashboard/dashboard-charts.tsx` | [ ] Connected to real data |
| StatusPieChart | `components/dashboard/status-pie-chart.tsx` | [ ] All ticket statuses represented |
| PriorityBarChart | `components/dashboard/priority-bar-chart.tsx` | [ ] All priorities: low, medium, high, critical |
| TicketTrendChart | `components/dashboard/ticket-trend-chart.tsx` | [ ] Fetches trend data from API |
| LocationChart | `components/dashboard/location-chart.tsx` | [ ] Shows tickets by location |

### 2.9 Layout Components

| Component | File | Checklist |
|-----------|------|-----------|
| Sidebar | `components/layout/sidebar.tsx` | [ ] Navigation items correct [ ] Active state works |
| Header | `components/layout/header.tsx` | [ ] User name displays [ ] Logout works |
| BottomNav | `components/layout/bottom-nav.tsx` | [ ] Mobile nav items match sidebar |
| MobileNav | `components/layout/mobile-nav.tsx` | [ ] Works on mobile |
| NotificationFab | `components/layout/notification-fab.tsx` | [ ] Shows unread count |

---

## Section 3: API Routes Review

### 3.1 Core CRUD APIs

| Route | Method | Service Method | Checklist |
|-------|--------|----------------|-----------|
| `/api/tickets` | GET | TicketService.list() | [ ] Filters by tenant_id [ ] Pagination works |
| `/api/tickets` | POST | TicketService.create() | [ ] Validates input [ ] Returns created ticket |
| `/api/tickets/[id]` | GET | TicketService.getById() | [ ] Includes relations [ ] 404 if not found |
| `/api/tickets/[id]` | PUT | TicketService.update() | [ ] Validates ownership |
| `/api/tickets/[id]/status` | PUT | TicketService.updateStatus() | [ ] Valid transitions only |
| `/api/tickets/[id]/assign` | PUT | TicketService.assign() | [ ] Updates assigned_to |
| `/api/tickets/[id]/comments` | GET/POST | CommentService | [ ] Filters by ticket_id |
| `/api/tickets/[id]/attachments` | GET/POST | AttachmentService | [ ] Handles file upload |
| `/api/tickets/[id]/approval` | POST | CostApprovalService | [ ] Creates approval record |
| `/api/assets` | GET/POST | AssetService | [ ] Uses `name`, `qr_code` fields |
| `/api/assets/[id]` | GET/PUT/DELETE | AssetService | [ ] Soft delete only |
| `/api/assets/[id]/transfer` | POST | AssetTransferService | [ ] Creates transfer record |
| `/api/assets/qr/[code]` | GET | AssetService.getByQRCode() | [ ] Looks up by qr_code |
| `/api/locations` | GET/POST | LocationService | [ ] Tenant isolation |
| `/api/locations/[id]` | GET/PUT/DELETE | LocationService | [ ] Soft delete only |
| `/api/users` | GET/POST | UserService | [ ] Tenant isolation |
| `/api/users/[id]` | GET/PUT | UserService | [ ] No hard delete |
| `/api/users/[id]/deactivate` | POST | UserService.deactivate() | [ ] Sets is_active=false |
| `/api/vendors` | GET/POST | VendorService | [ ] service_categories as array |
| `/api/vendors/[id]` | GET/PUT/DELETE | VendorService | [ ] Soft delete only |
| `/api/vendors/[id]/ratings` | GET/POST | VendorRatingService | [ ] Creates rating record |
| `/api/compliance` | GET/POST | ComplianceService | [ ] location_ids as array |
| `/api/compliance/[id]` | GET/PUT/DELETE | ComplianceService | [ ] Soft delete only |
| `/api/compliance/[id]/status` | PUT | ComplianceService.updateStatus() | [ ] Valid status transitions |
| `/api/compliance/calendar` | GET | ComplianceService.getCalendar() | [ ] Returns upcoming expirations |
| `/api/compliance/expiring` | GET | ComplianceService.getExpiring() | [ ] Filters by days ahead |
| `/api/pm-schedules` | GET/POST | PMScheduleService | [ ] Validates frequency enum |
| `/api/pm-schedules/[id]` | GET/PUT/DELETE | PMScheduleService | [ ] Soft delete only |
| `/api/pm-schedules/[id]/complete` | POST | PMCompletionService | [ ] Creates completion record |
| `/api/pm-schedules/calendar` | GET | PMScheduleService.getCalendar() | [ ] Returns upcoming PM |
| `/api/pm-schedules/due` | GET | PMScheduleService.getDue() | [ ] Filters by due date |
| `/api/pm-templates` | GET/POST | PMTemplateService | [ ] checklist as JSON |
| `/api/pm-templates/[id]` | GET/PUT/DELETE | PMTemplateService | [ ] Soft delete only |
| `/api/budgets` | GET/POST | BudgetService | [ ] fiscal_year required |
| `/api/budgets/[id]` | GET/PUT/DELETE | BudgetService | [ ] Soft delete only |
| `/api/emergencies` | GET/POST | EmergencyService | [ ] severity: high/critical only |
| `/api/emergencies/[id]` | GET/PUT/DELETE | EmergencyService | [ ] Soft delete only |

### 3.2 Special APIs

| Route | Purpose | Checklist |
|-------|---------|-----------|
| `/api/auth/me` | Get current user | [ ] Returns user with tenant |
| `/api/auth/session` | Get session | [ ] Returns auth session |
| `/api/invitations` | Send invite | [ ] Creates tenant_invitation [ ] Sends email |
| `/api/invitations/[token]` | Accept invite | [ ] Validates token [ ] Creates user |
| `/api/dashboard` | Dashboard overview | [ ] Returns real stats |
| `/api/dashboard/overview` | Stats | [ ] Counts from DB |
| `/api/dashboard/activity` | Recent activity | [ ] Real activity data |
| `/api/reports/*` | Report generation | [ ] Queries real data [ ] Export works |

### 3.3 Cron/Background Jobs

| Route | Purpose | Checklist |
|-------|---------|-----------|
| `/api/cron/compliance-alerts` | Send compliance alerts | [ ] Checks expiration_date [ ] Sends notifications |
| `/api/cron/ticket-escalation` | Escalate tickets | [ ] Checks escalation_hours [ ] Updates status |
| `/api/cron/pm-generate` | Generate PM tickets | [ ] Checks next_due_date [ ] Creates tickets |

---

## Section 4: Services Review

| Service | File | Checklist |
|---------|------|-----------|
| AssetService | `services/asset.service.ts` | [ ] Uses AssetDAO [ ] Field names match schema |
| AssetCategoryService | `services/asset-category.service.ts` | [ ] CRUD operations |
| AssetTransferService | `services/asset-transfer.service.ts` | [ ] Creates transfer records |
| BudgetService | `services/budget.service.ts` | [ ] fiscal_year handling |
| ComplianceAlertService | `services/compliance-alert.service.ts` | [ ] Alert logic correct |
| ComplianceDocumentService | `services/compliance-document.service.ts` | [ ] location_ids handling |
| ComplianceDocumentTypeService | `services/compliance-document-type.service.ts` | [ ] CRUD operations |
| CostApprovalService | `services/cost-approval.service.ts` | [ ] Approval workflow |
| DashboardService | `services/dashboard.service.ts` | [ ] Aggregates real data |
| EmergencyIncidentService | `services/emergency-incident.service.ts` | [ ] severity enum correct |
| InvitationService | `services/invitation.service.ts` | [ ] Token generation [ ] Email sending |
| LocationService | `services/location.service.ts` | [ ] manager_id handling |
| NotificationService | `services/notification.service.ts` | [ ] Notification delivery |
| OnCallScheduleService | `services/on-call-schedule.service.ts` | [ ] Date range handling |
| PMCompletionService | `services/pm-completion.service.ts` | [ ] Creates completion records |
| PMScheduleService | `services/pm-schedule.service.ts` | [ ] frequency enum [ ] next_due_date calculation |
| PMTemplateService | `services/pm-template.service.ts` | [ ] checklist JSON handling |
| ReportService | `services/report.service.ts` | [ ] Real data aggregation |
| TenantService | `services/tenant.service.ts` | [ ] Tenant operations |
| TicketService | `services/ticket.service.ts` | [ ] Status transitions [ ] Assignment |
| TicketAttachmentService | `services/ticket-attachment.service.ts` | [ ] File upload handling |
| TicketCommentService | `services/ticket-comment.service.ts` | [ ] is_internal flag |
| TicketCategoryService | `services/ticket-category.service.ts` | [ ] approval_threshold |
| UserService | `services/user.service.ts` | [ ] No hard delete [ ] Deactivation |
| VendorService | `services/vendor.service.ts` | [ ] service_categories array |
| VendorRatingService | `services/vendor-rating.service.ts` | [ ] Rating 1-5 validation |

---

## Section 5: DAOs Review

| DAO | File | Checklist |
|-----|------|-----------|
| AssetDAO | `dao/asset.dao.ts` | [ ] Uses `name` not `asset_name` [ ] Uses `qr_code` not `asset_tag` [ ] tenant_id filter |
| AssetCategoryDAO | `dao/asset-category.dao.ts` | [ ] Soft delete filter |
| AssetHistoryDAO | `dao/asset-history.dao.ts` | [ ] No soft delete (audit) |
| AssetTransferDAO | `dao/asset-transfer.dao.ts` | [ ] No soft delete (audit) |
| BaseDAO | `dao/base.dao.ts` | [ ] Soft delete implemented [ ] tenant_id enforcement |
| BudgetDAO | `dao/budget.dao.ts` | [ ] Unique constraint handling |
| ComplianceAlertDAO | `dao/compliance-alert.dao.ts` | [ ] No soft delete (audit) |
| ComplianceDocumentDAO | `dao/compliance-document.dao.ts` | [ ] location_ids array handling |
| ComplianceDocumentTypeDAO | `dao/compliance-document-type.dao.ts` | [ ] Soft delete filter |
| ComplianceDocumentVersionDAO | `dao/compliance-document-version.dao.ts` | [ ] No soft delete (audit) |
| CostApprovalDAO | `dao/cost-approval.dao.ts` | [ ] No soft delete (audit) |
| EmergencyIncidentDAO | `dao/emergency-incident.dao.ts` | [ ] severity enum |
| InvitationDAO | `dao/invitation.dao.ts` | [ ] Token lookup |
| LocationDAO | `dao/location.dao.ts` | [ ] manager_id relation |
| OnCallScheduleDAO | `dao/on-call-schedule.dao.ts` | [ ] Date range queries |
| PMCompletionDAO | `dao/pm-completion.dao.ts` | [ ] No soft delete (audit) |
| PMScheduleDAO | `dao/pm-schedule.dao.ts` | [ ] frequency enum |
| PMTemplateDAO | `dao/pm-template.dao.ts` | [ ] checklist JSON |
| TenantDAO | `dao/tenant.dao.ts` | [ ] No tenant_id filter (is tenant) |
| TicketDAO | `dao/ticket.dao.ts` | [ ] All relations correct |
| TicketAttachmentDAO | `dao/ticket-attachment.dao.ts` | [ ] attachment_type validation |
| TicketCommentDAO | `dao/ticket-comment.dao.ts` | [ ] is_internal flag |
| TicketCategoryDAO | `dao/ticket-category.dao.ts` | [ ] approval_threshold |
| UserDAO | `dao/user.dao.ts` | [ ] auth_user_id handling |
| VendorDAO | `dao/vendor.dao.ts` | [ ] service_categories array |
| VendorRatingDAO | `dao/vendor-rating.dao.ts` | [ ] No soft delete (audit) |

---

## Section 6: Hooks Review

| Hook | File | Checklist |
|------|------|-----------|
| useAssets | `hooks/use-assets.ts` | [ ] Calls /api/assets [ ] Returns typed data |
| useAssetCategories | `hooks/use-asset-categories.ts` | [ ] Calls /api/asset-categories |
| useAuth | `hooks/use-auth.ts` | [ ] Uses Supabase auth [ ] Returns user |
| useCompliance | `hooks/use-compliance.ts` | [ ] Calls /api/compliance |
| useDashboard | `hooks/use-dashboard.ts` | [ ] Calls /api/dashboard |
| useDebouncedValue | `hooks/use-debounced-value.ts` | [ ] Utility hook |
| useEmergencies | `hooks/use-emergencies.ts` | [ ] Calls /api/emergencies |
| useLocations | `hooks/use-locations.ts` | [ ] Calls /api/locations |
| usePM | `hooks/use-pm.ts` | [ ] Calls /api/pm-schedules |
| useRealtime | `hooks/use-realtime.ts` | [ ] Supabase realtime subscription |
| useTickets | `hooks/use-tickets.ts` | [ ] Calls /api/tickets |
| useUsers | `hooks/use-users.ts` | [ ] Calls /api/users |
| useVendors | `hooks/use-vendors.ts` | [ ] Calls /api/vendors |

---

## Section 7: Type Definitions Review

| Type File | Checklist |
|-----------|-----------|
| `types/database.ts` | [ ] TenantPlan includes 'trial' [ ] All enums match schema [ ] All table types match schema |
| `types/index.ts` | [ ] CreateAssetInput uses `name` not `asset_name` [ ] All input types match schema |

---

## Section 8: Validation Schemas Review

| File | Checklist |
|------|-----------|
| `lib/validations/assets-vendors.ts` | [ ] Asset fields match schema [ ] Vendor fields match schema |
| `lib/validations/compliance.ts` | [ ] location_ids as array [ ] status values correct |
| `lib/validations/location.ts` | [ ] All fields match schema |
| `lib/validations/pm.ts` | [ ] frequency values match enum [ ] All fields match schema |
| `lib/validations/ticket.ts` | [ ] priority values match enum [ ] All fields match schema |
| `lib/validations/user.ts` | [ ] role values match enum |

---

## Section 9: Test Coverage Review

### Existing Tests
- [ ] `dao/__tests__/asset.dao.test.ts` - Passes, uses correct field names
- [ ] `dao/__tests__/base.dao.test.ts` - Passes, soft delete tested
- [ ] `dao/__tests__/compliance-document.dao.test.ts` - Passes
- [ ] `dao/__tests__/location.dao.test.ts` - Passes
- [ ] `dao/__tests__/pm-schedule.dao.test.ts` - Passes, frequency values correct
- [ ] `dao/__tests__/ticket.dao.test.ts` - Passes
- [ ] `dao/__tests__/user.dao.test.ts` - Passes
- [ ] `dao/__tests__/vendor.dao.test.ts` - Passes
- [ ] `services/__tests__/location.service.test.ts` - Passes
- [ ] `services/__tests__/pm-schedule.service.test.ts` - Passes

### Missing Test Coverage
- [ ] Services: Most services lack tests
- [ ] API Routes: No API route tests
- [ ] Components: No component tests

---

## Section 10: Common Issues to Check For

### 10.1 Mock Data Patterns
Search for and eliminate:
- [ ] Hardcoded arrays of objects with IDs
- [ ] `const mockData = [...]`
- [ ] `const dummyItems = [...]`
- [ ] `const sampleUsers = [...]`
- [ ] Placeholder text like "Lorem ipsum"
- [ ] Test email addresses in production code

### 10.2 Schema Mismatches
Known issues to verify fixed:
- [ ] `asset_name` should be `name` (assets table)
- [ ] `asset_tag` should be `qr_code` (assets table)
- [ ] `tenant_plan` should include `trial` value
- [ ] `service_categories` is string[] not string

### 10.3 Missing Soft Deletes
Verify these tables have NO soft delete (audit tables):
- [ ] `asset_transfers` - No deleted_at
- [ ] `asset_history` - No deleted_at
- [ ] `ticket_status_history` - No deleted_at
- [ ] `cost_approvals` - No deleted_at
- [ ] `vendor_ratings` - No deleted_at
- [ ] `compliance_alerts` - No deleted_at
- [ ] `compliance_document_versions` - No deleted_at
- [ ] `pm_completions` - No deleted_at

### 10.4 Enum Value Consistency
Verify all enum usages match database exactly:
- [ ] ticket_status: 10 values
- [ ] ticket_priority: 4 values
- [ ] asset_status: 5 values
- [ ] compliance_status: 7 values
- [ ] pm_frequency: 7 values
- [ ] incident_severity: 2 values (high, critical)

---

## Section 11: Summary Statistics

**App Inventory Totals:**
- Pages: ~45 across all route groups
- Components: ~90+ (UI + feature components)
- API Routes: ~55+ endpoints
- Services: 26 service classes
- DAOs: 26 data access objects
- Hooks: 13 custom hooks
- Type Files: 3 main files
- Validation Files: 8 schema files
- Test Files: 10 (DAO + Service tests only)

---

## How to Use This Checklist

1. **Phase 1:** Review all DAOs for schema alignment
2. **Phase 2:** Review all Services for correct DAO usage
3. **Phase 3:** Review all API routes for correct service usage
4. **Phase 4:** Review all hooks for correct API calls
5. **Phase 5:** Review all pages for correct hook usage and no mock data
6. **Phase 6:** Review all components for correct field names
7. **Phase 7:** Run type-check and lint to catch remaining issues
8. **Phase 8:** Run existing tests to verify they pass
9. **Phase 9:** Manual testing of each module's CRUD operations

---

## Completion Promise

When all items in this checklist are verified:

```
PHASE_9_DEEP_REVIEW_COMPLETE
```

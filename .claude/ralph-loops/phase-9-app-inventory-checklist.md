# Phase 9 - App Inventory & Deep Review Checklist

## Goal
- Verify every page/component is wired to real data via hooks → services → API → DAO.
- Confirm there is no mock data in the frontend.
- Ensure UI fields, validations, API payloads, and DAOs match the Supabase schema.
- Validate tenant scoping, soft deletes, and role-based access across the stack.

## Inventory (All App Parts)

### Root/Config
- `mhg-facilities/package.json` (scripts: `lint`, `type-check`, `test`)
- `mhg-facilities/next.config.ts`
- `mhg-facilities/vitest.setup.ts`
- `mhg-facilities/scripts/create-admin-user.ts`

### Supabase Schema & Seed
- `mhg-facilities/supabase/migrations/20260113110015_initial_schema.sql`
- `mhg-facilities/supabase/migrations/20260113211010_seed_mhg_locations.sql`
- `mhg-facilities/supabase/seed.sql`

### App Routes (UI)
**Public/Auth**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/verify-email/page.tsx`
- `src/app/(public)/accept-invite/[token]/page.tsx`

**Dashboard**
- `src/app/(dashboard)/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/approvals/page.tsx`
- `src/app/(dashboard)/assets/page.tsx`
- `src/app/(dashboard)/assets/new/page.tsx`
- `src/app/(dashboard)/assets/[id]/page.tsx`
- `src/app/(dashboard)/assets/[id]/edit/page.tsx`
- `src/app/(dashboard)/assets/scan/page.tsx`
- `src/app/(dashboard)/budgets/page.tsx`
- `src/app/(dashboard)/compliance/page.tsx`
- `src/app/(dashboard)/compliance/new/page.tsx`
- `src/app/(dashboard)/compliance/[id]/page.tsx`
- `src/app/(dashboard)/compliance/[id]/edit/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/emergencies/page.tsx`
- `src/app/(dashboard)/emergencies/new/page.tsx`
- `src/app/(dashboard)/emergencies/[id]/page.tsx`
- `src/app/(dashboard)/locations/page.tsx`
- `src/app/(dashboard)/locations/new/page.tsx`
- `src/app/(dashboard)/locations/[id]/page.tsx`
- `src/app/(dashboard)/pm/page.tsx`
- `src/app/(dashboard)/pm/new/page.tsx`
- `src/app/(dashboard)/pm/[id]/page.tsx`
- `src/app/(dashboard)/pm/[id]/edit/page.tsx`
- `src/app/(dashboard)/pm/templates/page.tsx`
- `src/app/(dashboard)/pm/templates/new/page.tsx`
- `src/app/(dashboard)/pm/templates/[id]/page.tsx`
- `src/app/(dashboard)/reports/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/settings/profile/page.tsx`
- `src/app/(dashboard)/settings/tenant/page.tsx`
- `src/app/(dashboard)/settings/notifications/page.tsx`
- `src/app/(dashboard)/settings/categories/page.tsx`
- `src/app/(dashboard)/tickets/page.tsx`
- `src/app/(dashboard)/tickets/new/page.tsx`
- `src/app/(dashboard)/tickets/[id]/page.tsx`
- `src/app/(dashboard)/users/page.tsx`
- `src/app/(dashboard)/vendors/page.tsx`
- `src/app/(dashboard)/vendors/new/page.tsx`
- `src/app/(dashboard)/vendors/[id]/page.tsx`
- `src/app/(dashboard)/vendors/[id]/edit/page.tsx`

**Global App**
- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/app/error.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/error.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/favicon.ico`

**Page-level Partials**
- `src/app/(dashboard)/compliance/compliance-list.tsx`
- `src/app/(dashboard)/pm/pm-schedule-list.tsx`
- `src/app/(auth)/actions.ts`

### API Routes
**Auth & Users**
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/session/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/users/[id]/deactivate/route.ts`
- `src/app/api/invitations/route.ts`
- `src/app/api/invitations/[token]/route.ts`

**Assets**
- `src/app/api/assets/route.ts`
- `src/app/api/assets/[id]/route.ts`
- `src/app/api/assets/[id]/transfer/route.ts`
- `src/app/api/assets/qr/[code]/route.ts`
- `src/app/api/asset-categories/route.ts`
- `src/app/api/asset-categories/[id]/route.ts`

**Tickets & Approvals**
- `src/app/api/tickets/route.ts`
- `src/app/api/tickets/check-duplicate/route.ts`
- `src/app/api/tickets/[id]/route.ts`
- `src/app/api/tickets/[id]/assign/route.ts`
- `src/app/api/tickets/[id]/status/route.ts`
- `src/app/api/tickets/[id]/attachments/route.ts`
- `src/app/api/tickets/[id]/comments/route.ts`
- `src/app/api/tickets/[id]/approval/route.ts`
- `src/app/api/ticket-categories/route.ts`
- `src/app/api/ticket-categories/[id]/route.ts`
- `src/app/api/approvals/route.ts`

**Compliance**
- `src/app/api/compliance/route.ts`
- `src/app/api/compliance/[id]/route.ts`
- `src/app/api/compliance/[id]/status/route.ts`
- `src/app/api/compliance/expiring/route.ts`
- `src/app/api/compliance/calendar/route.ts`
- `src/app/api/compliance-document-types/route.ts`
- `src/app/api/compliance-document-types/[id]/route.ts`
- `src/app/api/compliance-types/route.ts`
- `src/app/api/compliance-types/[id]/route.ts`

**PM (Preventive Maintenance)**
- `src/app/api/pm-schedules/route.ts`
- `src/app/api/pm-schedules/[id]/route.ts`
- `src/app/api/pm-schedules/[id]/complete/route.ts`
- `src/app/api/pm-schedules/due/route.ts`
- `src/app/api/pm-schedules/calendar/route.ts`
- `src/app/api/pm-schedules/generate/route.ts`
- `src/app/api/pm-templates/route.ts`
- `src/app/api/pm-templates/[id]/route.ts`

**Vendors**
- `src/app/api/vendors/route.ts`
- `src/app/api/vendors/[id]/route.ts`
- `src/app/api/vendors/[id]/ratings/route.ts`

**Locations & Budgets**
- `src/app/api/locations/route.ts`
- `src/app/api/locations/[id]/route.ts`
- `src/app/api/budgets/route.ts`
- `src/app/api/budgets/[id]/route.ts`

**Emergencies & On-call**
- `src/app/api/emergencies/route.ts`
- `src/app/api/emergencies/[id]/route.ts`
- `src/app/api/on-call/route.ts`

**Dashboard & Reports**
- `src/app/api/dashboard/route.ts`
- `src/app/api/dashboard/overview/route.ts`
- `src/app/api/dashboard/activity/route.ts`
- `src/app/api/dashboard/assets/route.ts`
- `src/app/api/dashboard/tickets/route.ts`
- `src/app/api/dashboard/compliance/route.ts`
- `src/app/api/dashboard/pm/route.ts`
- `src/app/api/reports/assets/route.ts`
- `src/app/api/reports/budget/route.ts`
- `src/app/api/reports/compliance/route.ts`
- `src/app/api/reports/pm/route.ts`
- `src/app/api/reports/tickets/route.ts`
- `src/app/api/reports/vendors/route.ts`
- `src/app/api/reports/export/route.ts`

**Cron Jobs**
- `src/app/api/cron/compliance-alerts/route.ts`
- `src/app/api/cron/pm-generate/route.ts`
- `src/app/api/cron/ticket-escalation/route.ts`

### Components
**Assets**
- `src/components/assets/asset-form.tsx`
- `src/components/assets/qr-code-display.tsx`
- `src/components/assets/qr-scanner.tsx`
- `src/components/assets/transfer-modal.tsx`

**Tickets**
- `src/components/tickets/ticket-form.tsx`
- `src/components/tickets/status-badge.tsx`
- `src/components/tickets/status-actions.tsx`
- `src/components/tickets/status-timeline.tsx`
- `src/components/tickets/assign-modal.tsx`
- `src/components/tickets/assign-vendor-modal.tsx`
- `src/components/tickets/comment-form.tsx`
- `src/components/tickets/comment-list.tsx`
- `src/components/tickets/attachment-upload.tsx`
- `src/components/tickets/attachment-gallery.tsx`
- `src/components/tickets/cost-approval-form.tsx`
- `src/components/tickets/approval-status.tsx`

**Compliance**
- `src/components/compliance/compliance-form.tsx`
- `src/components/compliance/compliance-calendar.tsx`
- `src/components/compliance/status-badge.tsx`
- `src/components/compliance/expiration-countdown.tsx`
- `src/components/compliance/conditional-banner.tsx`
- `src/components/compliance/failed-inspection-banner.tsx`

**PM**
- `src/components/pm/pm-schedule-form.tsx`
- `src/components/pm/pm-calendar.tsx`

**Vendors**
- `src/components/vendors/vendor-form.tsx`
- `src/components/vendors/vendor-rating-form.tsx`

**Locations**
- `src/components/locations/location-form.tsx`

**Users**
- `src/components/users/invite-user-modal.tsx`
- `src/components/users/edit-user-modal.tsx`

**Dashboard**
- `src/components/dashboard/activity-feed.tsx`
- `src/components/dashboard/dashboard-charts.tsx`
- `src/components/dashboard/location-chart.tsx`
- `src/components/dashboard/priority-bar-chart.tsx`
- `src/components/dashboard/stat-card.tsx`
- `src/components/dashboard/status-pie-chart.tsx`
- `src/components/dashboard/ticket-trend-chart.tsx`

**Layout/Auth**
- `src/components/layout/header.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/bottom-nav.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/components/layout/more-menu.tsx`
- `src/components/layout/notification-fab.tsx`
- `src/components/auth/RequireRole.tsx`

**UI Kit**
- `src/components/ui/*` (alert, dialog, table, inputs, etc.)
- `src/components/ui/table-loading-overlay.tsx`

### Hooks
- `src/hooks/use-assets.ts`
- `src/hooks/use-asset-categories.ts`
- `src/hooks/use-tickets.ts`
- `src/hooks/use-compliance.ts`
- `src/hooks/use-pm.ts`
- `src/hooks/use-vendors.ts`
- `src/hooks/use-locations.ts`
- `src/hooks/use-users.ts`
- `src/hooks/use-emergencies.ts`
- `src/hooks/use-dashboard.ts`
- `src/hooks/use-auth.ts`
- `src/hooks/use-realtime.ts`
- `src/hooks/use-debounced-value.ts`

### Services
- `src/services/asset.service.ts`
- `src/services/asset-category.service.ts`
- `src/services/asset-transfer.service.ts`
- `src/services/ticket.service.ts`
- `src/services/ticket-category.service.ts`
- `src/services/ticket-comment.service.ts`
- `src/services/ticket-attachment.service.ts`
- `src/services/cost-approval.service.ts`
- `src/services/compliance-document.service.ts`
- `src/services/compliance-document-type.service.ts`
- `src/services/compliance-alert.service.ts`
- `src/services/pm-schedule.service.ts`
- `src/services/pm-template.service.ts`
- `src/services/pm-completion.service.ts`
- `src/services/vendor.service.ts`
- `src/services/vendor-rating.service.ts`
- `src/services/location.service.ts`
- `src/services/user.service.ts`
- `src/services/invitation.service.ts`
- `src/services/tenant.service.ts`
- `src/services/budget.service.ts`
- `src/services/emergency-incident.service.ts`
- `src/services/on-call-schedule.service.ts`
- `src/services/notification.service.ts`
- `src/services/dashboard.service.ts`
- `src/services/report.service.ts`

### DAOs
- `src/dao/base.dao.ts`
- `src/dao/tenant.dao.ts`
- `src/dao/user.dao.ts`
- `src/dao/invitation.dao.ts`
- `src/dao/location.dao.ts`
- `src/dao/vendor.dao.ts`
- `src/dao/vendor-rating.dao.ts`
- `src/dao/asset.dao.ts`
- `src/dao/asset-category.dao.ts`
- `src/dao/asset-transfer.dao.ts`
- `src/dao/asset-history.dao.ts`
- `src/dao/ticket.dao.ts`
- `src/dao/ticket-category.dao.ts`
- `src/dao/ticket-comment.dao.ts`
- `src/dao/ticket-attachment.dao.ts`
- `src/dao/cost-approval.dao.ts`
- `src/dao/compliance-document.dao.ts`
- `src/dao/compliance-document-type.dao.ts`
- `src/dao/compliance-document-version.dao.ts`
- `src/dao/compliance-alert.dao.ts`
- `src/dao/pm-schedule.dao.ts`
- `src/dao/pm-template.dao.ts`
- `src/dao/pm-completion.dao.ts`
- `src/dao/budget.dao.ts`
- `src/dao/on-call-schedule.dao.ts`
- `src/dao/emergency-incident.dao.ts`

### Lib & Infrastructure
- Supabase clients: `src/lib/supabase/{client,server,server-pooled,proxy}.ts`
- Auth/Tenant: `src/lib/auth/api-auth.ts`, `src/lib/tenant/{context,super-admin}.ts`
- API client: `src/lib/api-client.ts`
- Export: `src/lib/export/{index,excel,pdf}.ts`
- Email: `src/lib/email/smtp.ts`, `src/lib/email/templates/invitation.ts`
- Validations: `src/lib/validations/{assets-vendors,compliance,file-upload,location,pm,shared,ticket,user}.ts`
- Utils: `src/lib/utils.ts`

### Providers, Stores, Types, Theme, i18n
- Providers: `src/providers/auth-provider.tsx`, `src/providers/query-provider.tsx`
- Stores: `src/stores/ui-store.ts`
- Types: `src/types/{database, database-extensions, index}.ts`
- Theme: `src/theme/{colors,index}.ts`
- i18n messages: `src/messages/{en.json, es.json}`

### Tests
- DAO tests: `src/dao/__tests__/*`
- Service tests: `src/services/__tests__/*`

## Schema Reference (Supabase)

### Enums
- `user_role`: `super_admin`, `admin`, `manager`, `staff`, `vendor`, `readonly`
- `tenant_plan`: `trial`, `free`, `starter`, `professional`, `enterprise`
- `tenant_status`: `active`, `suspended`, `cancelled`, `trial`
- `location_status`: `active`, `temporarily_closed`, `permanently_closed`
- `asset_status`: `active`, `under_maintenance`, `retired`, `transferred`, `disposed`
- `ticket_status`: `submitted`, `acknowledged`, `needs_approval`, `approved`, `in_progress`, `completed`, `verified`, `closed`, `rejected`, `on_hold`
- `ticket_priority`: `low`, `medium`, `high`, `critical`
- `compliance_status`: `active`, `expiring_soon`, `expired`, `pending_renewal`, `conditional`, `failed_inspection`, `suspended`
- `approval_status`: `pending`, `approved`, `denied`
- `invoice_status`: `pending`, `approved`, `paid`, `disputed`
- `incident_status`: `active`, `contained`, `resolved`
- `incident_severity`: `high`, `critical`
- `pm_frequency`: `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `semi_annually`, `annually`
- `notification_channel`: `email`, `sms`, `push`, `slack`

### Tables
- `tenants`
- `locations`
- `users`
- `tenant_invitations`
- `vendors`
- `asset_categories`
- `assets`
- `asset_transfers`
- `ticket_categories`
- `tickets`
- `ticket_status_history`
- `ticket_comments`
- `ticket_attachments`
- `cost_approvals`
- `vendor_ratings`
- `compliance_document_types`
- `compliance_documents`
- `compliance_document_versions`
- `compliance_alerts`
- `pm_templates`
- `pm_schedules`
- `pm_completions`
- `budgets`
- `asset_history`
- `on_call_schedules`
- `emergency_incidents`

### DB Functions/Triggers/Indexes
- Functions: `get_user_role`, `is_admin_or_above`, `get_user_location`, `get_user_tenant`, `check_duplicate_ticket`, `generate_ticket_number`, `update_updated_at`, `log_ticket_status_change`
- Triggers: ticket number generation, updated_at triggers, status history logging
- Indexes: tenant_id, status/priority, QR, expiration, next_due_date, etc.

## Deep Review Checklist

### Global Wiring & Data Integrity
- [ ] No mock data in UI (search for hardcoded arrays/objects and placeholder values in components/hooks).
- [ ] All UI data flows through hooks → services → API routes → DAOs (no direct Supabase in components/pages).
- [ ] API routes enforce auth/tenant context and never return cross-tenant data.
- [ ] All DAOs filter `deleted_at IS NULL` and scope by `tenant_id` where applicable.
- [ ] Zod validations match DB schema (nullability, defaults, enums, numeric precision).
- [ ] UI field names match DB columns (`qr_code`, `full_name`, `approval_threshold`, etc.).
- [ ] Enum/status mappings cover all values (no missing states in badges, filters, or dropdowns).
- [ ] Date/time handling uses consistent timezone expectations for `TIMESTAMPTZ`.
- [ ] Attachment uploads store and retrieve paths/URLs correctly.
- [ ] Error/loading/empty states are present and consistent across all list/detail views.
- [ ] Realtime updates (if used) are wired and scoped correctly.
- [ ] i18n strings exist for all user-facing text (EN/ES).
- [ ] Seed/demo data is not surfaced in production contexts.

### Auth, Tenant, and Users
**Pages:** auth pages, `users` list, invite accept.
**API:** auth session/me, users CRUD, invitations.
**Tables:** `tenants`, `users`, `tenant_invitations`.
- [ ] Auth flow uses `auth_user_id` correctly and keeps `users` table in sync.
- [ ] Role checks (`RequireRole`) align with `user_role` enum and API access control.
- [ ] Invitation tokens and expiration handled end-to-end.
- [ ] Profile fields match schema (`full_name`, `phone`, `location_id`, preferences).
- [ ] Deactivation updates `is_active`/`deactivated_at` consistently.

### Locations
**Pages:** locations list/new/detail.
**Components:** `location-form`.
**Hooks/Services/DAOs:** `use-locations`, `location.service`, `location.dao`.
**Tables:** `locations`.
- [ ] `brand`, `manager_id`, `status`, `opened_date`, `closed_date` map to UI fields.
- [ ] Location filters/search use real data (no mocks).
- [ ] Manager assignment uses valid `users.id`.

### Vendors & Ratings
**Pages:** vendors list/new/detail/edit.
**Components:** `vendor-form`, `vendor-rating-form`.
**Hooks/Services/DAOs:** `use-vendors`, `vendor.service`, `vendor-rating.service`, `vendor.dao`, `vendor-rating.dao`.
**Tables:** `vendors`, `vendor_ratings`.
- [ ] Vendor fields align (insurance dates, hourly_rate, preferred flags).
- [ ] Rating flow wired to correct vendor/ticket references.

### Assets & Transfers
**Pages:** assets list/new/detail/edit/scan.
**Components:** asset form, QR scanner, transfer modal.
**Hooks/Services/DAOs:** `use-assets`, `use-asset-categories`, asset/asset-category/asset-transfer services + DAOs.
**API:** assets CRUD, QR lookup, transfer, asset categories.
**Tables:** `assets`, `asset_categories`, `asset_transfers`, `asset_history`.
- [ ] Asset fields match schema (`name`, `qr_code`, `status`, `manual_url`, `spec_sheet_path`, `photo_path`).
- [ ] QR scan resolves `assets.qr_code` (not legacy `asset_tag`).
- [ ] Transfer modal writes to `asset_transfers` and updates asset `location_id`/`status`.
- [ ] Asset history audit entries are written and displayed correctly.

### Tickets & Approvals
**Pages:** tickets list/new/detail.
**Components:** ticket form, status actions/timeline/badge, assignment modals, comments, attachments, cost approvals.
**Hooks/Services/DAOs:** `use-tickets`, ticket/category/comment/attachment/cost-approval services + DAOs.
**API:** tickets CRUD, status, assign, comments, attachments, approvals, categories, duplicate check.
**Tables:** `tickets`, `ticket_categories`, `ticket_status_history`, `ticket_comments`, `ticket_attachments`, `cost_approvals`.
- [ ] Status transitions align with `ticket_status` enum and history logging.
- [ ] Ticket number generation matches DB trigger; UI shows correct field.
- [ ] Assignments to users/vendors stored in correct columns.
- [ ] Attachments upload and display from `ticket_attachments`.
- [ ] Approval thresholds and costs align (`estimated_cost`, `approved_cost`, `actual_cost`).

### Compliance
**Pages:** compliance list/new/detail/edit.
**Components:** compliance form, calendar, status badge, banners.
**Hooks/Services/DAOs:** `use-compliance`, compliance services + DAOs.
**API:** compliance CRUD, status, expiring, calendar, document types.
**Tables:** `compliance_document_types`, `compliance_documents`, `compliance_document_versions`, `compliance_alerts`.
- [ ] Document type fields match schema (`default_alert_days`, `is_location_specific`).
- [ ] Status mapping uses `compliance_status` enum.
- [ ] Versioning writes to `compliance_document_versions` and is visible.
- [ ] Expiration/alert logic matches cron/compliance-alerts route.

### Preventive Maintenance (PM)
**Pages:** PM list/new/detail/edit, templates list/new/detail.
**Components:** PM schedule form, calendar.
**Hooks/Services/DAOs:** `use-pm`, pm services + DAOs.
**API:** pm schedules CRUD, due, calendar, generate, complete; pm templates.
**Tables:** `pm_templates`, `pm_schedules`, `pm_completions`.
- [ ] Frequency values match `pm_frequency` enum.
- [ ] `next_due_date` and `last_completed_date` computed correctly.
- [ ] Completion flow writes to `pm_completions` and updates schedule.

### Dashboard & Reports
**Pages:** dashboard, reports.
**Components:** charts, activity feed, stat cards.
**Hooks/Services:** `use-dashboard`, `dashboard.service`, `report.service`.
**API:** dashboard routes, reports routes, export.
- [ ] Aggregations and charts align with DB schema and filters (tenant, date range).
- [ ] Export uses `lib/export` and matches report filters.

### Budgets
**Pages:** budgets.
**Services/DAOs:** `budget.service`, `budget.dao`.
**API:** budgets CRUD, report budget.
**Tables:** `budgets`.
- [ ] Budget fields and calculations match schema.

### Emergencies & On-call
**Pages:** emergencies list/new/detail.
**Hooks/Services/DAOs:** `use-emergencies`, `emergency-incident.service`, `emergency-incident.dao`, `on-call-schedule`.
**API:** emergencies, on-call.
**Tables:** `emergency_incidents`, `on_call_schedules`.
- [ ] Incident status/severity align with enums.
- [ ] On-call schedules feed notifications correctly.

### Settings, Notifications, Categories
**Pages:** settings, tenant, profile, notifications, categories.
**Services/DAOs:** tenant, notification, asset-category, ticket-category, compliance-document-type.
- [ ] Tenant branding/features map to `tenants.features` and `tenants.branding`.
- [ ] Notification preferences align with `notification_channel` enum.
- [ ] Category management wired to correct tables and APIs.

### Cron Jobs
- [ ] Compliance alerts cron matches alert rules and updates `compliance_alerts`.
- [ ] PM generate cron creates schedules consistently with templates.
- [ ] Ticket escalation cron respects `escalation_hours` and updates status.

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRowIssues = exports.uploadConfirmJobs = exports.matchingRefreshJobs = exports.matchNotifications = exports.matchCandidateSnapshots = exports.deadStockReservations = exports.pharmacyRelationships = exports.openclawCommandWhitelist = exports.openclawCommands = exports.errorCodes = exports.errorCodeSeverityValues = exports.errorCodeCategoryValues = exports.systemEvents = exports.activityLogs = exports.drugMasterSyncLogs = exports.drugMasterPriceHistory = exports.drugMasterPackages = exports.drugMaster = exports.pharmacySpecialHours = exports.pharmacyBusinessHours = exports.passwordResetTokens = exports.pharmacyRegistrationReviews = exports.userRequests = exports.adminMessageReads = exports.adminMessages = exports.columnMappingTemplates = exports.monthlyReports = exports.pharmacyTrustScores = exports.exchangeFeedback = exports.proposalComments = exports.exchangeHistory = exports.exchangeProposalItems = exports.exchangeProposals = exports.usedMedicationItems = exports.deadStockItems = exports.uploads = exports.pharmacies = exports.registrationReviewVerdictValues = exports.systemEventLevelValues = exports.systemEventSourceValues = exports.monthlyReportStatusEnum = exports.specialBusinessHoursTypeEnum = exports.drugMasterRevisionTypeEnum = exports.drugMasterSyncStatusEnum = exports.openclawStatusEnum = exports.adminMessageTargetTypeEnum = exports.exchangeStatusEnum = exports.uploadJobStatusEnum = exports.uploadTypeEnum = exports.pharmacyRelationshipTypeEnum = void 0;
exports.drugMasterSourceState = exports.predictiveAlerts = exports.notifications = exports.predictiveAlertTypeValues = exports.notificationReferenceTypeValues = exports.notificationTypeValues = exports.matchingRuleProfiles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.pharmacyRelationshipTypeEnum = (0, pg_core_1.pgEnum)('pharmacy_relationship_type_enum', ['favorite', 'blocked']);
exports.uploadTypeEnum = (0, pg_core_1.pgEnum)('upload_type_enum', ['dead_stock', 'used_medication']);
exports.uploadJobStatusEnum = (0, pg_core_1.pgEnum)('upload_job_status_enum', ['pending', 'processing', 'completed', 'failed']);
exports.exchangeStatusEnum = (0, pg_core_1.pgEnum)('exchange_status_enum', [
    'proposed',
    'accepted_a',
    'accepted_b',
    'confirmed',
    'rejected',
    'completed',
    'cancelled',
]);
exports.adminMessageTargetTypeEnum = (0, pg_core_1.pgEnum)('admin_message_target_type_enum', ['all', 'pharmacy']);
exports.openclawStatusEnum = (0, pg_core_1.pgEnum)('openclaw_status_enum', [
    'pending_handoff',
    'in_dialogue',
    'implementing',
    'completed',
]);
exports.drugMasterSyncStatusEnum = (0, pg_core_1.pgEnum)('drug_master_sync_status_enum', ['running', 'success', 'failed', 'partial']);
exports.drugMasterRevisionTypeEnum = (0, pg_core_1.pgEnum)('drug_master_revision_type_enum', ['price_revision', 'new_listing', 'delisting', 'transition']);
exports.specialBusinessHoursTypeEnum = (0, pg_core_1.pgEnum)('special_business_hours_type_enum', [
    'holiday_closed',
    'long_holiday_closed',
    'temporary_closed',
    'special_open',
]);
exports.monthlyReportStatusEnum = (0, pg_core_1.pgEnum)('monthly_report_status_enum', ['success', 'failed']);
exports.systemEventSourceValues = ['runtime_error', 'unhandled_rejection', 'uncaught_exception', 'vercel_deploy'];
exports.systemEventLevelValues = ['info', 'warning', 'error'];
exports.registrationReviewVerdictValues = ['approved', 'rejected'];
exports.pharmacies = (0, pg_core_1.pgTable)('pharmacies', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    postalCode: (0, pg_core_1.text)('postal_code').notNull(),
    address: (0, pg_core_1.text)('address').notNull(),
    phone: (0, pg_core_1.text)('phone').notNull(),
    fax: (0, pg_core_1.text)('fax').notNull(),
    licenseNumber: (0, pg_core_1.text)('license_number').notNull().unique(),
    prefecture: (0, pg_core_1.text)('prefecture').notNull(),
    latitude: (0, pg_core_1.real)('latitude'),
    longitude: (0, pg_core_1.real)('longitude'),
    isAdmin: (0, pg_core_1.boolean)('is_admin').default(false),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    isTestAccount: (0, pg_core_1.boolean)('is_test_account').notNull().default(false),
    testAccountPassword: (0, pg_core_1.text)('test_account_password'),
    version: (0, pg_core_1.integer)('version').notNull().default(1),
    lastTimelineViewedAt: (0, pg_core_1.timestamp)('last_timeline_viewed_at', { mode: 'string' }),
    verificationStatus: (0, pg_core_1.text)('verification_status').notNull().default('pending_verification'),
    verificationRequestId: (0, pg_core_1.integer)('verification_request_id'),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at', { mode: 'string' }),
    rejectionReason: (0, pg_core_1.text)('rejection_reason'),
    matchingAutoNotifyEnabled: (0, pg_core_1.boolean)('matching_auto_notify_enabled').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    chkLatitude: (0, pg_core_1.check)('chk_latitude', (0, drizzle_orm_1.sql) `${table.latitude} IS NULL OR (${table.latitude} >= -90 AND ${table.latitude} <= 90)`),
    chkLongitude: (0, pg_core_1.check)('chk_longitude', (0, drizzle_orm_1.sql) `${table.longitude} IS NULL OR (${table.longitude} >= -180 AND ${table.longitude} <= 180)`),
}));
exports.uploads = (0, pg_core_1.pgTable)('uploads', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    uploadType: (0, exports.uploadTypeEnum)('upload_type').notNull(),
    originalFilename: (0, pg_core_1.text)('original_filename').notNull(),
    columnMapping: (0, pg_core_1.text)('column_mapping'),
    rowCount: (0, pg_core_1.integer)('row_count'),
    requestedAt: (0, pg_core_1.timestamp)('requested_at', { mode: 'string' }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxUploadsPharmacyTypeCreated: (0, pg_core_1.index)('idx_uploads_pharmacy_type_created')
        .on(table.pharmacyId, table.uploadType, table.createdAt),
    idxUploadsUsedMedicationRecentCandidates: (0, pg_core_1.index)('idx_uploads_used_med_recent_candidates')
        .on(table.createdAt, table.pharmacyId)
        .where((0, drizzle_orm_1.sql) `${table.uploadType} = 'used_medication'`),
}));
exports.deadStockItems = (0, pg_core_1.pgTable)('dead_stock_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    uploadId: (0, pg_core_1.integer)('upload_id').notNull().references(() => exports.uploads.id, { onDelete: 'cascade' }),
    drugCode: (0, pg_core_1.text)('drug_code'),
    drugName: (0, pg_core_1.text)('drug_name').notNull(),
    drugMasterId: (0, pg_core_1.integer)('drug_master_id'),
    drugMasterPackageId: (0, pg_core_1.integer)('drug_master_package_id'),
    packageLabel: (0, pg_core_1.text)('package_label'),
    quantity: (0, pg_core_1.real)('quantity').notNull(),
    unit: (0, pg_core_1.text)('unit'),
    yakkaUnitPrice: (0, pg_core_1.numeric)('yakka_unit_price', { precision: 12, scale: 2 }),
    yakkaTotal: (0, pg_core_1.numeric)('yakka_total', { precision: 12, scale: 2 }),
    expirationDate: (0, pg_core_1.text)('expiration_date'),
    expirationDateIso: (0, pg_core_1.date)('expiration_date_iso', { mode: 'string' }),
    lotNumber: (0, pg_core_1.text)('lot_number'),
    isAvailable: (0, pg_core_1.boolean)('is_available').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxDeadStockPharmacyAvailableCreated: (0, pg_core_1.index)('idx_dead_stock_pharmacy_available_created')
        .on(table.pharmacyId, table.isAvailable, table.createdAt),
    idxDeadStockPharmacyCreated: (0, pg_core_1.index)('idx_dead_stock_pharmacy_created')
        .on(table.pharmacyId, table.createdAt),
    idxDeadStockAvailableCreated: (0, pg_core_1.index)('idx_dead_stock_available_created')
        .on(table.createdAt)
        .where((0, drizzle_orm_1.sql) `${table.isAvailable} = true`),
    idxDeadStockAvailableName: (0, pg_core_1.index)('idx_dead_stock_available_name')
        .on(table.isAvailable, table.drugName),
    idxDeadStockExpiryRisk: (0, pg_core_1.index)('idx_dead_stock_expiry_risk')
        .on(table.pharmacyId, table.isAvailable, table.expirationDateIso),
    idxDeadStockDrugMasterId: (0, pg_core_1.index)('idx_dead_stock_drug_master_id')
        .on(table.drugMasterId),
    idxDeadStockDrugMasterPackageId: (0, pg_core_1.index)('idx_dead_stock_drug_master_package_id')
        .on(table.drugMasterPackageId),
    idxDeadStockPharmacyAvailableName: (0, pg_core_1.index)('idx_dead_stock_pharmacy_available_name')
        .on(table.pharmacyId, table.isAvailable, table.drugName),
    chkQuantityPositive: (0, pg_core_1.check)('chk_dead_stock_quantity', (0, drizzle_orm_1.sql) `${table.quantity} > 0`),
    chkYakkaUnitPriceNonNeg: (0, pg_core_1.check)('chk_dead_stock_yakka_price', (0, drizzle_orm_1.sql) `${table.yakkaUnitPrice} IS NULL OR ${table.yakkaUnitPrice} >= 0`),
}));
exports.usedMedicationItems = (0, pg_core_1.pgTable)('used_medication_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    uploadId: (0, pg_core_1.integer)('upload_id').notNull().references(() => exports.uploads.id, { onDelete: 'cascade' }),
    drugCode: (0, pg_core_1.text)('drug_code'),
    drugName: (0, pg_core_1.text)('drug_name').notNull(),
    drugMasterId: (0, pg_core_1.integer)('drug_master_id'),
    drugMasterPackageId: (0, pg_core_1.integer)('drug_master_package_id'),
    packageLabel: (0, pg_core_1.text)('package_label'),
    monthlyUsage: (0, pg_core_1.real)('monthly_usage'),
    unit: (0, pg_core_1.text)('unit'),
    yakkaUnitPrice: (0, pg_core_1.numeric)('yakka_unit_price', { precision: 12, scale: 2 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxUsedMedicationPharmacyCreated: (0, pg_core_1.index)('idx_used_medication_pharmacy_created')
        .on(table.pharmacyId, table.createdAt),
    idxUsedMedDrugMasterId: (0, pg_core_1.index)('idx_used_med_drug_master_id')
        .on(table.drugMasterId),
    idxUsedMedDrugMasterPackageId: (0, pg_core_1.index)('idx_used_med_drug_master_package_id')
        .on(table.drugMasterPackageId),
    idxUsedMedPharmacyName: (0, pg_core_1.index)('idx_used_med_pharmacy_name')
        .on(table.pharmacyId, table.drugName),
    chkYakkaUnitPriceNonNeg: (0, pg_core_1.check)('chk_used_med_yakka_price', (0, drizzle_orm_1.sql) `${table.yakkaUnitPrice} IS NULL OR ${table.yakkaUnitPrice} >= 0`),
}));
exports.exchangeProposals = (0, pg_core_1.pgTable)('exchange_proposals', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyAId: (0, pg_core_1.integer)('pharmacy_a_id').notNull().references(() => exports.pharmacies.id),
    pharmacyBId: (0, pg_core_1.integer)('pharmacy_b_id').notNull().references(() => exports.pharmacies.id),
    status: (0, exports.exchangeStatusEnum)('status').notNull().default('proposed'),
    totalValueA: (0, pg_core_1.numeric)('total_value_a', { precision: 12, scale: 2 }),
    totalValueB: (0, pg_core_1.numeric)('total_value_b', { precision: 12, scale: 2 }),
    valueDifference: (0, pg_core_1.numeric)('value_difference', { precision: 12, scale: 2 }),
    proposedAt: (0, pg_core_1.timestamp)('proposed_at', { mode: 'string' }).defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { mode: 'string' }),
}, (table) => ({
    idxExchangeProposalsAProposed: (0, pg_core_1.index)('idx_exchange_proposals_a_proposed')
        .on(table.pharmacyAId, table.proposedAt),
    idxExchangeProposalsBProposed: (0, pg_core_1.index)('idx_exchange_proposals_b_proposed')
        .on(table.pharmacyBId, table.proposedAt),
    idxExchangeProposalsStatusProposed: (0, pg_core_1.index)('idx_exchange_proposals_status_proposed')
        .on(table.status, table.proposedAt),
}));
exports.exchangeProposalItems = (0, pg_core_1.pgTable)('exchange_proposal_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    proposalId: (0, pg_core_1.integer)('proposal_id').notNull().references(() => exports.exchangeProposals.id, { onDelete: 'cascade' }),
    deadStockItemId: (0, pg_core_1.integer)('dead_stock_item_id').notNull().references(() => exports.deadStockItems.id),
    fromPharmacyId: (0, pg_core_1.integer)('from_pharmacy_id').notNull().references(() => exports.pharmacies.id),
    toPharmacyId: (0, pg_core_1.integer)('to_pharmacy_id').notNull().references(() => exports.pharmacies.id),
    quantity: (0, pg_core_1.real)('quantity').notNull(),
    yakkaValue: (0, pg_core_1.numeric)('yakka_value', { precision: 12, scale: 2 }),
}, (table) => ({
    idxExchangeItemsProposal: (0, pg_core_1.index)('idx_exchange_items_proposal').on(table.proposalId),
    chkQuantityPositive: (0, pg_core_1.check)('chk_exchange_item_quantity', (0, drizzle_orm_1.sql) `${table.quantity} > 0`),
}));
exports.exchangeHistory = (0, pg_core_1.pgTable)('exchange_history', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    proposalId: (0, pg_core_1.integer)('proposal_id').notNull().references(() => exports.exchangeProposals.id),
    pharmacyAId: (0, pg_core_1.integer)('pharmacy_a_id').notNull().references(() => exports.pharmacies.id),
    pharmacyBId: (0, pg_core_1.integer)('pharmacy_b_id').notNull().references(() => exports.pharmacies.id),
    totalValue: (0, pg_core_1.numeric)('total_value', { precision: 12, scale: 2 }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxExchangeHistoryACompleted: (0, pg_core_1.index)('idx_exchange_history_a_completed')
        .on(table.pharmacyAId, table.completedAt),
    idxExchangeHistoryBCompleted: (0, pg_core_1.index)('idx_exchange_history_b_completed')
        .on(table.pharmacyBId, table.completedAt),
    idxExchangeHistoryProposal: (0, pg_core_1.index)('idx_exchange_history_proposal')
        .on(table.proposalId),
}));
exports.proposalComments = (0, pg_core_1.pgTable)('proposal_comments', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    proposalId: (0, pg_core_1.integer)('proposal_id').notNull().references(() => exports.exchangeProposals.id, { onDelete: 'cascade' }),
    authorPharmacyId: (0, pg_core_1.integer)('author_pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    body: (0, pg_core_1.text)('body').notNull(),
    isDeleted: (0, pg_core_1.boolean)('is_deleted').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
    readByRecipient: (0, pg_core_1.boolean)('read_by_recipient').notNull().default(false),
}, (table) => ({
    idxProposalCommentsProposalCreated: (0, pg_core_1.index)('idx_proposal_comments_proposal_created')
        .on(table.proposalId, table.createdAt),
    idxProposalCommentsAuthor: (0, pg_core_1.index)('idx_proposal_comments_author')
        .on(table.authorPharmacyId, table.createdAt),
}));
exports.exchangeFeedback = (0, pg_core_1.pgTable)('exchange_feedback', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    proposalId: (0, pg_core_1.integer)('proposal_id').notNull().references(() => exports.exchangeProposals.id, { onDelete: 'cascade' }),
    fromPharmacyId: (0, pg_core_1.integer)('from_pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    toPharmacyId: (0, pg_core_1.integer)('to_pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    rating: (0, pg_core_1.integer)('rating').notNull(),
    comment: (0, pg_core_1.text)('comment'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxExchangeFeedbackProposalFromUnique: (0, pg_core_1.uniqueIndex)('idx_exchange_feedback_proposal_from_unique')
        .on(table.proposalId, table.fromPharmacyId),
    idxExchangeFeedbackTarget: (0, pg_core_1.index)('idx_exchange_feedback_target')
        .on(table.toPharmacyId, table.createdAt),
    chkExchangeFeedbackRating: (0, pg_core_1.check)('chk_exchange_feedback_rating', (0, drizzle_orm_1.sql) `${table.rating} >= 1 AND ${table.rating} <= 5`),
}));
exports.pharmacyTrustScores = (0, pg_core_1.pgTable)('pharmacy_trust_scores', {
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').primaryKey().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    trustScore: (0, pg_core_1.numeric)('trust_score', { precision: 5, scale: 2 }).notNull().default('60.00'),
    ratingCount: (0, pg_core_1.integer)('rating_count').notNull().default(0),
    positiveRate: (0, pg_core_1.numeric)('positive_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxTrustScoresUpdatedAt: (0, pg_core_1.index)('idx_trust_scores_updated_at').on(table.updatedAt),
}));
exports.monthlyReports = (0, pg_core_1.pgTable)('monthly_reports', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    year: (0, pg_core_1.integer)('year').notNull(),
    month: (0, pg_core_1.integer)('month').notNull(),
    status: (0, exports.monthlyReportStatusEnum)('status').notNull().default('success'),
    reportJson: (0, pg_core_1.text)('report_json').notNull(),
    generatedBy: (0, pg_core_1.integer)('generated_by').references(() => exports.pharmacies.id, { onDelete: 'set null' }),
    generatedAt: (0, pg_core_1.timestamp)('generated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxMonthlyReportsYearMonthUnique: (0, pg_core_1.uniqueIndex)('idx_monthly_reports_year_month_unique')
        .on(table.year, table.month),
    idxMonthlyReportsGeneratedAt: (0, pg_core_1.index)('idx_monthly_reports_generated_at')
        .on(table.generatedAt),
    chkMonthlyReportsMonthRange: (0, pg_core_1.check)('chk_monthly_reports_month_range', (0, drizzle_orm_1.sql) `${table.month} >= 1 AND ${table.month} <= 12`),
}));
exports.columnMappingTemplates = (0, pg_core_1.pgTable)('column_mapping_templates', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    uploadType: (0, exports.uploadTypeEnum)('upload_type').notNull(),
    headerHash: (0, pg_core_1.text)('header_hash').notNull(),
    mapping: (0, pg_core_1.text)('mapping').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxMappingTemplatesPharmacyTypeHash: (0, pg_core_1.uniqueIndex)('idx_mapping_templates_pharmacy_type_hash')
        .on(table.pharmacyId, table.uploadType, table.headerHash),
}));
exports.adminMessages = (0, pg_core_1.pgTable)('admin_messages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    senderAdminId: (0, pg_core_1.integer)('sender_admin_id').notNull().references(() => exports.pharmacies.id),
    targetType: (0, exports.adminMessageTargetTypeEnum)('target_type').notNull().default('all'),
    targetPharmacyId: (0, pg_core_1.integer)('target_pharmacy_id').references(() => exports.pharmacies.id),
    title: (0, pg_core_1.text)('title').notNull(),
    body: (0, pg_core_1.text)('body').notNull(),
    actionPath: (0, pg_core_1.text)('action_path'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxAdminMessagesTarget: (0, pg_core_1.index)('idx_admin_messages_target')
        .on(table.targetType, table.targetPharmacyId, table.createdAt),
}));
exports.adminMessageReads = (0, pg_core_1.pgTable)('admin_message_reads', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    messageId: (0, pg_core_1.integer)('message_id').notNull().references(() => exports.adminMessages.id, { onDelete: 'cascade' }),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    readAt: (0, pg_core_1.timestamp)('read_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxAdminMessageReadsUnique: (0, pg_core_1.uniqueIndex)('idx_admin_message_reads_unique')
        .on(table.messageId, table.pharmacyId),
}));
exports.userRequests = (0, pg_core_1.pgTable)('user_requests', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    requestText: (0, pg_core_1.text)('request_text').notNull(),
    openclawStatus: (0, exports.openclawStatusEnum)('openclaw_status').notNull().default('pending_handoff'),
    openclawThreadId: (0, pg_core_1.text)('openclaw_thread_id'),
    openclawSummary: (0, pg_core_1.text)('openclaw_summary'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxUserRequestsCreatedAt: (0, pg_core_1.index)('idx_user_requests_created_at').on(table.createdAt),
    idxUserRequestsPharmacyCreated: (0, pg_core_1.index)('idx_user_requests_pharmacy_created').on(table.pharmacyId, table.createdAt),
    idxUserRequestsStatusCreated: (0, pg_core_1.index)('idx_user_requests_status_created').on(table.openclawStatus, table.createdAt),
}));
exports.pharmacyRegistrationReviews = (0, pg_core_1.pgTable)('pharmacy_registration_reviews', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull(),
    pharmacyName: (0, pg_core_1.text)('pharmacy_name').notNull(),
    postalCode: (0, pg_core_1.text)('postal_code').notNull(),
    prefecture: (0, pg_core_1.text)('prefecture').notNull(),
    address: (0, pg_core_1.text)('address').notNull(),
    phone: (0, pg_core_1.text)('phone').notNull(),
    fax: (0, pg_core_1.text)('fax').notNull(),
    licenseNumber: (0, pg_core_1.text)('license_number').notNull(),
    permitLicenseNumber: (0, pg_core_1.text)('permit_license_number').notNull(),
    permitPharmacyName: (0, pg_core_1.text)('permit_pharmacy_name').notNull(),
    permitAddress: (0, pg_core_1.text)('permit_address').notNull(),
    verdict: (0, pg_core_1.text)('verdict').$type().notNull(),
    screeningScore: (0, pg_core_1.integer)('screening_score').notNull().default(0),
    screeningReasons: (0, pg_core_1.text)('screening_reasons').notNull(),
    mismatchDetailsJson: (0, pg_core_1.text)('mismatch_details_json'),
    createdPharmacyId: (0, pg_core_1.integer)('created_pharmacy_id').references(() => exports.pharmacies.id, { onDelete: 'set null' }),
    registrationIp: (0, pg_core_1.text)('registration_ip'),
    submittedAt: (0, pg_core_1.timestamp)('submitted_at', { mode: 'string' }).defaultNow(),
    reviewedAt: (0, pg_core_1.timestamp)('reviewed_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxRegistrationReviewsSubmitted: (0, pg_core_1.index)('idx_registration_reviews_submitted')
        .on(table.submittedAt),
    idxRegistrationReviewsVerdictSubmitted: (0, pg_core_1.index)('idx_registration_reviews_verdict_submitted')
        .on(table.verdict, table.submittedAt),
    idxRegistrationReviewsCreatedPharmacy: (0, pg_core_1.index)('idx_registration_reviews_created_pharmacy')
        .on(table.createdPharmacyId),
    chkRegistrationReviewsVerdict: (0, pg_core_1.check)('chk_registration_reviews_verdict', (0, drizzle_orm_1.sql) `${table.verdict} IN ('approved', 'rejected')`),
    chkRegistrationReviewsScore: (0, pg_core_1.check)('chk_registration_reviews_score', (0, drizzle_orm_1.sql) `${table.screeningScore} >= 0 AND ${table.screeningScore} <= 100`),
}));
exports.passwordResetTokens = (0, pg_core_1.pgTable)('password_reset_tokens', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    token: (0, pg_core_1.text)('token').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { mode: 'string' }).notNull(),
    usedAt: (0, pg_core_1.timestamp)('used_at', { mode: 'string' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxPasswordResetToken: (0, pg_core_1.uniqueIndex)('idx_password_reset_token').on(table.token),
    idxPasswordResetPharmacy: (0, pg_core_1.index)('idx_password_reset_pharmacy').on(table.pharmacyId),
    idxPasswordResetActiveTokens: (0, pg_core_1.index)('idx_password_reset_active_tokens')
        .on(table.pharmacyId, table.expiresAt)
        .where((0, drizzle_orm_1.sql) `${table.usedAt} IS NULL`),
}));
exports.pharmacyBusinessHours = (0, pg_core_1.pgTable)('pharmacy_business_hours', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    dayOfWeek: (0, pg_core_1.integer)('day_of_week').notNull(), // 0=日曜, 1=月曜, ..., 6=土曜
    openTime: (0, pg_core_1.text)('open_time'), // "09:00" format, null if closed
    closeTime: (0, pg_core_1.text)('close_time'), // "18:00" format, null if closed
    isClosed: (0, pg_core_1.boolean)('is_closed').default(false),
    is24Hours: (0, pg_core_1.boolean)('is_24_hours').default(false),
    version: (0, pg_core_1.integer)('version').notNull().default(1),
}, (table) => ({
    idxBusinessHoursPharmacy: (0, pg_core_1.index)('idx_business_hours_pharmacy').on(table.pharmacyId),
    idxBusinessHoursPharmacyDay: (0, pg_core_1.uniqueIndex)('idx_business_hours_pharmacy_day').on(table.pharmacyId, table.dayOfWeek),
    chkDayOfWeek: (0, pg_core_1.check)('chk_day_of_week', (0, drizzle_orm_1.sql) `${table.dayOfWeek} >= 0 AND ${table.dayOfWeek} <= 6`),
}));
exports.pharmacySpecialHours = (0, pg_core_1.pgTable)('pharmacy_special_hours', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    specialType: (0, exports.specialBusinessHoursTypeEnum)('special_type').notNull(),
    startDate: (0, pg_core_1.date)('start_date', { mode: 'string' }).notNull(),
    endDate: (0, pg_core_1.date)('end_date', { mode: 'string' }).notNull(),
    openTime: (0, pg_core_1.text)('open_time'),
    closeTime: (0, pg_core_1.text)('close_time'),
    isClosed: (0, pg_core_1.boolean)('is_closed').notNull().default(true),
    is24Hours: (0, pg_core_1.boolean)('is_24_hours').notNull().default(false),
    note: (0, pg_core_1.text)('note'),
    version: (0, pg_core_1.integer)('version').notNull().default(1),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxSpecialHoursPharmacyDate: (0, pg_core_1.index)('idx_special_hours_pharmacy_date')
        .on(table.pharmacyId, table.startDate, table.endDate),
    chkSpecialHoursDateRange: (0, pg_core_1.check)('chk_special_hours_date_range', (0, drizzle_orm_1.sql) `${table.startDate} <= ${table.endDate}`),
    chkSpecialHoursFlags: (0, pg_core_1.check)('chk_special_hours_flags', (0, drizzle_orm_1.sql) `NOT (${table.isClosed} = true AND ${table.is24Hours} = true)`),
}));
// ── 医薬品マスター ──────────────────────────────────────
exports.drugMaster = (0, pg_core_1.pgTable)('drug_master', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    yjCode: (0, pg_core_1.text)('yj_code').notNull().unique(),
    drugName: (0, pg_core_1.text)('drug_name').notNull(),
    genericName: (0, pg_core_1.text)('generic_name'),
    specification: (0, pg_core_1.text)('specification'),
    unit: (0, pg_core_1.text)('unit'),
    yakkaPrice: (0, pg_core_1.numeric)('yakka_price', { precision: 12, scale: 2 }).notNull(),
    manufacturer: (0, pg_core_1.text)('manufacturer'),
    category: (0, pg_core_1.text)('category'), // 内用薬/外用薬/注射薬/歯科用薬剤
    therapeuticCategory: (0, pg_core_1.text)('therapeutic_category'), // 薬効分類番号
    isListed: (0, pg_core_1.boolean)('is_listed').default(true),
    listedDate: (0, pg_core_1.text)('listed_date'),
    transitionDeadline: (0, pg_core_1.text)('transition_deadline'), // 経過措置期限
    deletedDate: (0, pg_core_1.text)('deleted_date'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxDrugMasterName: (0, pg_core_1.index)('idx_drug_master_name').on(table.drugName),
    idxDrugMasterGenericName: (0, pg_core_1.index)('idx_drug_master_generic_name').on(table.genericName),
    idxDrugMasterListedName: (0, pg_core_1.index)('idx_drug_master_listed_name').on(table.isListed, table.drugName),
    chkYakkaPriceNonNeg: (0, pg_core_1.check)('chk_drug_master_yakka_price', (0, drizzle_orm_1.sql) `${table.yakkaPrice} >= 0`),
}));
exports.drugMasterPackages = (0, pg_core_1.pgTable)('drug_master_packages', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    drugMasterId: (0, pg_core_1.integer)('drug_master_id').notNull().references(() => exports.drugMaster.id, { onDelete: 'cascade' }),
    gs1Code: (0, pg_core_1.text)('gs1_code'), // 14桁 販売包装単位コード
    janCode: (0, pg_core_1.text)('jan_code'), // 13桁
    hotCode: (0, pg_core_1.text)('hot_code'), // 9〜13桁
    packageDescription: (0, pg_core_1.text)('package_description'), // 例: 100錠(10錠×10)PTP
    packageQuantity: (0, pg_core_1.real)('package_quantity'),
    packageUnit: (0, pg_core_1.text)('package_unit'),
    normalizedPackageLabel: (0, pg_core_1.text)('normalized_package_label'),
    packageForm: (0, pg_core_1.text)('package_form'),
    isLoosePackage: (0, pg_core_1.boolean)('is_loose_package').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxDrugPackagesDrugMasterId: (0, pg_core_1.index)('idx_drug_packages_drug_master_id').on(table.drugMasterId),
    idxDrugPackagesGs1: (0, pg_core_1.index)('idx_drug_packages_gs1').on(table.gs1Code),
    idxDrugPackagesJan: (0, pg_core_1.index)('idx_drug_packages_jan').on(table.janCode),
    idxDrugPackagesHot: (0, pg_core_1.index)('idx_drug_packages_hot').on(table.hotCode),
    idxDrugPackagesNormalizedLabel: (0, pg_core_1.index)('idx_drug_packages_normalized_label').on(table.normalizedPackageLabel),
}));
exports.drugMasterPriceHistory = (0, pg_core_1.pgTable)('drug_master_price_history', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    yjCode: (0, pg_core_1.text)('yj_code').notNull(),
    previousPrice: (0, pg_core_1.numeric)('previous_price', { precision: 12, scale: 2 }),
    newPrice: (0, pg_core_1.numeric)('new_price', { precision: 12, scale: 2 }),
    revisionDate: (0, pg_core_1.text)('revision_date').notNull(),
    revisionType: (0, exports.drugMasterRevisionTypeEnum)('revision_type').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxPriceHistoryYjCode: (0, pg_core_1.index)('idx_price_history_yj_code').on(table.yjCode),
    idxPriceHistoryDate: (0, pg_core_1.index)('idx_price_history_date').on(table.revisionDate),
}));
exports.drugMasterSyncLogs = (0, pg_core_1.pgTable)('drug_master_sync_logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    syncType: (0, pg_core_1.text)('sync_type').notNull(), // manual / auto
    sourceDescription: (0, pg_core_1.text)('source_description'),
    status: (0, exports.drugMasterSyncStatusEnum)('status').notNull(),
    itemsProcessed: (0, pg_core_1.integer)('items_processed').default(0),
    itemsAdded: (0, pg_core_1.integer)('items_added').default(0),
    itemsUpdated: (0, pg_core_1.integer)('items_updated').default(0),
    itemsDeleted: (0, pg_core_1.integer)('items_deleted').default(0),
    errorMessage: (0, pg_core_1.text)('error_message'),
    startedAt: (0, pg_core_1.timestamp)('started_at', { mode: 'string' }).defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { mode: 'string' }),
    triggeredBy: (0, pg_core_1.integer)('triggered_by').references(() => exports.pharmacies.id, { onDelete: 'set null' }),
}, (table) => ({
    idxSyncLogsStartedAt: (0, pg_core_1.index)('idx_sync_logs_started_at').on(table.startedAt),
}));
// ── アクティビティログ ──────────────────────────────────
exports.activityLogs = (0, pg_core_1.pgTable)('activity_logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').references(() => exports.pharmacies.id, { onDelete: 'set null' }),
    action: (0, pg_core_1.text)('action').notNull(),
    detail: (0, pg_core_1.text)('detail'),
    resourceType: (0, pg_core_1.text)('resource_type'),
    resourceId: (0, pg_core_1.text)('resource_id'),
    metadataJson: (0, pg_core_1.text)('metadata_json'),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    errorCode: (0, pg_core_1.varchar)('error_code', { length: 64 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxActivityLogsCreatedAt: (0, pg_core_1.index)('idx_activity_logs_created_at')
        .on(table.createdAt),
    idxActivityLogsPharmacyCreated: (0, pg_core_1.index)('idx_activity_logs_pharmacy_created')
        .on(table.pharmacyId, table.createdAt),
    idxActivityLogsAction: (0, pg_core_1.index)('idx_activity_logs_action')
        .on(table.action, table.createdAt),
    idxActivityLogsResource: (0, pg_core_1.index)('idx_activity_logs_resource')
        .on(table.resourceType, table.resourceId, table.createdAt),
    idxActivityLogsFailurePatternScan: (0, pg_core_1.index)('idx_activity_logs_failure_pattern_scan')
        .on(table.action, table.createdAt)
        .where((0, drizzle_orm_1.sql) `${table.detail} LIKE '失敗|%'`),
}));
exports.systemEvents = (0, pg_core_1.pgTable)('system_events', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    source: (0, pg_core_1.text)('source').$type().notNull(),
    level: (0, pg_core_1.text)('level').$type().notNull().default('error'),
    eventType: (0, pg_core_1.text)('event_type').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    detailJson: (0, pg_core_1.text)('detail_json'),
    errorCode: (0, pg_core_1.varchar)('error_code', { length: 64 }),
    occurredAt: (0, pg_core_1.timestamp)('occurred_at', { mode: 'string' }).notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxSystemEventsOccurredAt: (0, pg_core_1.index)('idx_system_events_occurred_at')
        .on(table.occurredAt),
    idxSystemEventsSourceOccurredAt: (0, pg_core_1.index)('idx_system_events_source_occurred_at')
        .on(table.source, table.occurredAt),
    idxSystemEventsLevelOccurredAt: (0, pg_core_1.index)('idx_system_events_level_occurred_at')
        .on(table.level, table.occurredAt),
    idxSystemEventsTypeOccurredAt: (0, pg_core_1.index)('idx_system_events_type_occurred_at')
        .on(table.eventType, table.occurredAt),
    chkSystemEventsSource: (0, pg_core_1.check)('chk_system_events_source', (0, drizzle_orm_1.sql) `${table.source} IN ('runtime_error', 'unhandled_rejection', 'uncaught_exception', 'vercel_deploy')`),
    chkSystemEventsLevel: (0, pg_core_1.check)('chk_system_events_level', (0, drizzle_orm_1.sql) `${table.level} IN ('info', 'warning', 'error')`),
}));
// ── エラーコードレジストリ ──────────────────────────────────
exports.errorCodeCategoryValues = ['upload', 'auth', 'sync', 'system', 'openclaw'];
exports.errorCodeSeverityValues = ['critical', 'error', 'warning', 'info'];
exports.errorCodes = (0, pg_core_1.pgTable)('error_codes', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    code: (0, pg_core_1.varchar)('code', { length: 64 }).unique().notNull(),
    category: (0, pg_core_1.text)('category').$type().notNull(),
    severity: (0, pg_core_1.text)('severity').$type().notNull(),
    titleJa: (0, pg_core_1.varchar)('title_ja', { length: 128 }).notNull(),
    descriptionJa: (0, pg_core_1.text)('description_ja'),
    resolutionJa: (0, pg_core_1.text)('resolution_ja'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxErrorCodesCategory: (0, pg_core_1.index)('idx_error_codes_category').on(table.category),
    idxErrorCodesSeverity: (0, pg_core_1.index)('idx_error_codes_severity').on(table.severity),
    chkErrorCodesCategory: (0, pg_core_1.check)('chk_error_codes_category', (0, drizzle_orm_1.sql) `${table.category} IN ('upload', 'auth', 'sync', 'system', 'openclaw')`),
    chkErrorCodesSeverity: (0, pg_core_1.check)('chk_error_codes_severity', (0, drizzle_orm_1.sql) `${table.severity} IN ('critical', 'error', 'warning', 'info')`),
}));
// ── OpenClawコマンド管理 ──────────────────────────────────
exports.openclawCommands = (0, pg_core_1.pgTable)('openclaw_commands', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    commandName: (0, pg_core_1.varchar)('command_name', { length: 64 }).notNull(),
    parameters: (0, pg_core_1.text)('parameters'),
    status: (0, pg_core_1.varchar)('status', { length: 16 }).notNull(),
    result: (0, pg_core_1.text)('result'),
    errorMessage: (0, pg_core_1.text)('error_message'),
    openclawThreadId: (0, pg_core_1.varchar)('openclaw_thread_id', { length: 255 }),
    signature: (0, pg_core_1.varchar)('signature', { length: 255 }).notNull(),
    receivedAt: (0, pg_core_1.timestamp)('received_at', { mode: 'string' }).defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { mode: 'string' }),
}, (table) => ({
    idxOpenclawCommandsReceivedAt: (0, pg_core_1.index)('idx_openclaw_commands_received_at').on(table.receivedAt),
    idxOpenclawCommandsStatus: (0, pg_core_1.index)('idx_openclaw_commands_status').on(table.status),
    idxOpenclawCommandsName: (0, pg_core_1.index)('idx_openclaw_commands_name').on(table.commandName),
}));
exports.openclawCommandWhitelist = (0, pg_core_1.pgTable)('openclaw_command_whitelist', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    commandName: (0, pg_core_1.varchar)('command_name', { length: 64 }).unique().notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 16 }).notNull(),
    descriptionJa: (0, pg_core_1.varchar)('description_ja', { length: 255 }),
    isEnabled: (0, pg_core_1.boolean)('is_enabled').default(true).notNull(),
    parametersSchema: (0, pg_core_1.text)('parameters_schema'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
});
// ── 薬局リレーション（お気に入り / ブロック）────────────────
exports.pharmacyRelationships = (0, pg_core_1.pgTable)('pharmacy_relationships', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    targetPharmacyId: (0, pg_core_1.integer)('target_pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    relationshipType: (0, exports.pharmacyRelationshipTypeEnum)('relationship_type').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxRelationshipsPharmacy: (0, pg_core_1.index)('idx_relationships_pharmacy')
        .on(table.pharmacyId, table.relationshipType),
    idxRelationshipsUnique: (0, pg_core_1.uniqueIndex)('idx_relationships_unique')
        .on(table.pharmacyId, table.targetPharmacyId),
    chkNotSelfRelationship: (0, pg_core_1.check)('chk_not_self_relationship', (0, drizzle_orm_1.sql) `${table.pharmacyId} != ${table.targetPharmacyId}`),
}));
// ── マッチング予約・通知 ─────────────────────────────────
exports.deadStockReservations = (0, pg_core_1.pgTable)('dead_stock_reservations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    deadStockItemId: (0, pg_core_1.integer)('dead_stock_item_id').notNull().references(() => exports.deadStockItems.id, { onDelete: 'cascade' }),
    proposalId: (0, pg_core_1.integer)('proposal_id').notNull().references(() => exports.exchangeProposals.id, { onDelete: 'cascade' }),
    reservedQuantity: (0, pg_core_1.real)('reserved_quantity').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxDeadStockReservationsItem: (0, pg_core_1.index)('idx_dead_stock_reservations_item')
        .on(table.deadStockItemId),
    idxDeadStockReservationsProposal: (0, pg_core_1.index)('idx_dead_stock_reservations_proposal')
        .on(table.proposalId),
    idxDeadStockReservationsUnique: (0, pg_core_1.uniqueIndex)('idx_dead_stock_reservations_unique')
        .on(table.proposalId, table.deadStockItemId),
    chkDeadStockReservationQtyPositive: (0, pg_core_1.check)('chk_dead_stock_reservation_qty', (0, drizzle_orm_1.sql) `${table.reservedQuantity} > 0`),
}));
exports.matchCandidateSnapshots = (0, pg_core_1.pgTable)('match_candidate_snapshots', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    candidateHash: (0, pg_core_1.text)('candidate_hash').notNull(),
    candidateCount: (0, pg_core_1.integer)('candidate_count').notNull().default(0),
    topCandidatesJson: (0, pg_core_1.text)('top_candidates_json').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxMatchSnapshotsPharmacyUnique: (0, pg_core_1.uniqueIndex)('idx_match_snapshots_pharmacy_unique')
        .on(table.pharmacyId),
}));
exports.matchNotifications = (0, pg_core_1.pgTable)('match_notifications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    triggerPharmacyId: (0, pg_core_1.integer)('trigger_pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    triggerUploadType: (0, exports.uploadTypeEnum)('trigger_upload_type').notNull(),
    candidateCountBefore: (0, pg_core_1.integer)('candidate_count_before').notNull().default(0),
    candidateCountAfter: (0, pg_core_1.integer)('candidate_count_after').notNull().default(0),
    diffJson: (0, pg_core_1.text)('diff_json').notNull(),
    dedupeKey: (0, pg_core_1.text)('dedupe_key').notNull(),
    isRead: (0, pg_core_1.boolean)('is_read').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxMatchNotificationsPharmacyCreated: (0, pg_core_1.index)('idx_match_notifications_pharmacy_created')
        .on(table.pharmacyId, table.createdAt),
    idxMatchNotificationsUnread: (0, pg_core_1.index)('idx_match_notifications_unread')
        .on(table.pharmacyId, table.isRead, table.createdAt),
    idxMatchNotificationsDedupe: (0, pg_core_1.uniqueIndex)('idx_match_notifications_dedupe')
        .on(table.pharmacyId, table.dedupeKey),
}));
exports.matchingRefreshJobs = (0, pg_core_1.pgTable)('matching_refresh_jobs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    triggerPharmacyId: (0, pg_core_1.integer)('trigger_pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    uploadType: (0, exports.uploadTypeEnum)('upload_type').notNull(),
    attempts: (0, pg_core_1.integer)('attempts').notNull().default(0),
    lastError: (0, pg_core_1.text)('last_error'),
    processingStartedAt: (0, pg_core_1.timestamp)('processing_started_at', { mode: 'string' }),
    nextRetryAt: (0, pg_core_1.timestamp)('next_retry_at', { mode: 'string' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxMatchingRefreshJobsCreated: (0, pg_core_1.index)('idx_matching_refresh_jobs_created')
        .on(table.createdAt),
    idxMatchingRefreshJobsTrigger: (0, pg_core_1.index)('idx_matching_refresh_jobs_trigger')
        .on(table.triggerPharmacyId, table.createdAt),
    idxMatchingRefreshJobsReady: (0, pg_core_1.index)('idx_matching_refresh_jobs_ready')
        .on(table.attempts, table.nextRetryAt, table.processingStartedAt, table.createdAt),
}));
exports.uploadConfirmJobs = (0, pg_core_1.pgTable)('upload_confirm_jobs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    uploadType: (0, exports.uploadTypeEnum)('upload_type').notNull(),
    originalFilename: (0, pg_core_1.text)('original_filename').notNull(),
    idempotencyKey: (0, pg_core_1.text)('idempotency_key'),
    fileHash: (0, pg_core_1.text)('file_hash').notNull(),
    headerRowIndex: (0, pg_core_1.integer)('header_row_index').notNull(),
    mappingJson: (0, pg_core_1.text)('mapping_json').notNull(),
    applyMode: (0, pg_core_1.text)('apply_mode').notNull().default('replace'),
    deleteMissing: (0, pg_core_1.boolean)('delete_missing').notNull().default(false),
    deduplicated: (0, pg_core_1.boolean)('deduplicated').notNull().default(false),
    fileBase64: (0, pg_core_1.text)('file_base64').notNull(),
    status: (0, exports.uploadJobStatusEnum)('status').notNull().default('pending'),
    attempts: (0, pg_core_1.integer)('attempts').notNull().default(0),
    lastError: (0, pg_core_1.text)('last_error'),
    resultJson: (0, pg_core_1.text)('result_json'),
    cancelRequestedAt: (0, pg_core_1.timestamp)('cancel_requested_at', { mode: 'string' }),
    canceledAt: (0, pg_core_1.timestamp)('canceled_at', { mode: 'string' }),
    canceledBy: (0, pg_core_1.integer)('canceled_by').references(() => exports.pharmacies.id, { onDelete: 'set null' }),
    processingStartedAt: (0, pg_core_1.timestamp)('processing_started_at', { mode: 'string' }),
    nextRetryAt: (0, pg_core_1.timestamp)('next_retry_at', { mode: 'string' }),
    completedAt: (0, pg_core_1.timestamp)('completed_at', { mode: 'string' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxUploadConfirmJobsPharmacyCreated: (0, pg_core_1.index)('idx_upload_confirm_jobs_pharmacy_created')
        .on(table.pharmacyId, table.createdAt),
    idxUploadConfirmJobsPharmacyIdempotency: (0, pg_core_1.index)('idx_upload_confirm_jobs_pharmacy_idempotency')
        .on(table.pharmacyId, table.idempotencyKey),
    idxUploadConfirmJobsIdempotencyActive: (0, pg_core_1.uniqueIndex)('idx_upload_confirm_jobs_idempotency_active')
        .on(table.pharmacyId, table.idempotencyKey)
        .where((0, drizzle_orm_1.sql) `${table.idempotencyKey} IS NOT NULL AND ${table.status} IN ('pending', 'processing')`),
    idxUploadConfirmJobsPharmacyFileHashCreated: (0, pg_core_1.index)('idx_upload_confirm_jobs_pharmacy_file_hash_created')
        .on(table.pharmacyId, table.fileHash, table.createdAt),
    idxUploadConfirmJobsReady: (0, pg_core_1.index)('idx_upload_confirm_jobs_ready')
        .on(table.status, table.attempts, table.nextRetryAt, table.processingStartedAt, table.createdAt),
    chkUploadConfirmJobsApplyMode: (0, pg_core_1.check)('chk_upload_confirm_jobs_apply_mode', (0, drizzle_orm_1.sql) `${table.applyMode} IN ('replace', 'diff', 'partial')`),
    chkUploadConfirmJobsAttemptsNonNegative: (0, pg_core_1.check)('chk_upload_confirm_jobs_attempts_non_negative', (0, drizzle_orm_1.sql) `${table.attempts} >= 0`),
}));
exports.uploadRowIssues = (0, pg_core_1.pgTable)('upload_row_issues', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    jobId: (0, pg_core_1.integer)('job_id').notNull().references(() => exports.uploadConfirmJobs.id, { onDelete: 'cascade' }),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    uploadType: (0, exports.uploadTypeEnum)('upload_type').notNull(),
    rowNumber: (0, pg_core_1.integer)('row_number').notNull(),
    issueCode: (0, pg_core_1.text)('issue_code').notNull(),
    issueMessage: (0, pg_core_1.text)('issue_message').notNull(),
    rowDataJson: (0, pg_core_1.text)('row_data_json'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxUploadRowIssuesJobRow: (0, pg_core_1.index)('idx_upload_row_issues_job_row')
        .on(table.jobId, table.rowNumber, table.id),
    idxUploadRowIssuesPharmacyCreated: (0, pg_core_1.index)('idx_upload_row_issues_pharmacy_created')
        .on(table.pharmacyId, table.createdAt),
    chkUploadRowIssuesRowNumber: (0, pg_core_1.check)('chk_upload_row_issues_row_number', (0, drizzle_orm_1.sql) `${table.rowNumber} > 0`),
}));
exports.matchingRuleProfiles = (0, pg_core_1.pgTable)('matching_rule_profiles', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    profileName: (0, pg_core_1.text)('profile_name').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    nameMatchThreshold: (0, pg_core_1.real)('name_match_threshold').notNull().default(0.7),
    valueScoreMax: (0, pg_core_1.real)('value_score_max').notNull().default(55),
    valueScoreDivisor: (0, pg_core_1.real)('value_score_divisor').notNull().default(2500),
    balanceScoreMax: (0, pg_core_1.real)('balance_score_max').notNull().default(20),
    balanceScoreDiffFactor: (0, pg_core_1.real)('balance_score_diff_factor').notNull().default(1.5),
    distanceScoreMax: (0, pg_core_1.real)('distance_score_max').notNull().default(15),
    distanceScoreDivisor: (0, pg_core_1.real)('distance_score_divisor').notNull().default(8),
    distanceScoreFallback: (0, pg_core_1.real)('distance_score_fallback').notNull().default(2),
    nearExpiryScoreMax: (0, pg_core_1.real)('near_expiry_score_max').notNull().default(10),
    nearExpiryItemFactor: (0, pg_core_1.real)('near_expiry_item_factor').notNull().default(1.5),
    nearExpiryDays: (0, pg_core_1.integer)('near_expiry_days').notNull().default(120),
    diversityScoreMax: (0, pg_core_1.real)('diversity_score_max').notNull().default(10),
    diversityItemFactor: (0, pg_core_1.real)('diversity_item_factor').notNull().default(1.5),
    favoriteBonus: (0, pg_core_1.real)('favorite_bonus').notNull().default(15),
    version: (0, pg_core_1.integer)('version').notNull().default(1),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxMatchingRuleProfilesNameUnique: (0, pg_core_1.uniqueIndex)('idx_matching_rule_profiles_name_unique')
        .on(table.profileName),
    idxMatchingRuleProfilesActiveUnique: (0, pg_core_1.uniqueIndex)('idx_matching_rule_profiles_active_unique')
        .on(table.isActive)
        .where((0, drizzle_orm_1.sql) `${table.isActive} = true`),
    idxMatchingRuleProfilesUpdatedAt: (0, pg_core_1.index)('idx_matching_rule_profiles_updated_at')
        .on(table.updatedAt),
    chkMatchingRuleNameThreshold: (0, pg_core_1.check)('chk_matching_rule_name_threshold', (0, drizzle_orm_1.sql) `${table.nameMatchThreshold} >= 0 AND ${table.nameMatchThreshold} <= 1`),
    chkMatchingRuleValueScoreMax: (0, pg_core_1.check)('chk_matching_rule_value_score_max', (0, drizzle_orm_1.sql) `${table.valueScoreMax} >= 0`),
    chkMatchingRuleValueScoreDivisor: (0, pg_core_1.check)('chk_matching_rule_value_score_divisor', (0, drizzle_orm_1.sql) `${table.valueScoreDivisor} > 0`),
    chkMatchingRuleBalanceScoreMax: (0, pg_core_1.check)('chk_matching_rule_balance_score_max', (0, drizzle_orm_1.sql) `${table.balanceScoreMax} >= 0`),
    chkMatchingRuleBalanceScoreDiffFactor: (0, pg_core_1.check)('chk_matching_rule_balance_diff_factor', (0, drizzle_orm_1.sql) `${table.balanceScoreDiffFactor} >= 0`),
    chkMatchingRuleDistanceScoreMax: (0, pg_core_1.check)('chk_matching_rule_distance_score_max', (0, drizzle_orm_1.sql) `${table.distanceScoreMax} >= 0`),
    chkMatchingRuleDistanceScoreDivisor: (0, pg_core_1.check)('chk_matching_rule_distance_score_divisor', (0, drizzle_orm_1.sql) `${table.distanceScoreDivisor} > 0`),
    chkMatchingRuleDistanceScoreFallback: (0, pg_core_1.check)('chk_matching_rule_distance_fallback', (0, drizzle_orm_1.sql) `${table.distanceScoreFallback} >= 0`),
    chkMatchingRuleNearExpiryScoreMax: (0, pg_core_1.check)('chk_matching_rule_near_expiry_score_max', (0, drizzle_orm_1.sql) `${table.nearExpiryScoreMax} >= 0`),
    chkMatchingRuleNearExpiryItemFactor: (0, pg_core_1.check)('chk_matching_rule_near_expiry_item_factor', (0, drizzle_orm_1.sql) `${table.nearExpiryItemFactor} >= 0`),
    chkMatchingRuleNearExpiryDays: (0, pg_core_1.check)('chk_matching_rule_near_expiry_days', (0, drizzle_orm_1.sql) `${table.nearExpiryDays} >= 1 AND ${table.nearExpiryDays} <= 365`),
    chkMatchingRuleDiversityScoreMax: (0, pg_core_1.check)('chk_matching_rule_diversity_score_max', (0, drizzle_orm_1.sql) `${table.diversityScoreMax} >= 0`),
    chkMatchingRuleDiversityItemFactor: (0, pg_core_1.check)('chk_matching_rule_diversity_item_factor', (0, drizzle_orm_1.sql) `${table.diversityItemFactor} >= 0`),
    chkMatchingRuleFavoriteBonus: (0, pg_core_1.check)('chk_matching_rule_favorite_bonus', (0, drizzle_orm_1.sql) `${table.favoriteBonus} >= 0`),
    chkMatchingRuleVersion: (0, pg_core_1.check)('chk_matching_rule_version', (0, drizzle_orm_1.sql) `${table.version} >= 1`),
}));
// ── 通知 ──────────────────────────────────────────────────
exports.notificationTypeValues = ['proposal_received', 'proposal_status_changed', 'new_comment', 'request_update'];
exports.notificationReferenceTypeValues = ['proposal', 'match', 'comment', 'request'];
exports.predictiveAlertTypeValues = ['near_expiry', 'excess_stock'];
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.text)('type').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    referenceType: (0, pg_core_1.text)('reference_type'),
    referenceId: (0, pg_core_1.integer)('reference_id'),
    isRead: (0, pg_core_1.boolean)('is_read').notNull().default(false),
    readAt: (0, pg_core_1.timestamp)('read_at', { mode: 'string' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxNotificationsPharmacyUnread: (0, pg_core_1.index)('idx_notifications_pharmacy_unread')
        .on(table.pharmacyId, table.isRead, table.createdAt),
}));
exports.predictiveAlerts = (0, pg_core_1.pgTable)('predictive_alerts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    pharmacyId: (0, pg_core_1.integer)('pharmacy_id').notNull().references(() => exports.pharmacies.id, { onDelete: 'cascade' }),
    alertType: (0, pg_core_1.text)('alert_type').$type().notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    detailJson: (0, pg_core_1.text)('detail_json').notNull(),
    dedupeKey: (0, pg_core_1.text)('dedupe_key').notNull(),
    notificationId: (0, pg_core_1.integer)('notification_id').references(() => exports.notifications.id, { onDelete: 'set null' }),
    detectedAt: (0, pg_core_1.timestamp)('detected_at', { mode: 'string' }).notNull().defaultNow(),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at', { mode: 'string' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { mode: 'string' }).defaultNow(),
}, (table) => ({
    idxPredictiveAlertsPharmacyCreated: (0, pg_core_1.index)('idx_predictive_alerts_pharmacy_created')
        .on(table.pharmacyId, table.createdAt),
    idxPredictiveAlertsUnresolved: (0, pg_core_1.index)('idx_predictive_alerts_unresolved')
        .on(table.pharmacyId, table.resolvedAt, table.createdAt),
    idxPredictiveAlertsTypeDetected: (0, pg_core_1.index)('idx_predictive_alerts_type_detected')
        .on(table.alertType, table.detectedAt),
    idxPredictiveAlertsDedupeUnique: (0, pg_core_1.uniqueIndex)('idx_predictive_alerts_dedupe_unique')
        .on(table.pharmacyId, table.dedupeKey),
    chkPredictiveAlertsType: (0, pg_core_1.check)('chk_predictive_alerts_type', (0, drizzle_orm_1.sql) `${table.alertType} IN ('near_expiry', 'excess_stock')`),
}));
// ── 医薬品マスターソース状態 ──────────────────────────────
exports.drugMasterSourceState = (0, pg_core_1.pgTable)('drug_master_source_state', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    sourceKey: (0, pg_core_1.text)('source_key').notNull().unique(),
    url: (0, pg_core_1.text)('url').notNull(),
    etag: (0, pg_core_1.text)('etag'),
    lastModified: (0, pg_core_1.text)('last_modified'),
    contentHash: (0, pg_core_1.text)('content_hash'),
    lastCheckedAt: (0, pg_core_1.timestamp)('last_checked_at', { mode: 'string' }),
    lastChangedAt: (0, pg_core_1.timestamp)('last_changed_at', { mode: 'string' }),
    metadataJson: (0, pg_core_1.text)('metadata_json'),
}, (table) => ({
    idxSourceStateSourceKey: (0, pg_core_1.uniqueIndex)('idx_source_state_source_key').on(table.sourceKey),
}));
//# sourceMappingURL=schema.js.map
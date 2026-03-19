import { type DbClient, type RawTimelineEvent } from '../types/timeline';
export declare function mapNotificationToEvent(row: {
    id: number;
    type: string;
    title: string;
    message: string;
    referenceType: string | null;
    referenceId: number | null;
    isRead: boolean;
    createdAt: string | null;
}): RawTimelineEvent;
export declare function mapMatchNotificationToEvent(row: {
    id: number;
    candidateCountBefore: number;
    candidateCountAfter: number;
    isRead: boolean;
    createdAt: string | null;
}): RawTimelineEvent;
export declare function mapProposalToEvent(row: {
    id: number;
    pharmacyAId: number;
    pharmacyBId: number;
    status: string;
    proposedAt: string | null;
    completedAt: string | null;
}, pharmacyId: number): RawTimelineEvent;
export declare function mapCommentToEvent(row: {
    id: number;
    proposalId: number;
    body: string;
    readByRecipient: boolean;
    createdAt: string | null;
}): RawTimelineEvent;
export declare function mapFeedbackToEvent(row: {
    id: number;
    proposalId: number;
    rating: number;
    comment: string | null;
    createdAt: string | null;
}): RawTimelineEvent;
export declare function mapUploadToEvent(row: {
    id: number;
    uploadType: string;
    originalFilename: string;
    createdAt: string | null;
}): RawTimelineEvent;
export declare function mapAdminMessageToEvent(row: {
    id: number;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string | null;
}): RawTimelineEvent;
export declare function mapExchangeHistoryToEvent(row: {
    id: number;
    proposalId: number;
    pharmacyAId: number;
    pharmacyBId: number;
    totalValue: string | null;
    completedAt: string | null;
}, pharmacyId: number): RawTimelineEvent;
export declare function mapExpiryRiskToEvent(row: {
    id: number;
    drugName: string;
    expirationDateIso: string | null;
    quantity: number;
    createdAt: string | null;
}): RawTimelineEvent;
/** 期限リスク判定用の日付範囲（今日〜3日後）を返す */
export declare function getExpiryDateRange(): {
    todayStr: string;
    threeDaysLaterStr: string;
};
export declare function fetchNotificationEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchMatchEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchProposalEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchCommentEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchFeedbackEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchUploadEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchAdminMessageEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchExchangeHistoryEvents(db: DbClient, pharmacyId: number, since?: string, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
export declare function fetchExpiryRiskEvents(db: DbClient, pharmacyId: number, limit?: number, before?: string): Promise<RawTimelineEvent[]>;
//# sourceMappingURL=timeline-aggregators.d.ts.map
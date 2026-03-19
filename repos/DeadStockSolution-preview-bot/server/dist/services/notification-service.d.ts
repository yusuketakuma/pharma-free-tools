import { notifications, type NotificationReferenceType, type NotificationType } from '../db/schema';
interface CreateNotificationInput {
    pharmacyId: number;
    type: NotificationType;
    title: string;
    message: string;
    referenceType?: NotificationReferenceType;
    referenceId?: number;
}
export declare function invalidateDashboardUnreadCache(pharmacyId: number): void;
export declare function createNotification(input: CreateNotificationInput): Promise<{
    id: number;
} | null>;
export declare function getUnreadCount(pharmacyId: number): Promise<number>;
export declare function getDashboardUnreadCount(pharmacyId: number): Promise<number>;
export declare function getNotifications(pharmacyId: number, page?: number, limit?: number): Promise<{
    rows: typeof notifications.$inferSelect[];
    total: number;
}>;
export declare function markAsRead(notificationId: number, pharmacyId: number): Promise<boolean>;
export declare function markAllAsRead(pharmacyId: number): Promise<number>;
export declare function markAllDashboardAsRead(pharmacyId: number): Promise<number>;
export {};
//# sourceMappingURL=notification-service.d.ts.map
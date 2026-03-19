export interface ProposalPriorityInput {
    id: number;
    pharmacyAId: number;
    pharmacyBId: number;
    status: string;
    proposedAt: string | null;
}
export interface ProposalPriority {
    priorityScore: number;
    priorityReasons: string[];
    deadlineAt: string | null;
}
export declare function getProposalPriority(input: ProposalPriorityInput, viewerPharmacyId: number): ProposalPriority;
export declare function sortByPriority<T extends ProposalPriorityInput & ProposalPriority>(rows: T[]): T[];
//# sourceMappingURL=proposal-priority-service.d.ts.map
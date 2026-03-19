declare const PROPOSAL_TIMELINE_ACTIONS: readonly ["proposal_accept", "proposal_reject", "proposal_complete", "proposal_create"];
type ProposalTimelineAction = (typeof PROPOSAL_TIMELINE_ACTIONS)[number];
export interface ProposalTimelineActionRow {
    action: ProposalTimelineAction | string;
    detail: string | null;
    createdAt: string | null;
    actorPharmacyId: number | null;
    actorName: string | null;
}
export interface ProposalTimelineEvent {
    action: string;
    label: string;
    at: string | null;
    actorPharmacyId: number | null;
    actorName: string;
    statusFrom?: string | null;
    statusTo?: string | null;
}
interface BuildProposalTimelineParams {
    proposedAt: string | null;
    proposalCreatorPharmacyId: number | null;
    proposalCreatorName?: string | null;
    actionRows: ProposalTimelineActionRow[];
    includeStatusTransitions?: boolean;
}
export declare function fetchProposalTimelineActionRows(proposalId: number): Promise<ProposalTimelineActionRow[]>;
export declare function buildProposalTimeline({ proposedAt, proposalCreatorPharmacyId, proposalCreatorName, actionRows, includeStatusTransitions, }: BuildProposalTimelineParams): ProposalTimelineEvent[];
export {};
//# sourceMappingURL=proposal-timeline-service.d.ts.map
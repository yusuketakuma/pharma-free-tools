export declare function createProposal(pharmacyAId: number, rawCandidate: unknown): Promise<number>;
export declare function acceptProposal(proposalId: number, pharmacyId: number): Promise<string>;
export declare function rejectProposal(proposalId: number, pharmacyId: number): Promise<void>;
export declare function completeProposal(proposalId: number, pharmacyId: number): Promise<void>;
//# sourceMappingURL=exchange-service.d.ts.map
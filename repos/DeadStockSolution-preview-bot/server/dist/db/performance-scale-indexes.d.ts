import { db } from '../config/database';
interface SqlExecutor {
    execute: typeof db.execute;
}
interface PerformanceScaleIndexDefinition {
    name: string;
    statement: string;
}
export declare function applyPerformanceScaleIndexes(executor?: SqlExecutor): Promise<number>;
export declare const __testables: {
    PERFORMANCE_SCALE_INDEX_DEFINITIONS: readonly PerformanceScaleIndexDefinition[];
};
export {};
//# sourceMappingURL=performance-scale-indexes.d.ts.map
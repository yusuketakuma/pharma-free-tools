"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rowCount = void 0;
const drizzle_orm_1 = require("drizzle-orm");
exports.rowCount = (0, drizzle_orm_1.sql) `count(*)::int`;
//# sourceMappingURL=db-utils.js.map
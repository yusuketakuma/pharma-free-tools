"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.postalCodeToCoordinates = postalCodeToCoordinates;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../services/logger");
let postalData = null;
function loadPostalData() {
    if (postalData)
        return postalData;
    const filePath = path.join(__dirname, '../../data/postal-geocode.json');
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        postalData = JSON.parse(raw);
        return postalData;
    }
    catch {
        logger_1.logger.warn('postal-geocode.json not found, geocoding will be unavailable');
        postalData = {};
        return postalData;
    }
}
function postalCodeToCoordinates(postalCode) {
    const normalized = postalCode.replace(/[-ー－\s]/g, '');
    const data = loadPostalData();
    if (data[normalized]) {
        return data[normalized];
    }
    // Try first 5 digits as a fallback (area-level)
    const prefix5 = normalized.substring(0, 5);
    for (const key of Object.keys(data)) {
        if (key.startsWith(prefix5)) {
            return data[key];
        }
    }
    return null;
}
//# sourceMappingURL=postal-code.js.map
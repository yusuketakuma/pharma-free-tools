"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeAddress = geocodeAddress;
const logger_1 = require("./logger");
const GEOCODE_TIMEOUT_MS = 5000;
/**
 * 住所文字列から緯度・経度を取得する（国土地理院 API）
 * https://msearch.gsi.go.jp/address-search/AddressSearch?q=<住所>
 */
async function geocodeAddress(address) {
    const query = address.trim();
    if (!query)
        return null;
    const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) {
            logger_1.logger.warn('Geocoding API returned non-OK status', { status: response.status, address: query });
            return null;
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            logger_1.logger.info('Geocoding returned no results', { address: query });
            return null;
        }
        // coordinates are [lng, lat] in GeoJSON format
        const [lng, lat] = data[0].geometry.coordinates;
        if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
            logger_1.logger.warn('Geocoding returned invalid coordinates', { address: query, lat, lng });
            return null;
        }
        return { lat, lng };
    }
    catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            logger_1.logger.warn('Geocoding request timed out', { address: query });
        }
        else {
            logger_1.logger.error('Geocoding request failed', {
                address: query,
                error: err instanceof Error ? err.message : String(err),
            });
        }
        return null;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
//# sourceMappingURL=geocode-service.js.map
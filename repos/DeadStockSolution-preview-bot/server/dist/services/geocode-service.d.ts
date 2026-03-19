interface GeocodeResult {
    lat: number;
    lng: number;
}
/**
 * 住所文字列から緯度・経度を取得する（国土地理院 API）
 * https://msearch.gsi.go.jp/address-search/AddressSearch?q=<住所>
 */
export declare function geocodeAddress(address: string): Promise<GeocodeResult | null>;
export {};
//# sourceMappingURL=geocode-service.d.ts.map
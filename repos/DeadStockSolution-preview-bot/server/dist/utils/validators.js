"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registrationSchema = exports.passwordSchema = exports.emailSchema = void 0;
exports.validateRegistration = validateRegistration;
exports.validateLogin = validateLogin;
const zod_1 = require("zod");
const prefectures_1 = require("./prefectures");
const trimmedText = zod_1.z.string().trim();
// Email: proper format with @ and domain
const emailSchema = trimmedText
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください')
    .max(254, 'メールアドレスが長すぎます');
exports.emailSchema = emailSchema;
// Password: 8+ chars, at least one letter and one digit
const passwordSchema = zod_1.z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以下で入力してください')
    .regex(/[a-zA-Z]/, 'パスワードにはアルファベットを含めてください')
    .regex(/\d/, 'パスワードには数字を含めてください');
exports.passwordSchema = passwordSchema;
// Phone / FAX: Japanese phone number patterns
const phoneSchema = trimmedText
    .min(1, '電話番号を入力してください')
    .regex(/^[\d\-ー－() ]{8,20}$/, '有効な電話番号を入力してください');
const faxSchema = trimmedText
    .min(1, 'FAX番号を入力してください')
    .regex(/^[\d\-ー－() ]{8,20}$/, '有効なFAX番号を入力してください');
// Postal code: 7 digits (allow hyphens)
const postalCodeSchema = trimmedText
    .min(1, '郵便番号を入力してください')
    .refine((val) => {
    const normalized = val.replace(/[-ー－\s]/g, '');
    return /^\d{7}$/.test(normalized);
}, '郵便番号は7桁の数字で入力してください');
const registrationSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordSchema,
    name: trimmedText.min(1, '薬局名を入力してください').max(100, '薬局名は100文字以下で入力してください'),
    postalCode: postalCodeSchema,
    address: trimmedText.min(1, '住所を入力してください').max(255, '住所は255文字以下で入力してください'),
    phone: phoneSchema,
    fax: faxSchema,
    licenseNumber: trimmedText.min(1, '薬局開設許可番号を入力してください').max(50, '薬局開設許可番号が長すぎます'),
    permitLicenseNumber: trimmedText.min(1, '許可証記載の許可番号を入力してください').max(50, '許可証記載の許可番号が長すぎます'),
    permitPharmacyName: trimmedText.min(1, '許可証記載の薬局名を入力してください').max(100, '許可証記載の薬局名が長すぎます'),
    permitAddress: trimmedText.min(1, '許可証記載の所在地を入力してください').max(255, '許可証記載の所在地が長すぎます'),
    prefecture: trimmedText.min(1, '都道府県を選択してください').refine((val) => (0, prefectures_1.isValidPrefecture)(val), '有効な都道府県を選択してください'),
});
exports.registrationSchema = registrationSchema;
const loginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, 'パスワードを入力してください'),
});
exports.loginSchema = loginSchema;
function zodToValidationErrors(result) {
    if (result.success || !result.error)
        return [];
    return result.error.issues.map((issue) => ({
        field: issue.path[0]?.toString() || 'unknown',
        message: issue.message,
    }));
}
function validateRegistration(body) {
    return zodToValidationErrors(registrationSchema.safeParse(body));
}
function validateLogin(body) {
    return zodToValidationErrors(loginSchema.safeParse(body));
}
//# sourceMappingURL=validators.js.map
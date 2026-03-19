import { z } from 'zod';
export interface ValidationError {
    field: string;
    message: string;
}
declare const emailSchema: z.ZodString;
declare const passwordSchema: z.ZodString;
declare const registrationSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    postalCode: z.ZodString;
    address: z.ZodString;
    phone: z.ZodString;
    fax: z.ZodString;
    licenseNumber: z.ZodString;
    permitLicenseNumber: z.ZodString;
    permitPharmacyName: z.ZodString;
    permitAddress: z.ZodString;
    prefecture: z.ZodString & z.ZodType<"北海道" | "青森県" | "岩手県" | "宮城県" | "秋田県" | "山形県" | "福島県" | "茨城県" | "栃木県" | "群馬県" | "埼玉県" | "千葉県" | "東京都" | "神奈川県" | "新潟県" | "富山県" | "石川県" | "福井県" | "山梨県" | "長野県" | "岐阜県" | "静岡県" | "愛知県" | "三重県" | "滋賀県" | "京都府" | "大阪府" | "兵庫県" | "奈良県" | "和歌山県" | "鳥取県" | "島根県" | "岡山県" | "広島県" | "山口県" | "徳島県" | "香川県" | "愛媛県" | "高知県" | "福岡県" | "佐賀県" | "長崎県" | "熊本県" | "大分県" | "宮崎県" | "鹿児島県" | "沖縄県", string, z.core.$ZodTypeInternals<"北海道" | "青森県" | "岩手県" | "宮城県" | "秋田県" | "山形県" | "福島県" | "茨城県" | "栃木県" | "群馬県" | "埼玉県" | "千葉県" | "東京都" | "神奈川県" | "新潟県" | "富山県" | "石川県" | "福井県" | "山梨県" | "長野県" | "岐阜県" | "静岡県" | "愛知県" | "三重県" | "滋賀県" | "京都府" | "大阪府" | "兵庫県" | "奈良県" | "和歌山県" | "鳥取県" | "島根県" | "岡山県" | "広島県" | "山口県" | "徳島県" | "香川県" | "愛媛県" | "高知県" | "福岡県" | "佐賀県" | "長崎県" | "熊本県" | "大分県" | "宮崎県" | "鹿児島県" | "沖縄県", string>>;
}, z.core.$strip>;
declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare function validateRegistration(body: Record<string, unknown>): ValidationError[];
export declare function validateLogin(body: Record<string, unknown>): ValidationError[];
export { emailSchema, passwordSchema, registrationSchema, loginSchema };
//# sourceMappingURL=validators.d.ts.map
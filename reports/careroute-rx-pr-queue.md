# careroute-rx Open PR 優先順位（CI復旧後マージキュー）

## 🔴 CRITICAL — 即時マージ推奨
| PR | 内容 | 変更規模 |
|----|------|----------|
| #1202 | SW queue ID予測可能性修正（Math.random→crypto） | +10/-9 |
| #1224 | Math.random() fallback ID生成の脆弱性修正 | +7/0 |

## 🟠 HIGH — セキュリティ修正
| PR | 内容 | 備考 |
|----|------|------|
| #1205 | billing search wildcard DoS | +0/0（空diff？確認要） |
| #1208 | billing code lookup DoS | +10/-1 |
| #1226 | audit-log export ILIKE DoS | +14/-1 |
| #1232 | SQL DoS via unescaped ILIKE | +9/-1 |
| #1238 | billing code wildcard injection | +9/-1（#1208/#1232と重複可能性） |

## 🟡 MEDIUM — セキュリティ/安定性
| PR | 内容 |
|----|------|
| #1207 | tasks ILIKE unescaped input |
| #1210 | UI store予測可能ID |
| #1221 | jose 6.2.1→6.2.2（prod dep） |
| #1231 | offline queue予測可能ID |
| #1235 | SW queue ID fallback |
| #1236 | patient creation ID |

## 🟢 LOW — パフォーマンス・UI改善
| PR | 内容 |
|----|------|
| #1203 | claim-codes/staff reducer bailout |
| #1204 | toggle switches a11y |
| #1206 | reducer strict equality（+1927/-0 大規模） |
| #1209 | dismiss button tooltips |
| #1223 | notification toggle a11y |
| #1225 | VisitRow React.memo |
| #1227 | CareTeamPicker reducer |
| #1228 | icon-only button tooltips |
| #1229 | NextTaskCard WAI-ARIA |
| #1230 | VirtualizedRow memo |
| #1233 | Alert dismiss tooltip |
| #1234 | useReducer bailout |
| #1237 | CareTeamPicker reducer（#1227と重複） |

## 🔵 dependabot
| PR | 内容 | リスク |
|----|------|--------|
| #1211 | azure/login 2→3 | 低 |
| #1212 | pnpm/action-setup 4→5 | 低 |
| #1213 | eslint-plugin 8.57.1 | 低 |
| #1214 | otplib 13.4.0 | 低 |
| #1215 | msw 2.12.14 | 低 |
| #1216 | jspdf 4.2.1 | 低 |
| #1217 | storybook addon-themes 10.3.1 | ⚠️ 大規模ver-up |
| #1218 | vite 7→8 | ⚠️ 大規模ver-up |
| #1219 | jsdom 28→29 | ⚠️ 大規模変更 |
| #1220 | storybook test-runner 0.24.3 | 低 |
| #1222 | secretlint-rule-github 11.4.0 | 低 |

## 重複・確認要
- #1205 は +0/-0（空diff）。close推奨
- #1208/#1226/#1232/#1238 はILIKE DoS修正で重複の可能性。1件に統合推奨
- #1227/#1237 はCareTeamPicker reducer bailoutで重複
- #1202/#1224/#1231/#1235 はMath.random() fallback修正で重複

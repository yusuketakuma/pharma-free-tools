#!/usr/bin/env python3
"""
経過措置薬品387品目 照合スクリプト テンプレート
用途: MedicalCareStationから抽出した処方データと387品目リストを照合
作成日: 2026-03-07
"""

import csv
import json
from pathlib import Path
from typing import List, Dict, Set, Tuple

# ==================== 設定 ====================

# MedicalCareStationからエクスポートした処方データ（CSV形式）
# カラム例: 患者ID, 患者名, 薬品名, 規格, 用法, 用量, 処方日
PRESCRIPTION_FILE = "prescriptions_export.csv"

# 387品目リスト（以下の形式で準備）
# - CSV: 薬品コード, 薬品名, 規格, メーカー, 削除タイプ
# - または手動リスト
DRUGS_387_FILE = "drugs_387_list.csv"

# 成分単位削除54品目リスト（要注意リスト）
COMPONENT_DELETE_FILE = "drugs_54_component_delete.csv"

# 出力ファイル
OUTPUT_FILE = "transition_drugs_match_result.json"

# ==================== データ読み込み関数 ====================

def load_prescriptions(filepath: str) -> List[Dict]:
    """MedicalCareStationから抽出した処方データを読み込み"""
    prescriptions = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            prescriptions.append(row)
    return prescriptions

def load_drugs_387(filepath: str) -> Tuple[Set[str], Dict]:
    """387品目リストを読み込み"""
    drugs_set = set()  # 薬品名で照合
    drugs_detail = {}  # 詳細情報
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            drug_name = row.get('薬品名', '').strip()
            if drug_name:
                drugs_set.add(drug_name)
                drugs_detail[drug_name] = {
                    'code': row.get('薬品コード', ''),
                    'spec': row.get('規格', ''),
                    'maker': row.get('メーカー', ''),
                    'delete_type': row.get('削除タイプ', '経過措置')
                }
    return drugs_set, drugs_detail

def load_component_delete(filepath: str) -> Set[str]:
    """成分単位削除54品目を読み込み（要注意リスト）"""
    drugs = set()
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                drug_name = row.get('薬品名', '').strip()
                if drug_name:
                    drugs.add(drug_name)
    except FileNotFoundError:
        print(f"警告: {filepath} が見つかりません。54品目チェックをスキップします。")
    return drugs

# ==================== 照合関数 ====================

def match_prescriptions(
    prescriptions: List[Dict],
    drugs_387: Set[str],
    drugs_detail: Dict,
    drugs_54: Set[str],
    drug_name_col: str = '薬品名'
) -> Dict:
    """
    処方データと387品目を照合
    
    Args:
        prescriptions: 処方データリスト
        drugs_387: 387品目の薬品名セット
        drugs_detail: 387品目の詳細情報
        drugs_54: 成分単位削除54品目セット
        drug_name_col: 処方データの薬品名カラム名
    
    Returns:
        照合結果（マッチした処方、患者別集計、優先度別分類）
    """
    matched_prescriptions = []
    patient_summary = {}
    
    for rx in prescriptions:
        drug_name = rx.get(drug_name_col, '').strip()
        
        # 387品目にマッチするか
        if drug_name in drugs_387:
            patient_id = rx.get('患者ID', rx.get('患者名', '不明'))
            
            # マッチ情報を記録
            match_info = {
                **rx,
                '_match': {
                    'drug_387': True,
                    'is_component_delete': drug_name in drugs_54,
                    'detail': drugs_detail.get(drug_name, {})
                }
            }
            matched_prescriptions.append(match_info)
            
            # 患者別集計
            if patient_id not in patient_summary:
                patient_summary[patient_id] = {
                    'patient_name': rx.get('患者名', ''),
                    'matched_drugs': [],
                    'component_delete_drugs': []
                }
            
            patient_summary[patient_id]['matched_drugs'].append(drug_name)
            if drug_name in drugs_54:
                patient_summary[patient_id]['component_delete_drugs'].append(drug_name)
    
    # 優先度分類
    high_priority_patients = {
        pid: data for pid, data in patient_summary.items()
        if data['component_delete_drugs']
    }
    
    return {
        'matched_prescriptions': matched_prescriptions,
        'patient_summary': patient_summary,
        'high_priority_patients': high_priority_patients,
        'stats': {
            'total_prescriptions': len(prescriptions),
            'matched_count': len(matched_prescriptions),
            'patient_count': len(patient_summary),
            'high_priority_patient_count': len(high_priority_patients)
        }
    }

# ==================== 出力関数 ====================

def save_result(result: Dict, filepath: str):
    """結果をJSONファイルに保存"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"結果を保存しました: {filepath}")

def print_summary(result: Dict):
    """サマリーを表示"""
    stats = result['stats']
    print("\n" + "="*50)
    print("照合結果サマリー")
    print("="*50)
    print(f"総処方件数: {stats['total_prescriptions']}")
    print(f"387品目にマッチ: {stats['matched_count']}件")
    print(f"影響を受ける患者数: {stats['patient_count']}人")
    print(f"【優先対応】成分単位削除対象患者: {stats['high_priority_patient_count']}人")
    print("="*50)
    
    # 優先対応患者を表示
    if result['high_priority_patients']:
        print("\n【優先対応が必要な患者】")
        for pid, data in result['high_priority_patients'].items():
            print(f"  - {data['patient_name']}: {', '.join(data['component_delete_drugs'])}")

# ==================== メイン処理 ====================

def main():
    """メイン処理"""
    print("経過措置薬品387品目 照合ツール")
    print("-" * 40)
    
    # ファイル存在チェック
    if not Path(PRESCRIPTION_FILE).exists():
        print(f"エラー: 処方データファイルが見つかりません: {PRESCRIPTION_FILE}")
        print("\nMedicalCareStationから以下の形式でエクスポートしてください:")
        print("  - 形式: CSV")
        print("  - 必須カラム: 患者ID, 患者名, 薬品名")
        return
    
    if not Path(DRUGS_387_FILE).exists():
        print(f"エラー: 387品目リストが見つかりません: {DRUGS_387_FILE}")
        print("\n387品目リストを以下の形式で準備してください:")
        print("  - 形式: CSV")
        print("  - カラム: 薬品コード, 薬品名, 規格, メーカー, 削除タイプ")
        return
    
    # データ読み込み
    print("処方データを読み込み中...")
    prescriptions = load_prescriptions(PRESCRIPTION_FILE)
    print(f"  -> {len(prescriptions)}件")
    
    print("387品目リストを読み込み中...")
    drugs_387, drugs_detail = load_drugs_387(DRUGS_387_FILE)
    print(f"  -> {len(drugs_387)}品目")
    
    print("成分単位削除54品目を読み込み中...")
    drugs_54 = load_component_delete(COMPONENT_DELETE_FILE)
    print(f"  -> {len(drugs_54)}品目")
    
    # 照合実行
    print("\n照合実行中...")
    result = match_prescriptions(
        prescriptions,
        drugs_387,
        drugs_detail,
        drugs_54,
        drug_name_col='薬品名'  # MedicalCareStationのカラム名に合わせて調整
    )
    
    # 結果表示・保存
    print_summary(result)
    save_result(result, OUTPUT_FILE)
    
    print("\n次のステップ:")
    print("1. 出力されたJSONファイルを確認")
    print("2. high_priority_patients（成分単位削除対象）を優先対応")
    print("3. 患者ごとに医師へ処方変更を相談")

if __name__ == '__main__':
    main()

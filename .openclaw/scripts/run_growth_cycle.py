#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = ROOT.parent
SCRIPTS_ROOT = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_ROOT))

from task_runtime import atomic_write_json, atomic_write_text  # noqa: E402


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run OpenClaw growth observe/propose cycle (no auto-apply)")
    p.add_argument("--cycle-id", default=f"growth-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    p.add_argument("--summary-only", action="store_true")
    return p.parse_args()


def read_text(rel: str) -> str:
    path = WORKSPACE_ROOT / rel
    return path.read_text(encoding="utf-8") if path.exists() else ""


def project_roots() -> list[str]:
    manifest = read_text('.openclaw/config/project-manifest.yaml')
    roots: list[str] = []
    in_section = False
    for raw in manifest.splitlines():
        stripped = raw.strip()
        if stripped == 'portfolio_projects:':
            in_section = True
            continue
        if in_section:
            if not stripped:
                continue
            if not stripped.startswith('- '):
                break
            roots.append(stripped[2:].strip())
    return roots


def main() -> int:
    args = parse_args()
    cycle_id = args.cycle_id
    proposal_id = cycle_id + '-proposal'
    created_at = now_iso()
    status_history = [
        {
            'status': 'INBOX',
            'at': created_at,
            'note': 'proposal created from observe/propose cycle',
        }
    ]
    status_text = read_text('CURRENT_STATUS.md')
    readme_text = read_text('.openclaw/README.md')
    org_text = read_text('org/organization.md')
    roots = project_roots()

    observations: list[str] = []
    if roots:
        observations.append(f"portfolio projects registered: {len(roots)}")
    if 'manual approval' in org_text.lower():
        observations.append('organization guardrail language already mentions approval discipline')
    else:
        observations.append('organization guardrail wording should keep manual approval explicit')
    if 'projects/' in status_text:
        observations.append('CURRENT_STATUS already links to project-level status')
    else:
        observations.append('CURRENT_STATUS should expose portfolio project entry points')
    if 'auth' in readme_text.lower():
        observations.append('execution system README already references auth-related behavior')
    else:
        observations.append('execution system README should document auth preflight artifacts')

    proposed_changes = [
        'Keep observe/propose only; do not auto-apply growth changes.',
        'Require manual approval before any guardrail, org, or routing policy mutation.',
        'Use growth proposals as the review queue for future apply automation.',
    ]
    affected_paths = [
        '.openclaw/config/approval-policy.yaml',
        '.openclaw/config/routing-policy.yaml',
        '.openclaw/config/claude-code.yaml',
        '.openclaw/scripts/run_claude_code.sh',
        'org/organization.md',
    ]
    proposal = {
        'proposal_id': proposal_id,
        'cycle_id': cycle_id,
        'created_at': created_at,
        'phase': 'propose',
        'summary': 'Initial growth observe/propose cycle created baseline improvement proposal; auto-apply remains disabled.',
        'observations': observations,
        'proposed_changes': proposed_changes,
        'affected_paths': affected_paths,
        'evidence': [
            'CURRENT_STATUS.md',
            '.openclaw/config/project-manifest.yaml',
            '.openclaw/README.md',
        ],
        'requires_manual_approval': True,
        'status': 'INBOX',
        'status_history': status_history,
        'guardrails': affected_paths,
        'next_step': 'Review the proposal, then run review_growth_proposal.py before any apply step.',
    }
    proposal_path = ROOT / 'growth' / 'proposals' / f'{proposal_id}.json'
    inbox_path = ROOT / 'growth' / 'inbox' / f'{proposal_id}.json'
    report_path = ROOT / 'growth' / 'reports' / f'{cycle_id}.md'
    ledger_path = ROOT / 'growth' / 'ledgers' / f'{cycle_id}.json'
    atomic_write_json(proposal_path, proposal)
    atomic_write_json(inbox_path, proposal)
    atomic_write_json(ledger_path, {
        'cycle_id': cycle_id,
        'created_at': created_at,
        'mode': 'proposal_review_apply_assisted',
        'proposal_path': str(proposal_path),
        'report_path': str(report_path),
        'proposal_status': 'INBOX',
        'manual_approval_required': True,
        'events': [
            {
                'at': created_at,
                'type': 'proposal_created',
                'status': 'INBOX',
                'proposal_path': str(proposal_path),
            }
        ],
    })
    atomic_write_text(report_path, '\n'.join([
        f'# Growth cycle {cycle_id}',
        '',
        '## Observations',
        *[f'- {item}' for item in observations],
        '',
        '## Proposed changes',
        *[f'- {item}' for item in proposed_changes],
        '',
        '## Guardrails',
        *[f'- {item}' for item in affected_paths],
        '',
        '## Decision',
        '- manual approval required; apply is not automated in this phase',
        '',
    ]))
    if args.summary_only:
        print(json.dumps({'cycle_id': cycle_id, 'proposal_id': proposal_id, 'proposal_path': str(proposal_path)}, ensure_ascii=False))
    else:
        print(json.dumps(proposal, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env bash
set -euo pipefail

EXIT_SUCCESS=0
EXIT_POLICY_BLOCKED=10
EXIT_TIMEOUT=20
EXIT_RUNTIME_ERROR=30
EXIT_INVALID_REQUEST=40
EXIT_INVALID_RESULT=50

show_help() {
  cat <<'HELP'
Usage: run_claude_code.sh --request FILE --result FILE --stdout-log FILE --stderr-log FILE [--dry-run]

OpenClaw adapter for Claude Code.

Guardrail:
  manual approval remains fixed for guardrail / org / growth-policy mutations.

Contract:
  --request     execution-request.json
  --result      execution-result.json (always written atomically)
  --stdout-log  executor stdout log
  --stderr-log  executor stderr log
  --dry-run     render prompt/settings and write a normalized success result without invoking Claude

Environment overrides:
  CLAUDE_CODE_BIN                  Override Claude CLI binary
  CLAUDE_PERMISSION_MODE_EXECUTE   Override permission mode for one run (useful for smoke)
  CLAUDE_ALLOWED_TOOLS             Override --tools for one run (comma-separated)

Exit codes:
  0   success
  10  policy_blocked
  20  timeout
  30  runtime_error
  40  invalid_request
  50  invalid_result

Resolution order for CLAUDE_CODE_BIN:
  env CLAUDE_CODE_BIN > .openclaw/config/claude-code.yaml:bin > default 'claude'
HELP
}

REQUEST=""
RESULT=""
STDOUT_LOG=""
STDERR_LOG=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --request)
      REQUEST="${2:-}"
      shift 2
      ;;
    --result)
      RESULT="${2:-}"
      shift 2
      ;;
    --stdout-log)
      STDOUT_LOG="${2:-}"
      shift 2
      ;;
    --stderr-log)
      STDERR_LOG="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      show_help >&2
      exit 2
      ;;
  esac
done

if [[ -z "$REQUEST" || -z "$RESULT" || -z "$STDOUT_LOG" || -z "$STDERR_LOG" ]]; then
  show_help >&2
  exit 2
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE_ROOT="$(cd "$ROOT/.." && pwd)"
STRUCTURED_SCHEMA_PATH="$ROOT/schemas/claude-structured-output.schema.json"
mkdir -p "$(dirname "$RESULT")" "$(dirname "$STDOUT_LOG")" "$(dirname "$STDERR_LOG")"
: > "$STDOUT_LOG"
: > "$STDERR_LOG"

write_result() {
  local json="$1"
  local tmp
  tmp="$(mktemp "$(dirname "$RESULT")/.$(basename "$RESULT").XXXXXX")"
  printf '%s\n' "$json" > "$tmp"
  mv "$tmp" "$RESULT"
}

validate_request() {
  python3 "$ROOT/scripts/task_runtime.py" validate --schema execution-request --path "$REQUEST" >/dev/null
}

validate_result() {
  python3 "$ROOT/scripts/task_runtime.py" validate --schema execution-result --path "$RESULT" >/dev/null
}

json_value() {
  python3 - "$REQUEST" "$1" <<'PY'
import json
import sys
from pathlib import Path
payload = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
value = payload
for part in sys.argv[2].split('.'):
    if isinstance(value, dict):
        value = value.get(part)
    else:
        value = None
        break
if value is None:
    print("")
elif isinstance(value, (dict, list)):
    print(json.dumps(value, ensure_ascii=False))
else:
    print(value)
PY
}

resolve_output_path() {
  local request_key="$1"
  local fallback_name="$2"
  local resolved
  resolved="$(python3 - "$REQUEST" "$WORKSPACE_ROOT" "$request_key" "$fallback_name" <<'PY'
import json
import sys
from pathlib import Path
request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
workspace = Path(sys.argv[2])
key = sys.argv[3]
fallback_name = sys.argv[4]
value = request.get(key)
if value:
    path = Path(value)
    if not path.is_absolute():
        path = workspace / path
else:
    path = Path(sys.argv[1]).resolve().parent / fallback_name
print(path)
PY
)"
  printf '%s' "$resolved"
}

RAW_PATH="$(resolve_output_path raw_response_path claude-raw.json)"
PROMPT_PATH="$(resolve_output_path rendered_prompt_path rendered-prompt.txt)"
SETTINGS_PATH="$(dirname "$RESULT")/claude-settings.json"
mkdir -p "$(dirname "$RAW_PATH")" "$(dirname "$PROMPT_PATH")"

write_raw_json() {
  local json="$1"
  local target="${2:-$RAW_PATH}"
  if [[ "${SAVE_RAW_RESPONSE:-true}" != "True" && "${SAVE_RAW_RESPONSE:-true}" != "true" ]]; then
    return 0
  fi
  local tmp
  tmp="$(mktemp "$(dirname "$target")/.$(basename "$target").XXXXXX")"
  printf '%s\n' "$json" > "$tmp"
  mv "$tmp" "$target"
}

build_result() {
  local status="$1"
  local exit_code="$2"
  local summary="$3"
  local changed_files_json="$4"
  local verification_json="$5"
  local risks_json="$6"
  local meta_json="${7:-null}"
  python3 - "$REQUEST" "$status" "$exit_code" "$summary" "$changed_files_json" "$verification_json" "$risks_json" "$RAW_PATH" "$PROMPT_PATH" "$meta_json" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
request_path = Path(sys.argv[1])
status = sys.argv[2]
exit_code = int(sys.argv[3])
summary = sys.argv[4]
changed_files = json.loads(sys.argv[5])
verification_results = json.loads(sys.argv[6])
remaining_risks = json.loads(sys.argv[7])
raw_path = str(Path(sys.argv[8]))
prompt_path = str(Path(sys.argv[9]))
meta = json.loads(sys.argv[10])
request = json.loads(request_path.read_text(encoding='utf-8'))
finished_at = datetime.now(timezone.utc).astimezone().isoformat(timespec='seconds')
started_at = request.get('started_at', finished_at)
payload = {
    'task_id': request.get('task_id', 'unknown'),
    'status': status,
    'executor': 'claude-code',
    'summary': summary,
    'changed_files': changed_files,
    'verification_results': verification_results,
    'remaining_risks': remaining_risks,
    'exit_code': exit_code,
    'started_at': started_at,
    'finished_at': finished_at,
    'dispatch_id': request.get('dispatch_id'),
    'raw_response_path': raw_path,
    'rendered_prompt_path': prompt_path,
}
if meta not in (None, {}):
    payload['_meta'] = meta
print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
}

render_prompt() {
  python3 - "$REQUEST" "$WORKSPACE_ROOT" "$PROMPT_PATH" <<'PY'
import json
import sys
from pathlib import Path
request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
workspace = Path(sys.argv[2])
prompt_path = Path(sys.argv[3])
context_text = ''
context_rel = request.get('context_pack_path')
if context_rel:
    context_path = Path(context_rel)
    if not context_path.is_absolute():
        context_path = workspace / context_path
    if context_path.exists():
        context_text = context_path.read_text(encoding='utf-8').strip()
handoff_pack = request.get('handoff_pack') if isinstance(request.get('handoff_pack'), dict) else {}
return_schema = request.get('return_schema') if isinstance(request.get('return_schema'), dict) else {}
lines = [
    f"Task ID: {request.get('task_id', 'unknown')}",
    f"Dispatch ID: {request.get('dispatch_id', '(none)')}",
    f"Execution mode: {request.get('execution_mode', 'unknown')}",
    '',
    'You must return structured output that matches the provided JSON schema exactly.',
    'Do not wrap the response in markdown fences.',
    'Prefer the handoff artifacts over guesswork.',
    'If the task is ambiguous, return a narrow executable plan rather than broad speculative edits.',
    'Always include changed_files, verification_results, remaining_risks, and a concise summary.',
    '',
    'Task Summary:',
    request.get('task_summary', ''),
    '',
    'Constraints:',
]
constraints = request.get('constraints') or ['(none)']
lines.extend([f"- {item}" for item in constraints])
lines.extend(['', 'Target Paths:'])
paths = request.get('target_paths') or ['(none)']
lines.extend([f"- {item}" for item in paths])
lines.extend(['', 'Verification Commands:'])
commands = request.get('verification_commands') or ['(none)']
lines.extend([f"- {item}" for item in commands])
lines.extend(['', 'Review Focus:'])
focus = request.get('review_focus') or ['(none)']
lines.extend([f"- {item}" for item in focus])
if handoff_pack:
    lines.extend(['', 'Handoff Artifacts:'])
    lines.extend([f"- {key}: {value}" for key, value in handoff_pack.items()])
if return_schema:
    lines.extend(['', 'Return Schema Hints:'])
    lines.extend([f"- {key}: {value}" for key, value in return_schema.items()])
if context_text:
    lines.extend(['', 'Context Pack:', context_text])
prompt_path.write_text('\n'.join(lines).rstrip() + '\n', encoding='utf-8')
PY
}

write_settings_file() {
  python3 - "$ROOT" "$SETTINGS_PATH" "$STRUCTURED_SCHEMA_PATH" <<'PY'
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(sys.argv[1]) / 'scripts'))
from task_runtime import load_claude_code_config
settings_path = Path(sys.argv[2])
config = load_claude_code_config()
payload = {
    'model': config['model'],
    'permission_mode_default': config['permission_mode_default'],
    'permission_mode_execute': config['permission_mode_execute'],
    'timeout_sec': config['timeout_sec'],
    'max_turns': config['max_turns'],
    'max_budget_usd': config['max_budget_usd'],
    'use_json_schema': config['use_json_schema'],
    'structured_output_schema_path': str(Path(sys.argv[3])),
    'output_format': 'json',
    'settings_strategy': config['settings_strategy'],
    'use_bare_for_low_risk': config['use_bare_for_low_risk'],
    'restrict_tools': config['restrict_tools'],
}
settings_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(settings_path)
PY
}

config_value() {
  python3 - "$ROOT" "$1" <<'PY'
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(sys.argv[1]) / 'scripts'))
from task_runtime import load_claude_code_config
config = load_claude_code_config()
value = config.get(sys.argv[2])
if isinstance(value, (dict, list)):
    print(json.dumps(value, ensure_ascii=False))
elif value is None:
    print('')
else:
    print(value)
PY
}

status_from_mock() {
  case "$1" in
    success) echo "$EXIT_SUCCESS success" ;;
    policy_blocked) echo "$EXIT_POLICY_BLOCKED policy_blocked" ;;
    timeout) echo "$EXIT_TIMEOUT timeout" ;;
    runtime_error) echo "$EXIT_RUNTIME_ERROR runtime_error" ;;
    invalid_result) echo "$EXIT_INVALID_RESULT invalid_result" ;;
    *) echo "$EXIT_RUNTIME_ERROR runtime_error" ;;
  esac
}

invoke_claude_cli() {
  local attempt="$1"
  python3 - "$BIN" "$PROMPT_PATH" "$RAW_PATH" "$STDOUT_LOG" "$STDERR_LOG" "$SETTINGS_PATH" "$TIMEOUT_SEC" "$MODEL" "$PERMISSION_MODE_EFFECTIVE" "$STRUCTURED_SCHEMA_PATH" "$USE_JSON_SCHEMA" "$ALLOWED_TOOLS" "$attempt" <<'PY'
import json
import subprocess
import sys
from pathlib import Path

bin_name = sys.argv[1]
prompt_path = Path(sys.argv[2])
raw_path = Path(sys.argv[3])
stdout_log = Path(sys.argv[4])
stderr_log = Path(sys.argv[5])
settings_path = Path(sys.argv[6])
timeout_sec = int(sys.argv[7])
model = sys.argv[8]
permission_mode = sys.argv[9]
structured_schema_path = Path(sys.argv[10])
use_json_schema = sys.argv[11].lower() == 'true'
allowed_tools = sys.argv[12].strip()
attempt = int(sys.argv[13])
prompt = prompt_path.read_text(encoding='utf-8')
command = [bin_name, '--print', '--output-format', 'json', '--permission-mode', permission_mode]
if allowed_tools:
    normalized_tools = [item.strip() for item in allowed_tools.replace(',', ' ').split() if item.strip()]
    if use_json_schema and 'StructuredOutput' not in normalized_tools:
        normalized_tools.append('StructuredOutput')
    command.extend(['--tools', ','.join(normalized_tools)])
if model:
    command.extend(['--model', model])
if use_json_schema:
    command.extend(['--json-schema', structured_schema_path.read_text(encoding='utf-8')])
command.append(prompt)
with stdout_log.open('a', encoding='utf-8') as out_fh, stderr_log.open('a', encoding='utf-8') as err_fh:
    out_fh.write(f"[openclaw-adapter] invoking attempt={attempt} {' '.join(command[:-1])} <rendered-prompt>\n")
    out_fh.write(f"[openclaw-adapter] settings={settings_path}\n")
    try:
        completed = subprocess.run(command, check=False, capture_output=True, text=True, timeout=timeout_sec)
        out_fh.write(completed.stdout)
        err_fh.write(completed.stderr)
        raw_text = completed.stdout
        try:
            json.loads(raw_text)
        except Exception as exc:  # noqa: BLE001
            raw_payload = {
                'kind': 'cli_capture',
                'attempt': attempt,
                'command': command[:-1] + ['<rendered-prompt>'],
                'exit_code': completed.returncode,
                'stdout': completed.stdout,
                'stderr': completed.stderr,
                'stdout_parse_error': str(exc),
                'settings_path': str(settings_path),
            }
            raw_path.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        else:
            raw_path.write_text(raw_text if raw_text.endswith('\n') else raw_text + '\n', encoding='utf-8')
        sys.exit(completed.returncode)
    except subprocess.TimeoutExpired as exc:
        raw_payload = {
            'kind': 'cli_capture',
            'attempt': attempt,
            'command': command[:-1] + ['<rendered-prompt>'],
            'status': 'timeout',
            'timeout_sec': timeout_sec,
            'stdout': exc.stdout or '',
            'stderr': exc.stderr or '',
            'settings_path': str(settings_path),
        }
        raw_path.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        out_fh.write(exc.stdout or '')
        err_fh.write(exc.stderr or '')
        sys.exit(124)
PY
}

normalize_cli_result() {
  local cli_exit="$1"
  local retry_count="${2:-0}"
  local allow_result_json_fallback="${3:-true}"
  local fallback_accept_root_json_string="${4:-true}"
  local fallback_accept_single_fenced_json="${5:-true}"
  local fallback_accept_free_text_json="${6:-false}"
  python3 - "$ROOT" "$REQUEST" "$RAW_PATH" "$PROMPT_PATH" "$STRUCTURED_SCHEMA_PATH" "$cli_exit" "$retry_count" "$allow_result_json_fallback" "$fallback_accept_root_json_string" "$fallback_accept_single_fenced_json" "$fallback_accept_free_text_json" <<'PY'
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(sys.argv[1])
request_path = Path(sys.argv[2])
raw_path = Path(sys.argv[3])
prompt_path = Path(sys.argv[4])
structured_schema_path = Path(sys.argv[5])
cli_exit = int(sys.argv[6])
retry_count = int(sys.argv[7])
allow_result_json_fallback = sys.argv[8].lower() == 'true'
accept_root_json_string = sys.argv[9].lower() == 'true'
accept_single_fenced_json = sys.argv[10].lower() == 'true'
accept_free_text_json = sys.argv[11].lower() == 'true'

sys.path.insert(0, str(root / 'scripts'))
from task_runtime import ValidationError, load_json, validate_json_value, validate_payload  # noqa: E402

request = json.loads(request_path.read_text(encoding='utf-8'))
raw_payload = load_json(raw_path)
raw_text = raw_path.read_text(encoding='utf-8') if raw_path.exists() else ''
finished_at = datetime.now(timezone.utc).astimezone().isoformat(timespec='seconds')
started_at = request.get('started_at', finished_at)
schema = json.loads(structured_schema_path.read_text(encoding='utf-8'))


def emit(status: str, exit_code: int, summary: str, changed_files, verification_results, remaining_risks, meta=None):
    payload = {
        'task_id': request.get('task_id', 'unknown'),
        'status': status,
        'executor': 'claude-code',
        'summary': summary,
        'changed_files': changed_files,
        'verification_results': verification_results,
        'remaining_risks': remaining_risks,
        'exit_code': exit_code,
        'started_at': started_at,
        'finished_at': finished_at,
        'dispatch_id': request.get('dispatch_id'),
        'raw_response_path': str(raw_path),
        'rendered_prompt_path': str(prompt_path),
    }
    if meta not in (None, {}):
        payload['_meta'] = meta
    validate_payload('execution-result', payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def invalid(summary: str, verification_results, remaining_risks, meta=None):
    emit('invalid_result', 50, summary, [], verification_results, remaining_risks, meta)
    sys.exit(50)


def bool_string(value: bool) -> str:
    return 'true' if value else 'false'


def extract_events(payload):
    result_event = None
    init_event = None
    if isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict) and item.get('type') == 'system' and item.get('subtype') == 'init':
                init_event = item
        for item in reversed(payload):
            if isinstance(item, dict) and item.get('type') == 'result':
                result_event = item
                break
    elif isinstance(payload, dict) and payload.get('type') == 'result':
        result_event = payload
    return init_event, result_event


def build_meta(result_event, init_event, normalization_source: str, fallback_used: bool, degraded_contract: str | None = None):
    meta = {
        'raw_result_type': result_event.get('type') if isinstance(result_event, dict) else None,
        'raw_result_subtype': result_event.get('subtype') if isinstance(result_event, dict) else None,
        'session_id': result_event.get('session_id') if isinstance(result_event, dict) else None,
        'usage': result_event.get('usage') if isinstance(result_event, dict) else None,
        'normalization_source': normalization_source,
        'fallback_used': fallback_used,
        'retry_count': retry_count,
        'raw_sha256': hashlib.sha256(raw_text.encode('utf-8')).hexdigest(),
    }
    if isinstance(result_event, dict):
        for key in ('modelUsage', 'total_cost_usd', 'duration_ms', 'duration_api_ms', 'num_turns', 'stop_reason', 'permission_denials', 'is_error', 'result'):
            if key in result_event:
                meta[key] = result_event.get(key)
    if isinstance(init_event, dict):
        meta['init'] = {
            key: init_event.get(key)
            for key in ('session_id',)
            if key in init_event
        }
        message = init_event.get('message') or {}
        if isinstance(message, dict):
            init_message_meta = {
                key: message.get(key)
                for key in ('model', 'permissionMode', 'tools', 'apiKeySource', 'claude_code_version')
                if key in message
            }
            if init_message_meta:
                meta['init']['message'] = init_message_meta
                if 'claude_code_version' in init_message_meta:
                    meta['cli_version'] = init_message_meta['claude_code_version']
        elif 'cli_version' not in meta:
            meta['cli_version'] = None
    else:
        meta['cli_version'] = None
    if degraded_contract:
        meta['degraded_contract'] = degraded_contract
    return {key: value for key, value in meta.items() if value is not None}


def coerce_candidate_to_schema(candidate, normalization_source: str, fallback_used: bool):
    try:
        validate_json_value(schema, candidate, 'claude-structured-output')
        return candidate, None
    except ValidationError as exc:
        if not fallback_used or not isinstance(candidate, dict):
            raise
        source = dict(candidate)
        compat = {}
        compat_changed = False
        summary_candidates = [
            source.get('summary'),
            source.get('result'),
            source.get('intended_outcome'),
            source.get('proposed_update_summary'),
        ]
        summary_text = next((item for item in summary_candidates if isinstance(item, str) and item.strip()), None)
        if summary_text is not None:
            compat['summary'] = summary_text
            if not isinstance(source.get('summary'), str):
                compat_changed = True
        if 'result' in source and isinstance(source.get('result'), str):
            compat['result'] = source['result']
        elif summary_text is not None:
            compat['result'] = summary_text
            compat_changed = True
        if isinstance(source.get('changed_files'), list):
            compat['changed_files'] = source['changed_files']
        else:
            compat['changed_files'] = []
            compat_changed = True
        if isinstance(source.get('verification_results'), list):
            compat['verification_results'] = source['verification_results']
        else:
            verification_items = []
            if source.get('file_exists') is True and source.get('file_path'):
                verification_items.append(f"verified readable: {source['file_path']}")
            if source.get('line_count') is not None:
                verification_items.append(f"observed line_count={source['line_count']}")
            if not verification_items:
                verification_items.append(f"compatibility-normalized via {normalization_source}")
            compat['verification_results'] = verification_items
            compat_changed = True
        if isinstance(source.get('remaining_risks'), list):
            compat['remaining_risks'] = source['remaining_risks']
        else:
            compat['remaining_risks'] = [
                'compatibility fallback normalized non-canonical Claude result payload'
            ]
            compat_changed = True
        if compat_changed:
            validate_json_value(schema, compat, 'claude-structured-output')
            return compat, 'compatibility normalization filled required schema fields'
        raise exc


def validate_structured_output(candidate, result_event, init_event, normalization_source: str, fallback_used: bool, degraded_contract: str | None = None):
    try:
        normalized_candidate, compat_degraded = coerce_candidate_to_schema(candidate, normalization_source, fallback_used)
    except ValidationError as exc:
        invalid(
            f'claude structured_output schema validation failed: {exc}',
            ['structured_output schema validation failed'],
            ['inspect claude-raw.json for schema drift'],
            build_meta(result_event, init_event, normalization_source, fallback_used, degraded_contract),
        )
    effective_degraded = degraded_contract
    if compat_degraded:
        effective_degraded = f"{degraded_contract}; {compat_degraded}" if degraded_contract else compat_degraded
    summary = normalized_candidate.get('summary') or normalized_candidate.get('result') or (result_event.get('result') if isinstance(result_event, dict) else '') or ''
    emit(
        'success',
        0,
        summary,
        normalized_candidate.get('changed_files') or [],
        normalized_candidate.get('verification_results') or [],
        normalized_candidate.get('remaining_risks') or [],
        build_meta(result_event, init_event, normalization_source, fallback_used, effective_degraded),
    )
    sys.exit(0)


if cli_exit != 0:
    emit('runtime_error', 30, f'executor failed with exit code {cli_exit}', [], ['executor returned non-zero'], ['inspect execution.stderr.log and claude-raw.json'], {
        'retry_count': retry_count,
        'raw_sha256': hashlib.sha256(raw_text.encode('utf-8')).hexdigest(),
    })
    sys.exit(30)

if not isinstance(raw_payload, (list, dict)):
    invalid('claude raw output is not valid JSON', ['raw JSON parse failed'], ['inspect execution.stdout.log for non-JSON output'], {
        'retry_count': retry_count,
        'raw_sha256': hashlib.sha256(raw_text.encode('utf-8')).hexdigest(),
    })

init_event, result_event = extract_events(raw_payload)
if not isinstance(result_event, dict):
    invalid('claude JSON output missing result envelope', ['result envelope missing'], ['adapter could not locate type=result in claude-raw.json'], {
        'retry_count': retry_count,
        'raw_sha256': hashlib.sha256(raw_text.encode('utf-8')).hexdigest(),
    })

structured_output = result_event.get('structured_output')
if isinstance(structured_output, dict):
    validate_structured_output(structured_output, result_event, init_event, 'structured_output', False)

if not allow_result_json_fallback:
    invalid('claude JSON output missing structured_output', ['structured_output missing'], ['exit 0 without structured_output is treated as invalid_result'], build_meta(result_event, init_event, 'structured_output', False))

raw_result = result_event.get('result')
if accept_root_json_string and isinstance(raw_result, str):
    try:
        candidate = json.loads(raw_result)
    except Exception:
        candidate = None
    if isinstance(candidate, dict):
        validate_structured_output(candidate, result_event, init_event, 'result_json_fallback', True, 'structured_output missing; decoded result JSON string')

if accept_single_fenced_json and isinstance(raw_result, str):
    matches = re.findall(r"```json\s*(\{.*?\})\s*```", raw_result, flags=re.IGNORECASE | re.DOTALL)
    if len(matches) == 1:
        try:
            candidate = json.loads(matches[0])
        except Exception:
            candidate = None
        if isinstance(candidate, dict):
            validate_structured_output(candidate, result_event, init_event, 'result_fenced_json_fallback', True, 'structured_output missing; decoded single fenced json block')

if accept_free_text_json:
    invalid('free text JSON fallback is forbidden by config', ['fallback policy violation'], ['disable free text fallback'])

invalid('claude JSON output missing structured_output and fallback normalization failed', ['structured_output missing', 'fallback decode failed'], ['inspect claude-raw.json for raw result formatting'], build_meta(result_event, init_event, 'structured_output', False))
PY
}

# Auth preflight is delegated to ensure_claude_auth.py so task-local auth artifacts are always persisted.
run_auth_preflight() {
  python3 - "$BIN" "$RAW_PATH" "$STDOUT_LOG" "$STDERR_LOG" <<'PY'
import json
import subprocess
import sys
from pathlib import Path

bin_name = sys.argv[1]
raw_path = Path(sys.argv[2])
stdout_log = Path(sys.argv[3])
stderr_log = Path(sys.argv[4])
command = [bin_name, 'auth', 'status', '--json']
with stdout_log.open('a', encoding='utf-8') as out_fh, stderr_log.open('a', encoding='utf-8') as err_fh:
    out_fh.write(f"[openclaw-adapter] auth preflight {' '.join(command)}\n")
    completed = subprocess.run(command, check=False, capture_output=True, text=True)
    out_fh.write(completed.stdout)
    err_fh.write(completed.stderr)
    parsed = None
    parse_error = None
    try:
        parsed = json.loads(completed.stdout) if completed.stdout.strip() else None
    except Exception as exc:  # noqa: BLE001
        parse_error = str(exc)
    raw_payload = {
        'kind': 'auth_preflight',
        'command': command,
        'exit_code': completed.returncode,
        'stdout': parsed if parsed is not None else completed.stdout,
        'stderr': completed.stderr,
    }
    if parse_error:
        raw_payload['stdout_parse_error'] = parse_error
    raw_path.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if completed.returncode != 0:
        sys.exit(completed.returncode or 1)
    if not isinstance(parsed, dict) or not parsed.get('loggedIn'):
        sys.exit(2)
    sys.exit(0)
PY
}

if ! validate_request >>"$STDOUT_LOG" 2>>"$STDERR_LOG"; then
  write_raw_json '{"status":"invalid_request","message":"execution-request validation failed"}'
  result_json="$(build_result invalid_request $EXIT_INVALID_REQUEST 'execution-request validation failed' '[]' '["request validation failed"]' '["adapter aborted before execution"]')"
  write_result "$result_json"
  exit "$EXIT_INVALID_REQUEST"
fi

TASK_SUMMARY="$(json_value task_summary)"
TARGET_PATHS_JSON="$(json_value target_paths)"
if [[ -z "$TARGET_PATHS_JSON" ]]; then
  TARGET_PATHS_JSON='[]'
fi
REQUEST_MOCK_MODE="$(json_value mock_mode)"
EXECUTION_MODE="$(json_value execution_mode)"
if [[ -z "$EXECUTION_MODE" ]]; then
  EXECUTION_MODE="$(config_value mode)"
fi
BIN="$(CLAUDE_CODE_BIN="${CLAUDE_CODE_BIN:-}" python3 - "$ROOT" <<'PY'
import sys
from pathlib import Path
sys.path.insert(0, str(Path(sys.argv[1]) / 'scripts'))
from task_runtime import load_claude_code_config, resolve_claude_code_bin
print(resolve_claude_code_bin(load_claude_code_config())[0])
PY
)"
BIN_SOURCE="$(CLAUDE_CODE_BIN="${CLAUDE_CODE_BIN:-}" python3 - "$ROOT" <<'PY'
import sys
from pathlib import Path
sys.path.insert(0, str(Path(sys.argv[1]) / 'scripts'))
from task_runtime import load_claude_code_config, resolve_claude_code_bin
print(resolve_claude_code_bin(load_claude_code_config())[1])
PY
)"
TIMEOUT_SEC="$(config_value timeout_sec)"
SAVE_RAW_RESPONSE="$(config_value save_raw_response)"
SETTINGS_STRATEGY="$(config_value settings_strategy)"
PERMISSION_MODE_EXECUTE="$(config_value permission_mode_execute)"
MODEL="$(config_value model)"
USE_JSON_SCHEMA="$(config_value use_json_schema)"
RESTRICT_TOOLS_JSON="$(config_value restrict_tools)"
ALLOW_RESULT_JSON_FALLBACK="$(config_value allow_result_json_fallback)"
FALLBACK_ACCEPT_ROOT_JSON_STRING="$(config_value fallback_accept_root_json_string)"
FALLBACK_ACCEPT_SINGLE_FENCED_JSON="$(config_value fallback_accept_single_fenced_json)"
FALLBACK_ACCEPT_FREE_TEXT_JSON="$(config_value fallback_accept_free_text_json)"
RETRY_ON_JSON_SCHEMA_COLD_START="$(config_value retry_on_json_schema_cold_start)"
PERMISSION_MODE_EFFECTIVE="${CLAUDE_PERMISSION_MODE_EXECUTE:-$PERMISSION_MODE_EXECUTE}"
ALLOWED_TOOLS="${CLAUDE_ALLOWED_TOOLS:-}"

render_prompt
write_settings_file >/dev/null

echo "[openclaw-adapter] mode=$EXECUTION_MODE" >>"$STDOUT_LOG"
echo "[openclaw-adapter] bin=$BIN source=$BIN_SOURCE" >>"$STDOUT_LOG"
echo "[openclaw-adapter] model=$MODEL" >>"$STDOUT_LOG"
echo "[openclaw-adapter] permission_mode=$PERMISSION_MODE_EFFECTIVE" >>"$STDOUT_LOG"
echo "[openclaw-adapter] allowed_tools=${ALLOWED_TOOLS:-<default>}" >>"$STDOUT_LOG"
echo "[openclaw-adapter] fallback_allow=$ALLOW_RESULT_JSON_FALLBACK root_json=$FALLBACK_ACCEPT_ROOT_JSON_STRING fenced_json=$FALLBACK_ACCEPT_SINGLE_FENCED_JSON free_text_json=$FALLBACK_ACCEPT_FREE_TEXT_JSON cold_start_retry=$RETRY_ON_JSON_SCHEMA_COLD_START" >>"$STDOUT_LOG"
echo "[openclaw-adapter] task=$TASK_SUMMARY" >>"$STDOUT_LOG"

after_success_validate_and_exit() {
  if ! validate_result >>"$STDOUT_LOG" 2>>"$STDERR_LOG"; then
    exit "$EXIT_INVALID_RESULT"
  fi
  exit "$EXIT_SUCCESS"
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  write_raw_json "$(python3 - "$REQUEST" "$BIN" "$SETTINGS_PATH" "$STRUCTURED_SCHEMA_PATH" <<'PY'
import json
import sys
from pathlib import Path
request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
payload = {
    'kind': 'dry_run',
    'bin': sys.argv[2],
    'settings_path': sys.argv[3],
    'structured_output_schema_path': sys.argv[4],
    'task_id': request.get('task_id'),
    'dispatch_id': request.get('dispatch_id'),
}
print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
)"
  result_json="$(build_result success $EXIT_SUCCESS 'dry-run completed; prompt and settings rendered without invoking Claude' "$TARGET_PATHS_JSON" '["dry-run"]' '["Claude execution skipped by --dry-run"]' '{"mode":"dry_run"}')"
  write_result "$result_json"
  after_success_validate_and_exit
fi

if [[ "$EXECUTION_MODE" == "sdk" ]]; then
  write_raw_json '{"status":"runtime_error","message":"sdk mode is not implemented in Phase 3"}'
  result_json="$(build_result runtime_error $EXIT_RUNTIME_ERROR 'sdk mode is not implemented in Phase 3' "$TARGET_PATHS_JSON" '["sdk path not available"]' '["implement SDK adapter or switch mode to mock/cli"]' '{"mode":"sdk"}')"
  write_result "$result_json"
  validate_result >>"$STDOUT_LOG" 2>>"$STDERR_LOG" || true
  exit "$EXIT_RUNTIME_ERROR"
fi

if [[ -z "$REQUEST_MOCK_MODE" && "$EXECUTION_MODE" == "mock" ]]; then
  REQUEST_MOCK_MODE="success"
fi

if [[ -n "$REQUEST_MOCK_MODE" ]]; then
  read -r mock_exit mock_status <<<"$(status_from_mock "$REQUEST_MOCK_MODE")"
  if [[ "$REQUEST_MOCK_MODE" == "invalid_result" ]]; then
    write_raw_json '{"kind":"mock","status":"invalid_result"}'
    write_result '{"task_id":"broken","status":"invalid_result"}'
    exit "$EXIT_INVALID_RESULT"
  fi
  write_raw_json "$(python3 - "$REQUEST" "$REQUEST_MOCK_MODE" "$SETTINGS_PATH" <<'PY'
import json
import sys
from pathlib import Path
request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
payload = {
    'kind': 'mock',
    'mock_mode': sys.argv[2],
    'task_id': request.get('task_id'),
    'dispatch_id': request.get('dispatch_id'),
    'settings_path': sys.argv[3],
}
print(json.dumps(payload, ensure_ascii=False, indent=2))
PY
)"
  result_json="$(build_result "$mock_status" "$mock_exit" "mock execution: $REQUEST_MOCK_MODE" "$TARGET_PATHS_JSON" '["mock verification"]' '["mock path"]' '{"mode":"mock"}')"
  write_result "$result_json"
  if [[ "$mock_exit" -eq 0 ]]; then
    after_success_validate_and_exit
  fi
  validate_result >>"$STDOUT_LOG" 2>>"$STDERR_LOG" || true
  exit "$mock_exit"
fi

if ! command -v "$BIN" >/dev/null 2>&1; then
  write_raw_json "$(python3 - "$BIN" <<'PY'
import json, sys
print(json.dumps({'status':'runtime_error','message':f'CLAUDE_CODE_BIN not found: {sys.argv[1]}'}, ensure_ascii=False, indent=2))
PY
)"
  result_json="$(build_result runtime_error $EXIT_RUNTIME_ERROR "CLAUDE_CODE_BIN not found: $BIN" '[]' '["runtime unavailable"]' '["configure CLAUDE_CODE_BIN or use mock/dry-run"]' '{"preflight":"bin_lookup"}')"
  write_result "$result_json"
  validate_result >>"$STDOUT_LOG" 2>>"$STDERR_LOG" || true
  exit "$EXIT_RUNTIME_ERROR"
fi

set +e
python3 "$ROOT/scripts/ensure_claude_auth.py" \
  --task-dir "$(dirname "$RESULT")" \
  --cli-bin "$BIN" \
  --auth-status-path "$(dirname "$RESULT")/auth-status.json" \
  --auth-log-path "$(dirname "$RESULT")/auth-preflight.log" \
  --execution-result-path "$RESULT" \
  --raw-path "$RAW_PATH" >/dev/null 2>>"$STDERR_LOG"
preflight_exit=$?
set -e
if [[ "$preflight_exit" -ne 0 ]]; then
  if [[ -f "$RESULT" ]]; then
    :
  else
    result_json="$(build_result runtime_error $EXIT_RUNTIME_ERROR 'Claude auth preflight failed' '[]' '["claude auth status --json"]' '["login with claude auth login or verify existing session"]' '{"preflight":"auth","auth_exit_code":'"$preflight_exit"',"result_code":"AUTH_REQUIRED","publishable":false}')"
    write_result "$result_json"
  fi
  validate_result >>"$STDOUT_LOG" 2>>"$STDERR_LOG" || true
  exit "$EXIT_RUNTIME_ERROR"
fi

attempt=0
max_attempts=$((RETRY_ON_JSON_SCHEMA_COLD_START + 1))
cli_exit=0
while true; do
  set +e
  invoke_claude_cli "$attempt"
  cli_exit=$?
  set -e

  if [[ "$cli_exit" -eq 124 ]]; then
    result_json="$(build_result timeout $EXIT_TIMEOUT 'executor timed out' "$TARGET_PATHS_JSON" '["timeout"]' '["increase timeout_sec or simplify prompt"]' '{"preflight":"auth_passed","retry_count":'"$attempt"'}')"
    write_result "$result_json"
    validate_result >>"$STDOUT_LOG" 2>>"$STDERR_LOG" || true
    exit "$EXIT_TIMEOUT"
  fi

  should_retry="$(python3 - "$RAW_PATH" "$USE_JSON_SCHEMA" "$attempt" "$max_attempts" <<'PY'
import json
import sys
from pathlib import Path

raw_path = Path(sys.argv[1])
use_json_schema = sys.argv[2].lower() == 'true'
attempt = int(sys.argv[3])
max_attempts = int(sys.argv[4])
if not use_json_schema or attempt != 0 or max_attempts <= 1:
    print('false')
    raise SystemExit(0)
text = raw_path.read_text(encoding='utf-8').strip() if raw_path.exists() else ''
if not text:
    print('true')
    raise SystemExit(0)
try:
    payload = json.loads(text)
except Exception:
    print('true')
    raise SystemExit(0)
if isinstance(payload, dict):
    if payload.get('status') == 'timeout':
        print('false')
        raise SystemExit(0)
    if payload.get('kind') == 'cli_capture':
        stdout = payload.get('stdout') or ''
        parse_error = payload.get('stdout_parse_error')
        print('true' if (not stdout.strip() or parse_error) else 'false')
        raise SystemExit(0)
    result_event = payload if payload.get('type') == 'result' else None
elif isinstance(payload, list):
    result_event = next((item for item in reversed(payload) if isinstance(item, dict) and item.get('type') == 'result'), None)
else:
    result_event = None
if not isinstance(result_event, dict):
    print('true')
    raise SystemExit(0)
raw_result = result_event.get('result')
structured_output = result_event.get('structured_output')
if structured_output is not None:
    print('false')
elif not raw_result or not str(raw_result).strip():
    print('true')
else:
    print('false')
PY
)"

  if [[ "$attempt" -eq 0 && "$cli_exit" -ne 0 && "$USE_JSON_SCHEMA" == "true" && "$RETRY_ON_JSON_SCHEMA_COLD_START" -ge 1 ]]; then
    should_retry="true"
  fi

  if [[ "$should_retry" == "true" && $((attempt + 1)) -lt "$max_attempts" ]]; then
    echo "[openclaw-adapter] cold-start retry triggered after attempt=$attempt exit=$cli_exit" >>"$STDOUT_LOG"
    attempt=$((attempt + 1))
    continue
  fi
  break
done

set +e
result_json="$(normalize_cli_result "$cli_exit" "$attempt" "$ALLOW_RESULT_JSON_FALLBACK" "$FALLBACK_ACCEPT_ROOT_JSON_STRING" "$FALLBACK_ACCEPT_SINGLE_FENCED_JSON" "$FALLBACK_ACCEPT_FREE_TEXT_JSON")"
normalize_exit=$?
set -e
write_result "$result_json"
if [[ "$normalize_exit" -eq 0 ]]; then
  after_success_validate_and_exit
fi
validate_result >>"$STDOUT_LOG" 2>>"$STDERR_LOG" || true
exit "$normalize_exit"

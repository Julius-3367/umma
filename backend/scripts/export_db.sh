#!/usr/bin/env bash
set -euo pipefail

# Simple DB export helper for the WTI project.
# Usage:
#   ./export_db.sh [--tables table1,table2] [--out /path/to/out.sql.gz]
# Or set DATABASE_URL in the environment before running.
# If DATABASE_URL is not set the script will try to read backend/.env in the repo.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

print_usage() {
  cat <<EOF
Usage: $0 [--tables table1,table2] [--out /path/to/out.sql.gz]

Options:
  --tables   Comma-separated list of tables to export (default: entire database)
  --out      Output file path (default: ./<dbname>_<YYYYMMDD_HHMM>.sql.gz)
  --help     Show this help

The script reads DATABASE_URL from the environment or from $ENV_FILE.
DATABASE_URL format: mysql://user:pass@host:port/dbname
EOF
}

TABLES=""
OUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tables)
      TABLES="$2"
      shift 2
      ;;
    --out)
      OUT="$2"
      shift 2
      ;;
    --help|-h)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      print_usage
      exit 2
      ;;
  esac
done

# Load DATABASE_URL from env or .env file
if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    # parse DATABASE_URL line (allow quotes)
    DB_LINE=$(grep -E '^\s*DATABASE_URL\s*=' "$ENV_FILE" || true)
    if [[ -n "$DB_LINE" ]]; then
      # extract value between = and end, remove surrounding quotes and export
      VAL=$(echo "$DB_LINE" | sed -E 's/^[^=]*=\s*//')
      VAL=$(echo "$VAL" | sed -E 's/^"(.*)"$/\1/')
      export DATABASE_URL="$VAL"
    fi
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Set it in the environment or in $ENV_FILE" >&2
  exit 2
fi

# Parse DATABASE_URL: mysql://user:pass@host:port/dbname
if [[ "$DATABASE_URL" =~ ^mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)$ ]]; then
  DB_USER=${BASH_REMATCH[1]}
  DB_PASS=${BASH_REMATCH[2]}
  DB_HOST=${BASH_REMATCH[3]}
  DB_PORT=${BASH_REMATCH[4]}
  DB_NAME=${BASH_REMATCH[5]}
else
  echo "DATABASE_URL format not recognized. Expected mysql://user:pass@host:port/dbname" >&2
  exit 2
fi

TIMESTAMP=$(date +%F_%H%M%S)
DEFAULT_OUT="${ROOT_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
OUT=${OUT:-$DEFAULT_OUT}

echo "Exporting database: $DB_NAME from $DB_HOST:$DB_PORT as user $DB_USER"
echo "Output: $OUT"

DUMP_CMD=(mysqldump -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" --single-transaction --quick --routines --triggers --events)

if [[ -n "$TABLES" ]]; then
  # Convert comma-separated list to array
  IFS=',' read -r -a TBL_ARR <<< "$TABLES"
  echo "Tables: ${TBL_ARR[*]}"
  DUMP_CMD+=("$DB_NAME")
  for t in "${TBL_ARR[@]}"; do
    DUMP_CMD+=("$t")
  done
else
  DUMP_CMD+=(--databases "$DB_NAME")
fi

# Execute dump and gzip
mkdir -p "$(dirname "$OUT")"
echo "Running: ${DUMP_CMD[*]} | gzip > $OUT"
"${DUMP_CMD[@]}" | gzip > "$OUT"

EXIT_CODE=$?
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "Export completed successfully: $OUT"
else
  echo "Export failed with exit code: $EXIT_CODE" >&2
fi

exit $EXIT_CODE

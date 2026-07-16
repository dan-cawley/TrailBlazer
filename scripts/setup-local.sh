#!/usr/bin/env bash

# Sets up a local TrailBlazer checkout after the Supabase project has been created.
# Usage: bash scripts/setup-local.sh

set -euo pipefail

readonly ENV_FILE=".env.local"
readonly ENV_TEMPLATE=".env.example"

print_error() {
  printf '\nError: %s\n' "$1" >&2
}

has_value() {
  local key="$1"
  local value
  value="$(sed -n -E "s/^${key}=(.*)$/\\1/p" "$ENV_FILE" | tail -n 1)"
  [[ -n "$value" && "$value" != *"your-project-ref"* && "$value" != *"your-publishable-key"* && "$value" != *"[YOUR-PASSWORD]"* ]]
}

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_TEMPLATE" "$ENV_FILE"
  printf 'Created %s from %s.\n' "$ENV_FILE" "$ENV_TEMPLATE"
  print_error "Add your Supabase URL, publishable key, and DATABASE_URL to .env.local, then run this script again."
  exit 1
fi

missing=()
for key in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY DATABASE_URL; do
  if ! has_value "$key"; then
    missing+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  print_error "Set these values in .env.local before continuing: ${missing[*]}"
  exit 1
fi

printf 'Installing dependencies…\n'
npm install

printf 'Generating the Prisma client…\n'
npm run db:generate

printf 'Applying database migrations…\n'
npx prisma migrate deploy

printf '\nLocal setup is complete.\n'
printf 'Before uploading a district calendar, run supabase/storage.sql once in the Supabase SQL Editor.\n'
printf 'Start the app with: npm run dev\n'

#!/bin/sh
set -eu

escaped_api_base_url=$(printf '%s' "${WEB_API_BASE_URL:-http://localhost:3001}" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__ANTIN_OS_CONFIG__ = {
  apiBaseUrl: "${escaped_api_base_url}"
};
EOF

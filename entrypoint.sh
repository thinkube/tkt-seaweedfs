#!/bin/bash

# Copyright Alejandro Martínez Corriá and the Thinkube contributors
# SPDX-License-Identifier: MIT

set -e

echo "=== SeaweedFS File Gateway Startup ==="
echo "SeaweedFS endpoint: ${SEAWEEDFS_ENDPOINT:-not set}"
echo "Listening on port 8080"

exec python3 /app/server.py

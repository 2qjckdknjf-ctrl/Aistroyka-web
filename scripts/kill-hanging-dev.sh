#!/usr/bin/env bash
# Kill background dev processes that can keep Node event loops alive.
# Run when tests or builds hang or to clean the environment.

set -e
pkill -f workerd || true
pkill -f jest-worker || true
pkill -f wrangler || true
pkill -f "next dev" || true

#!/usr/bin/env bash
pkill -f "workerd serve" 2>/dev/null || true
pkill -f wrangler 2>/dev/null || true
pkill -f "jest-worker/processChild" 2>/dev/null || true
pkill -f vitest 2>/dev/null || true
pkill -f playwright 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
echo "Background processes cleaned"

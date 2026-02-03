#!/bin/bash

# VB Desk Test Script
# Runs unit and integration tests

set -e

echo "Running tests..."
anchor test --skip-local-validator

echo "✅ All tests passed!"

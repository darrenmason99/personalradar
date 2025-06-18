#!/bin/bash
set -e

# Activate virtual environment
source ./.venv/bin/activate

# Set Python path for imports
export PYTHONPATH=.

# Run tests with verbose output
pytest tests/ -v 
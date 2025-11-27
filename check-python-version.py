#!/usr/bin/env python3
"""Helper script to check Python version"""
import sys

v = sys.version_info
if v.major == 3 and v.minor >= 10 and v.minor < 14:
    # Python 3.10-3.13
    sys.exit(0)
elif v.major == 3 and v.minor >= 14:
    # Python 3.14+
    sys.exit(1)
else:
    # Python < 3.10
    sys.exit(2)


#!/usr/bin/env python3
"""
Fix the filter_skills variable name conflict in intelligent_filtering.py
"""

import re

# Read the file
with open('app/routes/intelligent_filtering.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in filtering context only
# Pattern 1: if required_skills: in filtering blocks
content = re.sub(
    r'(\s+# Filter by required skills\s+)if required_skills:',
    r'\1if filter_skills:',
    content
)

# Pattern 2: required_skills_list = [s.strip().lower() for s in required_skills.split(',')]
content = re.sub(
    r'filter_skills_list = \[s\.strip\(\)\.lower\(\) for s in required_skills\.split\(\',\'\)\]',
    r'filter_skills_list = [s.strip().lower() for s in filter_skills.split(\',\')]',
    content
)

# Pattern 3: logger.info with required_skills_list
content = re.sub(
    r'logger\.info\(f\"🔍 Filter: required_skills = \{required_skills_list\}',
    r'logger.info(f"🔍 Filter: required_skills = {filter_skills_list}',
    content
)

# Pattern 4: filters_applied with required_skills
content = re.sub(
    r'if required_skills:\s+filters_applied\.append\(f\"skills contain: \{required_skills\}\"\)',
    r'if filter_skills:\n                filters_applied.append(f"skills contain: {filter_skills}")',
    content
)

# Write back
with open('app/routes/intelligent_filtering.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fixed filter_skills variable names in intelligent_filtering.py')

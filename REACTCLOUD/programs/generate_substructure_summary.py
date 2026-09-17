#!/usr/bin/env python3
"""
Script to generate substructure summary tables from SDF files referenced in
readsubsset.sh and extrasubs.sh.

Outputs generated in REACTCLOUD/programs:
  - Summary.csv (Flat CSV format, 1 row per substructure)
  - Summary.xls (HTML-based Excel file with styled headers, blue text for Q-classes, red text for duplicates)
  - Summary.md  (Markdown table format)
  - Summary     (Plain flat CSV format)
"""

import os
import sys
import re
import csv
from collections import defaultdict

# -----------------------------------------------------------------------------
# Path Resolution
# -----------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REACTCLOUD_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

REACTROOT = os.environ.get("REACTROOT", REACTCLOUD_DIR)
SUBS_DIR = os.path.join(REACTROOT, "data", "mol", "subs")
READSUBS_PATH = os.path.join(REACTROOT, "programs", "setup", "readsubsset.sh")
EXTRASUBS_PATH = os.path.join(REACTROOT, "programs", "setup", "extrasubs.sh")
OUTPUT_DIR = os.path.join(REACTROOT, "programs")

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------
def get_stems_from_script(script_path):
    """Extract substructure stem names from $PROGRAM or #$PROGRAM lines in setup scripts."""
    stems = []
    if not os.path.exists(script_path):
        print(f"Warning: Script path not found: {script_path}", file=sys.stderr)
        return stems
    with open(script_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            l = line.strip()
            if l.startswith("$PROGRAM") or l.startswith("#$PROGRAM"):
                parts = l.split()
                if len(parts) >= 2:
                    stems.append(parts[1])
    return stems

def name_to_class(name):
    """
    Map parenthesized substitution patterns:
      - Parentheses containing 'h' and 'r' -> (X), (XX), (XXX), etc.
      - Parentheses containing 'q' -> (Q), (QQ), (QQQ), etc.
    """
    def repl_paren(m):
        content = m.group(1)
        if all(c in "hr" for c in content) and len(content) > 0:
            return "(" + "X" * len(content) + ")"
        elif all(c in "q" for c in content) and len(content) > 0:
            return "(" + "Q" * len(content) + ")"
        elif all(c in "hrq" for c in content) and len(content) > 0:
            return "(" + "Q" * len(content) + ")"
        return m.group(0)
    
    return re.sub(r"\(([hrq]+)\)", repl_paren, name)

# -----------------------------------------------------------------------------
# Main Generation Workflow
# -----------------------------------------------------------------------------
def main():
    print(f"Reading setup scripts from: {READSUBS_PATH} and {EXTRASUBS_PATH}")
    stems = get_stems_from_script(READSUBS_PATH) + get_stems_from_script(EXTRASUBS_PATH)
    
    # Preserve unique stem list order
    unique_stems = []
    seen = set()
    for s in stems:
        if s not in seen:
            seen.add(s)
            unique_stems.append(s)

    class_file_map = defaultdict(list)
    sub_file_map = defaultdict(list)
    file_class_subs = defaultdict(lambda: defaultdict(list))

    total_substructures = 0
    parsed_files_count = 0

    for stem in unique_stems:
        fname = stem + ".sdf"
        sdf_path = os.path.join(SUBS_DIR, fname)
        if not os.path.exists(sdf_path):
            continue
        
        parsed_files_count += 1
        with open(sdf_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        
        for i in range(2, len(lines)):
            if lines[i-1].strip().startswith("-CPSS-"):
                n = lines[i].strip()
                cname = name_to_class(n)
                file_class_subs[fname][cname].append(n)
                class_file_map[cname].append(fname)
                sub_file_map[n].append(fname)
                total_substructures += 1

    dup_class_names = set(c for c, f_list in class_file_map.items() if len(set(f_list)) > 1)
    dup_sub_names = set(s for s, f_list in sub_file_map.items() if len(f_list) > 1)

    table_entries = []
    for fname, classes in file_class_subs.items():
        for cname, subs in classes.items():
            is_dup = (cname in dup_class_names) or any(s in dup_sub_names for s in subs)
            has_q = ("Q" in cname) or ("q" in cname.lower()) or any("q" in s.lower() for s in subs)
            
            table_entries.append({
                "filename": fname,
                "class_name": cname,
                "substructures": subs,
                "is_duplicate": is_dup,
                "has_q": has_q
            })

    # Sort entries by Class Name (case-insensitive), then by Filename
    table_entries.sort(key=lambda x: (x["class_name"].lower(), x["filename"].lower()))

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Write Summary.csv (Flat CSV format, 1 row per substructure for clean Excel import)
    flat_csv_path = os.path.join(OUTPUT_DIR, "Summary.csv")
    with open(flat_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Filename", "Class Name", "Substructure", "Status"])
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            if entry["is_duplicate"] and entry["has_q"]:
                status = "DUPLICATE (Q-CLASS)"
            elif entry["is_duplicate"]:
                status = "DUPLICATE"
            elif entry["has_q"]:
                status = "Q-CLASS"
            else:
                status = "UNIQUE"
                
            for sub in entry["substructures"]:
                writer.writerow([fname, cname, sub, status])

    # 2. Write Summary.xls (HTML-based Excel file with styled headers, blue text for Q-classes, red text for duplicates)
    xls_path = os.path.join(OUTPUT_DIR, "Summary.xls")
    with open(xls_path, "w", encoding="utf-8") as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  th { background-color: #1F497D; color: white; font-weight: bold; border: 1px solid #95B3D7; padding: 6px 12px; text-align: left; }
  td { border: 1px solid #D9D9D9; padding: 5px 10px; vertical-align: top; }
  tr:nth-child(even) { background-color: #F2F5F8; }
  .dup { color: #C00000; font-weight: bold; }
  .qclass { color: #002060; font-weight: bold; }
  .dup-q { color: #900000; font-weight: bold; }
  .sub-list { font-family: Consolas, monospace; font-size: 10pt; }
</style>
</head>
<body>
<table>
<thead>
  <tr>
    <th>Filename</th>
    <th>Class Name</th>
    <th>Substructures</th>
    <th>Status</th>
  </tr>
</thead>
<tbody>
""")
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            is_dup = entry["is_duplicate"]
            has_q = entry["has_q"]
            
            if is_dup and has_q:
                c_class = ' class="dup-q"'
                status_html = '<span class="dup">DUPLICATE</span> <span class="qclass">(Q-CLASS)</span>'
            elif is_dup:
                c_class = ' class="dup"'
                status_html = '<span class="dup">DUPLICATE</span>'
            elif has_q:
                c_class = ' class="qclass"'
                status_html = '<span class="qclass">Q-CLASS</span>'
            else:
                c_class = ''
                status_html = 'UNIQUE'

            subs_html = "<br>".join(entry["substructures"])
            f.write('  <tr>\n')
            f.write('    <td>' + fname + '</td>\n')
            f.write('    <td' + c_class + '>' + cname + '</td>\n')
            f.write('    <td class="sub-list">' + subs_html + '</td>\n')
            f.write('    <td>' + status_html + '</td>\n')
            f.write('  </tr>\n')
        f.write("""</tbody>
</table>
</body>
</html>
""")

    # 3. Write Summary.md (Markdown format)
    md_path = os.path.join(OUTPUT_DIR, "Summary.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# Substructure Summary\n\n")
        f.write("| Filename | Class Name | Substructures | Status |\n")
        f.write("| --- | --- | --- | --- |\n")
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            is_dup = entry["is_duplicate"]
            has_q = entry["has_q"]
            
            if is_dup and has_q:
                c_display = '<font color="red">**' + cname + '**</font>'
                status_str = '<font color="red">DUPLICATE</font> / <font color="blue">Q-CLASS</font>'
            elif is_dup:
                c_display = '<font color="red">**' + cname + '**</font>'
                status_str = '<font color="red">DUPLICATE</font>'
            elif has_q:
                c_display = '<font color="blue">**' + cname + '**</font>'
                status_str = '<font color="blue">Q-CLASS</font>'
            else:
                c_display = cname
                status_str = 'UNIQUE'
                
            subs_html = "<br>".join(entry["substructures"])
            f.write("| " + fname + " | " + c_display + " | " + subs_html + " | " + status_str + " |\n")

    # 4. Write Summary plain file (CSV)
    summary_plain_path = os.path.join(OUTPUT_DIR, "Summary")
    with open(summary_plain_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Filename", "Class Name", "Substructure", "Status"])
        for entry in table_entries:
            fname = entry["filename"]
            cname = entry["class_name"]
            if entry["is_duplicate"] and entry["has_q"]:
                status = "DUPLICATE (Q-CLASS)"
            elif entry["is_duplicate"]:
                status = "DUPLICATE"
            elif entry["has_q"]:
                status = "Q-CLASS"
            else:
                status = "UNIQUE"
                
            for sub in entry["substructures"]:
                writer.writerow([fname, cname, sub, status])

    print("Summary generation complete:")
    print(f"  Processed {parsed_files_count} SDF files ({total_substructures} substructures across {len(table_entries)} class entries).")
    print(f"  Summary.csv: {flat_csv_path}")
    print(f"  Summary.xls: {xls_path}")
    print(f"  Summary.md:  {md_path}")
    print(f"  Summary:     {summary_plain_path}")

if __name__ == "__main__":
    main()

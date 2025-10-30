import os
import xml.etree.ElementTree as ET
from collections import defaultdict


def strip_ns(tag: str) -> str:
    """Remove {namespace} from an XML tag."""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def collect_xml_shape(elem, path="", paths=None, attrs=None):
    """
    Walk XML and collect:
      - paths like 'AUSZUG_V2_RESPONSE/FIRMA/FI_DKZ03/PLZ'
      - attributes per path (names only, no values)
    """
    if paths is None:
        paths = set()
    if attrs is None:
        attrs = defaultdict(set)

    tag = strip_ns(elem.tag)
    current_path = f"{path}/{tag}" if path else tag

    paths.add(current_path)

    # collect attribute NAMES (strip ns too)
    for raw_name in elem.attrib:
        # attribute can also have a namespace; we only care about the local name
        name = raw_name.split("}", 1)[-1] if "}" in raw_name else raw_name
        attrs[current_path].add(name)

    for child in elem:
        collect_xml_shape(child, current_path, paths, attrs)

    return paths, attrs


def compare_shapes(base_paths, base_attrs, other_paths, other_attrs):
    missing_paths = base_paths - other_paths  # in base but not in other
    extra_paths = other_paths - base_paths  # in other but not in base

    attr_diffs = {}
    for p in base_paths & other_paths:
        base_a = base_attrs.get(p, set())
        other_a = other_attrs.get(p, set())
        miss_a = base_a - other_a
        extra_a = other_a - base_a
        if miss_a or extra_a:
            attr_diffs[p] = (miss_a, extra_a)

    return missing_paths, extra_paths, attr_diffs


def analyze_xml_folder(folder: str):
    files = [
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if f.lower().endswith(".xml")
    ]
    if not files:
        print("No XML files found.")
        return

    print(f"Found {len(files)} XML files.\n")

    # use the first file as the canonical XML
    base_file = files[0]
    base_tree = ET.parse(base_file)
    base_root = base_tree.getroot()
    base_paths, base_attrs = collect_xml_shape(base_root)

    print(f"Reference file: {os.path.basename(base_file)}")
    print(f"Reference element paths: {len(base_paths)}")
    print()

    same_count = 0
    results = []

    for fpath in files:
        tree = ET.parse(fpath)
        root = tree.getroot()
        paths, attrs = collect_xml_shape(root)

        missing_paths, extra_paths, attr_diffs = compare_shapes(
            base_paths, base_attrs, paths, attrs
        )
        is_same = not missing_paths and not extra_paths and not attr_diffs
        if is_same:
            same_count += 1

        results.append(
            {
                "file": fpath,
                "is_same": is_same,
                "missing_paths": missing_paths,
                "extra_paths": extra_paths,
                "attr_diffs": attr_diffs,
            }
        )

    # -------------- report --------------
    print("=== SUMMARY ===")
    print(f"Total XML files: {len(files)}")
    print(f"Same structure as reference: {same_count}")
    print(f"Different structure: {len(files) - same_count}")
    print()

    for r in results:
        name = os.path.basename(r["file"])
        if r["is_same"]:
            print(f"[OK]   {name}")
        else:
            print(f"[DIFF] {name}")
            if r["missing_paths"]:
                print("  missing element paths:")
                for p in sorted(r["missing_paths"]):
                    print(f"    - {p}")
            if r["extra_paths"]:
                print("  extra element paths:")
                for p in sorted(r["extra_paths"]):
                    print(f"    + {p}")
            if r["attr_diffs"]:
                print("  attribute differences:")
                for p, (miss_a, extra_a) in r["attr_diffs"].items():
                    if miss_a:
                        print(f"    {p}: missing attrs: {', '.join(sorted(miss_a))}")
                    if extra_a:
                        print(f"    {p}: extra attrs: {', '.join(sorted(extra_a))}")
            print()


if __name__ == "__main__":
    # change this to your directory with XMLs
    analyze_xml_folder("./xml_input")

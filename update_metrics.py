#!/usr/bin/env python3
"""Rewrite the citation figures across every page of the site.

Reads CITATIONS, H_INDEX and I10_INDEX from the environment and updates every
element tagged data-metric="..." in the HTML at the repository root, plus the
"as of" date. Refuses anything that is not a plausible integer, so a typo in the
form cannot put nonsense on the live page.
"""

import datetime
import glob
import os
import re
import sys

LIMITS = {"citations": (0, 1_000_000), "h_index": (0, 500), "i10_index": (0, 5000)}


def read(name):
    raw = (os.environ.get(name.upper()) or "").strip().replace(",", "")
    if not raw.isdigit():
        sys.exit("ERROR: %s must be a whole number, got %r" % (name, raw))
    value = int(raw)
    low, high = LIMITS[name]
    if not low <= value <= high:
        sys.exit("ERROR: %s = %d is outside the plausible range %d-%d"
                 % (name, value, low, high))
    return str(value)


def main():
    values = {name: read(name) for name in LIMITS}
    values["asof"] = datetime.date.today().strftime("%B %Y")

    pattern = re.compile(r'(<(span|dd)\s+data-metric="([a-z0-9_]+)"[^>]*>)[^<]*(</\2>)')
    changed, total = [], 0

    for path in sorted(glob.glob("*.html")):
        before = open(path, encoding="utf-8").read()
        hits = [0]

        def repl(m):
            value = values.get(m.group(3))
            if value is None:
                return m.group(0)
            hits[0] += 1
            return m.group(1) + value + m.group(4)

        after = pattern.sub(repl, before)
        total += hits[0]
        if after != before:
            open(path, "w", encoding="utf-8").write(after)
            changed.append("%s (%d)" % (path, hits[0]))

    print("citations=%(citations)s  h-index=%(h_index)s  i10=%(i10_index)s  "
          "as of %(asof)s" % values)
    print("tagged elements found: %d" % total)
    print("files changed: %s" % (", ".join(changed) or "none"))

    if total == 0:
        sys.exit("ERROR: no data-metric elements found - is this the right repository?")


if __name__ == "__main__":
    main()

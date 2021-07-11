import sys
import subprocess

# implement pip as a subprocess:
requirements = ["requests", "numpy", "nltk", "flair", "ip2geotools", "ipinfo", "datetime", "stanza", "pandas", "termcolor"]
for pkg in requirements:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', pkg])


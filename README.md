<div align="center">

# 🗃️ HackTheBox Walkthroughs

![Machines](https://img.shields.io/badge/Machines-11-blue?style=flat-square)
![Rooted](https://img.shields.io/badge/Fully%20Rooted-9-success?style=flat-square)
![WIP](https://img.shields.io/badge/In%20Progress-2-yellow?style=flat-square)

Evidence-first, reproducible writeups documenting methodology, exploitation chains, and remediation for every box.

`BUILD // ATTACK // DETECT // DOCUMENT`

</div>

---

## 📋 Machines

| Machine | OS | Difficulty | Key Technique | Status |
|---|:---:|:---:|---|:---:|
| [Kobold](./kobold.md) | 🐧 Linux | Easy | Unauth MCP RCE → Docker group → root | ✅ Rooted |
| [Facts](./facts.md) | 🐧 Linux | Easy | Open registration → LFI → SSH key crack → `facter` sudo abuse | ✅ Rooted |
| [Nibbles](./nibbles.md) | 🐧 Linux | Easy | Leaky private dir → CVE-2015-6967 → sudo misconfig | ✅ Rooted |
| [Devel](./devel.md) | 🪟 Windows | Easy | Anonymous FTP write to IIS webroot | 🟡 WIP |
| [Job](./job.md) | 🪟 Windows | Medium | Open SMTP relay phishing → macro RCE → PrintSpoofer | ✅ Rooted |
| [Bitlab](./bitlab.md) | 🐧 Linux | Medium | Leaked creds in obfuscated JS (GitLab) | 🟡 WIP |
| [Pterodactyl](./pterodactyl.md) | 🐧 Linux | Medium | LFI → PEAR RCE → CVE-2021-3802 (udisks2) | ✅ Rooted |
| [Browsed](./browsed.md) | 🐧 Linux | Medium | Malicious Chrome extension → SSRF → `.pyc` cache poisoning | ✅ Rooted |
| [Bizness](./bizness.md) | 🐧 Linux | Medium | Apache OFBiz pre-auth RCE → Derby DB hash → password reuse | ✅ Rooted |
| [Overwatch](./overwatch.md) | 🪟 Windows AD | Medium | Guest SMB → SQL linked-server leak → WCF command injection | ✅ Rooted |
| [Principal](./principal.md) | 🐧 Linux | Medium | pac4j JWT forgery (CVE-2026-29000) → leaked SSH CA key | ✅ Rooted |

---

## 🏷️ By Technique

**Web / API Exploitation**
[Principal](./principal.md) · [Pterodactyl](./pterodactyl.md) · [Bizness](./bizness.md) · [Nibbles](./nibbles.md) · [Facts](./facts.md) · [Kobold](./kobold.md)

**Active Directory**
[Overwatch](./overwatch.md)

**Phishing / Client-Side**
[Job](./job.md) · [Browsed](./browsed.md)

**Credential Exposure / Reuse**
[Bitlab](./bitlab.md) · [Bizness](./bizness.md) · [Overwatch](./overwatch.md)

**Misconfiguration (sudo, ACLs, permissions)**
[Nibbles](./nibbles.md) · [Job](./job.md) · [Kobold](./kobold.md) · [Devel](./devel.md)

---

## 🎯 Format

Every writeup follows the same structure: recon, narrative walkthrough of the foothold and privilege-escalation chain, an attack-timeline, and a remediation table mapping each finding to a fix. IP addresses and flag values are redacted throughout — the methodology is the point, not the specific lab instance.

Two entries are marked **WIP** — recon and the confirmed vulnerability are documented, but the full exploitation chain and proof weren't logged and will be backfilled.

---

<div align="center">

*Maintained by [Dylans7j](https://github.com/Dylans7j) — see the [profile README](https://github.com/Dylans7j/Dylans7j) for the full security portfolio.*

</div>

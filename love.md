# Love — Hack The Box walkthrough

**Platform:** Hack The Box (retired machine)  
**OS / difficulty:** Windows / Easy  
**Outcome:** User shell obtained; `NT AUTHORITY\SYSTEM` verified  
**Scope:** Authorized HTB lab. Target and VPN addresses, flags, and recovered password are omitted from this public version.

## Executive summary

The target hosted a Voting System on HTTP port 80 and a separate staging site. The staging site's URL checker fetched an otherwise inaccessible local web endpoint on port 5000 and exposed a Voting System administrator credential. After authenticating, an unrestricted image upload in the application's voter workflow allowed a PHP file to execute. Local enumeration found `AlwaysInstallElevated` enabled in both machine and user policy hives. Installing a controlled MSI from the low-privilege shell produced a new shell whose `whoami` output was `nt authority\system`.

## Reconnaissance

```bash
nmap -sVC -p- TARGET -T3 --min-rate 5000 -oA Love
```

The scan showed Apache/PHP on port 80 (Voting System), Apache endpoints on 443 and 5000 returning HTTP 403, SMB on 445, WinRM on 5985/5986, and a TLS certificate naming `staging.love.htb`. The exposed services were leads, not vulnerabilities by themselves. The initial scan took about 193 seconds. Direct requests to port 5000 returned 403.

The staging site was reachable over **HTTP** at `http://staging.love.htb/beta.php`; HTTPS on port 443 returned 403. Its file checker accepted a URL. Supplying `http://127.0.0.1:5000/` caused the application to fetch the password dashboard from the target's own loopback interface. The dashboard displayed the Voting System admin credential. This demonstrates server-side request forgery (SSRF) crossing the web service's access boundary. Do not put the password in a public screenshot or repository.

## Authenticated upload and foothold

The credentials authenticated to the application's `/admin/` path. An authenticated Voting System 1.0 upload PoC targeted `admin/voters_add.php`, submitted a PHP file as the voter `photo`, and requested it from `/images/`. The original PoC assumed `/votesystem/admin/`, which returned 404 on this instance; removing `/votesystem` corrected the paths. The PoC's HTTP 200 checks alone were weak evidence, but the listener received a connection from the HTB target and presented a Windows command shell at `C:\xampp\htdocs\omrs\images>`.

The third-party PoC contained an opaque encoded executable. Its exact payload is intentionally excluded here. Review downloaded exploits before running them; a simpler controlled upload can validate the same vulnerability. The admin credential was an application credential: a test against SMB returned `STATUS_LOGON_FAILURE`, which did not invalidate the web login.

## Local privilege escalation

`whoami /priv` showed no obvious impersonation or backup privilege. Both required Windows Installer policy values were present:

```text
HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer
  AlwaysInstallElevated    REG_DWORD    0x1
HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer
  AlwaysInstallElevated    REG_DWORD    0x1
```

This configuration permits a low-privilege user to install an MSI with elevated installer privileges. A test MSI was transferred over the HTB VPN. The first attempt did not produce a callback because the MSI was not present at the assumed `C:\Windows\Temp\` path. A later directory listing confirmed a 159,744-byte MSI in the writable application images directory. Executing `msiexec /i` against that verified path yielded a second connection. In the new shell:

```text
C:\WINDOWS\system32>whoami
nt authority\system
```

The SYSTEM identity is directly supported by the provided terminal screenshot. Flag values were not included in the evidence supplied for this article; no flag value or submission is claimed here.

## Evidence and limits

| Observation | Evidence supplied | Confidence |
| --- | --- | --- |
| Web services and staging hostname | Nmap output and HTTP responses | High |
| Loopback URL fetch exposed the password dashboard | Browser screenshot | High |
| Upload yielded a Windows shell | PoC output and inbound listener screenshot | High |
| Both Installer policy values were `0x1` | Registry command output | High |
| MSI existed at the corrected path | Directory listing in terminal screenshot | High |
| SYSTEM access | New shell's `whoami` screenshot | High |

The screenshots shared for review also contain transient HTB/VPN IPs and an application password. They are omitted from this public draft. The exact MSI command line after the corrected download is visible in the supplied screenshot; an installer log and flag capture were not supplied. This account is based on the user's lab output, not an independent execution by the authoring assistant.

## Remediation and detection

- Restrict URL-checker destinations and schemes; resolve and validate addresses, block loopback and internal ranges, and enforce egress policy to prevent SSRF.
- Keep sensitive dashboards inaccessible even from local web callers; require authentication and avoid plaintext credential display.
- Validate upload content server-side, use safe generated filenames, store files outside executable web directories, and disable PHP execution in upload paths.
- Set `AlwaysInstallElevated` to disabled in both HKLM and HKCU policies; monitor policy changes and MSI installation from user-writable directories.
- Correlate web requests to staging's URL checker, unusual access to `/images/*.php`, Apache child process creation, and Windows Installer events. Tune for expected administrative software deployment.

## Lessons learned

An HTTP 403 on a directly accessed service did not prove the service was unreachable from another application on the same host. Treat exploit scripts' printed success messages as hypotheses until a shell and the intended security context are verified. When file transfer claims success, confirm the file exists at the exact path before executing it.

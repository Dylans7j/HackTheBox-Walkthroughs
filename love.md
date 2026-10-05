# Love — Security Assessment

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Operating system | Windows |
| Difficulty | Easy |
| Assessment date | Not recorded (from existing notes; timezone not recorded) |
| Author | Dylan Senez / d4rkgunn3r |
| Review status | Proposed revision; publication eligibility and evidence review pending |

## 1. Executive summary

The reviewed report documents a staging URL checker exposing an internal credential dashboard, an authenticated upload producing a Windows shell, and Windows Installer policy elevation to SYSTEM.

## 2. Scope and authorization

This account concerns the assigned HTB laboratory target only. Target addresses, VPN information, secrets, and flag contents are excluded. This revision analyzes recorded work; no assessment commands were executed during the editorial review. Machine retirement status has not been freshly verified.

## 3. Methodology and reproducibility

Discovery → service analysis → recorded access path → privilege/impact assessment → evidence review → remediation. Commands below support authorized discovery and identity verification. Exploitation is described at the finding level; operational payloads and secret-extraction procedures are omitted.

Set the address of the currently assigned lab instance before discovery:

```bash
export TARGET_IP='REPLACE_WITH_ASSIGNED_LAB_IP'
mkdir -p evidence/love/{scans,screenshots}
nmap -sV -p 80,443,445,5000,5985,5986 -oA evidence/love/scans/services "$TARGET_IP"
```

This is a proposed targeted confirmation command, not the original full-port scan. Nmap creates traffic and local output files. Record tool versions, instance date, and timezone; compare results with the observations below rather than assuming the same services are still present.

## 4. Reconnaissance and service analysis

HTTP Voting System; staging hostname from TLS certificate; direct local-dashboard service access returned HTTP 403. Direct denial did not establish denial to server-originated requests.

> **EV-001 — Evidence placeholder:** add the reviewed service-scan excerpt and screenshot here. Remove sensitive identifiers. No screenshot file is claimed to exist at this placeholder.

## 5. Recorded initial-access path

The URL checker reached the local dashboard from the server context. Application authentication and an executable upload yielded a shell. The report distinguishes PoC success messages from the received shell and records correction of an incorrect application base path.

> **EV-002 — Evidence placeholder:** add a sanitized artifact establishing the behavior and resulting identity. An HTTP success response or tool success message alone does not prove code execution.

## 6. Privilege escalation and impact validation

Both HKLM and HKCU AlwaysInstallElevated values were 0x1. An initial installation failed because the file was absent at the assumed path. A later verified file location led to a new shell with nt authority\system.

In an already authorized session, record identity without reading objective contents:

```powershell
whoami
hostname
whoami /priv
```

These are proposed identity-verification commands, not a claim of rerunning the assessment. Windows privilege enumeration does not prove successful elevation; Linux sudo policy alone does not prove a root session.

> **EV-003 — Evidence placeholder:** add policy/permission evidence and the resulting identity or access proof. Never include flags, tokens, private keys, hashes of credentials, or password values.

## 7. Evidence register and limitations

| ID | Required artifact | Current status |
| --- | --- | --- |
| EV-001 | Service inventory and timestamped scan excerpt | Text observations available; original artifact review pending |
| EV-002 | Initial-access behavior and identity proof | Existing narrative reviewed; sanitized artifact pending |
| EV-003 | Privilege boundary and impact proof | Reported in narrative; original artifact review pending |

SYSTEM identity is supported by the prior evidence review; original screenshots are excluded because they contain sensitive values and addresses.

The source is [the existing repository note](https://github.com/Dylans7j/HackTheBox-Walkthroughs/blob/main/love.md), reviewed at blob SHA `0c044390e93c9e49aa28bff7dd413daae2b29cce`, plus [the repository source review](./EVIDENCE-REVIEW.md). 

A Rooted status is not a substitute for a terminal transcript. Reported results are attributed to the existing notes; they have not been independently reproduced in this review. CVE numbers, fixed-version claims, unsupported timing claims, and numerical severity scores are withheld where primary-source verification is missing.

## 8. Findings and remediation

| ID | Finding / review target | Remediation |
| --- | --- | --- |
| F-001 | SSRF and credential dashboard exposure | Validate resolved destinations and redirects, enforce egress restrictions, and authenticate sensitive dashboards. |
| F-002 | Executable upload | Validate content; store uploads outside executable directories and disable script execution. |
| F-003 | Elevated installer policy | Disable AlwaysInstallElevated in both policy hives and validate effective settings. |

Prioritize the boundary failures that enable access or elevation. Set final severity after confirming prerequisites, affected privileges, and original evidence.

## 9. Detection opportunities

URL-checker requests correlated with local dashboard access; executable uploads and Apache child processes; MSI installation from user-writable directories. Tune for authorized software deployment.

Collect relevant application, authentication, process, and file-change logs. Correlate events by account, host, and time; a single suspicious request is not proof of successful compromise. These are detection proposals, not tested rules or observed telemetry.

## 10. Remediation validation

Verify corrected permissions and authentication/authorization policy using approved test accounts and administrative configuration review. Confirm exposed secrets were rotated and removed from distributed artifacts. Validate that legitimate workflows still function and monitoring captures permitted test activity. Preserve before/after evidence without exposing sensitive values.

## 11. Lessons learned and remaining work

Use observed identities and access results to establish impact. Keep service exposure separate from validated weaknesses and distinguish suggested methods from executed steps. Before publication, resolve the gaps in Sections 5–7, verify platform permission, and review every image and output for secrets.

[Back to walkthrough inventory](./README.md)

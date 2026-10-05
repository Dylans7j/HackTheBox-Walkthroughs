# Browsed — Security Assessment

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Operating system | Linux |
| Difficulty | Medium |
| Assessment date | 2026-01-17 (from existing notes; timezone not recorded) |
| Author | Dylan Senez / d4rkgunn3r |
| Review status | Proposed revision; publication eligibility and evidence review pending |

## 1. Executive summary

The notes describe an extension-review workflow reaching an internal application, command execution as larry, and privileged execution through a writable Python import cache.

## 2. Scope and authorization

This account concerns the assigned HTB laboratory target only. Target addresses, VPN information, secrets, and flag contents are excluded. This revision analyzes recorded work; no assessment commands were executed during the editorial review. Machine retirement status has not been freshly verified.

## 3. Methodology and reproducibility

Discovery → service analysis → recorded access path → privilege/impact assessment → evidence review → remediation. Commands below support authorized discovery and identity verification. Exploitation is described at the finding level; operational payloads and secret-extraction procedures are omitted.

Set the address of the currently assigned lab instance before discovery:

```bash
export TARGET_IP='REPLACE_WITH_ASSIGNED_LAB_IP'
mkdir -p evidence/browsed/{scans,screenshots}
nmap -sV -p 22,80 -oA evidence/browsed/scans/services "$TARGET_IP"
```

This is a proposed targeted confirmation command, not the original full-port scan. Nmap creates traffic and local output files. Record tool versions, instance date, and timezone; compare results with the observations below rather than assuming the same services are still present.

## 4. Reconnaissance and service analysis

22 OpenSSH 9.6p1; 80 nginx 1.24.0. Extension samples and an internal Gitea repository informed the investigation.

> **EV-001 — Evidence placeholder:** add the reviewed service-scan excerpt and screenshot here. Remove sensitive identifiers. No screenshot file is claimed to exist at this placeholder.

## 5. Recorded initial-access path

The workflow loaded submitted extension code in a browser context. The notes report access to an internal Flask application and execution as uid=1000(larry). Browser-mediated requests should not automatically be classified as server-side SSRF.

> **EV-002 — Evidence placeholder:** add a sanitized artifact establishing the behavior and resulting identity. An HTTP success response or tool success message alone does not prove code execution.

## 6. Privilege escalation and impact validation

A sudo-authorized Python script imported code from a cache directory writable by the low-privilege account. The recorded transcript reports a root shell. The security boundary failure is untrusted writable code entering privileged execution, rather than Python caching being intrinsically vulnerable.

In an already authorized session, record identity without reading objective contents:

```bash
id
hostname
sudo -l
```

These are proposed identity-verification commands, not a claim of rerunning the assessment. Windows privilege enumeration does not prove successful elevation; Linux sudo policy alone does not prove a root session.

> **EV-003 — Evidence placeholder:** add policy/permission evidence and the resulting identity or access proof. Never include flags, tokens, private keys, hashes of credentials, or password values.

## 7. Evidence register and limitations

| ID | Required artifact | Current status |
| --- | --- | --- |
| EV-001 | Service inventory and timestamped scan excerpt | Text observations available; original artifact review pending |
| EV-002 | Initial-access behavior and identity proof | Existing narrative reviewed; sanitized artifact pending |
| EV-003 | Privilege boundary and impact proof | Reported in narrative; original artifact review pending |

Root shell reported; original screenshot and cache-permission evidence are missing from the reviewed attachments.

The source is [the existing repository note](https://github.com/Dylans7j/HackTheBox-Walkthroughs/blob/main/browsed.md), reviewed at blob SHA `c68b8caaf746f3af48ca7533255349102d18d805`, plus [the repository source review](./EVIDENCE-REVIEW.md). 

A Rooted status is not a substitute for a terminal transcript. Reported results are attributed to the existing notes; they have not been independently reproduced in this review. CVE numbers, fixed-version claims, unsupported timing claims, and numerical severity scores are withheld where primary-source verification is missing.

## 8. Findings and remediation

| ID | Finding / review target | Remediation |
| --- | --- | --- |
| F-001 | Untrusted extension execution | Review extensions in isolated disposable environments with restricted network access and permissions. |
| F-002 | Internal application command injection | Replace shell evaluation with structured operations and validate input; authenticate internal services. |
| F-003 | Writable privileged import path | Make scripts, modules, caches, and parent directories administrator-owned and non-writable to unprivileged users. |

Prioritize the boundary failures that enable access or elevation. Set final severity after confirming prerequisites, affected privileges, and original evidence.

## 9. Detection opportunities

Extension installation and network activity; internal app child processes; Python cache writes followed by privileged script execution. Tune for approved extension testing and deployments.

Collect relevant application, authentication, process, and file-change logs. Correlate events by account, host, and time; a single suspicious request is not proof of successful compromise. These are detection proposals, not tested rules or observed telemetry.

## 10. Remediation validation

Verify corrected permissions and authentication/authorization policy using approved test accounts and administrative configuration review. Confirm exposed secrets were rotated and removed from distributed artifacts. Validate that legitimate workflows still function and monitoring captures permitted test activity. Preserve before/after evidence without exposing sensitive values.

## 11. Lessons learned and remaining work

Use observed identities and access results to establish impact. Keep service exposure separate from validated weaknesses and distinguish suggested methods from executed steps. Before publication, resolve the gaps in Sections 5–7, verify platform permission, and review every image and output for secrets.

[Back to walkthrough inventory](./README.md)

# Pterodactyl — Security Assessment

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Operating system | Linux |
| Difficulty | Medium |
| Assessment date | 2026-02-07 (from existing notes; timezone not recorded) |
| Author | Dylan Senez / d4rkgunn3r |
| Review status | Proposed revision; publication eligibility and evidence review pending |

## 1. Executive summary

The notes report application file disclosure leading to execution as wwwrun, followed by a reported local udisks2 race and root context.

## 2. Scope and authorization

This account concerns the assigned HTB laboratory target only. Target addresses, VPN information, secrets, and flag contents are excluded. This revision analyzes recorded work; no assessment commands were executed during the editorial review. Machine retirement status has not been freshly verified.

## 3. Methodology and reproducibility

Discovery → service analysis → recorded access path → privilege/impact assessment → evidence review → remediation. Commands below support authorized discovery and identity verification. Exploitation is described at the finding level; operational payloads and secret-extraction procedures are omitted.

Set the address of the currently assigned lab instance before discovery:

```bash
export TARGET_IP='REPLACE_WITH_ASSIGNED_LAB_IP'
mkdir -p evidence/pterodactyl/{scans,screenshots}
nmap -sV -p 22,80 -oA evidence/pterodactyl/scans/services "$TARGET_IP"
```

This is a proposed targeted confirmation command, not the original full-port scan. Nmap creates traffic and local output files. Record tool versions, instance date, and timezone; compare results with the observations below rather than assuming the same services are still present.

## 4. Reconnaissance and service analysis

22 OpenSSH 9.6; 80 nginx 1.21.5. A separate panel virtual host exposed a Laravel-based application.

> **EV-001 — Evidence placeholder:** add the reviewed service-scan excerpt and screenshot here. Remove sensitive identifiers. No screenshot file is claimed to exist at this placeholder.

## 5. Recorded initial-access path

The localization handler reportedly read outside its intended directory boundary and disclosed database configuration. The notes describe subsequent PHP execution through development tooling. Original request/response evidence is needed to verify precise behavior.

> **EV-002 — Evidence placeholder:** add a sanitized artifact establishing the behavior and resulting identity. An HTTP success response or tool success message alone does not prove code execution.

## 6. Privilege escalation and impact validation

The narrative associates root access with CVE-2021-3802 and shows a root-context transcript. The transition from wwwrun to phileasfogg3 is not explained. Exact host package build, prerequisites, and CVE applicability remain unresolved.

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

Root context reported; user transition and original local-exploitation evidence are missing.

The source is [the existing repository note](https://github.com/Dylans7j/HackTheBox-Walkthroughs/blob/main/pterodactyl.md), reviewed at blob SHA `7511051d575da6d9c710180b1599401e16f0d864`, plus [the repository source review](./EVIDENCE-REVIEW.md). 

A Rooted status is not a substitute for a terminal transcript. Reported results are attributed to the existing notes; they have not been independently reproduced in this review. CVE numbers, fixed-version claims, unsupported timing claims, and numerical severity scores are withheld where primary-source verification is missing.

## 8. Findings and remediation

| ID | Finding / review target | Remediation |
| --- | --- | --- |
| F-001 | File traversal/disclosure | Use fixed localization identifiers, canonical path checks, and least-privilege file access. |
| F-002 | Production development tooling | Remove unnecessary command-line development components; segregate writable content from executable PHP paths. |
| F-003 | Local privileged-service vulnerability | Verify installed package applicability, apply vendor-supported fixes, and remove unnecessary privileged storage services. |

Prioritize the boundary failures that enable access or elevation. Set final severity after confirming prerequisites, affected privileges, and original evidence.

## 9. Detection opportunities

Unexpected localization paths; PHP writes outside normal content flow; udisks2/polkit activity and unexpected privileged execution. Tune against storage administration.

Collect relevant application, authentication, process, and file-change logs. Correlate events by account, host, and time; a single suspicious request is not proof of successful compromise. These are detection proposals, not tested rules or observed telemetry.

## 10. Remediation validation

Verify corrected permissions and authentication/authorization policy using approved test accounts and administrative configuration review. Confirm exposed secrets were rotated and removed from distributed artifacts. Validate that legitimate workflows still function and monitoring captures permitted test activity. Preserve before/after evidence without exposing sensitive values.

## 11. Lessons learned and remaining work

Use observed identities and access results to establish impact. Keep service exposure separate from validated weaknesses and distinguish suggested methods from executed steps. Before publication, resolve the gaps in Sections 5–7, verify platform permission, and review every image and output for secrets.

[Back to walkthrough inventory](./README.md)

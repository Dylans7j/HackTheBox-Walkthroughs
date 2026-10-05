# Devel — Security Assessment

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Operating system | Windows |
| Difficulty | Easy |
| Assessment date | 2026-01-03 (from existing notes; timezone not recorded) |
| Author | Dylan Senez / d4rkgunn3r |
| Review status | Proposed revision; publication eligibility and evidence review pending |

## 1. Executive summary

Anonymous FTP access and an IIS-associated directory listing are documented. The reviewed narrative does not supply proof of upload, executable content, a shell, or privilege escalation.

## 2. Scope and authorization

This account concerns the assigned HTB laboratory target only. Target addresses, VPN information, secrets, and flag contents are excluded. This revision analyzes recorded work; no assessment commands were executed during the editorial review. Machine retirement status has not been freshly verified.

## 3. Methodology and reproducibility

Discovery → service analysis → recorded access path → privilege/impact assessment → evidence review → remediation. Commands below support authorized discovery and identity verification. Exploitation is described at the finding level; operational payloads and secret-extraction procedures are omitted.

Set the address of the currently assigned lab instance before discovery:

```bash
export TARGET_IP='REPLACE_WITH_ASSIGNED_LAB_IP'
mkdir -p evidence/devel/{scans,screenshots}
nmap -sV -p 21,80 -oA evidence/devel/scans/services "$TARGET_IP"
```

This is a proposed targeted confirmation command, not the original full-port scan. Nmap creates traffic and local output files. Record tool versions, instance date, and timezone; compare results with the observations below rather than assuming the same services are still present.

## 4. Reconnaissance and service analysis

21 Microsoft FTP with anonymous login accepted; 80 IIS 7.5. The FTP listing contains IIS default filenames.

> **EV-001 — Evidence placeholder:** add the reviewed service-scan excerpt and screenshot here. Remove sensitive identifiers. No screenshot file is claimed to exist at this placeholder.

## 5. Recorded initial-access path

Default filenames support a suspected connection between FTP storage and the web content directory; they do not independently prove the physical webroot mapping, write permissions, or server-side execution.

> **EV-002 — Evidence placeholder:** add a sanitized artifact establishing the behavior and resulting identity. An HTTP success response or tool success message alone does not prove code execution.

## 6. Privilege escalation and impact validation

No privilege-escalation result is documented in this file. A separate repository review records a matching Rooted source record, which is a status assertion rather than proof of the missing steps.

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
| EV-003 | Privilege boundary and impact proof | Not documented in reviewed narrative |

Anonymous access documented. Executable upload and SYSTEM access remain unverified.

The source is [the existing repository note](https://github.com/Dylans7j/HackTheBox-Walkthroughs/blob/main/devel.md), reviewed at blob SHA `11a63a3740a31ba625bfec2694a701fbb83f9ccb`, plus [the repository source review](./EVIDENCE-REVIEW.md). 

A Rooted status is not a substitute for a terminal transcript. Reported results are attributed to the existing notes; they have not been independently reproduced in this review. CVE numbers, fixed-version claims, unsupported timing claims, and numerical severity scores are withheld where primary-source verification is missing.

## 8. Findings and remediation

| ID | Finding / review target | Remediation |
| --- | --- | --- |
| F-001 | Anonymous FTP exposure | Disable anonymous access unless explicitly required; enforce read-only permissions and review accessible data. |
| F-002 | Possible shared FTP/web content path | Verify directory mapping; segregate upload storage and prohibit executable content in upload directories. |
| F-003 | Legacy service fingerprint | Confirm installed OS and support status using host inventory; migrate unsupported components. |

These include suspected configuration risks; write access and executable uploads remain unconfirmed.

## 9. Detection opportunities

FTP authentication/upload logs correlated with IIS requests and worker-process activity. Tune for authorized file distribution. Do not infer compromise from filenames alone.

Collect relevant application, authentication, process, and file-change logs. Correlate events by account, host, and time; a single suspicious request is not proof of successful compromise. These are detection proposals, not tested rules or observed telemetry.

## 10. Remediation validation

Verify corrected permissions and authentication/authorization policy using approved test accounts and administrative configuration review. Confirm exposed secrets were rotated and removed from distributed artifacts. Validate that legitimate workflows still function and monitoring captures permitted test activity. Preserve before/after evidence without exposing sensitive values.

## 11. Lessons learned and remaining work

Use observed identities and access results to establish impact. Keep service exposure separate from validated weaknesses and distinguish suggested methods from executed steps. Before publication, resolve the gaps in Sections 5–7, verify platform permission, and review every image and output for secrets.

[Back to walkthrough inventory](./README.md)

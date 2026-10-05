# Job — Security Assessment

| Field | Value |
| --- | --- |
| Platform | Hack The Box |
| Operating system | Windows |
| Difficulty | Medium |
| Assessment date | 2025-12-21 (from existing notes; timezone not recorded) |
| Author | Dylan Senez / d4rkgunn3r |
| Review status | Proposed revision; publication eligibility and evidence review pending |

## 1. Executive summary

The notes report document-driven execution as jack.black, execution under IIS through writable web content, and named-pipe impersonation producing SYSTEM.

## 2. Scope and authorization

This account concerns the assigned HTB laboratory target only. Target addresses, VPN information, secrets, and flag contents are excluded. This revision analyzes recorded work; no assessment commands were executed during the editorial review. Machine retirement status has not been freshly verified.

## 3. Methodology and reproducibility

Discovery → service analysis → recorded access path → privilege/impact assessment → evidence review → remediation. Commands below support authorized discovery and identity verification. Exploitation is described at the finding level; operational payloads and secret-extraction procedures are omitted.

Set the address of the currently assigned lab instance before discovery:

```bash
export TARGET_IP='REPLACE_WITH_ASSIGNED_LAB_IP'
mkdir -p evidence/job/{scans,screenshots}
nmap -sV -p 25,80,445,3389,5985 -oA evidence/job/scans/services "$TARGET_IP"
```

This is a proposed targeted confirmation command, not the original full-port scan. Nmap creates traffic and local output files. Record tool versions, instance date, and timezone; compare results with the observations below rather than assuming the same services are still present.

## 4. Reconnaissance and service analysis

25 hMailServer; 80 IIS 10; 445 SMB; 3389 RDP; 5985 WinRM. A careers-page screenshot supports LibreOffice-document submission context.

> **EV-001 — Evidence placeholder:** add the reviewed service-scan excerpt and screenshot here. Remove sensitive identifiers. No screenshot file is claimed to exist at this placeholder.

## 5. Recorded initial-access path

SMTP accepted a message for a local recipient. This does not prove external open relay. A callback and user context are reported after document processing; the reviewed screenshot does not establish who opened it, macro warning policy, or a particular LibreOffice CVE.

> **EV-002 — Evidence placeholder:** add a sanitized artifact establishing the behavior and resulting identity. An HTTP success response or tool success message alone does not prove code execution.

## 6. Privilege escalation and impact validation

The developers group reportedly had Full Control over IIS content. Execution in the application-pool context and an enabled impersonation privilege were followed by a recorded Meterpreter SYSTEM result. The notes do not establish a separately executed PrintSpoofer binary.

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

SYSTEM reported in text; careers screenshot alone does not establish exploitation.

The source is [the existing repository note](https://github.com/Dylans7j/HackTheBox-Walkthroughs/blob/main/job.md), reviewed at blob SHA `46d63727ecf5edd900c955655765ca66244111ec`, plus [the repository source review](./EVIDENCE-REVIEW.md). The existing careers-page image supports document-submission context only; it still requires address-redaction review before reuse.

A Rooted status is not a substitute for a terminal transcript. Reported results are attributed to the existing notes; they have not been independently reproduced in this review. CVE numbers, fixed-version claims, unsupported timing claims, and numerical severity scores are withheld where primary-source verification is missing.

## 8. Findings and remediation

| ID | Finding / review target | Remediation |
| --- | --- | --- |
| F-001 | Document processing boundary | Use isolated document review, restricted macro policies, attachment screening, and current supported office software. |
| F-002 | Excessive production webroot permissions | Deploy through controlled workflows; remove unnecessary write access and prohibit executable user uploads. |
| F-003 | Service-context elevation | Restrict unnecessary privileges and services after compatibility review; harden service identities. |

Prioritize the boundary failures that enable access or elevation. Set final severity after confirming prerequisites, affected privileges, and original evidence.

## 9. Detection opportunities

Office-to-shell process ancestry; IIS content writes and child processes; named-pipe/privilege activity. Tune against approved deployments and document automation.

Collect relevant application, authentication, process, and file-change logs. Correlate events by account, host, and time; a single suspicious request is not proof of successful compromise. These are detection proposals, not tested rules or observed telemetry.

## 10. Remediation validation

Verify corrected permissions and authentication/authorization policy using approved test accounts and administrative configuration review. Confirm exposed secrets were rotated and removed from distributed artifacts. Validate that legitimate workflows still function and monitoring captures permitted test activity. Preserve before/after evidence without exposing sensitive values.

## 11. Lessons learned and remaining work

Use observed identities and access results to establish impact. Keep service exposure separate from validated weaknesses and distinguish suggested methods from executed steps. Before publication, resolve the gaps in Sections 5–7, verify platform permission, and review every image and output for secrets.

[Back to walkthrough inventory](./README.md)

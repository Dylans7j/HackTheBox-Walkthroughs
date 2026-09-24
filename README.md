# Hack The Box Walkthroughs

Sanitized notes from authorized Hack The Box lab work, organized around repeatable methodology, evidence, and remediation.

> Repository status: publication review in progress.

## Publication rules

- Publish only retired machines or material permitted by HTB.
- Remove flags, credentials, private keys, tokens, and raw proof strings.
- Redact target-specific data that does not improve the learning value.
- Separate confirmed findings from hypotheses and next steps.
- Do not label service exposure or version detection as a vulnerability without validation.
- Include remediation and detection opportunities where the evidence supports them.

## Current inventory

The repository currently contains nine machine-note files. Each entry remains marked **Review required** until retirement status, redaction, internal links, and evidence quality have been checked.

| Machine notes | Platform | Publication status |
| --- | --- | --- |
| [Bizness](./bizness.md) | Linux | Review required |
| [Browsed](./browsed.md) | Linux | Review required |
| [Devel](./devel.md) | Windows | Review required |
| [Facts](./facts.md) | Linux | Review required |
| [Job](./job.md) | Windows | Review required |
| [Kobold](./kobold-hybrid.md) | Linux | Review required |
| [Overwatch](./overwatch.md) | Windows / AD | Review required |
| [Principal](./principal.md) | Linux | Review required |
| [Pterodactyl](./pterodactyl.md) | Linux | Review required |

## Notion evidence update — 2026-09-24

The [completion inventory and publication queue](./PUBLICATION-QUEUE.md) records 62 Rooted source records across 61 distinct names. Nine have existing walkthroughs here; 52 distinct names await publication review. See the [source and screenshot review](./EVIDENCE-REVIEW.md) for what was actually available, including Job’s careers-page screenshot.

## Required case-study format

1. Executive summary
2. Authorized scope
3. Attack-surface discovery
4. Validated attack path
5. Privilege-escalation path
6. Evidence index
7. Demonstrated impact
8. Remediation
9. Detection opportunities
10. Lessons learned

## Evidence standard

A finding should include the exact observable behavior, a sanitized supporting artifact or output excerpt, reproduction steps, impact demonstrated in the lab, and specific remediation. Potential weaknesses remain hypotheses until validated.

## Safety

All activity represented here is limited to authorized training environments. This repository should not contain active-machine spoilers or sensitive authentication material. Entries that have not completed publication review should not be promoted as portfolio case studies.

Maintained by [Dylans7j](https://github.com/Dylans7j). The primary defensive-security project is the [SOC–Active Directory Lab](https://github.com/Dylans7j/SOC-Lab).

## Related detection-engineering work

The companion [SOC-Lab](https://github.com/Dylans7j/SOC-Lab) now documents verified Windows 11 → Splunk ingestion of Security, System, PowerShell and Sysmon telemetry, including the resolution of a Sysmon read-permission failure. The next milestone is a controlled Active Directory authentication investigation with validated SPL and Sigma detections.

Public project documentation uses `192.169.70.x` only as a redaction placeholder. Do not publish actual lab, VPN or HTB target addresses unless publication is explicitly permitted. The placeholder is not an address to configure.

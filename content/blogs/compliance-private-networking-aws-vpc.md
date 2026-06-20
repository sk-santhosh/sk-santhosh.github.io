---
title: "Compliance-Ready Private Networking on AWS VPC"
description: "How to design an AWS VPC that keeps workloads private, auditable, and aligned with SOC 2, PCI-DSS, and HIPAA — using private subnets, VPC endpoints, flow logs, and Terraform."
date: "2026-06-17"
tags: ["AWS", "Networking", "Compliance", "Terraform"]
---

When auditors ask "how is this data protected in transit?" and "prove nothing in this subnet can reach the internet," vague answers don't pass. SOC 2, PCI-DSS, and HIPAA all care about the same network fundamentals: isolation, least privilege, encryption, and an audit trail. This is how I design AWS VPCs so those answers are built in — and provable — rather than bolted on.

## The Core Principle: Private by Default

Workloads that handle sensitive data should have **no path to or from the public internet** unless one is explicitly justified. In a compliant VPC that means:

- Application and database tiers live in **private subnets** with no public IPs.
- Outbound internet (for patches, APIs) goes through a **NAT gateway** in a public subnet — egress only, never ingress.
- Internal AWS service traffic (S3, ECR, Secrets Manager) never touches the internet at all — it goes through **VPC endpoints**.

![VPC with a public subnet for NAT and ALB, private app and data subnets with no public IPs, and VPC endpoints keeping AWS traffic off the internet](/diagrams/vpc-architecture.svg)

## Subnet Tiering with Terraform

Separate tiers into separate subnets so security groups and NACLs can enforce boundaries between them. The data tier should never be directly reachable from the internet-facing tier without going through the app tier.

```hcl
resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  # never auto-assign public IPs in a private tier
  map_public_ip_on_launch = false

  tags = { Tier = "app", Compliance = "in-scope" }
}

resource "aws_subnet" "private_data" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 20)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = { Tier = "data", Compliance = "in-scope" }
}
```

## Keep AWS Traffic Off the Internet: VPC Endpoints

By default, a private instance calling `s3.amazonaws.com` or Secrets Manager routes out through the NAT gateway and across the public internet to AWS's public endpoints. Auditors flag this. **VPC endpoints (PrivateLink)** keep that traffic inside the AWS network.

Use a **Gateway endpoint** for S3 and DynamoDB (free, route-table based) and **Interface endpoints** for everything else:

```hcl
# Gateway endpoint — S3 stays on the AWS backbone
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
}

# Interface endpoint — Secrets Manager over PrivateLink
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.endpoints.id]
  private_dns_enabled = true
}
```

With `private_dns_enabled`, the SDK call to `secretsmanager.<region>.amazonaws.com` resolves to a private VPC IP automatically — no code changes. This single control satisfies a lot of "encryption in transit" and "no public data path" requirements at once.

## Least Privilege: Security Groups Over NACLs

Security groups are stateful and reference each other — make them your primary control. Reference SGs by ID, not CIDR, so the rule expresses intent ("the data tier accepts traffic *from the app tier*") rather than a brittle IP range.

```hcl
resource "aws_security_group_rule" "db_from_app" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.data.id
  source_security_group_id = aws_security_group.app.id   # not a CIDR
  description              = "PostgreSQL from app tier only"
}
```

Use **NACLs** as a coarse, subnet-level backstop — e.g. explicitly denying the data subnet any route to `0.0.0.0/0`. They're stateless and harder to reason about, so keep their rules few and blunt.

## The Audit Trail: VPC Flow Logs

You can't prove what you don't record. VPC Flow Logs capture accepted and rejected connections — the evidence auditors ask for, and the data you need when investigating an incident. Send them to CloudWatch or S3 with a retention period that matches your framework (PCI-DSS wants a year, with 3 months immediately available).

```hcl
resource "aws_flow_log" "vpc" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  iam_role_arn    = aws_iam_role.flow_logs.arn
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/vpc/flow-logs"
  retention_in_days = 365
}
```

Pair this with a GuardDuty detector — it consumes flow logs, DNS logs, and CloudTrail to flag things like a private instance suddenly talking to a known-malicious IP or a crypto-mining domain. That's continuous monitoring evidence with almost no operational cost.

## Encryption in Transit

Network isolation is necessary but not sufficient — most frameworks also want data encrypted on the wire, even inside the VPC.

- **TLS everywhere**, including service-to-service. Terminate at the ALB with an ACM certificate, and re-encrypt to the backend rather than passing plaintext over the last hop.
- **VPC endpoints are TLS** to the AWS service by default.
- For database connections, **enforce SSL** at the engine level (e.g. RDS `rds.force_ssl = 1`) so a misconfigured client can't silently connect in plaintext.

## Mapping It Back to the Frameworks

The same handful of controls answers the recurring audit questions:

- **Private subnets, no public IPs** → network segmentation / isolation
- **Security groups referencing SGs** → least-privilege access
- **VPC endpoints (PrivateLink)** → no public data path, encryption in transit
- **Flow logs with retention** → audit trail and monitoring
- **GuardDuty** → continuous threat detection
- **TLS + enforced DB SSL** → encryption in transit

## Make It Provable, Not Just Present

The final piece is **drift detection**. A compliant VPC on day one means nothing if someone attaches an internet gateway to a private route table six months later. Run AWS Config rules — `vpc-flow-logs-enabled`, `vpc-sg-open-only-to-authorized-ports`, `restricted-ssh` — so a violation is flagged automatically, and keep the whole VPC in Terraform so every change is reviewed in a pull request and recorded in version control.

Compliance in networking isn't a one-time audit scramble. Build the controls into the infrastructure code, log everything, and let Config and GuardDuty prove continuously that the controls are still in place.

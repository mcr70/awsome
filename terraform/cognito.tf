#
# Cognito setup for Awsome authentication.
#
# Creates a User Pool + App Client (used for OIDC login), an Identity Pool
# (used to grant temporary AWS credentials), and per-group IAM roles so that
# permissions can be adjusted per user or group by simply moving users
# between Cognito groups.
#
# After `terraform apply`, use the values in the `cognito_*` outputs below
# to fill in `src/app/config/configuration.ts` (cognitoConfig).
#

variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
  default     = "awsome"
}

# Must be globally unique across all AWS accounts in the region.
variable "cognito_domain_prefix" {
  description = "Prefix for the Cognito Hosted UI domain (<prefix>.auth.<region>.amazoncognito.com)"
  type        = string
}

# Where the SPA is served from, e.g. http://localhost:4200 for dev
# and your CloudFront URL for production.
variable "callback_urls" {
  description = "Allowed OAuth callback (redirect) URLs for the App Client"
  type        = list(string)
  default     = ["http://localhost:4200"]
}

variable "logout_urls" {
  description = "Allowed logout URLs for the App Client"
  type        = list(string)
  default     = ["http://localhost:4200"]
}

# ----  Cognito User Pool  ---------------------
resource "aws_cognito_user_pool" "awsome" {
  name = var.user_pool_name
}

resource "aws_cognito_user_pool_domain" "awsome" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.awsome.id
}

resource "aws_cognito_user_pool_client" "awsome" {
  name         = "${var.user_pool_name}-spa"
  user_pool_id = aws_cognito_user_pool.awsome.id

  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid"]
  supported_identity_providers         = ["COGNITO"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls
}

# ----  Cognito Identity Pool  ---------------------
resource "aws_cognito_identity_pool" "awsome" {
  identity_pool_name               = "${var.user_pool_name}-identity"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.awsome.id
    provider_name           = aws_cognito_user_pool.awsome.endpoint
    server_side_token_check = false
  }
}

# Trust policy shared by all Identity Pool roles: only this Identity Pool's
# authenticated identities may assume the role.
data "aws_iam_policy_document" "cognito_authenticated_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = [aws_cognito_identity_pool.awsome.id]
    }

    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

# Fallback role for authenticated users who don't belong to a mapped group.
# Deliberately grants no permissions - add users to a group to grant access.
resource "aws_iam_role" "default_authenticated" {
  name               = "${var.user_pool_name}-default-authenticated"
  assume_role_policy = data.aws_iam_policy_document.cognito_authenticated_trust.json
}

# ----  Per-group roles  ---------------------
# Add / remove groups here to change what permissions are selectable.
# Cognito automatically embeds the group's IAM role in the ID token
# (as cognito:preferred_role), which the Identity Pool then assumes.

resource "aws_iam_role" "readonly" {
  name               = "${var.user_pool_name}-readonly"
  assume_role_policy = data.aws_iam_policy_document.cognito_authenticated_trust.json
}

resource "aws_iam_role_policy_attachment" "readonly" {
  role       = aws_iam_role.readonly.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_cognito_user_group" "readonly" {
  name         = "ReadOnly"
  user_pool_id = aws_cognito_user_pool.awsome.id
  description  = "Read-only access to the AWS account"
  precedence   = 10
  role_arn     = aws_iam_role.readonly.arn
}

# Placeholder admin role - scope this policy down before granting it to
# real users, this is just a starting point.
resource "aws_iam_role" "admins" {
  name               = "${var.user_pool_name}-admins"
  assume_role_policy = data.aws_iam_policy_document.cognito_authenticated_trust.json
}

resource "aws_iam_role_policy_attachment" "admins" {
  role       = aws_iam_role.admins.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

resource "aws_cognito_user_group" "admins" {
  name         = "Admins"
  user_pool_id = aws_cognito_user_pool.awsome.id
  description  = "Elevated access, scope the attached IAM policy before real use"
  precedence   = 1
  role_arn     = aws_iam_role.admins.arn
}

# ----  Role mapping  ---------------------
# Maps the group's IAM role (embedded in the ID token) to actual
# Identity Pool role selection.
resource "aws_cognito_identity_pool_roles_attachment" "awsome" {
  identity_pool_id = aws_cognito_identity_pool.awsome.id

  roles = {
    authenticated = aws_iam_role.default_authenticated.arn
  }

  role_mapping {
    identity_provider         = "${aws_cognito_user_pool.awsome.endpoint}:${aws_cognito_user_pool_client.awsome.id}"
    ambiguous_role_resolution = "AuthenticatedRole"
    type                      = "Token"
  }
}

# ----  Outputs for configuration.ts  ---------------------
output "cognito_domain" {
  value = "https://${aws_cognito_user_pool_domain.awsome.domain}.auth.${data.aws_region.current.region}.amazoncognito.com"
}

output "cognito_region" {
  value = data.aws_region.current.region
}

output "cognito_idp_identifier" {
  value = "cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.awsome.id}"
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.awsome.id
}

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.awsome.id
}

output "cognito_identity_pool_id" {
  value = aws_cognito_identity_pool.awsome.id
}

data "aws_region" "current" {}

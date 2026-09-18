terraform {
  required_version = "~> 1.9"

  backend "s3" {
    bucket               = "156779480692-terraform-state"
    key                  = "awsome-ui"
    region               = "eu-north-1"
    workspace_key_prefix = "env"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.91"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}

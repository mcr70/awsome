#
# This terraform file sets up an S3 bucket and a CloudFront distribution.
# It only provides a minimal setup for the purpose of this project.
#
# Proper state management is also left for the reader to implement.
# 
# Once the bucket and CloudFront distribution are created, you can upload 
# your static files to the bucket. This can be done on the root directory
# of the project by running the following commands:
#
# ```bash
# ng build --configuration=production
# aws s3 sync ./dist/awsome/browser s3://your-bucket-name --delete
# ```
#

terraform {
  required_version = "~> 1.9.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.91.0"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

# Variable for the bucket name. Terraform will prompt for this, 
# or you can set it in a terraform.tfvars file.
variable "bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
}

# ----  S3 bucket  ---------------------
resource "aws_s3_bucket" "awsome" {
  bucket = var.bucket_name
}

# Enable website hosting
resource "aws_s3_bucket_website_configuration" "awsome" {
  bucket = aws_s3_bucket.awsome.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Bucket policy for public access
resource "aws_s3_bucket_policy" "awsome" {
  bucket = aws_s3_bucket.awsome.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid       = "AllowCloudFrontAccess",
      Effect    = "Allow",
      Principal = "*",
      Action    = "s3:GetObject",
      Resource  = "${aws_s3_bucket.awsome.arn}/*"
    }]
  })
}


# ----  CloudFront distribution  ---------------------
resource "aws_cloudfront_distribution" "awsome" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket_website_configuration.awsome.website_endpoint
    origin_id   = aws_s3_bucket_website_configuration.awsome.website_endpoint
    connection_attempts = 3
    connection_timeout  = 10

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }


  default_cache_behavior {
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket_website_configuration.awsome.website_endpoint
    cache_policy_id = aws_cloudfront_cache_policy.awsome_cache_policy.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_cloudfront_cache_policy" "awsome_cache_policy" {
  name        = "Managed-CachingOptimized"
  comment     = "Policy with caching enabled. Supports Gzip and Brotli compression."
  min_ttl     = 1
  default_ttl = 86400
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip = true
    enable_accept_encoding_brotli = true

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}


output "awsome_url" {
  value = "https://${aws_cloudfront_distribution.awsome.domain_name}"
}
# This Terraform file creates a private S3 bucket served through CloudFront.

variable "bucket_name" {
  description = "Globally unique name of the private S3 bucket"
  type        = string
}

resource "aws_s3_bucket" "awsome" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "awsome" {
  bucket = aws_s3_bucket.awsome.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "awsome" {
  name                              = "${var.bucket_name}-oac"
  description                       = "Allow CloudFront to read the private Awsome S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_policy" "awsome" {
  bucket = aws_s3_bucket.awsome.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontAccess"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.awsome.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.awsome.arn
        }
      }
    }]
  })
}

resource "aws_cloudfront_distribution" "awsome" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.awsome.bucket_regional_domain_name
    origin_id                = aws_s3_bucket.awsome.id
    origin_access_control_id = aws_cloudfront_origin_access_control.awsome.id
  }

  default_cache_behavior {
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 10
    default_ttl            = 300
    max_ttl                = 86400
    compress               = true
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.awsome.id

    forwarded_values {
      headers                 = []
      query_string            = false
      query_string_cache_keys = []

      cookies {
        forward           = "none"
        whitelisted_names = []
      }
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
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

output "awsome_url" {
  value = "https://${aws_cloudfront_distribution.awsome.domain_name}"
}

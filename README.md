# Awsome

This project aims to be a starting point for creating a custom 
AWS user interface for the purposes of your AWS management. For example,
If your workload covers only EC2 instances and S3 buckets, you could create
an User interface that displays just the essentials of your workload.
Idea is not to replace existing AWS UI. This is important to note. For one thing,
it would be a huge tasks to do so.

To get started with this project, you need to create AWS Cognito User pool 
and Cognito Identity pool. This is not covered in here at this time.

Initial login, will be done against the AWS account where Cognito is installed.
To use "switch role" feature, target account needs to have a 
dedicated IAM Role for this to work. Use least privileged approach
in setting up the roles on target account.

In following snippet at IAM Role (_say, AWSomeRole_) in target account, 
we trust (_Trust relationships_) our AWS Cognito account (xxxxxx:yyyyy) 
to assume role into target account. if yyyyyy is root, then anything from that 
account is allowed, but you may be more specific who is granted access. 
Like an IAM role that is bound to user with Cognito.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::xxxxxxxxxxxx:yyyyyyy"
            },
            "Action": "sts:AssumeRole",
            "Condition": {}
        }
    ]
}
```

In the permissions, attach needed permissions for Awsome to operate. 
On development time, read-only permission for your AWS account is good to 
get started. I.e. attach AWS Managed permission `ReadOnlyAccess` to this role.

## Development 

Before starting the development server, you need to configure Cognito to be used.
Copy `src/app/config/configuration.empty` to `src/app/config/configuration.ts`,
and fill in `cognitoConfig` const.

To start a local development server, run:

```bash
ng serve
```

## Installing

There is a simple Terraform scripts in `terraform/` directory, which will make a
simple S3 bucket and CloudFront distribution, that can be used for simple installations.
It is assumed that Cognito has been already created by other means, and the configuration
is in place.

In `terraform/` folder, change `terraform.tfvars` and give your bucket a globally unique name.
After that, run 
```bash
terraform apply
```

Once the bucket and CloudFront distribution is created, build and copy the files into bucket
```bash
ng build --configuration=production
aws s3 sync ./dist/awsome/browser s3://my-awsome-ui --delete
```

If you need to update the service to S3 bucket, remember that there may be some caching 
involved with Cloudfront. To invalidate Cloudfront cache, you need to figure out your 
distribution ID, and then call the invalidation, like this

```bash
aws cloudfront list-distributions --query "DistributionList.Items[*].Id"
[
    "...."
]
aws cloudfront create-invalidation --distribution-id .... --paths "/*"
```
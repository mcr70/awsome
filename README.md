# Awsome

This project aims to be a starting point for creating a custom 
AWS user interface for the purposes of your AWS management. For example,
If your workload covers only EC2 instances and S3 buckets, you could create
an User interface that displays just the essentials of your workload.
Idea is not to replace existing AWS UI. This is important to note. For one thing,
it would be a huge tasks to do so.

To get started with this project, create the infrastructure in the `terraform/`
directory first. This creates the Cognito User Pool, Cognito Identity Pool,
the hosted login domain, and the `ReadOnly` and `Admins` groups.

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

### Create a Cognito user

The Terraform configuration creates the user pool and groups, but it does not
create individual users. Create a user in the AWS Console:

1. Open **Amazon Cognito** in the `eu-west-1` region.
2. Open the user pool named `awsome`.
3. Open **Users** and choose **Create user**.
4. Enter the user's email address as the username and email address.
5. Set a temporary password, or let Cognito generate one.
6. Create the user.
7. Open the new user, choose **Add user to group**, select `ReadOnly`, and save.

The user must belong to the `ReadOnly` group before logging in. The group is
created by Terraform and is linked to the AWS managed `ReadOnlyAccess` policy
through the `awsome-readonly` IAM role. Do not attach IAM policies directly to
the Cognito user.

On the first login, Cognito may require the user to change the temporary
password. After the password change, the application should receive temporary
AWS credentials with read-only permissions.

The `Admins` group is also created by Terraform, but it grants
`PowerUserAccess`. Do not add normal users to that group. Replace that policy
with a narrower custom policy before using it for real administrators.

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
aws s3 sync ./dist/awsome/browser s3://156779480692-awsome-ui --delete
```

If you need to update the service to S3 bucket, remember that there may be some caching 
involved with Cloudfront. To invalidate Cloudfront cache, you need to figure out your 
distribution ID, and then trigger the invalidation, like this

```bash
aws cloudfront list-distributions --query "DistributionList.Items[*].Id"
[
    "...."
]
aws cloudfront create-invalidation --paths "/*" --distribution-id ....
```

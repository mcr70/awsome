# Awsome

To get started with this project, you need to create 
AWS Cognito User pool and Cognito Identity pool.

To use "switch role" feature, target account needs to have a 
dedicated IAM Role for this to work. Use least privileged approach
in setting up the roles on target account.

In following snippet at IAM Role in target account, we trust
our AWS Cognito account (xxxxxx:yyyyy) to assume role into target account.
if yyyyyy is root, then anything from that account is allowed, but you may
be more specific who is granted access. Like an IAM role that is bound to user
with Cognito.

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
On development time, read-only permission for your AWS Resource is good to 
get started.

## Development 

Before starting the development server, you need to configure Cognito to be used.
Copy `src/app/config/configuration.empty` to `src/app/config/configuration.ts`,
and fill in `cognitoConfig` const.

To start a local development server, run:

```bash
ng serve
```

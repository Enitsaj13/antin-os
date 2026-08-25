# AWS S3 Portfolio Storage

This app uploads project images directly from the browser to S3 using presigned
`PUT` URLs created by the Nest API. The database stores the S3 object key in
`Project.imageKey`; API responses resolve that key into `imageUrl` for display.
Profile pictures and resume PDFs also use the same private bucket. Resume PDFs
are uploaded to the API for validation and are downloaded through the app, not
through public S3 URLs.

Official references:

- [AWS: Uploading objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [AWS: S3 bucket CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html)
- [AWS: IAM access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html)

## Recommended Free-Tier Setup

Start with one private S3 bucket. Do not add CloudFront yet. Leave
`AWS_S3_PUBLIC_BASE_URL` empty so the API returns temporary signed image URLs for
local development.

Add CloudFront or a public read policy later when you want permanent public image
URLs for production.

## Create The Bucket

Use a globally unique bucket name:

```bash
export AWS_REGION=ap-southeast-1
export AWS_S3_BUCKET=your-unique-portfolio-bucket-name

aws s3api create-bucket \
  --bucket "$AWS_S3_BUCKET" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"
```

Keep the default public access block enabled while learning.

## Configure Bucket CORS

Create a local file outside the repo if you do not want to keep AWS config files:

```bash
cat > /tmp/antin-os-s3-cors.json <<'JSON'
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
JSON
```

Apply it:

```bash
aws s3api put-bucket-cors \
  --bucket "$AWS_S3_BUCKET" \
  --cors-configuration file:///tmp/antin-os-s3-cors.json
```

## Create An IAM Policy

Replace `your-unique-portfolio-bucket-name` before creating the policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPortfolioObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::your-unique-portfolio-bucket-name/project-images/*",
        "arn:aws:s3:::your-unique-portfolio-bucket-name/profile-pictures/*",
        "arn:aws:s3:::your-unique-portfolio-bucket-name/resumes/*"
      ]
    }
  ]
}
```

Attach that policy to an IAM user used only for this app, then create an access
key for that user.

## Configure Local Env

Edit `apps/api/.env`:

```bash
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your-unique-portfolio-bucket-name
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_PUBLIC_BASE_URL=
AWS_S3_PRESIGNED_URL_TTL_SECONDS=900
RESUME_MAX_UPLOAD_BYTES=5242880
```

Restart the API after changing env vars.

## Run Locally

```bash
make up
make migrate
make dev
```

Open the admin form:

```text
http://localhost:5173/admin/projects/new
```

Upload an image in the Project image field. The browser uploads the file to S3,
then saving the project stores the returned `imageKey`.

Resume PDFs are managed at:

```text
http://localhost:5173/admin/resume
```

The API validates PDF uploads and stores them under `resumes/*`. Public visitors
only get a Download CV button when the resume is published, and the download
goes through `/public/resume/download` so the private S3 object key is never
shown.

## Optional Public URLs

For production project images, prefer CloudFront in front of S3 and set:

```bash
AWS_S3_PUBLIC_BASE_URL=https://your-cloudfront-domain.example
```

For a simpler learning-only project-image setup, you can instead make only
`project-images/*` publicly readable and set:

```bash
AWS_S3_PUBLIC_BASE_URL=https://your-unique-portfolio-bucket-name.s3.ap-southeast-1.amazonaws.com
```

Use a narrow bucket policy if you choose this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadProjectImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-unique-portfolio-bucket-name/project-images/*"
    }
  ]
}
```

This public policy requires changing the bucket public access settings. Skip it
until you are comfortable reading the S3 permissions screen and AWS billing page.
Do not make `resumes/*` public; CV downloads should continue to use the app
endpoint.

## Cost Guardrails

Before uploading real files:

```bash
aws budgets describe-budgets --account-id YOUR_AWS_ACCOUNT_ID
```

Also create an AWS Budget in the console with an alert around 1 USD. The app
limits project images and resumes to 5 MB by default, but billing alerts are
still worth setting up before experimenting.

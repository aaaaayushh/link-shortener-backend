# Link Shortener Backend

## Introduction

This is the backend for the link-shortener application built as an assignment for FarMart. It is built using ExpressJS.

## Features

This application contains the APIs for the following features:

- File upload: Users(both authorized and unauthorized) can upload files(only images of type jpegs,pngs and gifs of upto 5MB) and the service will upload it on an S3 storage.
- Bit.ly link generation: The service will provide a Bit.ly link to access the uploaded file.
- User dashboard: Authenticated users can see all their generated links and uploaded files.
- Delete uploaded files: Authenticated users can delete their uploaded files.

## Features I wanted to implement but couldn't because of time constraints

- Auto delete files after a set amount of time which can be fixed for unauthenticated users, and configurable for authenticated users.
- Protect against cross-site scripting (XSS) and cross-site request forgery (CSRF) attacks. I have not implemented these protections before, and would have liked to explore how it is done in a production setting.

#### This application is hosted on : https://link-shorten-frontend.vercel.app/

#### You can find the frontend repository on: https://github.com/aaaaayushh/link-shorten-frontend

#### Run locally

To run this application locally, you will need an AWS account.

1. Clone this repository on your device.
2. Install the dependencies using the command `npm i`(You will require Node installed on your device to run this application)
3. Create an .env file and set the following environment variables:
   - AWS_BUCKET_NAME: name of your s3 bucket.
   - AWS_ACCESS_KEY_ID: access key for your aws account.
   - AWS_SECRET_ACCESS_KEY: secret access key for your aws account.
4. Once the dependencies are installed, run using `npm start`

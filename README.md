**WORK IN PROGRESS**

_THIS DOES NOT WORK CURRENTLY_

# OpenActions - Github Actions Clone

This implements the Github Actions workflow API,
allowing a developer to test Github Actions on a
local machine or on private infrastructure.

## Running

Currently an AWS Lambda handler has been created
to run this as a highly-scalable backend application
for deploying Github actions to a private AWS account.

However, it is intended that handler.js can be modified
to run these actions locally, or to run on other clouds
such as Azure, GCP, or Kubernetes.

## Contributing

Contributors must agree to the https://www.contributor-covenant.org/

This work is licensed under the Apache 2.0 license, see LICENSE.

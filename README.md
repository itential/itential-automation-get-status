## Overview 
Github Action to monitor Itential Automation Platform(IAP) automations status and return output variables

## Table of Contents 
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Supported IAP Versions](#supported-iap-versions)
  - [Getting Started](#getting-started)
  - [Configurations](#configurations)
    - [Required Input Parameters](#required-input-parameters)
    - [Optional Input Parameters](#optional-input-parameters)
    - [Output](#output)
  - [Example Usage](#example-usage)

## Supported IAP Versions
* 2022.1
* 2021.2
* 2021.1

## Getting Started
1. Search for the Action on Github Marketplace.
2. Select the "Use the Latest Version" option on the top right of the screen 
3. Click the clipboard icon to copy the provided data. 
4. Navigate to the 'github/workflows' file in the target repository (where you intend on using the action. )
5. Paste the copied data in the correlating fields. 
6. Configure the required inputs and optional inputs. (See note)
7.  Save it as a .yml file.

>**_Note:_** Users may manually enter required input parameters or use Github Secrets if they want to hide certain parameters. If you choose to use Github Secrets, please reference the instructions provided below. 

1. Select the settings tab on your target repository 
2. Select the secrets and variables tab under security options 
3. Click the "new repository secret"option on the top right of the screen 
4. Enter the required fields 
For YOUR_SECRET_NAME enter a required input. 
For SECRET enter your desired variable. 
6. Click "Add Secret"
_See [action.yml](action.yml) for [metadata](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions) that defines the inputs, outputs, and runs configurations for this action._

 ### Required Input Parameters
The following table defines the required parameters to monitor IAP Job Status using a Github workflow. Input data is provided through Github Actions secrets. For more information about github action secrets, see [Github Secrets](https://docs.github.com/en/rest/actions/secrets?apiVersion=2022-11-28)
 
| Parameter | Description |
| --------- | ----------- |
| IAP_INSTANCE | URL to the IAP Instance |
| IAP_TOKEN | To authenticate api requests to the instance |
| JOB_ID| Job ID to check status of the job |

### Optional Input Parameters
The following table defines parameters considered optional. 

| Parameter | Description | Default |
| --------- | ----------- | ------- |
| TIME_INTERVAL | Time interval to check job status (in sec) | 15 sec |
| NO_OF_ATTEMPTS | No of attempts to check job status | 10 |

### Output
The following table defines parameters that are returned. 
| Parameter | Description |
| --------- | ----------- |
| results | API Trigger output variables |


## Example Usage 

The example below displays how to configure a workflow that runs when issues or pull requests are opened or labeled in your repository. This workflow runs when new pull request is opened as defined in the `on` variable of the workflow.

This action is defined in  `job1` of the workflow by the step id `step1`. The output of this step is defined as `output1` of the workflow and is extracted using the output variable of this action i.e. `results` as defined in the output.

You have the option to configure any filters you may want to add, such as only triggering workflow with a specific branch. 


_For more information about workflows, see [Using workflows](https://docs.github.com/en/actions/using-workflows)._

```yaml
# This is a basic workflow to help you get started with Actions
name: Get Job Results
# Controls when the workflow will run
on:
  pull_request:
    types: [opened]

jobs:
  job1:
    runs-on: ubuntu-latest
    outputs:
      output1: ${{ steps.step1.outputs.results }}
    name: API Endpoint Trigger
    steps:
      # To use this repository's private action,
      # you must check out the repository
      - name: Checkout
        uses: actions/checkout@v3
      - name: Hello world action step
        id: step1
        uses: itential/test-action@version
        env:
          IAP_TOKEN: ${{secrets.IAP_TOKEN}}
          IAP_INSTANCE: ${{secrets.IAP_INSTANCE}}
          JOB_ID: ${{secrets.JOB_ID}}
          NO_OF_ATTEMPTS: 10
          TIME_INTERVAL: 15
      - name: Get output
        run: echo "${{steps.step1.outputs.results}}"
```

# Cross-Workflow Github Pages Deploy

Deploy a previously created cross-workflow artifact to Github Pages.

I've created this to overcome 2 main goals:
- Allow for cross workflow artifact selection
- Save steps compared to using `action/upload-pages-artifact` and `action/deploy-pages` where
you must first create or download an existing artifact so `action/upload-pages-artifact` can create a `.tar` artifact and
upload to the current workflow, and then deploy it by `action/deploy-pages`.

This actions does it all in one go, it:
- Searches for a previously created artifact by the given name across workflows
- Without downloading it, deploys the found artifact to Github Pages

This makes this task faster and saves on your build minutes, at least for my ise case, hope it can be useful to others.

Cheers ;)

## Inputs
### `artifact_name`
**Required**: The name artifact to search on previous workflows.
### `workflow_name`
**Optional**: Workflow name or workflow filename to filter artifacts by
### `branch`
**Optional** Only consider artifacts from workflows on this branch name
### `token`
**Optional** Only consider artifacts from workflows on this branch name
### `timeout`
**Optional** Time in milliseconds after which to timeout and cancel the deployment [default is 10 minutes (60000)]
### `reporting_interval`
**Optional** Time in milliseconds between two deployment status report [default is 5 seconds (5000)]
### `error_count`
**Optional** Maximum number of status report errors before cancelling a deployment [default is 5]
### `on_error`
**Optional** Choose how to exit the action if no artifact is found fail, warn or ignore

## Outputs
### `status`
The deployment status
### `error_message`
The error message, if an error occurs
### `page_url`
The deployed Github page url
### `artifact`
JSON object of the deployed artifact

## Example usage
```shell
...
jobs:
  deploy:
    - name: Deploy to pages
      uses: jairmilanes/deploy-pages@v1
      with:
        artifact_name: github-pages
        token: ${{secrets.TOKEN}}
```

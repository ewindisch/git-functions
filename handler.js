'use strict';

// set $IOPIPE_TOKEN in environment variables
// find your token at dashboard.iopipe.com/install
const iopipe = require('@iopipe/iopipe')();
const WebhooksApi = require('@octokit/webhooks');
const actions = require('./actions.js');

// https://github.com/apocas/dockerode
const dockerode = require('dockerode');

const webhooks = new WebhooksApi({
  secret: process.env.GITHUB_WEBHOOK_SECRET
});

class ContainerManager () {
    function init () {
        this.docker = new dockerode();
    }

    function runContainer (action, context) {
        /* Env vars per https://developer.github.com/actions/creating-github-actions/accessing-the-runtime-environment/
            HOME	The path to the GitHub home directory used to store user data. Value: /github/home.
            GITHUB_WORKFLOW	The name of the workflow.
            GITHUB_ACTION	The name of the action.
            GITHUB_ACTOR	The name of the person or app that initiated the workflow. For example, octocat.
            GITHUB_REPOSITORY	The owner and repository name. For example, octocat/Hello-World.
            GITHUB_EVENT_NAME	The webhook name of the event that triggered the workflow.
            GITHUB_EVENT_PATH	The path to a file that contains the POST response of the event that triggered the workflow. Value: /github/workflow/event.json.
            GITHUB_WORKSPACE	The GitHub workspace path. Value: /github/workspace.
            GITHUB_SHA	The commit SHA that triggered the workflow.
            GITHUB_REF	The branch or tag ref that triggered the workflow. For example, refs/heads/feature-branch-1. If neither a branch or tag is available for the event type, the variable will not exist.
            GITHUB_TOKEN	A GitHub App installation token scoped to the repository containing the workflow file. This variable is only present if requested in the executing action. To learn more about secrets, see "Storing secrets."
        */
        const environment = {
            HOME: '/github/home',
            GITHUB_WORKFLOW: '',
            GITHUB_ACTION: action.name,
            GITHUB_ACTOR: context.payload.sender.login,
            GITHUB_REPOSITORY: context.payload.repository.full_name
            GITHUB_EVENT_NAME: context.name,
            GITHUB_EVENT_PATH: '/github/workflow/event.js', /* Write this file and map a volume into the container! */
            GITHUB_WORKSPACE: '/github/workspace',
            GITHUB_SHA: context.payload.check_run.head_sha, /* correct??? */
            GITHUB_REF: context.payload.check_suite.head_branch, /* correct ??? */
            GITHUB_TOKEN: '' /* I don't think we can access this! */
        }

        /* need to write parser for pathspec at:
            https://developer.github.com/actions/creating-workflows/workflow-configuration-options/#using-a-dockerfile-image-in-an-action */

        // only support docker:// urls for now....
        const usesUrl = url.parse(action.uses);
        if (! usesUrl.protocol === "docker:") {
            throw Error("Unsupported docker image pathspec.");
        }
        const image = usesUrl.host + usesUrl.path;
        
        this.docker.createContainer({
            Image: image,
            Tty: false,
            Env: environment
        }).then(function(container) {
            return container.start();
        }).this(function(container) {
            /* Need to do this correctly... :sob: */
            return container.wait();
        });
    }
}

function handleGitHubEvent (request) {
   // put this inside your webhooks route handler
   webhooks.verifyAndReceive({
     id: request.headers['x-github-delivery'],
     name: request.headers['x-github-event'],
     payload: request.body,
     signature: request.headers['x-github-signature']
   }).catch(handleErrorsFromHooks)
}

const container_manager = new ContainerManager();
function spawnContainer (action, context) {
    container_manager.runContainer(action, context); 
}

/* Register actions defined in main.workflow.json on webhooks */
actions(webhooks, 'main.workflow.json', spawnContainer);

/* Lambda function for handling github webhooks */
exports.handler = iopipe((event, context) => {
  event.Records.forEach((record) => {
    const data = Buffer.from(record.kinesis.data, 'base64');
    handleGitHubEvent(data);
  })
});

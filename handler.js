'use strict';

// set $IOPIPE_TOKEN in environment variables
// find your token at dashboard.iopipe.com/install
const iopipe = require('@iopipe/iopipe')();
const WebhooksApi = require('@octokit/webhooks');
const actions = require('./actions.js');

const webhooks = new WebhooksApi({
  secret: process.env.GITHUB_WEBHOOK_SECRET
})

function runEcsTask (task, context) {
    // context = {id, name, payload}
    //aws.ecs.something.something()
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

actions(webhooks, 'main.workflow.json', runEcsTask);

exports.handler = iopipe((event, context) => {
  event.Records.forEach((record) => {
    const data = Buffer.from(record.kinesis.data, 'base64');
    handleGitHubEvent(data);
  }) 
});

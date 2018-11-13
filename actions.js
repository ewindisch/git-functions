const hcl2json = require('hcl-to-json');

function openWorkflow (file, callback) {
    fs.readFile(file, (data) => {
        callback(JSON.parse(hcl2json(file)));
    })
}

function recurseNeeds (workflow, action, list) {
    list += action;
    if (! action.needs) {
        return list
    }
    if (action.needs instanceof Array) {
        if (list.includes(action.needs)) {
            throw Error("Recursive workflow.");
        }
        return recurseNeeds(workflow, action.needs, list)
    }
    return action.needs.map((requirement) => {
        if (list.includes(action.needs)) {
            throw Error("Recursive workflow.");
        }
        return recurseNeeds(workflow, requirement, list)
    }).concat()
}

function runStack(callstack, handler, context) {
    callstack.forEach((action) => {
        handler(action, context);
    });
}

function register (emitter, workflow, handler) {
    var actionFuncs = {};
    workflow.action.forEach((key) => {
        actionFuncs[key] = ({id, name, payload}) => {
            callstack = recurseNeeds(workflow, key, [key]);
            runStack(callstack, handler, {id, name, payload});
        }
    });

    workflow.workflow.forEach((key) => {
        wkfw = workflow.workflow[key]
        // Parallel
        emitter.on(wkfw.on, actionFuncs[wkfw.on]);
    });
}

module.exports = function registerWorkflowActionsHandler (emitter, file, handler) {
    openWorkflow(file, (workflow) => {
        register(emitter, workflow, handler);
    });
}

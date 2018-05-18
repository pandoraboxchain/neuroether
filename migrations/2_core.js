'use strict';

const Pandora = artifacts.require('Pandora');
const WorkerNode = artifacts.require('WorkerNode');
const CognitiveJob = artifacts.require('CognitiveJob');
const CognitiveJobFactory = artifacts.require('CognitiveJobFactory');
const WorkerNodeFactory = artifacts.require('WorkerNodeFactory');
const StateMachineLib = artifacts.require('StateMachineLib');
const JobQueueLib = artifacts.require('JobQueueLib');
const {
    saveAddressToFile
} = require('./utils');

module.exports = (deployer, network, accounts) => {
    let pandora, wnf, cjf;

    return deployer
        .then(_ => deployer.deploy(JobQueueLib))
        .then(_ => deployer.deploy(StateMachineLib))
        .then(_ => deployer.link(StateMachineLib, [WorkerNode, CognitiveJob]))
        .then(_ => {
            return deployer.deploy(CognitiveJobFactory)
        })
        .then(_ => CognitiveJobFactory.deployed())
        .then(instance => {
            cjf = instance
            return deployer.deploy(WorkerNodeFactory)
        })
        .then(_ => WorkerNodeFactory.deployed())
        .then(instance => {
            wnf = instance
            deployer.link(JobQueueLib, Pandora)
            return deployer.deploy(Pandora, cjf.address, wnf.address)
        })
        .then(_ => Pandora.deployed())
        .then(instance => {
            pandora = instance
            console.log('>>>>>>>>>>>>>>>>>', deployer);
            return saveAddressToFile(deployer.basePath, 'Pandora.json', JSON.stringify(pandora.address));
        })
        .then(_ => pandora.whitelistWorkerOwner(accounts[0]))
        .then(_ => wnf.transferOwnership(pandora.address))
        .then(_ => cjf.transferOwnership(pandora.address))
        .then(_ => pandora.initialize())
        .catch(console.error);
};

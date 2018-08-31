 
'use strict';

const functions = require('firebase-functions');
const app = require('./gcJobBankApp');
let items = [];
module.exports.gcJobBankAction = functions.https.onRequest(app);
 
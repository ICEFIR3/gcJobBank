'use strict';

 
const request = require('request-promise-native');
//const http = require('https');
const GcJobBankApp = require('actions-on-google').dialogflow();
const {
  SimpleResponse,
} = require('actions-on-google');

const config = require('./configuration');
const constants = require('./constants');


GcJobBankApp.middleware((conv) => {
 
//	if(!conv.data.items){
//		conv.data.attributes = {};
//		conv.data.attributes['category'] = 'en';
//		var options = {
//				uri: config.feeds[conv.data.attributes['category']],
//				json: true
//		};
//		return request.get(options).then( result => {
//			if(result.length > 1){
//				conv.data.items=result;
//				
//			}
//			return Promise.resolve( conv );
//		})
//	}
    return conv;
	
});
GcJobBankApp.intent('welcome', conv => {
 
  conv.ask('<speak>Welcome to canada.ca Job Bank.</speak>');
 
});

GcJobBankApp.intent('all jobs', (conv, params)=> {
	 const province = conv.parameters['provinces'];
	 const city = conv.parameters['geo-city'];
	 conv.ask('HELLO WORLD ' + city + ' and ' + province);
});

GcJobBankApp.intent('newest jobs', conv => {
	newItemNotification(conv);
	readItems(conv);
});

GcJobBankApp.intent('next', conv => {
	readItems(conv);
});

GcJobBankApp.intent('back', conv => {
	readPreviusItem(conv);
});
module.exports = GcJobBankApp;
 
function fetchFeed(conv) {
//  	console.log(conv.data.attributes['category']);
//	if(!conv.data.items){
//		var options = {
//				uri: config.feeds[conv.data.attributes['category']],
//				json: false
//		};
//		return request.get(options).then( result => {
//			if(result.length > 1){
//				conv.data.items=result;
//				
//			}
//			return Promise.resolve( conv );
//		})
//	}
    return conv;
}

function newItemNotification(conv) {
	let category = conv.data.attributes['category'];
    let indexKey = 'index' + category;
    let directionKey = 'direction' + category;
    let justStartedKey = 'justStarted' + category;
    // Initialize index and direction
    conv.data.attributes[indexKey] = 0;
    conv.data.attributes[directionKey] = 'forward';
    conv.data.attributes[justStartedKey] = true;
    // Calculate number of new items available in the feed since the last visit
    let newItemCount = -1;
    if (conv.data.attributes['latestItem'] && conv.data.attributes['latestItem'][category]) {
        let lastItemTitle = conv.data.attributes['latestItem'][category];
        for (let index = 0; index < conv.data.items.length; index++) {
            if (conv.data.items[index].title === lastItemTitle) {
                newItemCount = index;
                break;
            }
        }
    }else{
    	newItemCount=config.number_feeds_per_prompt;
    } 
    conv.data.attributes['latestItem'] ={};
    conv.data.attributes['latestItem'][category] = conv.data.items[0].title;
    conv.data.attributes['newItemCount'] = newItemCount;
   
}

function readItems(conv){
	let category = conv.data.attributes['category'];
	let indexKey = 'index' + category;
	let directionKey = 'direction' + category;
	let feedEndedKey = 'feedEnded' + category;
	let justStartedKey = 'justStarted' + category;
	if (!conv.data.attributes[feedEndedKey]) {
		let pagedItems = [];
		let feedLength = conv.data.items.length;
		let index;
		let currentIndex = conv.data.attributes[indexKey];
		if (currentIndex === 0) {
			// Mark flag to signify start of feed
			conv.data.attributes[justStartedKey] = true;
		} else {
			conv.data.attributes[justStartedKey] = null;
		}
		if (conv.data.attributes[directionKey] === 'backward') {
			// Adjustment for change in direction
			conv.data.attributes[directionKey] = 'forward';
			currentIndex += config.number_feeds_per_prompt;
		}
		let currentPaginationEnd = currentIndex + config.number_feeds_per_prompt;
		for (index = currentIndex; index < currentPaginationEnd && index < feedLength; index++) {
			pagedItems.push(conv.data.items[index]);
		}
		if (index === feedLength) {
			// Mark flag to signify end of feed
			conv.data.attributes[feedEndedKey] = true;
		}
		conv.data.attributes[indexKey] = currentPaginationEnd;
		readPagedItemsSingleMode(conv,pagedItems,'');
	} else {
		const message = 'Sorry, you are at the end of the feed. ' +constants.breakTime['300']+
            'You can say previous to hear previous feeds.';
        conv.ask(new SimpleResponse({
			speech: '<speak>'+message+'</speak>',
  			text: message
		}));
	}
}

function readPreviusItem(conv){
	let category = conv.data.attributes['category'];
	let indexKey = 'index' + category;
	let directionKey = 'direction' + category;
	let feedEndedKey = 'feedEnded' + category;
	let justStartedKey = 'justStarted' + category;
	if (!conv.data.attributes[justStartedKey]) {
		let pagedItems = [];
		let index;
		let currentIndex = conv.data.attributes[indexKey];
		if (conv.data.attributes[directionKey] === 'forward') {
			// Adjustment for change in direction
			currentIndex -= config.number_feeds_per_prompt;
			conv.data.attributes[directionKey] = 'backward';
		}
		let currentPaginationStart = currentIndex - config.number_feeds_per_prompt;
		if (conv.data.attributes[feedEndedKey]) {
			conv.data.attributes[feedEndedKey] = null;
		}
		currentIndex--;
		for (index = currentIndex; index >= currentPaginationStart && index >= 0; index--) {
			pagedItems.unshift(conv.data.items[index]);
		}
		if (index === -1) {
			// Mark flag to signify start of feed
			conv.data.attributes[justStartedKey] = true;
			currentPaginationStart = 0;
		}
		conv.data.attributes[indexKey] = currentPaginationStart;
		readPagedItemsSingleMode(conv,pagedItems,'');
	} else {
		const message = 'Sorry, you are at the start of the feed. '+constants.breakTime['300'] +
            'You can say next to hear subsequent items.';
        conv.ask(new SimpleResponse({
			speech: '<speak>'+message+'</speak>',
  			text: message
		}));
	}

}

function readPagedItemsSingleMode(conv,items,msg){
 // Read items to the user
	let category = conv.data.attributes['category'];

	let message = msg;
	let cardContent = '';
	let content = '';

	const feedEndedKey = 'feedEnded' + category;
	// add message to notify number of new items in the feed
	if (conv.data.attributes['newItemCount']) {
		message += config.welcome_message + constants.breakTime['100'];
		if (conv.data.attributes['newItemCount'] > 0) {
			let msg;
			if (conv.data.attributes['newItemCount'] === 1) {
				msg = ' new item. ';
			} else {
				msg = ' new items. ';
			}
			cardContent = 'There are ' + conv.data.attributes['newItemCount'] + msg + '\n';
			message += ' has ' + conv.data.attributes['newItemCount'] + msg +
				constants.breakTime['200'];
		} else {
			message += 'There are ' + conv.data.attributes['feedLength'] + ' items in the feed. ';
		}
		conv.data.attributes['newItemCount'] = null;
		// Setting start flag as false
		if (conv.data.attributes['start']) {
			conv.data.attributes['start'] = false;
		}
	}

	items.forEach(function (feed) {
		content += config.speech_style_for_numbering_feeds + " " + (feed.count + 1) + ". " + feed.title + ". ";
		cardContent += config.speech_style_for_numbering_feeds + " " + (feed.count + 1) + ". " + feed.title;
		// If config flag set to display description, append description
		if (!config.display_only_title_in_card) {
			cardContent += "  -  ";
			cardContent += feed.description;
		}
		if (!config.speak_only_feed_title) {
			content += constants.breakTime['300'];
			content += feed.description + " ";
		}
		cardContent += '\n';
		content += constants.breakTime['500'];
	});
	message += content;
	
	
	
	if (conv.data.attributes[feedEndedKey]) {
		message += ' You have reached the end of the feed. ' + constants.breakTime['200'] +
			' You can say restart to hear the feed from the beginning or say previous to hear newer items. ';
		cardContent += 'You have reached the end of the feed. ' +
			' You can say restart to hear the feed from the beginning or say previous to hear newer items. ';

	} else {
		message += 'You can say next for more or exit to quit. ';
		cardContent += 'You can say next for more or exit to quit.';
	}
	conv.ask(new SimpleResponse({
			speech: '<speak>'+message+'</speak>',
  			text: cardContent
		}));

}

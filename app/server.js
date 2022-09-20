//these orange words are the ones from external libraries. Declaring these variables allows for access to the libraries
const http = require('http');
const finalHandler = require('finalhandler');
const Router = require('router');
const bodyParser = require('body-parser');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

// State holding variables
let goals = [];
let user = {};
let categories = [];
let users = [];

//declaring a variable called router and setting it equal to a mere number 
const PORT = process.env.PORT || 8080;

// Setup router
const router = Router();
//body parser will parse the body of the request 
router.use(bodyParser.json());

//createServer is a method of the http object. Parameters are req and res. Think of req as the incoming request and res as the outgoing response. Both are objects.
const server = http.createServer((req, res) => {
	//establish the default response header of the response object (ie success)
	res.writeHead(200);
	//this is the router object. 3 arguments. 1st is the request object, 2nd is the response object, 3rd is a function that will be called when the router is done.
	router(req, res, finalHandler(req, res));
});

//server.listen is a method of the server object. It takes 2 arguments here, the port number and error handling function.
server.listen(PORT, err => {
	if (err) throw err;
	console.log(`server running on port ${PORT}`);
	//populate categories in a mock-up database fashion (it's a mockup because it's just a json file). JSON.parse will parse the json file into a javascript object and assign it to the categories variable. ReadFileSync is a method of the fs object. It takes 2 arguments, the file name and the encoding.
	categories = JSON.parse(fs.readFileSync('categories.json','utf-8'));

	//populate goals 
	goals = JSON.parse(fs.readFileSync('goals.json','utf-8'));

	//populate users
	users = JSON.parse(fs.readFileSync('users.json','utf-8'));
	// hardcode "logged in" user. This sets the user variable to the first user in the users array as to simulate a logged in user.
	user = users[0];
});

const saveCurrentUser = (currentUser) => {
	// set hardcoded "logged in" user
	users[0] = currentUser;
	fs.writeFileSync('users.json', JSON.stringify(users), 'utf-8');
};

// Routes. These are the endpoints. The first argument is the path. The second is a function that takes 2 arguments, the request and the response. router.get is a method of the router object. It takes 2 arguments, the path and the function. The function is a callback function that will be called when the router is done.
router.get('/v1/goals', (request, response) => {
	//parses the url and returns a url object with each part of the url as a property
	const parsedUrl = url.parse(request.originalUrl);
	//The querystring module provides utilities for parsing and formatting URL query strings.
	const { query, sort } = querystring.parse(parsedUrl.query);
	let goalsToReturn = [];
	//if the query is not empty then filter the goals array and return the filtered array
	if (query !== undefined) {
		goalsToReturn = goals.filter(goal => goal.description.includes(query));
		if (!goalsToReturn) {
			response.writeHead(404, 'There arent any goals to return');
			return response.end();
		}
	} else {
		goalsToReturn = goals;
	}
	//if the sort is not empty then sort the goals array and return the sorted array
	if (sort !== undefined) {
		goalsToReturn.sort((a, b) => a[sort] - b[sort]);
	}
	response.writeHead(200, { 'Content-Type': 'application/json' });
	//response.end will end the response process and send the response to the client. It takes 1 argument, the data to send
	return response.end(JSON.stringify(goalsToReturn));
});

//GET A SINGLE GOAL. The colon is a wildcard. It will match anything that comes after the colon. The request object has a params property that will contain the wildcard value.
router.get('/v1/me', (request, response) => {
	if (!user) {
		response.writeHead(404, 'That user does not exist');
		return response.end();
	}
	response.writeHead(200, { 'Content-Type': 'application/json' });
	return response.end(JSON.stringify(user));
});

//USER ACCEPT A SPECIFIC GOAL
router.post('/v1/me/goals/:goalId/accept', (request, response) => {
	const { goalId } = request.params;
	const goal = goals.find(goal => goal.id == goalId);
	if (!goal) {
		response.writeHead(404, 'That goal does not exist');
		return response.end();
	}
	response.writeHead(200);
	user.acceptedGoals.push(goal);
	saveCurrentUser(user);
	return response.end();
});

//ACHIEVE A GIVEN GOAL
router.post('/v1/me/goals/:goalId/achieve', (request, response) => {
	const { goalId } = request.params;
	const goal = goals.find(goal => goal.id == goalId);
	if (!goal) {
		response.writeHead(404, 'That goal does not exist');
		return response.end();
	}
	response.writeHead(200);
	user.achievedGoals.push(goal);
	saveCurrentUser(user);
	return response.end();
});

//CHALLENGE A GIVEN GOAL
router.post('/v1/me/goals/:goalId/challenge/:userId', (request, response) => {
	const { goalId, userId } = request.params;
	const goal = goals.find(goal => goal.id == goalId);
	const user = users.find(user => user.id == userId);
	if (!goal) {
		response.writeHead(404, 'That goal does not exist');
		return response.end();
	}
	response.writeHead(200);
	user.challengedGoals.push(goal);
	saveCurrentUser(user);
	return response.end();
});

//GIFT A GIVEN GOAL
router.post('/v1/me/goals/:goalId/gift/:userId', (request, response) => {
	const { goalId, userId } = request.params;
	const goal = goals.find(goal => goal.id == goalId);
	const user = users.find(user => user.id == userId);
  
	//handle goal and/or user not existing
	if (!goal) {
		response.writeHead(404, 'That goal does not exist');
		return response.end();
	}
	if (!user) {
		response.writeHead(404, 'That user does not exist');
		return response.end();
	}
	response.writeHead(200);
	user.giftedGoals.push(goal);
	saveCurrentUser(user);
	response.end();
});

//GET ALL CATEGORIES
router.get('/v1/categories', (request, response) => {
	const parsedUrl = url.parse(request.originalUrl);
	const { query, sort } = querystring.parse(parsedUrl.query);
	let categoriesToReturn = [];
	if (query !== undefined) {
		categoriesToReturn = categories.filter(category =>
			category.name.includes(query)
		);

		if (!categoriesToReturn) {
			response.writeHead(404, 'There arent any goals to return');
			return response.end();
		}
	} else {
		categoriesToReturn = categories;
	}
	if (sort !== undefined) {
		categoriesToReturn.sort((a, b) => a[sort] - b[sort]);
	}
	response.writeHead(200, { 'Content-Type': 'application/json' });
	return response.end(JSON.stringify(categoriesToReturn));
});

//GET ALL GOALS IN CATEGORY
router.get('/v1/categories/:categoryId/goals', (request, response) => {
	const { categoryId } = request.params;
	const category = categories.find(category => category.id == categoryId);
	if (!category) {
		response.writeHead(404, 'That category does not exist');
		return response.end();
	}
	response.writeHead(200, { 'Content-Type': 'application/json' });
	const relatedGoals = goals.filter(
		goals => goals.categoryId === categoryId
	);

	console.log(relatedGoals);
	return response.end(JSON.stringify(relatedGoals));
});

module.exports = server;
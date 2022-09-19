const http = require('http');
const fs = require('fs');

// State holding variables
let goals = [];
let user = {};
let categories = [];

http.createServer(function (request, response) {
	const { headers, method, url } = request;
	let body = [];
	request.on('error', (err) => {
		// Log any errors for now to the console to debug
		console.error(err);
	}).on('data', (chunk) => {
		// Add the data from the next 'chunk' to the data array
		body.push(chunk);
	}).on('end', () => {
		// Put together all the pieces of the request body
		body = Buffer.concat(body).toString();
    
		// Log errors for now
		response.on('error', (err) => {
			console.error(err);
		});
    
		// Offload the routing and handling of the api calls to helper function
		handleApiRequest(body,request,response);
	});
}).listen(3001, ()=> {
	// Load dummy data into server memory for serving
	goals = JSON.parse(fs.readFileSync('goals.json','utf-8'));
  
	// Load all users into users array and for now hardcode the first user to be "logged in"
	users = JSON.parse(fs.readFileSync('users.json','utf-8'));
	user = users[0];
  
	// Load all categories from file
	categories = JSON.parse(fs.readFileSync('categories.json','utf-8'));
});

function handleApiRequest(body, request,response) {
	// Set the default headers on the response
	response.statusCode = 200;
	response.setHeader('Content-Type', 'application/json');
	if (request.method === 'GET') {
		// Handle the Get endpoints
		if (request.url === '/v1/goals') {
			return response.end(JSON.stringify(goals));
		} 
	} else if (request.method === 'POST') {
		// Handle the POST endpoints
		// Pull out body of request for processing
		let postBody = JSON.parse(body);
		// Use regular expressions to pull out url param
		if (request.url.search('/\/v1\/me\/goals\/*\/accept/')) {
			let goalId = Number(request.url.match('/\d+$/'));
			// Make sure goal exists
			let goal = goals.find((goal)=> {
				return goal.id == goalId;
			});
			user.acceptedGoals.push(goal); 
			return response.end();
		}
	}
}

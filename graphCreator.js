function buildGraph(){
			d3.select("svg").remove();

			/**********************************/
    /*
The file we got in input is Composed by a JSON object, the result of the
algebric operation. It's structure is:
{interests: ["id_interest1","id_interest2","id_interestN"], users: "user1-user2-userN"}
*/

var fileTable = document.getElementById("fileSelectionMenu");
var operationTable = document.getElementById("operationSelectionMenu");
var linkFile = fileTable.options[fileTable.selectedIndex].text;
var operation = operationTable.options[operationTable.selectedIndex].text;
var outputFile = operation+'_'+linkFile.split('.')[0]+'.txt';

//THIS IS THE NEW READER FUNCTION, USED TO EXTRACT DATA COMPUTED BY THE JAR FILE
d3.queue(2)
.defer(d3.text, './output/'+outputFile)
.defer(d3.text, linkFile)
.await(function(err, data, data2){
	if (err) throw err;
  //Work on first file
  data=JSON.parse(data);
  var usersList = data.users.split('-');
  if (usersList.length>1)
  	usersList.splice(-1,1);
  console.log(usersList);

  //Work on second file
  var interestLinks=[];
  var interestsMap={};
  var elements = data2.split('\n');
  for (var i=0, l=elements.length; i<l; i++){
  	var interests = parseLine(elements[i]);
  	interests.forEach(function(el){
  		var id = el.split('-')[0];
  		var parents = el.split('-')[1].split(':')[1].split(',');
        //Interests can't change, so there will be some duplicate filtered
        if (!interestsMap[id])
        	interestsMap[id] = parents;

      });
  }
  var keys = Object.keys(interestsMap);
  for (var i=0, l=keys.length; i<l; i++){
  	if (keys[i]){
  		var relatedInterests = interestsMap[keys[i]];
  		for (var j=0, len=relatedInterests.length; j<len; j++){
  			if (relatedInterests[j]){
  				var link = JSON.stringify({source: keys[i], target: relatedInterests[j], type: 'parents'})
  				interestLinks.push(JSON.parse(link));
  			}
  		} 
  	}

  }
  var finalLinks = linkCreator(usersList, data.interests).concat(interestLinks);
  drawMyGraph(finalLinks); 

});

//This function is applied to each line. It creates data in the map
let parseLine = function(line){
	var obj = JSON.parse(line);
  map = jsonExtractor('info.interests.all',obj); // return the object extracted for this value
  interests = getValuesFromMap(map,['parents']);
  return interests
}

//Return the value extracted thanks to fields
function jsonExtractor(fields, obj){
	nestedFields = fields.split('.');
	json = obj;
	for (var j=0, lu=nestedFields.length; j<lu; j++) { 
		json=json[nestedFields[j]]
	}
	return json;
}

//Return a list containing all the interests for that user
function getValuesFromMap(obj, attributes){
	var interests = [];
	if (obj){
		var attr=[];
    Object.keys(obj).forEach(function(k) {//extracts keys from the map of interests
    	var return_value = '';
    	return_value += k;

    	attributes.forEach(function(attr){
    		return_value += '-'+attr+':'+obj[k][attr];
    	});
    	interests.push(return_value);
    });
  }
  return interests;
}

function linkCreator(key,value){
	var links=[];
	for (var i=0, l=key.length; i<l; i++){
		console.log(key[i])
		for (var j=0, len=value.length; j<len; j++){
			var link = JSON.stringify({source: key[i], target: value[j], type: 'interest'});
			links.push(JSON.parse(link));
		}
	}

	return links;
}

function drawMyGraph(links){
	var nodes = {};

	var w = 1280,
	h = 800;

	links.forEach(function(link) {
		link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
		link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
	});

	var svg = d3.select("#chart").append("svg")
	.attr("width", w)
	.attr("height", h);

	d3.select("#linkDist").on("input", function() {
		force.linkDistance(+this.value)
		.start();
	});

	d3.select("#charge").on("input", function() {
		force.charge(this.value*(-10))
		.start();
	});

	d3.select("#gravity").on("input", function() {
		force.gravity(this.value/100)
		.start();
	});

	var force = d3.layout.force()
	.nodes(d3.values(nodes))
	.links(links)
	.size([w, h])
	.gravity(0.5)
	.linkDistance(500)
	.charge(-800)
	.on("tick", tick)
	.start();

	var link = svg.selectAll('.link')
	.data(links)
	.enter().append('line')
	.attr('class', 'link')
	.style('stroke', function(l) {
		if (l.type=='interest')
			return 'blue';
		if (l.type=='parents')
			return 'red';
	});

	var node = svg.selectAll('.node')
	.data(d3.values(nodes))
	.enter().append('g')
	.attr('class','node')
	.call(force.drag);

	var circle = node.append('circle')
	.filter(function(d) { return /^\d+$/.test(d.name) && d.name.length>5})
	.style("fill", "red")
	.attr("r", 6.5);

	var interests = node.append('circle')
	.attr('r', 4.5)
	.filter(function(d) { return !/^\d+$/.test(d.name) && d.name.length>5});

	node.on("mouseover", function (d) {
		link.style('stroke-width', function(l) {
			if (d === l.source || d === l.target)
				return 4;
			else
				return 1.5;
		});
	})
	.on("mouseout",function (d) {
		link.style('stroke-width', 1.5)
	});

	var label = node.append('text')
	.style("font-size","20px")
	//.attr('dy','25px')
	.text(function(d){ return d.name; });

	function tick() {
		link
		.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

		circle
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

		interests
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });

		label
		.attr("x", function(d) { return d.x + 8; })
		.attr("y", function(d) { return d.y; });

	}
}
}
var focusNode = null, highlightNode = null;
var highlightTrans = 0.1;
var lookupTable={};

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
  	lookupTableAdd(elements[i]);
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
  //Reset slidebars when reloading graph
  d3.select("#linkDist").property("value", 500);
  d3.select("#gravity").property("value", 50);
  d3.select("#charge").property("value", 50);
  drawMyGraph(finalLinks); 

});

  /******************************************/
	/*** Here prepare a LookUp table to get info on interests when overed ***/
	
function lookupTableAdd(line){
	obj = JSON.parse(line);
	var interests = obj.info.interests.all;
	var ids = d3.keys(interests);
	for (var i=0, l=ids.length; i<l; i++){
		var key = ids[i];
		if (lookupTable[key] == null){
			var data = JSON.stringify({parents: interests[key].parents, name: interests[key].name, display: interests[key].display, category: interests[key].category})
			lookupTable[key] = data;
		}
	}
}

/*********** ************** ******************/

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
		for (var j=0, len=value.length; j<len; j++){
			var link = JSON.stringify({source: key[i], target: value[j], type: 'interest'});
			links.push(JSON.parse(link));
		}
	}

	return links;
}

function drawMyGraph(links){

	var linkedByIndex = {};

	var nodes = {};

	var w = window.innerWidth,
	h = window.innerHeight;

	links.forEach(function(link) {
		link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
		link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
		linkedByIndex[link.source + "," + link.target] = true;
	});

	function isConnected(a, b) {
		return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
	}

	function hasConnections(a) {
		for (var property in linkedByIndex) {
			s = property.split(",");
			if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) 					return true;
		}
		return false;
	}

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
	.attr('type', function(l) {
		if (l.type=='interest')
			return 'interest';
		if (l.type=='parents')
			return 'parents';
	})
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
		var connections = 0;
		link.style('stroke-width', function(l) {
			if (d === l.source || d === l.target){
				connections+=1;
				return 4;
			}
			else
				return 1.5;
		});
		var testo = lookupTable[d.name];
		if (testo == null) testo=d.name;
		d3.select('#infoDiv').attr('visibility','visible')
		.style('background','white')
		.append('text')
		.style('font-weight','bold').text(testo+ ' links number: '+connections);
	})
	.on("mousedown", function(d){
		d3.event.stopPropagation();
		focusNode = d;
		setFocus(d);
		if (highlightNode === null) setHighlight(d)
	})
	.on("mouseout",function (d) {
		link.style('stroke-width', 1.5)
		d3.select('#infoDiv').style('background','transparent').select('text').remove();
		d3.select('#infoDiv').attr('visibility','hidden');
	});

	var label = node.append('text')
	.style("font-size","20px")
	.text(function(d){ return d.name; });

	d3.select(window).on("mouseup", function() {
		if (focusNode !== null){
			focusNode = null;
			if (highlightTrans < 1){
				circle.style('opacity', 1);
				interests.style('opacity', 1);
				label.style('opacity', 1);
				link.style('opacity', 1);
			}
		}
		if (highlightNode === null) exitHighlight();
	});

	function exitHighlight(){
		highlightNode = null;
		if (focusNode===null){
			svg.style("cursor","move");			
		}
	}

	function setFocus(d){
		if (highlightTrans<1)  {
			circle.style("opacity", function(o) {
				return isConnected(d, o) ? 1 : highlightTrans;
			});

			interests.style("opacity", function(o) {
				return isConnected(d, o) ? 1 : highlightTrans;
			});

			label.style("opacity", function(o) {
				return isConnected(d, o) ? 1 : highlightTrans;
			});
			
			link.style("opacity", function(o) {
				return o.source.index == d.index || o.target.index == d.index ? 1 : highlightTrans;
			});		
		}
	}

	function setHighlight(d){
		svg.style('cursor','pointer');
		if (focusNode !== null) d = focusNode;
		highlightNode = d;
	}

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
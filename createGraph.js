/*
The file we got in input is Composed by a JSON object, the result of the
algebric operation. It's structure is:
{interests: ["id_interest1","id_interest2","id_interestN"], users: "user1-user2-userN"}
*/

//THIS IS THE NEW READER FUNCTION, USED TO EXTRACT DATA COMPUTED BY THE JAR FILE
d3.queue(2)
.defer(d3.text, './output.txt')
.defer(d3.text, 'prova2utenti.json')
.await(function(err, data, data2){
  if (err) throw err;
  //Work on first file
  data=JSON.parse(data);
  var usersList = data.users.split('-');
  usersList.splice(-1,1);

  //Work on second file
  var interestLinks=[];
    var interestsMap={};
    var elements = data2.split('\n');
    for (var i=0, l=elements.length; i<l; i++){
      var interests = parseLine(elements[i]);
      interests.forEach(function(el){
        var id = el.split('-')[0];
        var parents = el.split('-')[1].split(':')[1].split(',');
        //Interests can't change, so there will be some duplicate not used
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
            //console.log(JSON.parse(link));
            interestLinks.push(JSON.parse(link));
          }
        } 
      }

    }
    //console.log(interestLinks);
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
  var attr=[];
  var interests = [];
  Object.keys(obj).forEach(function(k) {//extracts keys from the map of interests
    var return_value = '';
    return_value += k;
  
  attributes.forEach(function(attr){
    return_value += '-'+attr+':'+obj[k][attr];
  });
  interests.push(return_value);
  });
  return interests;
}

//MODIFICARE QUESTA FUNZIONE A CUI PASSERÒ USER, LISTA INTERESSI
function linkCreator(key,value){
  var links=[];
  for (var i=0, l=key.length; i<l; i++){
    for (var j=0, len=value.length; j<len; j++){
      var link = JSON.stringify({source: key[i], target: value[j], type: 'interest'});
      links.push(JSON.parse(link));
    }
  }
  
  return links.concat();
}

//Debugging function
function print5links(links){
  for (var i=0, l=5; i<l; i++){
    console.log(JSON.stringify(links[i]));
  }
}

function drawMyGraph(links){
  //print5links(links); //ne stampa molti di più
  var nodes = {};

  var w = 1280,
      h = 800;

  //  console.log(links);

  links.forEach(function(link) {
    //link=JSON.parse(myLink);
    //console.log(link);
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([w, h])
      //.gravity(0.1)
      .linkDistance(80)
      .charge(-500)
      .on("tick", tick)
      .start();
      

  var svg = d3.select("#chart").append("svg")
      .attr("width", w)
      .attr("height", h);


  var link = svg.selectAll('.link')
        .data(links)
        .enter().append('line')
        .attr('class', 'link');

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
        //.style("fill", "red")
        //.attr("r", 5.5);

  var label = node.append('text')
    .attr('dy','.35em')
    .text(function(d){ return d.name; });

  function tick() {
    /*path.attr("d", function(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    });*/
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

  function mouseover(){
    d3.select(this).select("text").style("visibility", "visible");
    /*d3.selectAll('.link').style('stroke-width', function(l) {
      console.log(d3.select(this).select("text"));
    if (d3.select(this).select("text") == l.source || d3.select(this).select("text") == l.target)
      return 8;
    else
      return 2;
    });*/
  }
  function mouseout(){
    d3.select(this).select("text").style("visibility", "hidden");
    //d3.selectAll('.link').style('stroke-width', 2);
  }
}
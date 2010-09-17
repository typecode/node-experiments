var po = org.polymaps;

var appmap = function(id){
  var _me;
  map = po.map()
    .container(document.getElementById("app").appendChild(po.svg("svg")))
    .add(po.interact())
    .add(po.hash());
    
  map.add(po.image()
    .url(po.url("http://{S}tile.cloudmade.com"
    + "/"+environment.cloudmade.api_key
    + "/998/256/{Z}/{X}/{Y}.png")
    .hosts(["a.", "b.", "c.", ""])));
    
  map.add(po.compass().pan("none"));
  
  return map;
}

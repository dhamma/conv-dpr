var yase=require('yase');
var services={};
yase.api(services);
var thaifn='./thaimul.ydb';
var vrifn='../cst/vrimul.ydb';

var thaidb=yase.use(thaifn);
var vridb=yase.use(vrifn);

var enumsutraid=function(db) {
	var sidarr=[];
	var sidobj=db.get(['tags','p','sid'],true); //get all sid
	for (var slot in sidobj) {
		sidarr.push(sidobj[slot]);
	}
	return sidarr;	
}

var thaisid=enumsutraid(thaidb);
var vrisid=enumsutraid(vridb);
var opts={db:thaifn};
for (var i in vrisid) {
	var id=vrisid[i].match(/(.*?)\.(.*?)$/);
	var selector=['readunit[id='+id[1],'p[sid='+id[2]];

	vritext=services['yase'].getTextByTag({db:vrifn, selector:selector});
	thaitext=services['yase'].getTextByTag({db:thaifn, selector:selector});
	
	//compare the text
	console.log(thaitext,vritext);
	break;
}
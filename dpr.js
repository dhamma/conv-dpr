var set=process.argv[2]||'thai';
var titles={'thai':"Thai Tipitaka"}

var descs={'thai':"Thai Tipitaka converted from DPR"}
var customfunc=require('../cst/js/tipitakacustom.js')
customfunc.isBreaker=function(ch) {
	return  ( ch=='.') ;
}

console.log(require('yase').build({
	dbid:set+'mul',
	slotshift:8,
	loglevel:2,
	linkto:'vrimul',
	title: titles[set],
	desc: descs[set],
	groupunit:['p','p[n]'],
	schema:function() {
		this.toctag(["nikaya","book"]).attr("book","id",{"depth":1,"saveval":true,"unique":true})
		 .pagebreak("pb").attr("pb","n",{"depth":2,"saveval":true})
		 .toctag("readunit").attr("readunit","id",{"depth":1,"saveval":true,"unique":true})
		 .emptytag("pgroup").attr("pgroup","id",{"depth":1,"saveval":true,"unique":true})
		 .paragraph("p").attr("p","n",{"depth":1,"sparseval":true,"range":"-"})
		if (set=='thai') {
		    this.attr("p","sid", //secondary reference number, SN = sutta no. , DN= section no.
		    	{"depth":2,"sparseval":true,"unique":true,
		    	  "prefix":"readunit[id]","range":"-"})
		}
	},
	input:set+'/'+set+'mul.lst',
	output:'./'+set+'mul.ydb',
	author:'yapcheahshen@gmail.com',
	url:'http://www.ksana.tw',
	version:'0.0.1',
	outputencoding:'utf8',
	//maxfile:1,
	customfunc:customfunc
}));
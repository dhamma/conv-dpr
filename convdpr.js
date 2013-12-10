var fs=require('fs');
var lst='thai.lst';
var pagecount=0;
var wantlb=false;

var processfile=function(fn) {
	var arr=fs.readFileSync('thai.xml/'+fn,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
	var output=[];
	var doheader=function(line) {
		var m=line.match(/<h([a\d])n>/);
		if (m) {
			return {level:m[1],caption:line.replace(/<.*?>/g,'').trim()};
		}
	}
	var parsePTS=function(pts) {
		var greek2book={'I':1,'II':2,'III':3,'IV':4,'V':5};
		pts=pts.replace(' , ',',').replace(' PTS. S ','PS.');
		var m=pts.match(/P(.)\.(.*?),(\d+)/);
		if (m) {
			var book=greek2book[m[2]]
			return {nikaya:m[1],book:book,page:m[3]};
		}
		console.log('invalid ',pts)
		return null;
	}
	var dopts=function(line) {
		return line.replace(/\^a\^(.*?)\^ea\^/g, function(match, contents, offset, s){
			//return '<pts id="$1"/>');
			var pts=parsePTS(contents);
			return '<_pts_'+pts.nikaya+pts.book+'_'+pts.page+'/>';
		});
	}
	var dopagebreak=function(line) {
		var m=line.match(/-- \^a\^(.*?)\^ea\^ --/);
		if (m) {
			m=m[0].replace('Thai','T'); //inconsitent for some book Thai 19, 25
			var bp=m.match(/(\d+)\.(\d+)/);
			var book=parseInt(bp[1])
			var page=parseInt(bp[2],10);
			if (!book || !page) {
				throw 'empty book or page'
			}
			return {book:book,page:page};
		}
	}
	var donote=function(line) {
		//deal with the pts page inside the text
		line=line.replace(/\{ (\d+) (.*?)\}/g,'<note id="$1" text="$2"/>')
		return line;
	}
	var dopara=function(line) {
		return line.replace(/\[(\d+)\]/,'<p n="$1"/>');
	}
	var dotext=function(line) {
		empty=line.replace(/<.*?>/g,'').trim();
		if (!empty) return null;
		line=donote(line);
		line=dopara(line);
		line=dopts(line);
		if (wantlb) line=line.replace(/#(\d+)#/,'<lb n="$1"/>');
		else line=line.replace(/#(\d+)#/,'');
		line=line.replace(/<p>/g,'').replace(/<\/p>/g,'').trim();
		return line;
	}
	for (var i in arr) {
		var line=arr[i]
		var header=doheader(line);
		if (header) {
			output.push('<H'+header.level+'>'+header.caption+'</H'+header.level+'>')
			continue;
		}
		var page=dopagebreak(line);
		if (page) {
				pagecount++;
				output.push('<pb id="'+page.book+'.'+page.page+'"/>');
				continue;
		}
		line=dotext(line);
		if (line) output.push(line);
	}

	fs.writeFileSync('thai/'+fn,output.join('\n'),'utf8');

}
var main=function() {
	var files=fs.readFileSync(lst,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
	for (var i in files) {
		processfile(files[i])
	}	
	console.log(pagecount)
}

main();
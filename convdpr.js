var fs=require('fs');
var lst='thai.lst';
var pagecount=0;
var wantlb=false;
var filename='',linenum=0;
var titles=[];
var thaititles=[];
var readonly=false;
var notfound=[];
var withsidcount=0,titlecount=0;
var lastsid='',lastreadunit='';
var filenames=[];
var normalize=function(t) {
	t=t.replace(/au/g,'u');// misspell in thai
	t=t.replace(/ai/g,'i');// misspell in thai
	t=t.replace(/ao/g,'o');// misspell in thai
	t=t.replace(/ae/g,'e');// misspell in thai
	t=t.replace(/āa/g,'ā');// misspell in thai
	t=t.replace(/ā/g,'a');
	return t;
}
var vrititles=function() {
	var yase=require('yase');
	var db=yase.use('../cst/vrimul.ydb');
	var toc=db.buildToc(['book[id]','readunit[id]','p[sid]']);
	var out=[];
	for (var i in toc) {
		T=toc[i];
		T.head=normalize(T.head);
		if (T.depth==2) {
			var head=normalize(db.getText(T.slot));
			T.head=head.replace(/<.*?>/g,'').trim(); // p head is not stored
		}
		out.push([T.depth,T.head,T.title,false]);
	}
	return out;
}
var VRI=vrititles();
fs.writeFileSync('vrititles.txt',JSON.stringify(VRI),'utf8');
var vriconsumed=0;
var findvrititlebyid=function(sid) {
	for (var i=vriconsumed;i<VRI.length;i++) {
		if (sid==VRI[i][2]) {
			return VRI[i][1];
		} 
	}
	return null;
}
var findvrititle=function(t) {
	t=normalize(t)
	for (var i=vriconsumed;i<VRI.length;i++) {
		if (t==VRI[i][1] ) {
			VRI[i][3]=true;
			vriconsumed=i;
			withsidcount++;
			return {sid:VRI[i][2],level:VRI[i][0]};
		}
		if (i-vriconsumed > 100) {
		//	warning('too far')
			break;
		}
	}
	return null;
}

var warning=function() {
	console.log(filename,linenum);
	console.log.apply(console,arguments)
}
var processfile=function(fn) {
	var arr=fs.readFileSync('thai.xml/'+fn,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
	var output=[];
	var dotitle=function(line) {
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
		warning('invalid ',pts)
		return null;
	}
	var dopts=function(line) {
		return line.replace(/ ?\^a\^(.*?)\^ea\^ ?/g, function(match, contents, offset, s){
			//return '<pts id="$1"/>');
			var pts=parsePTS(contents);
			//put a blank before pb.  when remove pb , two words will not joined.
			return ' <pb ed="P" n="'+pts.book+'.'+pts.page+'" set="'+pts.nikaya+'"/>';
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
		line=line.replace(/\{ ([\d\*]*?) (.*?)\}/g,function(match,c1,c2,offset,s){
			if (c2.indexOf('<pb ed')>-1) {
				//warning('pts pagenumber inside <note>==>\n',c2)
			}
			return '<note n="'+c1+'">'+ c2+'</note>';
		});
		return line;
	}
	var doundefined=function(line) {
		line=line.replace(/\{undefined\}/g,'<undef/>');
		return line;
	}
	var dopara=function(line) {
		return line.replace(/\[(\d+)\] ?/,'<p n="$1"/>');
	}

	var guestvrititle=function() {
		//guest the vri title from the last sid
		//increase the second part with 1
		if (!lastsid) return;

		var n=lastsid.match(/(.*?)\.(\d+)/);
		if (!n) return;
		num=parseInt(n[2],10)+1;
		sid=n[1]+'.'+num;
		t=findvrititlebyid(sid);
		if (t) {
			lastsid=sid;
		}
		return sid+' '+t;
	}
	
	var outputtitle=function(title,level,sid) {
		var titleline='';
		if (level==0) {
			titleline='<book id="'+sid+'">'+title+'</book>';
		} else if (level==1) {
			if (output.length>10) {
				savefile();
			}
			last2=sid.substring(sid.length-2);
			if (sid[0]!='a' || (sid[0]=='a' &&last2=='-1')) {
				output.push('<pgroup id="'+sid+'"/>');
			}
			titleline='<readunit id="'+sid+'">'+title+'</readunit>';
			lastreadunit=sid;
		} else {
			var sid2=sid.substring(sid.indexOf('.')+1);
			title=title.replace('.',','); //. is used for sentence seperator
			titleline='<p rend="subhead" sid="'+sid2+'">'+title+'</p>';
		}
		if (sid=='?') titleline=titleline.replace(' sid="?"',' check="nosid"');
		output.push(titleline)
		

		//for manual checking
		if (sid=="?") {
			titleline=titleline+'//'+guestvrititle(lastsid);
		} else lastsid=sid;

		thaititles.push(titleline);
	}
	var savefile=function() {
		var appendxml=function() {
				var f=lastreadunit;
				if (f=='a1-1') output.unshift('<nikaya id="dn">dīghanikāyo</nikaya>');
				else if (f=='s1') output.unshift('<nikaya id="sn">saṃyuttanikāyo</nikaya>');
				else if (f=='d1') output.unshift('<nikaya id="an">aṅguttaranikāyo</nikaya>');
				else if (f=='m1') output.unshift('<nikaya id="mn">majjhimanikāyo</nikaya>');

				output.unshift('<xml src="'+f+'.xml">');
				output.push('</xml>');
		}
		if (!readonly) {
			appendxml();
			fs.writeFileSync('thai/'+lastreadunit+'.xml',output.join('\n'),'utf8');
			filenames.push(lastreadunit+'.xml');
			output=[];
		}		
	}
	var removedash=function(line) {
		for (var i=0;i<line.length;i++) {
			if (line[i]!='-')break;
		}
		return line.substring(i);
	}
	var dotext=function(line) {
		empty=line.replace(/<.*?>/g,'').trim();
		if (!empty) return null;
		//line.replace(/\./g,'|');
		line=dopts(line);
		line=donote(line);
		line=doundefined(line);
		line=dopara(line);
		if (wantlb) line=line.replace(/#(\d+)#/,'<lb n="$1"/>');
		else line=line.replace(/#(\d+)#/,'');
		line=line.replace(/<p>/g,'').replace(/<\/p>/g,'').trim();
		return line;
	}
	for (var i in arr) {
		var line=arr[i];
		linenum=i;
		var title=dotitle(line);
		if (title) {
			titlecount++;
			var vri=findvrititle(title.caption);
			if (vri) {
				outputtitle(title.caption,vri.level,vri.sid)
			} else {
				outputtitle(title.caption,2,'?')
				notfound.push(title.caption);
			}
			continue;
		}

		var page=dopagebreak(line);
		if (page) {
				pagecount++;
				var booknum=parseInt(filename.substring(1),10);
				output.push('<pb n="'+booknum+'.'+page.page+'"/>');
				continue;
		}
		line=dotext(line);
		if (line) line=removedash(line);
		if (line) {
			output.push(line);
		}
	}

	savefile();

}
var main=function() {
	var files=fs.readFileSync(lst,'utf8').replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
	for (var i in files) {
		filename=files[i]
		processfile(files[i])
	}	
	console.log(pagecount)
}

main();
console.log('titles count',titlecount)
console.log('titles with sid',withsidcount);
fs.writeFileSync('notfound.txt',notfound.join('\n'),'utf8')
fs.writeFileSync('thaititles.txt',thaititles.join('\n'),'utf8')
fs.writeFileSync('thai/thaimul.lst',filenames.join('\n'),'utf8')
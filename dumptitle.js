var yase=require('yase');
var db=yase.use('./thaimul.ydb');
var toc=db.buildToc(['book[id]','readunit[id]','p[sid]'])
for (var i in toc) {
	T=toc[i];
	if (T.depth==2) T.head=db.getText(T.slot).replace(/<.*?>/g,'').trim(); // p head is not stored
	console.log(T.depth,T.title,T.head)
}

if (typeof QUnit!=='undefined')
QUnit.test("test",function() {
	 equal(1,1);
});
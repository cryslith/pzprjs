//
// パズル固有スクリプト部 マイナリズム版 minarism.js v3.4.0
//
(function(){

var k = pzprv3.consts;

pzprv3.createCustoms('minarism', {
//---------------------------------------------------------
// マウス入力系
MouseEvent:{
	mouseinput : function(){
		if(this.owner.playmode){
			if(this.mousestart){ this.inputqnum();}
		}
		else if(this.owner.editmode){
			if(this.mousestart || this.mousemove){
				if(this.btn.Left){ this.inputmark_mousemove();}
			}
			else if(this.mouseend && this.notInputted()){
				this.inputmark_mouseup();
			}
		}
	},

	inputmark_mousemove : function(){
		var pos = this.getpos(0);
		if(pos.getc().isnull){ return;}

		var border = this.getnb(this.prevPos, pos);
		if(!border.isnull){
			this.inputData = this.getdir(this.prevPos, pos);
			border.setQdir(this.inputData!==border.getQdir()?this.inputData:0);
			border.draw();
			this.mousereset();
			return;
		}
		this.prevPos = pos;
	},
	inputmark_mouseup : function(){
		var pos = this.getpos(0.33);
		if(!pos.isinside()){ return;}

		if(!this.cursor.pos.equals(pos)){
			this.setcursorpos(pos);
			pos.draw();
		}
		else{
			var border = pos.getb();
			if(!border.isnull){ return;}

			var qn=border.getQnum(), qs=border.getQdir(), qm=(border.isHorz()?0:2);
			var max=Math.max(this.owner.board.qcols,this.owner.board.qrows)-1;
			if(this.btn.Left){
				if     (qn===-1 && qs===0)   { border.setQnum(-1); border.setQdir(qm+1);}
				else if(qn===-1 && qs===qm+1){ border.setQnum(-1); border.setQdir(qm+2);}
				else if(qn===-1 && qs===qm+2){ border.setQnum(1);  border.setQdir(0);}
				else if(qn===max)            { border.setQnum(-2); border.setQdir(0);}
				else if(qn===-2)             { border.setQnum(-1); border.setQdir(0);}
				else{ border.setQnum(id,qn+1);}
			}
			else if(this.btn.Right){
				if     (qn===-1 && qs===0)   { border.setQnum(-2); border.setQdir(0);}
				else if(qn===-2)             { border.setQnum(max);border.setQdir(0);}
				else if(qn=== 1 && qs===0)   { border.setQnum(-1); border.setQdir(qm+2);}
				else if(qn===-1 && qs===qm+2){ border.setQnum(-1); border.setQdir(qm+1);}
				else if(qn===-1 && qs===qm+1){ border.setQnum(-1); border.setQdir(0);}
				else{ border.setQnum(id,qn-1);}
			}
			border.draw();
		}
	}
},

//---------------------------------------------------------
// キーボード入力系
KeyEvent:{
	enablemake : true,
	enableplay : true,
	moveTarget : function(ca){
		if     (this.owner.editmode){ return this.moveTBorder(ca);}
		else if(this.owner.playmode){ return this.moveTCell(ca);}
		return false;
	},

	keyinput : function(ca){
		if     (this.owner.editmode){ this.key_inputmark(ca);}
		else if(this.owner.playmode){ this.key_inputqnum(ca);}
	},
	key_inputmark : function(ca){
		var border = this.cursor.getTBC();
		if(border.isnull){ return;}

		if(ca=='q'||ca=='w'||ca=='e' || ca==' ' || ca=='-'){
			var tmp=k.NDIR;
			if(ca=='q'){ tmp=(border.isHorz()?k.UP:k.LT);}
			if(ca=='w'){ tmp=(border.isHorz()?k.DN:k.RT);}

			border.setQdir(border.getQdir()!==tmp?tmp:k.NDIR);
			border.setQnum(-1);
		}
		else if('0'<=ca && ca<='9'){
			var num = parseInt(ca), cur = border.getQnum();
			var max = Math.max(this.owner.board.qcols,this.owner.board.qrows)-1;

			border.setQdir(k.NDIR);
			if(cur<=0 || this.prev!==border){ if(num<=max){ border.setQnum(num);}}
			else{
				if(cur*10+num<=max){ border.setQnum(cur*10+num);}
				else if  (num<=max){ border.setQnum(num);}
			}
		}
		else{ return;}

		this.prev = border;
		border.draw();
	}
},

TargetCursor:{
	adjust_modechange : function(){
		this.pos.bx -= ((this.pos.bx+1)%2);
		this.pos.by -= ((this.pos.by+1)%2);
	}
},

//---------------------------------------------------------
// 盤面管理系
Cell:{
	nummaxfunc : function(){
		return Math.max(this.owner.board.qcols,this.owner.board.qrows);
	}
},
Board:{
	qcols : 7,
	qrows : 7,

	isborder : 1
},
BoardExec:{
	adjustBoardData : function(key,d){
		this.adjustBorderArrow(key,d);
	}
},

//---------------------------------------------------------
// 画像表示系
Graphic:{
	hideHatena : true,

	initialize : function(){
		this.Common.prototype.initialize.call(this);

		this.gridcolor = this.gridcolor_LIGHT;
	},
	paint : function(){
		this.drawBDBase();

		this.drawBGCells();
		this.drawDashedGrid();

		this.drawBDNumbers_and_IneqSigns();
		this.drawNumbers();

		this.drawChassis();

		this.drawTarget_minarism();
	},

	drawBDBase : function(){
		var g = this.vinc('border_base', 'auto');
		if(!g.use.canvas){ return;}

		var csize = this.cw*0.29;
		var blist = this.range.borders;
		for(var i=0;i<blist.length;i++){
			var border = blist[i];

			if(border.qdir!==0 || border.qnum!==-1){
				var px = border.bx*this.bw, py = border.by*this.bh;
				g.fillStyle = "white";
				g.fillRect(px-csize, py-csize, 2*csize+1, 2*csize+1);
			}
		}
	},
	drawBDNumbers_and_IneqSigns : function(){
		var g = this.vinc('border_marks', 'auto');

		var csize = this.cw*0.27;
		var ssize = this.cw*0.22;
		var headers = ["b_cp_", "b_is1_", "b_is2_"];

		g.lineWidth = 1;
		g.strokeStyle = this.cellcolor;

		var blist = this.range.borders;
		for(var i=0;i<blist.length;i++){
			var border=blist[i], id=border.id, key=['border',id].join('_');
			var px = border.bx*this.bw, py = border.by*this.bh;
			// ○の描画
			if(border.qnum!=-1){
				g.fillStyle = (border.error===1 ? this.errcolor1 : "white");
				if(this.vnop(headers[0]+id,this.FILL)){
					g.shapeCircle(px, py, csize);
				}
			}
			else{ this.vhide([headers[0]+id]);}

			// 数字の描画
			if(border.qnum>0){
				this.dispnum(key, 1, ""+border.qnum, 0.45, "black", px, py);
			}
			else{ this.hidenum(key);}

			// 不等号の描画
			this.vhide([headers[1]+id, headers[2]+id]);
			if(border.qdir!==k.NDIR){
				if(this.vnop(headers[((border.qdir+1)&1)+1]+id,this.NONE)){
					switch(border.qdir){
						case k.UP: g.setOffsetLinePath(px,py ,-ssize,+ssize ,0,-ssize ,+ssize,+ssize, false); break;
						case k.DN: g.setOffsetLinePath(px,py ,-ssize,-ssize ,0,+ssize ,+ssize,-ssize, false); break;
						case k.LT: g.setOffsetLinePath(px,py ,+ssize,-ssize ,-ssize,0 ,+ssize,+ssize, false); break;
						case k.RT: g.setOffsetLinePath(px,py ,-ssize,-ssize ,+ssize,0 ,-ssize,+ssize, false); break;
					}
					g.stroke();
				}
			}
		}
	},

	drawTarget_minarism : function(){
		this.drawCursor(this.owner.playmode);
	}
},

//---------------------------------------------------------
// URLエンコード/デコード処理
Encode:{
	decodePzpr : function(type){
		this.decodeMinarism(type);
	},
	encodePzpr : function(type){
		this.encodeMinarism(type);
	},

	decodeMinarism : function(type){
		// 盤面外数字のデコード
		var id=0, a=0, mgn=0, bstr = this.outbstr, bd=this.owner.board;
		for(var i=0;i<bstr.length;i++){
			var ca = bstr.charAt(i);

			if(type===k.URL_PZPRAPP){
				if     (id<bd.qcols*bd.qrows)  { mgn=((id/bd.qcols)|0);}
				else if(id<2*bd.qcols*bd.qrows){ mgn=bd.qrows;}
			}
			var obj = bd.border[id-mgn];

			var tmp=0;
			if     (this.include(ca,'0','9')||this.include(ca,'a','f')){ obj.qnum = parseInt(ca,16);}
			else if(ca==="-"){ obj.qnum = parseInt(bstr.substr(i+1,2),16); i+=2;}
			else if(ca==="."){ obj.qnum = -2;}
			else if(ca==="g"){ tmp = ((type===k.URL_PZPRV3 || id<bd.qcols*bd.qrows)?1:2);}
			else if(ca==="h"){ tmp = ((type===k.URL_PZPRV3 || id<bd.qcols*bd.qrows)?2:1);}
			else if(this.include(ca,'i','z')){ id+=(parseInt(ca,36)-18);}
			else if(type===k.URL_PZPRAPP && ca==="/"){ id=bd.cellmax-1;}

			if     (tmp===1){ obj.qdir = (obj.isHorz()?k.UP:k.LT);}
			else if(tmp===2){ obj.qdir = (obj.isHorz()?k.DN:k.RT);}

			id++;
			if(id>=2*bd.qcols*bd.qrows){ a=i+1; break;}
		}
		this.outbstr = bstr.substr(a);
	},
	encodeMinarism : function(type){
		var cm="", count=0, mgn=0, bd=this.owner.board;
		for(var id=0,max=bd.bdmax+(type===k.URL_PZPRV3?0:bd.qcols);id<max;id++){
			if(type===1){
				if(id>0 && id<=(bd.qcols-1)*bd.qrows && id%(bd.qcols-1)==0){ count++;}
				if(id==(bd.qcols-1)*bd.qrows){ if(count>0){ cm+=(17+count).toString(36); count=0;} cm += "/";}
			}

			if(id<bd.bdmax){
				var pstr="", dir=bd.border[id].qdir, qnum=bd.border[id].qnum;

				if     (dir===k.UP||dir===k.LT){ pstr = ((type===k.URL_PZPRV3 || id<bd.cellmax)?"g":"h");}
				else if(dir===k.DN||dir===k.RT){ pstr = ((type===k.URL_PZPRV3 || id<bd.cellmax)?"h":"g");}
				else if(qnum===-2){ pstr = ".";}
				else if(qnum>= 0&&qnum< 16){ pstr = ""+ qnum.toString(16);}
				else if(qnum>=16&&qnum<256){ pstr = "-"+qnum.toString(16);}
				else{ count++;}
			}
			else{ count++;}

			if(count==0){ cm += pstr;}
			else if(pstr||count==18){ cm+=((17+count).toString(36)+pstr); count=0;}
		}
		if(count>0){ cm+=(17+count).toString(36);}

		this.outbstr += cm;
	}
},
//---------------------------------------------------------
FileIO:{
	decodeData : function(){
		this.decodeBorder( function(obj,ca){
			if     (ca==="a"){ obj.qdir = (obj.isHorz()?k.UP:k.LT);}
			else if(ca==="b"){ obj.qdir = (obj.isHorz()?k.DN:k.RT);}
			else if(ca==="."){ obj.qnum = -2;}
			else if(ca!=="0"){ obj.qnum = parseInt(ca);}
		});
		this.decodeCellAnumsub();
	},
	encodeData : function(){
		this.encodeBorder( function(obj){
			var dir=obj.qdir;
			if     (dir===k.UP||dir===k.LT){ return "a ";}
			else if(dir===k.DN||dir===k.RT){ return "b ";}
			else if(obj.qnum===-2){ return ". ";}
			else if(obj.qnum!==-1){ return ""+obj.qnum.toString()+" ";}
			else                  { return "0 ";}
		});
		this.encodeCellAnumsub();
	}
},

//---------------------------------------------------------
// 正解判定処理実行部
AnsCheck:{
	checkAns : function(){

		if( !this.checkRowsColsSameNumber() ){ return 10037;}
		if( !this.checkBDnumber() ){ return 69101;}
		if( !this.checkBDmark() ){ return 69111;}
		if( !this.checkNoNumCell() ){ return 50171;}

		return 0;
	},
	check1st : function(){
		return (this.checkNoNumCell() ? 0 : 50171);
	},

	checkRowsColsSameNumber : function(){
		return this.checkRowsCols(this.isDifferentNumberInClist, function(cell){ return cell.getNum();});
	},

	checkBDnumber : function(){
		return this.checkBDSideCell(function(border,a1,a2){
			return (border.getQnum()>0 && border.getQnum()!==Math.abs(a1-a2));
		});
	},
	checkBDmark : function(){
		return this.checkBDSideCell(function(border,a1,a2){
			var mark = border.getQdir();
			return !(mark==0 || ((mark===1||mark===3) && a1<a2) || ((mark===2||mark===4) && a1>a2));
		});
	},
	checkBDSideCell : function(func){
		var result = true, bd = this.owner.board;
		for(var id=0;id<bd.bdmax;id++){
			var border = bd.border[id], cell1 = border.sidecell[0], cell2 = border.sidecell[1];
			var num1 = cell1.getNum(), num2 = cell2.getNum();
			if(num1>0 && num2>0 && func(border,num1,num2)){
				if(this.checkOnly){ return false;}
				cell1.seterr(1);
				cell2.seterr(1);
				result = false;
			}
		}
		return result;
	}
}
});

})();
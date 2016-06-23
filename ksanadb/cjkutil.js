var isCJK =function(c) {return ((c>=0x3400 && c<=0x9FFF) || (c>=0xD800 && c<0xDFFF) ) ;}

var getutf32ch=function(ch) {
	return getutf32({widestring:ch});
}
var  getutf32 = function (opt) { // return ucs32 value from a utf 16 string, advance the string automatically
	opt.thechar='';
	if (!opt.widestring) return 0;
    var s = opt.widestring;
    var ic = s.charCodeAt(0);
    var c = 1; // default BMP one widechar
    if (ic >= 0xd800 && ic <= 0xdcff) {
      var ic2 = s.charCodeAt(1);
      ic = 0x10000 + ((ic & 0x3ff) * 1024) + (ic2 & 0x3ff);
      c++; // surrogate pair
    }
    opt.thechar = s.substr(0, c);
    opt.widestring = s.substr(c, s.length - c);
    return ic;
  };
		
  var ucs2string = function (unicode) { //unicode ���X�� �r��A�textension B ���p
    if (unicode >= 0x10000 && unicode <= 0x10FFFF) {
      var hi = Math.floor((unicode - 0x10000) / 0x400) + 0xD800;
      var lo = ((unicode - 0x10000) % 0x400) + 0xDC00;
      return String.fromCharCode(hi) + String.fromCharCode(lo);
    } else {
      return String.fromCharCode(unicode);
    }
    
  };
  
		

var enclosesurrogate=function(s,left,right) { // convert surrogate to \uXXXX
	var r="";
	left=left||"";
	right=right||"";
	var opt={widestring:s};
	
	var code=0;
	while(code=getutf32(opt)) {
		if (code>=0x20000) {
			r+=left+opt.thechar+right;
		} else {
			r+=opt.thechar;
		}
	}
	return r;
}      
	
var unique = function(ar){
   var u = {}, a = [];
   for(var i = 0, l = ar.length; i < l; ++i){
	  if(u.hasOwnProperty(ar[i])) {
		 continue;
	  }
	  a.push(ar[i]);
	  u[ar[i]] = 1;
   }
   return a;
}
var bigramof=function(s) {
	var r=[];
	var opts={};
	var i=0;
	opts.widestring=s;
	getutf32(opts);
	var ch=opts.thechar;
	while (ch) {
		getutf32(opts);
		if (opts.thechar && isCJK(ch.charCodeAt(0)) && isCJK(opts.thechar.charCodeAt(0))) {
			r.push(ch+opts.thechar);
		};
		ch=opts.thechar;
	}
	return unique(r);

}
var unigramof=function(s) {
	var r=[];
	var opts={};
	var i=0;
	opts.widestring=s;
	getutf32(opts);
	var ch=opts.thechar;
	while (ch) {
		getutf32(opts);
		if (isCJK(ch.charCodeAt(0))) r.push(ch);
		ch=opts.thechar;
	}
	return unique(r);
}
var toNumber = function(s) {
 	 
	s=s.replace(/一/g,"1");
	//s=s.replace(/元/g,"1");
	s=s.replace(/二/g,"2");
	s=s.replace(/兩/g,"2");
	s=s.replace(/三/g,"3");
	s=s.replace(/四/g,"4");
	s=s.replace(/五/g,"5");
	s=s.replace(/六/g,"6");
	s=s.replace(/七/g,"7");
	s=s.replace(/八/g,"8");
	s=s.replace(/九/g,"9");
	
	s=s.replace(/千零/g,"00");
	s=s.replace(/零/g,"0");
	s=s.replace(/千$/,"000");
	s=s.replace(/百$/,"00");
	s=s.replace(/^十$/,"10");
	s=s.replace(/^十/,"1");
	s=s.replace(/十$/,"0");
	s=s.replace(/^廿/,"2");
	s=s.replace(/^卅/,"2");
	
	s=s.replace(/千/,"");
	s=s.replace(/十/,"");
	s=s.replace(/百/,"");
	return parseInt(s);

//	return parseInt(n);
}
var chineseNumber =function (number,lowerorsupper,tail){  
    //轉換值是否為整數  
    if(!isNaN(parseInt(number * 1))){  
        //--------------  
        // 定義變數  
        //--------------  
        //小寫的中文數字  
        var chineseNumber_lower = ('零一二三四五六七八九').split('');  
        //大寫的中文數字  
        var chineseNumber_upper = ('零壹貳參肆伍陸柒捌玖').split('');  
        //數詞單位陣列  
        var chineseOrder = ('十百千元萬億兆京垓秭穰溝澗正載').split('');  
        if(tail == null){  
            chineseOrder[3] = '元'; 
        } else{  
            chineseOrder[3] = tail;  
        }  
        //定義儲存轉換後的數字結果陣列  
        var transformNumber = new Array();  
        //逆轉數字後的數字陣列  
        var numberAsString = new Array();  
        //用來記錄移動位數的索引(從tail開始)  
        var orderFlag = 3;  
        //--------------  
        // 數字處理  
        //--------------  
        //將數字字串化  
        number = number+'';  
        //逆轉數字後儲入陣列  
        for (var i=number.length-1; i>=0; i-- ){  
            numberAsString[numberAsString.length++] = number.charAt(i);  
        }  
        //針對每個英文數字處理  
        for(var i=0; i<numberAsString.length; i++){  
            //產生對應的中文數字，並且依大小寫有所不同  
            if(lowerorsupper == 'upper'){  
                numberAsString[i] = chineseNumber_upper[numberAsString[i]];  
                chineseOrder[0] = '拾';  
                chineseOrder[1] = '佰';  
                chineseOrder[2] = '仟';  
            } else {  
                numberAsString[i] = chineseNumber_lower[numberAsString[i]];  
                chineseOrder[0] = '十';  
                chineseOrder[1] = '百';  
                chineseOrder[2] = '千';  
            }  
            //添加數詞  
            switch((i+1)%4){  
                case 1:  
                    transformNumber[numberAsString.length-i] = numberAsString[i]+chineseOrder[orderFlag];  
                break;  
                case 2:  
                    transformNumber[numberAsString.length-i] = numberAsString[i]+chineseOrder[0];  
                break;  
                case 3:  
                    transformNumber[numberAsString.length-i] = numberAsString[i]+chineseOrder[1];  
                break  
                case 0:  
                    transformNumber[numberAsString.length-i] = numberAsString[i]+chineseOrder[2];  
                break;  
            }  
            //每處理四個數字後移動位數索引  
            if((i+1)%4 == 0){  
                orderFlag++;  
            }  
        }  
        //回傳轉換後的中文數字  
        var res=transformNumber.join('');  
    } else {  
        return '數字必需為整數';  
    }  
    
    res=res.replace('零千','零');
    res=res.replace('零百','零');
    res=res.replace('零十','零');
    res=res.replace('零萬','零');
    res=res.replace('零億','零');
    res=res.replace('零零','零');
    res=res.replace('零零','零');
    res=res.replace('零零','零');
    res=res.replace('零零','零');
    res=res.replace('零元','元');
    res=res.replace(/元$/,'');
    return res;
} 
var exports={};
exports.toChinese=chineseNumber;
exports.toNumber=toNumber;
exports.getutf32=getutf32;
exports.unigramof=unigramof;
exports.bigramof=bigramof;
exports.ucs2string=ucs2string;		
exports.isCJK=isCJK;
exports.getutf32ch=getutf32ch;
exports.enclosesurrogate=enclosesurrogate;
module.exports=exports;
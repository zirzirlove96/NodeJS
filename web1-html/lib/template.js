module.exports = {
  html:function (title, list, body, control) {
    return  `<!doctype html>
    <html>
    <head>
      <title>WEB1 - ${title}</title>
      <meta charset="utf-8">
    </head>
    <body>
      <h1><a href="/">WEB2</a></h1>
      ${list}
      ${control}
      ${body}
    </body>
    </html>
  `;
},//객체안에 함수를 넣었다.
list:function (filelist) {
  var list = '<ul>';
  var i=0;
  while(i<filelist.length){
    list = list+`<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
    i++;
  }
  list = list+'</ul>';
  return list;
  }
}

//객체이름을 주고 해도 되지만 객체 이름자체에 module.exports를 해도 된다.
//module.exports = template;

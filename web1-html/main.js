var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');//외부정보가 오염되지 않도록 하기 위해 사용한다.
var sanitize = require('sanitize-html');//sanitize모듈를 사용하기 위해


//lib폴더 아래에 template.js를 require해와 객체를 사용한다.
var template = require('./lib/template.js');


var app = http.createServer(function(request,response){
  var _url=request.url;
  var queryData = url.parse(_url, true).query;
  var title = queryData.id;
  var pathname = url.parse(_url, true).pathname;

  if(pathname==='/'){
    if(queryData.id === undefined){
      fs.readdir('./data', function(error, filelist){
        var title = 'Welcome';
        var description = 'Hello Node.js';
        /*
        var templatelist = templateList(filelist);
        var template = templateHTML(title, templatelist,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`);*/

          //객체안의 함수를 사용한 코드
        var templatelist = template.list(filelist);
        var html = template.html(title, templatelist,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`);

        response.writeHead(200);
        response.end(html);
      })


}else {
  fs.readdir('./data', function(error, filelist){
    var filterId = path.parse(queryData.id).base;//queryString으로 오는 값을
    //path.parse로 부모폴더에 있는 파일을 건들지 못하게 만든다.
    fs.readFile(`data/${filterId}`, 'utf8', function(err,description){
      var title = queryData.id;
      //파일을 읽어오는 부분에서 XCC공격을 막기 위해 sanitize모듈을 사용해 준다.
      var sanitizedTitle = sanitize(title);
      var sanitizedDescription = sanitize(description, {
        allowedTags:['h1']
      });
      var templatelist = template.list(filelist);
      var html = template.html(sanitizedTitle, templatelist,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        `<a href="/create">create</a>
         <a href="/update?id=${sanitizedTitle}">update</a>
         <form action="process_delete" method="post">
          <input type="hidden" name="id" value="${sanitizedTitle}">
          <input type="submit" value="delete">
         </form>`
       );
      response.writeHead(200);
      response.end(html);
    });
  });
  }
  //data폴더 안에 있는 것 말고 다른 페이지로 넘어갔을 경우
  //예를 들어 /create일 경우 else if문이 수행된다.
} else if(pathname==='/create') {

//위의 readdir을 복사해서 가져온다.
  fs.readdir('./data', function(error, filelist){
    var title = 'WEB - Create';
    var templatelist = template.list(filelist);
    //templateHTML에서 body부분에 들어 갈 부분을
    //form태그로 만들어서 process_create 서버로 내용을 보내준다.
    var html = template.html(title, templatelist,
      `<form action="http://localhost:3000/process_create" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p><textarea name="description" placeholder="description"></textarea></p>
      <p><input type="submit"></p>
      </form>
      `,``);
    response.writeHead(200);
    response.end(html);
  });

} else if(pathname==='/process_create')

{
  var body='';
  //request는 createServer의 매개변수로 가져온 것이다.
  //request는 사용자가 서버에게 요청할 때 사용한다.
  //nodeJS에서는 post 방식으로 전송되는 데이터가 많을 경우를 대비해서
  //request.on이라는 방식을 제공한다.
  //function(data) data라는 인자를 통해서 수신할 정보를 준다.
  request.on('data', function(data){
    body = body+data; //body데이터에다가 콜백이 실행될 때 마다 data데이터를 추가
  });

  request.on('end', function() {
    //데이터가 끝나면 이 콜백함수를 부른다.
    var post = qs.parse(body);
    var title = post.title; //post값에 있는 title값
    var description = post.description; //post값에 있는 description값

    fs.writeFile(`data/${title}`, description, 'utf8',
    function(err) {
      response.writeHead(302, {Location: `/?id=${title}`});//writeHead를 이용하여
      //writeFile을 하는 동시에 웹에 만들어진 파일내용이 나오도록 한다.
      response.end();//파일을 저장했을 때 response가 나와야한다.
    });

  });

} else if(pathname === '/update'){
  fs.readdir('./data', function(error, filelist){
    var filterId = path.parse(queryData.id).base;
    fs.readFile(`data/${filterId}`, 'utf8', function(err,description){
      var title = queryData.id;
      var templatelist = template.list(filelist);
      var html = template.html(title, templatelist,
        `<form action="/process_update" method="post">
          <input type="hidden" name="id" value="${title}">
        <p><input type="text" name="title" value="${title}"></p>
        <p><textarea name="description">${description}</textarea></p>
        <p><input type="submit"></p>
          </form>`,
        `<a href="/create">create</a>
         <a href="/update?id=${title}">update</a>`);
      response.writeHead(200);
      response.end(html);
    });
  });
} else if(pathname==='/process_update'){
  var body='';

  request.on('data', function(data){
    body = body+data;
  });

  request.on('end', function() {

    var post = qs.parse(body);
    var id = post.id;///update에서 hidden으로 날아오는 id값
    var title = post.title;
    var description = post.description;

    //rename은 원래 id파일명을 title로 바꿔주는 역할
    fs.rename(`data/${id}` , `data/${title}`, function(error){
      //수정할 파일에 수정된 내용을 넣어주고, redirection해준다.
      fs.writeFile(`data/${title}`, description, function(error){
        response.writeHead(302, {Location: `/?id=${title}`});
        response.end();
      });
    });

  });
} else if(pathname==='/process_delete'){
  var body='';

  request.on('data', function(data){
    body=body+data;

  });

  request.on('end', function() {
    var post = qs.parse(body);
    var id = post.id;
    //data폴더에 id에 해당하는 파일을 삭제하는 역할을 하는 unlink사용
    var filterId = path.parse(id).base;
    fs.unlink(`data/${filterId}`, function(err){
      response.writeHead(302, {Location: `/`});//삭제하고 홈으로 가게 리다이렉션
      response.end();
    });
  });
} else {
    response.writeHead(404);
    response.end('NOT FOUND');
  }


});

app.listen(3000);

/*
fileSHA stores the SHA of the file we want to fetch.

fileBlob stores the blob fetched from the API.

fileContent is used to store the decoded string.

file has the data that we actually need.

You can find the reference code in the next section, 
just change the folder path with the actual file path 
(with file extension) and you're good to go!
*/

let fileSHA, fileBlob, fileContent, file

const getFileSHA = async () => {
  try {
    const response = await fetch(
        "https://api.github.com/repos/apapadaki-edu/home/contents/images?ref=new"
    );
    const data = await response.json();
    // console.log(data);
    
    fileSHA = data[1].sha
    //console.log(fileSHA);

  } catch (error) {
    console.log(error);
  }
  
  getFileBlob()
}

const getFileBlob = async (fileSHA)=> {
  try {
  const response = await fetch(
    `https://api.github.com/repos/apapadaki-edu/home/git/blobs/d8e4b0c68d1d399be4123d595dfae32843427975`
    );
  const data = await response.json();
    
  fileBlob = data.content
  convertBlob(fileBlob)
  } catch (error) {
    console.log(error);
  }
}

const convertBlob = async blob => {
  //console.log(blob)
  try {
    // const fileContents = Buffer.from(blob, "base64").toString()
    // file = JSON.parse(fileContents)

    
    // ..... UNCOMMENT FOR FILES ..........
    //fileContents = base64EncodeUnicode(blob)
    //file = JSON.parse(fileContents)
    //console.log(file)

    //...... FOR IMAGES ....
    var base64img = `data:image/webp;base64,${blob}`;
    await Base64ToImage(base64img).then((img) => {
        //document.body.appendChild(img);
    });

  } catch(error) {
    console.log(error)
  }
}

function Base64ToImage(base64img) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.onload = function() {
            resolve(img);
        };
        img.onerror = reject;
        img.src = base64img; 
        
    });
}

//.....FOR FILES.....
function base64EncodeUnicode(str) {
  utf8Bytes = decodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1);
  });

  return atob(utf8Bytes);
}


getFileSHA()

/* the api call url includes
    user: aspapadaki-edu/
    repo: home/
    new: branch (in ref= '' parameter) 
*/
document.body.style.forntSize = "3rem";
fetch('https://api.github.com/repos/apapadaki-edu/home/contents/images?ref=new')
  .then(res => res.json())
  .then((json) => {
    document.body.innerHTML = `<pre>${JSON.stringify(json, undefined, 2)}</pre>`});

/*
fetch(`https://api.github.com/repos/apapadaki-edu/home/git/blobs/d8e4b0c68d1d399be4123d595dfae32843427975`)
.then(res=>res.json())
.then((json)=>{
    let data = json.content;
    var base64img = `data:image/webp;base64,${data}`;
    return new Promise((resolve, reject) => {
      var img = new Image();
      img.onload = function() {
          resolve(img);
      };
      img.onerror = reject;
      img.src = base64img;
      console.log("outimage")  
      
  });
})
.then((img)=>{
  document.body.appendChild(img);
})
*/
const GITHUB_USER = "apapadaki-edu"
const GITHUB__REPO = "testJs"
const GITHUB_BRACH = "main"
const GITHUB_CONTENT_PATH = "images"
const GITHUB_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB__REPO}/contents/${GITHUB_CONTENT_PATH}?ref=${GITHUB_BRACH}`

function getImageUrls(currPr="") {
  // fetches an array with objects containing the image URLs, and their names 
  // names, of all images matching a string in the images folder 
  // of the specified branch in the specified repo(using github's Content API)
  return new Promise((resolve)=>{
      fetch(GITHUB_URL)
      .then(res => res.json())
      .then((json) => {
        const imgLinks = []
        json.forEach((img)=>{
          //this can be done with the start of a string ex. /^fs/
          const regex = new RegExp(`^${currPr}.*[.]webp$`);
          if(!regex.test(img.name)) return; 
          imgLinks.push({"name": img.name,
                      "git_url": img.git_url});
        });

        resolve(imgLinks);
      });
    });
}

function getImageInBase64(imgUrl) {
  // fetches an image in its base64 encoding from the specified git url
  // the url can be found from github's content API
  return new Promise((resolve) =>{fetch(imgUrl)
      .then(res=>res.json())
      .then((json)=>resolve(json.content));
    });
}

function loadImageFromBase64(base64img){
  // loads an image with the specified data url as source
  // the data url is of the form "prefix,image_base64_str"
  // where prefix specifies the type of data and format
  return new Promise((resolve, reject) => {
      var base64imgDataUrl = `data:image/webp;base64,${base64img}`;
      var img = new Image();
      img.onload = function() {
          resolve(img);
      };
      img.onerror = reject;
      img.src = base64imgDataUrl; 
      img.style.width = "100%";
      img.classList.add()
    
    });
}


async function getAllImages(currPr="", imgsContainer=null){
  // the getImageUrls takes the following argument
  // currPr "c", "ca", "pg" etc (used in the includes function or test function
  // in line 229) to check the images to download based on the project.
  
  //fetching images urls
  const imgUrls = await getImageUrls(currPr);

  
  // mapping each image url from the array above with 
  // a promise that retrieves the image in base64,
  // the result is an array of promises that can be executed in 
  // parallel with the Promise.all method
  const promises = imgUrls.map((imgUrl)=>{
      return getImageInBase64(imgUrl.git_url).then((img)=>{
        return { "name": imgUrl.name, "imgBase64": img };
      })
  });

  // fetching images in base64 encoding from remote host  
  // img is of the form {"name":str, "imgBase64":str}
  const results = await Promise.all(promises);

  // mapping each image in base64 to a promise that returns
  // an image node with the loaded image and appends it 
  // to the the specified DOM element
  const promisesNodes = results.map((img)=>{
    return loadImageFromBase64(img.imgBase64).then((imgNode)=>{
      const parentNode = (imgsContainer)? imgsContainer: document.body;
      parentNode.appendChild(imgNode);
    })
  })

  // loads all images in parallel
  await Promise.all(promisesNodes);
}

getAllImages()
/*
async function loadImages(){
  const promisesImgs = await getAllImages();

  const fetchedImgs = await Promise.all(promisesImgs);
  // img is of the form {"name":str, "imgBase64":str}
  const promises = fetchedImgs.map((img)=>{
    return getImage(img.imgBase64).then((imgNode) => {
      document.body.appendNode(imgNode);
      //return json.parse({"name": img.name, "imgNode": imgNode});
    });
  })

  await Promise.all(promises);
  console.log("COMPLETE");

}
*/

/*
WORKS
async function getAllImages(){
  const imgUrls = await getImageUrls();
  const promises = imgUrls.map((imgUrl)=>{
    return getImage(imgUrl.git_url).then((img)=>{
      return { "name": imgUrl.name, "imgBase64": img };
    })
    
  });

  const results = await Promise.all(promises);
  console.log(results)
  return results
}
*/
  /*
    const response = await fetch(imgUrl);
    const data = await response.json();
  return new Promise((resolve)=>{
    resolve(data.content);
  })
  fileBlob = data.content
  convertBlob(fileBlob)
  */




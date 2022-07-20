const validUrl = require('valid-url');
const shortid = require('shortid');
const urlModel = require('../models/urlModel');
const redis = require("redis");
const { promisify } = require("util");
const baseUrl = 'http://localhost:3000'

//connect to redis
const redisClient = redis.createClient(
    18240,
     "redis-18240.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    // "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("BEUofXQDvNIoc9FNAcChK5VRgjLYlZIN", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

// ///////////////////////////////[Create ShortUrl]///////////////////////////////////////////////////////////////////

const urlShortner= async function(req,res){
    try{
        let{longUrl}=req.body;
        if(!longUrl) return res.status(400).send({status:false,message:"please enter the url"});
        
        if (!validUrl.isUri(baseUrl)) {
            return res.status(401).send({status:false,message:"Invalid base URL"})
        }

        const urlCode = shortid.generate()
        if (validUrl.isUri(longUrl)) {
            // checks for data in the cache
             let newUrl =  await GET_ASYNC(`${longUrl}`)   
            if(newUrl) return res.status(200).send({status:true, message:"Url already shortened", data:JSON.parse(newUrl)})
           
            let url = await urlModel.findOne({longUrl:longUrl})
            if (url){  
             let obj = url.toObject();
              delete obj._id;
               delete obj.__v;   
              return res.status(200).send({status:true, message:"Url already shortened", data:obj})
            }else{
                const shortUrl = baseUrl + '/' + urlCode
               
                url = new urlModel({
                    longUrl,
                    shortUrl,
                    urlCode
                })
                
                await url.save()
                let newId = url._id.toString()
                const data = await urlModel.findById({_id:newId}).select({__v:0, _id:0})
                console.log(data)
                await SET_ASYNC(`${longUrl}`, JSON.stringify(data))
                return res.status(200).send({status:true,data:data})
            }

        }else{
            return res.status(400).send({status:false,message:"Invalid longUrl"})
        }
    }   
        
    catch(error){
        return res.status(500).send({status:false,message:error.message})
    }
}
module.exports.urlShortner=urlShortner;

// /////////////////////////////////////////////////////[Get Url]///////////////////////////////////////////////////////////////
const getUrl= async (req,res) => {
    try{
        let urlCode=req.params.urlCode;
        if(!shortid.isValid(urlCode)) return res.status(400).send({status:false, message:"Enter the valid UrlCode"})
        if(!urlCode) return res.status(400).send({status:false,message:"please enter the url"});
            
        let cahcedurlCode =await GET_ASYNC( `${req.params.urlCode}`);
           if(cahcedurlCode) {
            return res.status(302).redirect(cahcedurlCode)
            }
            else{
            let cahcedUrl = await urlModel.findOne({urlCode:urlCode})
            console.log(cahcedUrl)
            if(!cahcedUrl) return res.status(404).send({status:false,message:"url not found"});     
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(cahcedUrl.longUrl))
            return res.status(302).redirect(cahcedUrl.longUrl)
        }
    }
    
    catch(error){
        return res.status(500).send({status:false,message:error.message})
    }
}

// const getUrl= async function(req,res){
//     try{
//         const urlCode = req.params.urlCode;
//         let getUrl = await GET_ASYNC(`${req.params.urlCode}`)
//        if(getUrl) {return res.status(200).send(getUrl)}
//        else {
//         let isUrl = await urlModel.findOne({urlCode:urlCode})
//         if(!isUrl) {return res.status(404).send({status:false, message:"urlCode not found"})}
//         else{
//             await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(isUrl))
//              res.send({ data: isUrl });
//         }
//        }
        
        
//     }
    
//     catch(error){
//         return res.status(500).send({status:false,message:error.message})
//     }
// }

module.exports.getUrl=getUrl;
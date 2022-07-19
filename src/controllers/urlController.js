const validUrl = require('valid-url');
const shortid = require('shortid');
const urlModel = require('../models/urlModel');
const baseUrl = 'http://localhost:3000'


const urlShortner= async function(req,res){
    try{
        let{longUrl}=req.body;
        if(!longUrl) return res.status(400).send({status:false,message:"please enter the url"});
        if (!validUrl.isUri(baseUrl)) {
            return res.status(401).send({status:false,message:"Invalid base URL"})
        }
        const urlCode = shortid.generate()
        if (validUrl.isUri(longUrl)) {
            let url = await urlModel.findOne({longUrl:longUrl})
            if (url){  
             let obj = url.toObject();
              delete obj._id;
               delete obj.__v;   
              return res.status(200).send({status:true,data:obj})
            }else{
                const shortUrl = baseUrl + '/' + urlCode
               
                url = new urlModel({
                    longUrl,
                    shortUrl,
                    urlCode
                })
                
                await url.save()
                const data = await urlModel.findById({_id:url._id}).select({__v:0, _id:0})
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

const getUrl= async function(req,res){
    try{
        const urlCode = req.params.urlCode;
        const isUrl= await urlModel.findOne({urlCode:urlCode})
        if(!isUrl) return res.status(400).send({status:false,message:"url not found"});
        if(isUrl) {
            return res.status(302).redirect(isUrl.longUrl)
            
        }else{
            return res.status(404).send({status:false,message:"url not found"});
        }
    }
    
    catch(error){
        return res.status(500).send({status:false,message:error.message})
    }
}
module.exports.getUrl=getUrl;
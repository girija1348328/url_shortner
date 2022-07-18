const validUrl = require('valid-url');
const shortid = require('shortid');
const urlModel = require('../models/urlModel');
const baseUrl = 'http://localhost:3000'


const urlShortner= async function(req,res){
    try{
        let{longUrl}=req.body;
        // if(!Object.keys().length == 0) return res.status(400).send({status:false,message:"Please enter input"});
        if(!longUrl) return res.status(400).send({status:false,message:"please enter the url"});
        if (!validUrl.isUri(baseUrl)) {
            return res.status(401).send({status:false,message:"Invalid base URL"})
        }
        const urlCode = shortid.generate()
        if (validUrl.isUri(longUrl)) {
            let url = await urlModel.findOne({longUrl:longUrl})
            let obj = url.toObject();
                delete obj._id;
                delete obj.__v;
            
            if (obj){
                return res.status(200).send({status:true,data:obj})
            }else{
                const shortUrl = baseUrl + '/' + urlCode
                url = new urlModel({
                    longUrl,
                    shortUrl,
                    urlCode
                })
                await url.save()
                
                return res.status(200).send({status:true,data:url})
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
        // if(!urlCode)  return res.status(400).send({status:false,message:"please enter the url"});
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
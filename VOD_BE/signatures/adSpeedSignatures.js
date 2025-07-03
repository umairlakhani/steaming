const crypto = require('crypto');
const secretKey = '71614030f8'

 async function generateEditAdSig({adId,clickurl,adName,skippable,weight,key,token}){
    function generateSignature(params) {
        const sortedParams = Object.keys(params)
          .sort()
          .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
          }, {});
        const queryString = new URLSearchParams(sortedParams).toString();
        const message = secretKey + queryString;
        const signature = crypto.createHash('md5').update(message).digest('hex');
        return signature;
      }
      const sig = generateSignature({
        ad:adId,
        // clickurl:clickurl,
        // height:height,
        key: key,
        method: 'AS.Ad.edit',
        name:adName,
        token:token,
        weight:weight,
        // skippable:skippable
        // width:width,
      });
      console.log(sig,"check sig")
      return sig
}
 async function generateTokenToEditAd(content) {  
  return crypto.createHash('md5').update(content).digest('hex')
}

async function generateDeleteAdSignature({adId,adName,key,token}){
    function generateSignature(params) {
        const sortedParams = Object.keys(params)
          .sort()
          .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
          }, {});
        const queryString = new URLSearchParams(sortedParams).toString();
        const message = secretKey + queryString;
        const signature = crypto.createHash('md5').update(message).digest('hex');
        return signature;
      }
      const sig = generateSignature({
        ad:adId,
        key: key,
        method: 'AS.Ad.edit',
        name:adName,
        token:token,
        status:'deleted'
      });
      console.log(sig,"check sig")
      return sig
}

module.exports={
    generateEditAdSig,
    generateTokenToEditAd,
    generateDeleteAdSignature
}
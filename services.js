
const axios = require('axios');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
exports.getOutlookToken=async()=> {
  try{
     const tokenUrl = `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default",
    });

    const tokenResponse = await axios.post(tokenUrl, params);

    return tokenResponse.data.access_token;
  }catch(e){
    console.error(e.message+" getToken");
  }
}
exports.refreshOutlookSubscription=async()=>{
  try{
    const token = await exports.getOutlookToken();
   
    const headers = { Authorization: `Bearer ${token}` };
    const webhookUrl = `${process.env.BACKEND}/outlook/webhook`;

    const subsResponse = await axios.get("https://graph.microsoft.com/v1.0/subscriptions", { headers });
    const allSubscriptions = subsResponse.data.value ;

    const userSubscriptions = allSubscriptions.filter(
      (s) =>
        s.resource.includes(`/users/${process.env.USER_EMAIL}/`) &&
        s.notificationUrl === webhookUrl
    );

    if (userSubscriptions.length > 0) {
      for (const subscription of userSubscriptions) {
          await axios.delete(`https://graph.microsoft.com/v1.0/subscriptions/${subscription.id}`, { headers });
      }
    }

    const newSubscription = {
      changeType: "created",
      notificationUrl: webhookUrl,
      resource: `/users/${process.env.USER_EMAIL}/mailFolders('Inbox')/messages`,
      expirationDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      clientState: `${process.env.USER_EMAIL}+${process.env.OUTLOOK_SUBSCRIPTION_SECRET}`,
    };
    await axios.post(
      "https://graph.microsoft.com/v1.0/subscriptions",
      newSubscription,
      { headers }
    );

  }catch(e){
    console.error(e.message +" refreshOutlookSubscription");
  }
}
exports.uploadToS3 = async ({ buffer, filename, contentType }) => {
  try{
  const key = `attachments/${Date.now()}-${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read"
    })
  );

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
catch(e){
  console.error(e.message +" uploadToS3");
}
};
exports.downloadWhatsappMedia = async(mediaId) =>  {
  try{
  const mediaResponse1 = await axios.get(
    `https://waba-v2.360dialog.io/${mediaId}`,
    {
      headers: {
        "D360-API-KEY": process.env.D360_API_KEY
      }
    }
  );

  const { url, mime_type } = mediaResponse1.data;

  const downloadUrl = url.replace(
    "https://lookaside.fbsbx.com",
    "https://waba-v2.360dialog.io"
  );

  const mediaResponse2 = await axios.get(downloadUrl, {
    headers: {
      "D360-API-KEY": process.env.D360_API_KEY
    },
    responseType: "arraybuffer"
  });
const {data}=mediaResponse2
  return {
    buffer: Buffer.from(data),
    contentType: mime_type
  };
}
catch(e){
   console.error(e.message +" downloadWhatsappMedia");
}
}
  exports.extractParams = (text = '') =>{
return  [...text.matchAll(/{{(\d+)}}/g)].map(m => `${m[0]}`);
  }
exports.generateWhatsappTemplatePayload=(template)=>{

  const parameterMap = {};

      (template.parameters || []).forEach(p => {
        parameterMap[p.name] = p.value ?? '';
      });
  
      const components = [];
  
      for (const component of template.components) {
  
        if (component.type === 'body') {

          const bodyParams = this.extractParams(component.text).map(p => ({
            type: 'text',
            text: parameterMap[p]
          }));
  

          if (bodyParams.length > 0) {
            components.push({
              type: 'body',
              parameters: bodyParams
            });
          }
        }
  
        if (
          component.type === 'url' ||
          component.type === 'quick_reply'
        ) {
          let value = '';
          let paramType = 'text';
  
          if (component.url) {
            value = component.url;
          } else if (component.payload) {
            value = component.payload;
            paramType = 'payload';
          } 
  
          const params = this.extractParams(value).map(p => ({
            type: paramType,
            [paramType]: parameterMap[p]
          }));
  
          if (params.length === 0) continue;
  
          components.push({
            type: 'button',
            sub_type: component.type,
            index: component.index,
            parameters: params
          });
        }
}
return components
}
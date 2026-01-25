const {  refreshOutlookSubscription } = require("./services.js");

exports.scheduler=async()=>  {
setInterval(async () => {
  await refreshOutlookSubscription();
}, 55 * 60 * 1000); 
}
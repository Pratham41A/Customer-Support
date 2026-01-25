const express = require("express");
const { manageOutgoingNewWhatsapp, manageOutgoingTemplateWhatsapp, manageOutgoingReplyOutlook, manageOutgoingNewOutlook, manageIncomingOutlook, getViews , getOutlookSubscriptions, updateInbox, root, getDashboard, getSubscriptions, getPayments, getActivities, getInboxes, getQueryTypes, createActivity, getMessages, createQueryType, manageIncomingWhatsapp, getWhatsappTemplates } = require("./controls.js");
const router=express.Router();

router.get("/",root)

router.post("/outlook/webhook",manageIncomingOutlook)
router.get('/outlook/subscriptions',getOutlookSubscriptions)
router.post('/outlook/new',manageOutgoingNewOutlook)
router.post('/outlook/reply',manageOutgoingReplyOutlook)

router.get('/whatsapp/webhook', manageIncomingWhatsapp);
router.post('/whatsapp/webhook', manageIncomingWhatsapp);
router.post('/whatsapp/new',manageOutgoingNewWhatsapp)
router.post("/whatsapp/template",manageOutgoingTemplateWhatsapp)
router.get('/whatsapp/templates',getWhatsappTemplates)

router.get('/subscriptions/:userId',getSubscriptions)
router.get('/views/:userId',getViews)
router.get('/payments/:userId',getPayments)
router.get('/activities/:inboxId',getActivities)

router.get('/dashboards',getDashboard)
router.get('/inboxes',getInboxes)
router.get('/inboxes/:status',getInboxes)
router.get('/messages/:inboxId',getMessages)
router.get('/queryTypes',getQueryTypes)

router.patch('/inbox/:inboxId',updateInbox)
router.post('/queryType',createQueryType)
router.post('/activity',createActivity)


module.exports = {router}
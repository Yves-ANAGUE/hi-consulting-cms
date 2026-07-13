const express = require('express');
const routeur = express.Router();
const chatbotController = require('../controllers/chatbotController');

routeur.post('/', chatbotController.repondreChatbot);

module.exports = routeur;

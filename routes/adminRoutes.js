const express = require('express');
const adminController = require('../controllers/adminController');
const methodOverride = require('method-override');

const router = express.Router();

router.use(methodOverride('_method'));

router.get('/userManage', (req, res) => adminController.renderUserManage(req, res));

router.post('/userManage', (req, res) => adminController.renderUserManage(req, res));

router.post('/deleteUser', (req, res) => adminController.deleteUser(req, res));

router.get('/rechargeCardManagement', (req, res) => adminController.renderRechargeCardManagement(req, res));

router.get('/generateRechargeCardPage', (req, res) => adminController.renderGenerateRechargeCardPage(req, res));

router.post('/generateRechargeCard', (req, res) => adminController.generateRechargeCard(req, res));

module.exports = router;

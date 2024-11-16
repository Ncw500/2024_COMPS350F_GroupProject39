const AdminModel = require('../models/adminModel');
const UserModel = require('../models/userModel');
const RechargeCardModel = require('../models/rechargeCardModel');

class AdminController {
    async renderWithDefaults(req, res, view, options = {}) {
        const admin = req.session.user;
        let usersList = {};
        let error = undefined;
        const userModel = new UserModel();
        try {
            usersList = await userModel.findAllUser();
            usersList = usersList.filter(user => user.userRole !== admin.userRole);
        } catch (err) {
            error = 'An error occurred while fetching user data';
        }

        const defaults = {
            error: error,
            success: undefined,
            admin: admin,
            usersList: usersList,
            rechargeCardList: [],
        };
        const renderOptions = { ...defaults, ...options };
        res.render(view, renderOptions);
    }


    // 渲染頁面
    async renderUserManage(req, res,) {
        await this.renderWithDefaults(req, res, 'userManage');
    }

    async deleteUser(req, res) {
        if (req.body._method === 'DELETE') {
            const { userID } = req.body;
            const userModel = new UserModel();
            try {
                const result = await userModel.deleteUserByUserID(userID);
                if (result.deletedCount > 0) {
                    return await this.renderWithDefaults(req, res, 'userManage', { success: 'User deleted successfully!' });;
                    
                } else {
                    return await this.renderWithDefaults(req, res, 'userManage', { error: 'User not found!' });;
                } 
            } catch (err) {
                  return await this.renderWithDefaults(req, res, 'userManage', { error: 'An error occurred while deleting the user' });;
            }
        } else {
            return await this.renderWithDefaults(req, res, 'userManage', { error: 'Invalid request!' });;
        }
    }

    async renderRechargeCardManagement(req, res, options = {}) {
        let rechargeCardModel = new RechargeCardModel();
        let rechargeCardList = await rechargeCardModel.getRechargeCard();

        const renderOptions = { rechargeCardList, ...options };
        await this.renderWithDefaults(req, res, 'rechargeCardManagement', { rechargeCardList: rechargeCardList }, renderOptions);
    }


    async renderGenerateRechargeCardPage(req, res) {
        await this.renderWithDefaults(req, res, 'generateRechargeCardPage');
    }

    async generateRechargeCard(req, res) {
        let cardValue = req.body.cardValue;
        let code = await this.generateRechargeCardNumber(16);
        let rechargeCardModel = new RechargeCardModel();
        let rechargeCard = {
            code: code,
            status: 'unused',
            refereeID: req.body.refereeID,
            value: cardValue,
        };
        try {
            await rechargeCardModel.createRechargeCard(rechargeCard);
            return await renderRechargeCardManagement(req, res, { success: 'Recharge card generated successfully!' });
        } catch (err) {
            return await renderRechargeCardManagement(req, res, { error: 'An error occurred while generating the recharge card' });
        
        }
    }

    async generateRechargeCardNumber(length = 16) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 可用字符
        let cardNumber = '';
    
        while (true) {
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length); // 随机索引
                cardNumber += characters[randomIndex]; // 生成字符并添加到序号中
            }
            let rechargeCardModel = new RechargeCardModel();
            let existingCard = await rechargeCardModel.getRechargeCard().catch(err => {
                throw err;
            });
            if (existingCard.filter(card => card.code === cardNumber).length === 0) {
                break;
            }
        }
    
        return cardNumber; // 返回生成的充值卡序号
    }


}

module.exports = new AdminController();
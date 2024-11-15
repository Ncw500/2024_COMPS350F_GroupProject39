const UserModel = require('../models/userModel');
const AccountBalanceModel = require('../models/accountBalanceModel');

class UserController {

    renderWithDefaults(res, view, options = {}) {
        // 定义默认值
        const defaults = {
            error: undefined,
            success: undefined,
        };
        // 合并默认值和传入的选项
        const renderOptions = { ...defaults, ...options };
        res.render(view, renderOptions);
    }

    // 渲染登入頁面
    async renderLoginPage(req, res) {
        this.renderWithDefaults(res, 'loginPage');
    }

    // 登入功能
    async login(req, res) {
        const { userID, userPassword } = req.body;
        const userModel = new UserModel();
        try {
            const result = await userModel.authenticate(userID, userPassword);
            if (result.isSuccess) {
                // 登入成功，設置會話
                req.session.user = result.user; // 使用會話
                req.session.cart = [];
                res.redirect('/'); // 成功後重定向到首頁
            } else {
                // 登入失敗，渲染相同的登入頁面並顯示錯誤消息
                return this.renderWithDefaults(res, 'loginPage', { error: 'Invalid user account or password!' });
            }
        } catch (err) {
            this.renderWithDefaults(res, 'loginPage', { error: 'An error occurred!' });
        }
    }

    // 登出功能
    async logout(req, res) {
        req.session = null;
        res.redirect('/'); // 登出後重定向到登入頁面

    }

    async renderSignupPage(req, res) {
        this.renderWithDefaults(res, 'signupPage');
    }

    async signup(req, res) {
        const { userID, userPassword, userEmail, userRole } = req.body;
        const userModel = new UserModel();
        const accountBalanceModel = new AccountBalanceModel();

        try {
            const result = await userModel.insertUser(userID, userPassword, userEmail, userRole);
            // create account balance for user
            const result2 = await accountBalanceModel.insertAccountBalance(userID);
            
            this.renderWithDefaults(res, 'loginPage', { success: 'User account created successfully!' });
        } catch (err) {
            if (err.code === 11000) { // 重複鍵錯誤
                if ('userID' in err.errorResponse.keyPattern) {
                    this.renderWithDefaults(res, 'signupPage', { error: 'User ID already exists!' });
                } else if ('userEmail' in err.errorResponse.keyPattern) {
                    this.renderWithDefaults(res, 'signupPage', { error: 'User email already exists!' });
                }
            } else {
                this.renderWithDefaults(res, 'signupPage', { error: 'An error occurred!' });
            }
        }
    }

}

module.exports = new UserController();
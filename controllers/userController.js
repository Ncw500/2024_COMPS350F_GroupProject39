const UserModel = require('../models/userModel');
const AccountBalanceModel = require('../models/accountBalanceModel');
const stringValidator = require('../lib/stringValidator');

class UserController {

    async renderWithDefaults(res, view, options = {}) {
        // 定义默认值
        const defaults = {
            error: undefined,
            success: undefined,
            user: undefined,
            accountBalance: undefined
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
        let { userID, userPassword } = req.body;

        userID = userID.trim();
        userPassword = userPassword.trim();

        // validate user ID and password
        if (stringValidator.containsChineseCharacters(userID) || stringValidator.containsChineseCharacters(userPassword)) {
            return this.renderWithDefaults(res, 'loginPage', { error: 'Cannot contain Chinese characters!' });
        }
        
        
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

        // Validate user ID, password, and email
        if (stringValidator.containsChineseCharacters(userID) || stringValidator.containsChineseCharacters(userPassword) || stringValidator.containsChineseCharacters(userEmail)) {
            return this.renderWithDefaults(res, 'signupPage', { error: 'Cannot contain Chinese characters!' });
        }



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

    async renderProfilePage(req, res, options = {}) {
        let userID = req.session.user.userID;
        const userModel = new UserModel();
        const accountBalanceModel = new AccountBalanceModel();
        let renderOptions = { ...options };

        try {
            const user = await userModel.findUserByUserID(userID);
            const accountBalance = await accountBalanceModel.getAccountBalance(userID);
            return await this.renderWithDefaults(res, 'profilePage', { user, accountBalance, ...renderOptions });

        } catch (err) {
            return await this.renderWithDefaults(res, 'profilePage', { error: 'An error occurred!', ...renderOptions });
        }
    }

    async updateProfile(req, res) {
        
        let user = {
            "personalInfo.firstName": req.body.firstName,
            "personalInfo.lastName": req.body.lastName,
            "personalInfo.phone": req.body.phoneNumber,
            "personalInfo.address": req.body.address,
            "personalInfo.region": req.body.region,
            "personalInfo.country": req.body.country,
            "personalInfo.aboutMe": req.body.aboutMe
        };
        let userID = req.session.user.userID;

        const userModel = new UserModel();

        try {
            const result = await userModel.updateUserByUserID(userID, user);
            return await this.renderProfilePage(req, res, { success: 'Profile updated successfully!' });
        } catch (err) {
            return await this.renderProfilePage(req, res, { error: 'An error occurred!' });
        }
    }

}

module.exports = new UserController();
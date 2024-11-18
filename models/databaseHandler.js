const mongoose = require('mongoose');


class DatabaseHandler {

    constructor() {
        this.dbUrl = "mongodb://nog19630:123@cluster0-shard-00-00.oicc7.mongodb.net:27017,cluster0-shard-00-01.oicc7.mongodb.net:27017,cluster0-shard-00-02.oicc7.mongodb.net:27017/COMPS350F_GroupProject39?ssl=true&replicaSet=atlas-13zfqv-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
        this.isConnect = false;
    }

    async connect() {
        if (this.isConnected) return; // 如果已经连接，直接返回
        try {
            await mongoose.connect(this.dbUrl);
            this.isConnected = true;
        } catch (err) {
            console.log(err);
            process.exit(1); // 连接失败时退出应用
        }
    }
    
    async disconnect() {
        if (this.isConnected) {
            await mongoose.connection.close();
            this.isConnected = false;
        }
    }

    // 查找数据
    async findOne(mongooseModel, queryObject, projection = {}, sortObject = {}) {
        try {
            await this.connect();
            const result = await mongooseModel.findOne(queryObject, projection).sort(sortObject);
            // console.log(debugLogheader("Databasehandler.findOne()") + 'Data found:', result);
            return result;
        } catch (err) {
            // console.error(debugLogheader("Databasehandler.findOne()") + 'Find data error:', err);
            throw err;
        } finally {
            await this.disconnect();
        }
    }

    async findMany(mongooseModel, queryObject, projection = {}, sortObject = {}) {
        try {
            await this.connect();
            const result = await mongooseModel.find(queryObject, projection).sort(sortObject);
            // console.log(debugLogheader("Databasehandler.findMany()") + 'Data found:', result);
            return result;
        } catch (err) {
            // console.error(debugLogheader("Databasehandler.findMany()") + 'Find data error:', err);
            throw err;
        } finally {
            await this.disconnect();
        }
    }

    // 查找多个数据
    async findAll(mongooseModel) {
        const categoryOrder = {
            "Main Course": 1,
            "Appetizer": 2,
            "Dessert": 3,
            "Beverage": 4
        };
        

        try {
            await this.connect();
            const result = await mongooseModel.find().sort({ itemCategory: 1, itemName: 1 });
            
            // console.log(debugLogheader("Databasehandler.findAll()") + 'Data found:', result);
            return result;
        } catch (err) {
            // console.error(debugLogheader("Databasehandler.findAll()") + 'Find data error:', err);
            throw err;
        } finally {
            await this.disconnect();
        }
    }

    // 插入数据
    async insertOne(mongooseModel, queryObject) {
        try {
            await this.connect();
            const result = await mongooseModel.create(queryObject);
            // console.log(debugLogheader("Databasehandler.insertOne()") + 'Data inserted successfully:', result);
            return result;
        } catch (err) {
            // console.error(debugLogheader("Databasehandler.insertOne()") + 'Insert data error:', err)
            throw err;
        } finally {
            await this.disconnect();
        }
    }

    // 更新数据
    async update(mongooseModel, queryObject, updateMode, updateData) {
        // 更新数据的逻辑
        try {
            await this.connect(); // 连接数据库
            let result = null;
            if (updateMode === "push") {
                result = await mongooseModel.updateOne(queryObject, { $push: updateData });
            } else if (updateMode === "set") {
                result = await mongooseModel.updateOne(queryObject, { $set: updateData });
            }
            return result;
        } catch (err) {
            throw err;
        } finally {
            await this.disconnect(); // 断开连接
        }
    }

    // 删除数据
    async delete(mongooseModel, queryObject, deleteNum) {
        try {
            await this.connect();
            let result = null;
            if (deleteNum === "many") {
                result = await mongooseModel.deleteMany(queryObject);
            } else if (deleteNum === "one") {
                result = await mongooseModel.deleteOne(queryObject);
            }
            // console.log(debugLogheader("Databasehandler.delete()") + 'Data deleted successfully:', result);
            return result;
        } catch (err) {
            // console.error(debugLogheader("Databasehandler.delete()") + 'Delete data error:', err);
            throw err;
        } finally {
            await this.disconnect
        }
    }
    
    // 统计数目
    async count(collection, query) {
        // 返回满足查询条件的数据数量
    }

    // 事务处理
    async transaction(callback) {
        // 实现事务机制的逻辑
    }

}

module.exports = DatabaseHandler;